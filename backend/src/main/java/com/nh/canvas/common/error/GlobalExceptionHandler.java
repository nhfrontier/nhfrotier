package com.nh.canvas.common.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

/**
 * 모든 오류를 {@link ErrorCode} 체계로 정규화한다.
 *
 * <p>응답 본문에 스택 트레이스·DB 정보·내부 경로를 넣지 않는다 (SECURITY D-2).
 * 원인은 서버 로그에만 남기고, 사용자에게는 로그와 맞춰 볼 수 있는 traceId 만 준다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public record ApiErrorResponse(String code, String message, String traceId) {}

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApi(ApiException ex, HttpServletRequest request) {
        return respond(ex.code(), ex.getMessage(), ex, request, ex.code().status().is5xxServerError());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                                                             HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse(ErrorCode.INVALID_REQUEST.defaultMessage());
        return respond(ErrorCode.INVALID_REQUEST, message, ex, request, false);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequest(Exception ex, HttpServletRequest request) {
        return respond(ErrorCode.INVALID_REQUEST, ErrorCode.INVALID_REQUEST.defaultMessage(), ex, request, false);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleTooLarge(MaxUploadSizeExceededException ex,
                                                           HttpServletRequest request) {
        return respond(ErrorCode.PAYLOAD_TOO_LARGE, ErrorCode.PAYLOAD_TOO_LARGE.defaultMessage(), ex, request, false);
    }

    @ExceptionHandler({NoHandlerFoundException.class, HttpRequestMethodNotSupportedException.class})
    public ResponseEntity<ApiErrorResponse> handleNoHandler(Exception ex, HttpServletRequest request) {
        return respond(ErrorCode.NOT_FOUND, ErrorCode.NOT_FOUND.defaultMessage(), ex, request, false);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleIntegrity(DataIntegrityViolationException ex,
                                                            HttpServletRequest request) {
        // 제약 위반 메시지에는 테이블·컬럼명이 그대로 들어 있다. 사용자에게 넘기지 않는다
        return respond(ErrorCode.CONFLICT, ErrorCode.CONFLICT.defaultMessage(), ex, request, false);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        return respond(ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.defaultMessage(), ex, request, true);
    }

    private ResponseEntity<ApiErrorResponse> respond(ErrorCode code, String message, Exception ex,
                                                     HttpServletRequest request, boolean withStack) {
        String traceId = UUID.randomUUID().toString();
        if (withStack) {
            log.error("[{}] {} {} -> {}", traceId, request.getMethod(), request.getRequestURI(), code, ex);
        } else {
            log.warn("[{}] {} {} -> {} ({})", traceId, request.getMethod(), request.getRequestURI(), code,
                    ex.getClass().getSimpleName());
        }
        return ResponseEntity.status(code.status())
                .body(new ApiErrorResponse(code.name(), message, traceId));
    }
}
