package com.nh.canvas.common.error;

import org.springframework.http.HttpStatus;

/**
 * API 오류 코드. HTTP 상태코드로 정규화한다 (05_API_DB_SPEC 7절 · ARCHITECTURE 9절).
 *
 * <p>LLM 장애(502/504)와 업무 규칙 위반(422)을 구분해야 프론트가 "재시도 가능"과
 * "입력을 고쳐야 함"을 다르게 안내할 수 있다. 하나로 뭉뚱그리지 않는다.
 */
public enum ErrorCode {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "이 작업을 수행할 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "대상을 찾을 수 없습니다."),
    CONFLICT(HttpStatus.CONFLICT, "다른 변경과 충돌했습니다. 최신 상태를 확인해 주세요."),
    PAYLOAD_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "허용 용량을 초과했습니다."),
    RULE_VIOLATION(HttpStatus.UNPROCESSABLE_ENTITY, "업무 규칙에 맞지 않는 요청입니다."),
    AI_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "AI 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "처리 중 오류가 발생했습니다."),
    LLM_ERROR(HttpStatus.BAD_GATEWAY, "AI 연계에 실패했습니다."),
    LLM_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI 응답이 지연되어 처리하지 못했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
