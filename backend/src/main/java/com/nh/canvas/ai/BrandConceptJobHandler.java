package com.nh.canvas.ai;

import com.nh.canvas.ai.AiJobRepository.JobRow;
import com.nh.canvas.common.Json;
import com.nh.canvas.responsibility.ResponsibilityRules;
import com.nh.canvas.screen.HtmlPipeline;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 브랜드 시안 3안 생성 (FR-13 {@code job_type=BRAND_CONCEPT}).
 *
 * <p><b>Version 을 만들지 않는다.</b> 3안은 {@code ai_job_outputs} 에만 남는 후보이며,
 * 사용자가 하나를 선택할 때 비로소 Version 이 생긴다 (05_API_DB_SPEC 8-3절).
 *
 * <p>시안 3안을 LLM 호출 3회로 나눌지 1회로 낼지는 미결이다 — 동시 호출 제한·최대 토큰 정책과
 * 직결된다 (08_DECISIONS 2절 AI). 지금은 <b>호출 3회</b>로 둔다. 한 응답에 3안을 넣으면
 * 토큰 한도에 걸렸을 때 세 개가 함께 잘리고, 어느 안이 실패했는지도 구분되지 않는다.
 */
@Component
public class BrandConceptJobHandler implements AiJobHandler {

    /** 방향을 미리 갈라 둔다. 같은 프롬프트로 3번 부르면 비슷한 것 세 개가 나온다. */
    private static final List<String> VARIANT_LABELS =
            List.of("정통·신뢰형", "친근·생활형", "간결·현대형");

    private final AiJobRepository jobs;
    private final AiOrchestrator ai;
    private final HtmlPipeline pipeline;
    private final ResponsibilityRules rules;
    private final Json json;

    public BrandConceptJobHandler(AiJobRepository jobs, AiOrchestrator ai, HtmlPipeline pipeline,
                                  ResponsibilityRules rules, Json json) {
        this.jobs = jobs;
        this.ai = ai;
        this.pipeline = pipeline;
        this.rules = rules;
        this.json = json;
    }

    @Override
    public String jobType() {
        return "BRAND_CONCEPT";
    }

    @Override
    @Transactional
    public String handle(JobRow job) {
        Map<String, Object> payload = json.readMap(job.requestPayload());
        String instruction = String.join("\n\n", jobs.listInputTexts(job.id()));
        String preset = String.valueOf(payload.getOrDefault("preset", "CARD_H"));

        String model = null;
        for (int index = 0; index < VARIANT_LABELS.size(); index++) {
            String label = VARIANT_LABELS.get(index);
            var response = ai.complete("BRAND_CONCEPT", systemPrompt(preset),
                    userPrompt(instruction, label), 16_000);
            model = response.model();

            // 시안도 화면과 같은 정제를 거친다. 브라우저에 뜨는 것은 다 같은 위험을 갖는다
            var sanitized = pipeline.sanitizeFragment(response.text(), List.of());
            jobs.addOutput(job.id(), index + 1, label, "HTML", sanitized.html(), null);
        }
        return model;
    }

    private String systemPrompt(String preset) {
        return """
                당신은 카드 실물·홍보물의 컨셉 시안을 만드는 디자이너다.
                방향 합의용 시안이며 인쇄용 최종 파일이 아니다 — 재단선·CMYK·규격 정밀도는 다루지 않는다.

                ## 출력 형식

                - HTML 조각 하나만 출력한다. 설명 문장·코드펜스를 붙이지 않는다.
                - 스타일은 인라인 style 속성으로 넣는다. 외부 이미지·폰트·스크립트를 불러오지 않는다.
                - 그래픽은 CSS 와 인라인 SVG 로만 만든다. 이미지 파일을 참조하지 않는다.
                - 규격 프리셋: %s

                ## 지켜야 할 것

                %s
                """.formatted(preset, rules.guardrailPrompt());
    }

    private String userPrompt(String instruction, String label) {
        return """
                ## 요청

                %s

                ## 이 시안의 방향

                %s

                이 방향에 맞는 시안 하나의 HTML 조각을 출력하라.
                """.formatted(instruction.isBlank() ? "브랜드 컨셉 시안을 만들어라." : instruction, label);
    }
}
