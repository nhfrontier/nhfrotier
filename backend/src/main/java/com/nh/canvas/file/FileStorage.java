package com.nh.canvas.file;

import java.io.InputStream;

/**
 * 파일 저장소 (ARCHITECTURE 7절).
 *
 * <p>DB 에는 메타데이터만 두고 바이너리는 여기에 둔다. NFS 냐 Object Storage 냐가 미결이라
 * 구현체를 갈아끼울 수 있게 인터페이스로 분리한다.
 *
 * <p>업로드·다운로드는 <b>스트리밍</b>이다. 전체를 메모리에 올리면 큰 파일 몇 개로 힙이 마른다.
 */
public interface FileStorage {

    /**
     * @param storageKey 저장소 안의 경로. 사용자 입력이 아니라 서버가 만든 값이어야 한다
     * @return 실제 기록된 바이트 수
     */
    long put(String storageKey, InputStream content);

    InputStream read(String storageKey);

    boolean delete(String storageKey);
}
