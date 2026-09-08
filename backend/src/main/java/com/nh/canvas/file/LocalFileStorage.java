package com.nh.canvas.file;

import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 로컬 디스크 구현. NFS 마운트도 이것으로 동작한다.
 *
 * <p>경로 조작(../) 방어: 저장 키를 루트 기준으로 정규화한 뒤 <b>루트 밖으로 나가면 거부</b>한다.
 * 키는 서버가 만들지만, 방어를 호출부의 성실함에 의존시키지 않는다.
 */
@Component
@ConditionalOnProperty(name = "canvas.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorage implements FileStorage {

    private final Path root;

    public LocalFileStorage(StorageProperties properties) {
        this.root = Path.of(properties.getLocalRoot()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException ex) {
            throw new IllegalStateException("파일 저장소 디렉터리를 만들 수 없습니다: " + root, ex);
        }
    }

    @Override
    public long put(String storageKey, InputStream content) {
        Path target = resolve(storageKey);
        try {
            Files.createDirectories(target.getParent());
            return Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "파일을 저장하지 못했습니다.", ex);
        }
    }

    @Override
    public InputStream read(String storageKey) {
        Path target = resolve(storageKey);
        if (!Files.isRegularFile(target)) {
            // DB 메타데이터는 있는데 실물이 없는 상태. 복구 절차가 필요한 신호다 (ARCHITECTURE 7절)
            throw new ApiException(ErrorCode.NOT_FOUND, "저장된 파일을 찾을 수 없습니다.");
        }
        try {
            return Files.newInputStream(target);
        } catch (IOException ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "파일을 읽지 못했습니다.", ex);
        }
    }

    @Override
    public boolean delete(String storageKey) {
        try {
            return Files.deleteIfExists(resolve(storageKey));
        } catch (IOException ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "파일을 삭제하지 못했습니다.", ex);
        }
    }

    private Path resolve(String storageKey) {
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw ApiException.invalid("잘못된 저장 경로입니다.");
        }
        return target;
    }
}
