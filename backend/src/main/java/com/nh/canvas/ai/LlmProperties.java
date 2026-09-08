package com.nh.canvas.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * LLM 연계 설정. 값은 전부 환경변수로 주입한다.
 *
 * <p><b>endpoint 를 사용자 입력으로 정하지 않는다.</b> 호출 대상은 설정으로 고정된 하나뿐이며,
 * 이것이 SSRF 방어의 핵심이다 (SECURITY_CHECKLIST 3절 A10).
 * {@code credential} 은 로그·응답·예외 메시지에 절대 싣지 않는다 (SECURITY 7절).
 */
@ConfigurationProperties(prefix = "canvas.llm")
public class LlmProperties {

    private boolean enabled = false;
    private String endpoint = "";
    private String credential = "";
    private String model = "";
    private int timeoutSeconds = 120;
    /** 입력 총량 상한. 넘으면 잘라내지 않고 413 으로 거절한다 (05_API_DB_SPEC FR-15 절) */
    private int maxInputChars = 400_000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getCredential() {
        return credential;
    }

    public void setCredential(String credential) {
        this.credential = credential;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public int getMaxInputChars() {
        return maxInputChars;
    }

    public void setMaxInputChars(int maxInputChars) {
        this.maxInputChars = maxInputChars;
    }

    @Override
    public String toString() {
        // credential 이 로그로 새는 가장 흔한 경로가 설정 객체의 toString 이다
        return "LlmProperties{enabled=%s, endpoint=%s, model=%s, credential=***}"
                .formatted(enabled, endpoint, model);
    }
}
