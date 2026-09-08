package com.nh.canvas.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * LLM endpoint 가 확정되기 전에도 전체 흐름(Job 등록 → 워커 → 결과 저장 → 화면)을
 * 돌려보기 위한 대역.
 *
 * <p><b>모델을 흉내내지 않는다.</b> 호출 목적에 맞는 <i>형식</i>만 돌려주고 내용은 자리채움이며,
 * 결과에 대역임이 드러나게 한다 — 그럴듯한 가짜를 돌려주면 연계가 안 된 것을 아무도 눈치채지 못한다.
 *
 * <p>지적을 만들어 내지 않는 것도 같은 이유다. 검토 계열은 항상 빈 결과를 돌려준다.
 * 근거 없는 지적을 지어내면 근거 대조 로직이 제대로 도는지 확인할 수 없고, 담당자에게는
 * 검증 불가능한 카드가 쌓인다.
 */
@Component
@ConditionalOnProperty(name = "canvas.llm.enabled", havingValue = "false", matchIfMissing = true)
public class StubLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(StubLlmClient.class);
    private static final String MODEL = "stub";

    public StubLlmClient() {
        log.warn("LLM 연계가 꺼져 있습니다(canvas.llm.enabled=false). AI 결과는 대역 응답입니다.");
    }

    @Override
    public LlmResponse complete(LlmRequest request) {
        return new LlmResponse(bodyFor(request.purpose()), MODEL, 0, 0);
    }

    private String bodyFor(String purpose) {
        return switch (purpose) {
            case "SCREEN_PLAN" -> """
                    {"screens":[
                      {"screenKey":"stub-home","name":"대역 화면","role":"LLM 연계 전 자리채움 화면이다.",
                       "linksTo":[]}
                    ]}
                    """;

            case "SCREEN_HTML", "ELEMENT_EDIT", "BRAND_CONCEPT" -> """
                    <section data-nh-key="llm-disabled" style="padding: 24px; font-family: sans-serif">
                      <h2>AI 연계가 설정되지 않았습니다</h2>
                      <p>승인 LLM endpoint 를 설정하면 실제 결과로 바뀝니다.</p>
                    </section>
                    """;

            // 지적을 지어내지 않는다. 빈 결과가 정직한 대역이다
            case "RESPONSIBILITY_REVIEW", "USABILITY_REVIEW" -> "{\"findings\":[]}";
            case "REVIEW_SUMMARY" -> "{\"items\":[]}";

            default -> "AI 연계가 설정되지 않았습니다. (요청 목적: " + purpose + ")";
        };
    }
}
