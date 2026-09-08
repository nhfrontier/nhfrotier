package com.nh.canvas.ai;

import com.nh.canvas.ai.AiJobRepository.JobRow;
import com.nh.canvas.common.Json;
import com.nh.canvas.version.VersionService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 문서 초안 생성 (FR-05 {@code job_type=DOC_DRAFT}).
 *
 * <p>결과가 나오면 Version 하나가 생긴다 — 문서는 화면과 달리 산출물이 하나라
 * 선택 단계를 두지 않는다 (브랜드 시안 3안과 다른 점).
 */
@Component
public class DocDraftJobHandler implements AiJobHandler {

    private final AiJobRepository jobs;
    private final AiOrchestrator ai;
    private final VersionService versions;
    private final Json json;

    public DocDraftJobHandler(AiJobRepository jobs, AiOrchestrator ai, VersionService versions, Json json) {
        this.jobs = jobs;
        this.ai = ai;
        this.versions = versions;
        this.json = json;
    }

    @Override
    public String jobType() {
        return "DOC_DRAFT";
    }

    @Override
    @Transactional
    public String handle(JobRow job) {
        Map<String, Object> payload = json.readMap(job.requestPayload());
        String instruction = String.join("\n\n", jobs.listInputTexts(job.id()));

        var response = ai.complete("DOC_DRAFT", systemPrompt(), userPrompt(instruction), 16_000);
        jobs.addOutput(job.id(), 1, null, "TEXT", response.text(), null);

        versions.create(job.projectId(), parentVersionId(payload), "AI_GENERATION", job.id(),
                designSystemId(payload), instruction, "AI 문서 초안", job.requestedBy());
        return response.model();
    }

    private String systemPrompt() {
        return """
                당신은 은행 업무 문서를 쓰는 실무자다. 요청받은 문서의 초안을 작성한다.

                ## 규칙

                - 한국어로 쓴다. 업무 문서의 어조를 지킨다.
                - 요청에 없는 수치·일정·근거를 지어내지 않는다. 모르는 값은 [확인 필요] 로 남긴다.
                - 결론을 먼저 쓰고 근거를 뒤에 둔다.
                - 마크다운 제목·표를 써도 좋다. 코드펜스로 감싸지 않는다.
                """;
    }

    private String userPrompt(String instruction) {
        return instruction.isBlank() ? "업무 문서 초안을 작성하라." : instruction;
    }

    private UUID parentVersionId(Map<String, Object> payload) {
        return asUuid(payload.get("baseVersionId"));
    }

    private UUID designSystemId(Map<String, Object> payload) {
        return asUuid(payload.get("designSystemId"));
    }

    private UUID asUuid(Object value) {
        if (!(value instanceof String text) || text.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(text);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    List<String> inputTexts(UUID jobId) {
        return jobs.listInputTexts(jobId);
    }
}
