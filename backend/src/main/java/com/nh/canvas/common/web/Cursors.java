package com.nh.canvas.common.web;

import com.nh.canvas.common.error.ApiException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;

/**
 * 커서 기반 페이지네이션의 커서 인코딩 (05_API_DB_SPEC 1절).
 *
 * <p>정렬 키가 시각 하나면 같은 밀리초에 만들어진 행에서 페이지가 어긋난다.
 * 그래서 커서는 항상 (created_at, id) 두 값을 함께 담고, 질의도 두 값을 함께 비교한다.
 *
 * <p>커서는 외부 입력이다. 복호 결과를 검증 없이 쓰지 않는다.
 */
public final class Cursors {

    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 100;

    private Cursors() {}

    public record Position(Instant createdAt, UUID id) {

        /**
         * PostgreSQL JDBC 드라이버는 {@link Instant} 를 그대로 바인딩하지 못한다
         * ("Can't infer the SQL type"). 질의에 넣을 때는 이 값을 쓴다.
         */
        public OffsetDateTime at() {
            return createdAt.atOffset(ZoneOffset.UTC);
        }
    }

    public static String encode(Instant createdAt, UUID id) {
        String raw = createdAt.toEpochMilli() + ":" + id;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public static Position decode(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            int separator = raw.indexOf(':');
            if (separator <= 0) {
                throw new IllegalArgumentException("malformed cursor");
            }
            return new Position(
                    Instant.ofEpochMilli(Long.parseLong(raw.substring(0, separator))),
                    UUID.fromString(raw.substring(separator + 1)));
        } catch (RuntimeException ex) {
            throw ApiException.invalid("cursor 값이 올바르지 않습니다.");
        }
    }

    public static int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        if (limit < 1) {
            throw ApiException.invalid("limit 은 1 이상이어야 합니다.");
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
