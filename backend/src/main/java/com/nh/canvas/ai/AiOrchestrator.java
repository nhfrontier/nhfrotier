package com.nh.canvas.ai;

import com.nh.canvas.ai.LlmClient.LlmRequest;
import com.nh.canvas.ai.LlmClient.LlmResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * AI Orchestrator (ARCHITECTURE 3절).
 *
 * <p>도메인 서비스는 LLM SDK 를 모르고 이 클래스만 부른다. 모델 교체·재시도 정책 변경이
 * 여러 도메인으로 번지는 shotgun surgery 를 막기 위한 계층이다.
 *
 * <p>사용량 메타데이터는 남기되 <b>프롬프트 원문과 응답 원문은 로그에 남기지 않는다</b>
 * (SECURITY L-1 · Prompt/Response 저장 허용 범위는 미결).
 */
@Component
public class AiOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(AiOrchestrator.class);
    private static final int DEFAULT_MAX_OUTPUT_TOKENS = 8_000;

    private final LlmClient client;

    public AiOrchestrator(LlmClient client) {
        this.client = client;
    }

    public LlmResponse complete(String purpose, String systemPrompt, String userPrompt) {
        return complete(purpose, systemPrompt, userPrompt, DEFAULT_MAX_OUTPUT_TOKENS);
    }

    public LlmResponse complete(String purpose, String systemPrompt, String userPrompt, int maxOutputTokens) {
        long startedAt = System.currentTimeMillis();
        LlmResponse response = client.complete(
                new LlmRequest(purpose, systemPrompt, userPrompt, maxOutputTokens));
        log.info("LLM 호출 purpose={} model={} inputTokens={} outputTokens={} elapsedMs={}",
                purpose, response.model(), response.inputTokens(), response.outputTokens(),
                System.currentTimeMillis() - startedAt);
        return response;
    }
}
