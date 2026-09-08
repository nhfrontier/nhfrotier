package com.nh.canvas.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nh.canvas.common.error.ApiException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalFileStorageTest {

    private static StorageProperties propertiesFor(Path root) {
        StorageProperties properties = new StorageProperties();
        properties.setLocalRoot(root.toString());
        return properties;
    }

    private static LocalFileStorage storageAt(Path root) {
        return new LocalFileStorage(propertiesFor(root));
    }

    @Test
    @DisplayName("저장한 파일을 그대로 다시 읽는다")
    void should_round_trip_when_stored(@TempDir Path root) throws IOException {
        LocalFileStorage storage = storageAt(root.resolve("storage"));

        long written = storage.put("projects/a/file",
                new ByteArrayInputStream("본문".getBytes(StandardCharsets.UTF_8)));

        assertThat(written).isEqualTo("본문".getBytes(StandardCharsets.UTF_8).length);
        try (InputStream read = storage.read("projects/a/file")) {
            assertThat(new String(read.readAllBytes(), StandardCharsets.UTF_8)).isEqualTo("본문");
        }
    }

    @Test
    @DisplayName("루트 밖으로 나가는 저장 키는 거부한다")
    void should_reject_when_key_escapes_root(@TempDir Path root) {
        LocalFileStorage storage = storageAt(root.resolve("storage"));

        assertThatThrownBy(() -> storage.read("../../etc/passwd"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("잘못된 저장 경로");
    }

    @Test
    @DisplayName("메타데이터는 있는데 실물이 없으면 404 다 — 복구가 필요한 신호")
    void should_report_not_found_when_file_missing(@TempDir Path root) {
        LocalFileStorage storage = storageAt(root.resolve("storage"));

        assertThatThrownBy(() -> storage.read("projects/a/missing"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("저장된 파일을 찾을 수 없습니다");
    }

    /**
     * 폐쇄망 반입 후 첫 기동이 죽는 전형적인 경우다. 메시지만 보고 원인을 찾을 수 있어야 한다.
     * 권한 조작은 OS 마다 동작이 달라, 여기서는 "파일 아래에 디렉터리를 만들 수 없다"로 실패를 만든다.
     */
    @Test
    @DisplayName("저장소를 만들 수 없으면 경로·실행 계정·조치 방법을 메시지에 담아 기동을 끊는다")
    void should_explain_cause_when_storage_unusable(@TempDir Path root) throws IOException {
        Path blocker = root.resolve("blocker");
        Files.writeString(blocker, "이 자리는 디렉터리가 아니라 파일이다");

        assertThatThrownBy(() -> storageAt(blocker.resolve("storage")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("파일 저장소 디렉터리를")
                .hasMessageContaining(blocker.toString())
                .hasMessageContaining("실행 계정:")
                .hasMessageContaining("존재하는 상위 경로:")
                .hasMessageContaining("조치:");
    }

    @Test
    @DisplayName("uid 를 알아내지 못해도 실행할 수 없는 명령을 안내하지 않는다")
    void should_not_suggest_broken_command_when_uid_unknown(@TempDir Path root) throws IOException {
        Path blocker = root.resolve("blocker");
        Files.writeString(blocker, "이 자리는 디렉터리가 아니라 파일이다");

        assertThatThrownBy(() -> storageAt(blocker.resolve("storage")))
                .isInstanceOf(IllegalStateException.class)
                // uid 자리에 "알 수 없음" 이 들어간 chown 은 그대로 복사해 실행할 수 없다
                .hasMessageNotContaining("chown -R 알 수 없음");
    }
}
