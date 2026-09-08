package com.nh.canvas.file;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@code /proc/self/uid_map} 해석.
 *
 * <p>이 계산이 틀리면 <b>그럴듯하지만 틀린 chown 명령</b>이 나간다. uid 를 못 읽는 경우보다
 * 위험하다 — 값이 찍혀 있으니 현장에서 의심하지 않고 그대로 실행한다.
 */
class StorageAccessDiagnosticsTest {

    /** 대부분의 환경. 컨테이너 uid 가 곧 호스트 uid 다. */
    private static final List<String> IDENTITY = List.of("         0          0 4294967295");

    /** userns-remap. 컨테이너 0~65535 가 호스트 165536~ 로 옮겨진다. */
    private static final List<String> REMAPPED = List.of("         0     165536      65536");

    @Test
    @DisplayName("항등 매핑이면 컨테이너 uid 가 그대로 호스트 uid 다")
    void should_return_same_uid_when_identity_map() {
        assertThat(StorageAccessDiagnostics.mapUid(10001, IDENTITY)).isEqualTo(10001L);
    }

    @Test
    @DisplayName("user namespace 가 걸리면 호스트 uid 로 옮겨 준다")
    void should_translate_uid_when_remapped() {
        // 컨테이너 10001 → 호스트 165536 + 10001
        assertThat(StorageAccessDiagnostics.mapUid(10001, REMAPPED)).isEqualTo(175537L);
    }

    @Test
    @DisplayName("여러 구간이 있으면 해당하는 구간으로 옮긴다")
    void should_pick_matching_range_when_multiple() {
        List<String> map = List.of(
                "0 165536 1",
                "1 100000 10",
                "1000 200000 500");

        assertThat(StorageAccessDiagnostics.mapUid(0, map)).isEqualTo(165536L);
        assertThat(StorageAccessDiagnostics.mapUid(5, map)).isEqualTo(100004L);
        assertThat(StorageAccessDiagnostics.mapUid(1200, map)).isEqualTo(200200L);
    }

    @Test
    @DisplayName("어느 구간에도 없는 uid 는 번역하지 않는다 — 틀린 값을 주느니 모른다고 한다")
    void should_return_null_when_uid_unmapped() {
        assertThat(StorageAccessDiagnostics.mapUid(70000, REMAPPED)).isNull();
        assertThat(StorageAccessDiagnostics.mapUid(10001, List.of())).isNull();
    }

    @Test
    @DisplayName("구간 경계를 벗어나면 매핑하지 않는다")
    void should_respect_range_boundary_when_at_edge() {
        List<String> map = List.of("0 165536 10");

        assertThat(StorageAccessDiagnostics.mapUid(9, map)).isEqualTo(165545L);
        assertThat(StorageAccessDiagnostics.mapUid(10, map)).isNull();
    }

    @Test
    @DisplayName("형식이 깨진 줄은 건너뛰고 나머지를 본다")
    void should_skip_malformed_lines_when_parsing() {
        List<String> map = List.of("", "쓰레기", "0 abc 100", "0 165536 65536");

        assertThat(StorageAccessDiagnostics.mapUid(10001, map)).isEqualTo(175537L);
    }
}
