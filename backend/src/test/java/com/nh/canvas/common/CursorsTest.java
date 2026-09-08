package com.nh.canvas.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import com.nh.canvas.common.web.Cursors;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CursorsTest {

    @Test
    @DisplayName("커서는 시각과 id 를 함께 담아 왕복한다")
    void should_round_trip_when_encoded() {
        Instant createdAt = Instant.ofEpochMilli(1_757_000_000_000L);
        UUID id = UUID.fromString("11111111-2222-3333-4444-555555555555");

        Cursors.Position decoded = Cursors.decode(Cursors.encode(createdAt, id));

        assertThat(decoded.createdAt()).isEqualTo(createdAt);
        assertThat(decoded.id()).isEqualTo(id);
    }

    @Test
    @DisplayName("커서가 없으면 첫 페이지다")
    void should_return_null_when_cursor_absent() {
        assertThat(Cursors.decode(null)).isNull();
        assertThat(Cursors.decode("  ")).isNull();
    }

    @Test
    @DisplayName("커서는 외부 입력이므로 깨진 값은 400 이다")
    void should_reject_when_cursor_malformed() {
        assertThatThrownBy(() -> Cursors.decode("not-a-cursor"))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).code())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
    }

    @Test
    @DisplayName("limit 은 상한으로 잘리고 0 이하는 거절한다")
    void should_clamp_limit_when_out_of_range() {
        assertThat(Cursors.normalizeLimit(null)).isEqualTo(Cursors.DEFAULT_LIMIT);
        assertThat(Cursors.normalizeLimit(500)).isEqualTo(Cursors.MAX_LIMIT);
        assertThat(Cursors.normalizeLimit(7)).isEqualTo(7);
        assertThatThrownBy(() -> Cursors.normalizeLimit(0)).isInstanceOf(ApiException.class);
    }
}
