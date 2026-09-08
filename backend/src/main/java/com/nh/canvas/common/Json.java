package com.nh.canvas.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * JSONB 컬럼과 주고받는 문자열 변환.
 *
 * <p>PostgreSQL 은 문자열을 jsonb 컬럼에 그대로 넣지 못한다. 쓰는 쪽 SQL 에서 {@code ?::jsonb} 로
 * 캐스팅하며, 이 클래스는 그 자리에 넣을 문자열을 만든다.
 */
@Component
public class Json {

    private final ObjectMapper mapper;

    public Json(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public String write(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return mapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "직렬화에 실패했습니다.", ex);
        }
    }

    public Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "역직렬화에 실패했습니다.", ex);
        }
    }

    public <T> T read(String json, Class<T> type) {
        try {
            return mapper.readValue(json, type);
        } catch (Exception ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "역직렬화에 실패했습니다.", ex);
        }
    }

    public ObjectMapper mapper() {
        return mapper;
    }
}
