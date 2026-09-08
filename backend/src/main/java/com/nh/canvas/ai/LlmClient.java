package com.nh.canvas.ai;

/**
 * 승인 LLM 호출의 유일한 통로 (ARCHITECTURE 2·3절).
 *
 * <p>브라우저는 LLM 을 직접 호출하지 않는다. 도메인 서비스도 이 인터페이스만 알고,
 * 어떤 모델을 어떤 인증으로 부르는지는 구현체에 갇힌다 — 행내에서 승인되는 endpoint·모델이
 * 아직 미정이고 이후 교체될 수 있기 때문이다.
 */
public interface LlmClient {

    LlmResponse complete(LlmRequest request);

    /**
     * @param purpose      사용량 메타데이터용 구분자. 프롬프트 내용이 아니다
     * @param systemPrompt 역할·규칙 지시
     * @param userPrompt   실제 입력
     */
    record LlmRequest(String purpose, String systemPrompt, String userPrompt, int maxOutputTokens) {}

    record LlmResponse(String text, String model, Integer inputTokens, Integer outputTokens) {}
}
