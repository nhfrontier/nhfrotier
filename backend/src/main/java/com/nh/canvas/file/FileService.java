package com.nh.canvas.file;

import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.common.web.Cursors;
import com.nh.canvas.file.FileRepository.FileRow;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

    private final FileRepository files;
    private final FileStorage storage;
    private final StorageProperties properties;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;

    public FileService(FileRepository files, FileStorage storage, StorageProperties properties,
                       ProjectAccessGuard guard, HistoryRecorder history, AuditLogger audit) {
        this.files = files;
        this.storage = storage;
        this.properties = properties;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
    }

    public record DownloadHandle(FileRow meta, InputStream content) {}

    public CursorPage<FileRow> list(AuthenticatedUser user, UUID projectId, String kind,
                                    String cursor, Integer limit) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        int size = Cursors.normalizeLimit(limit);
        List<FileRow> rows = files.listByProject(projectId, kind, Cursors.decode(cursor), size);
        return CursorPage.of(rows, size, FileRow::createdAt, FileRow::id);
    }

    @Transactional
    public FileRow upload(AuthenticatedUser user, UUID projectId, MultipartFile upload) {
        guard.require(projectId, user, ProjectRole.EDITOR);

        if (upload.isEmpty()) {
            throw ApiException.invalid("빈 파일은 업로드할 수 없습니다.");
        }
        if (upload.getSize() > properties.getMaxBytes()) {
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE,
                    "허용 용량(" + properties.getMaxBytes() + " bytes)을 초과했습니다.");
        }

        String contentType = normalizeContentType(upload.getContentType());
        if (!properties.allowedContentTypeSet().contains(contentType)) {
            throw ApiException.invalid("허용되지 않은 파일 형식입니다: " + contentType);
        }

        UUID fileId = UUID.randomUUID();
        // 저장 키는 서버가 만든다. 원본 파일명을 경로에 쓰면 경로 조작과 덮어쓰기가 열린다
        String storageKey = "projects/%s/%s/%s".formatted(projectId, LocalDate.now(), fileId);

        String checksum;
        long written;
        try (InputStream raw = upload.getInputStream();
             BufferedInputStream buffered = new BufferedInputStream(raw)) {

            verifySignature(buffered, contentType);

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (DigestInputStream digesting = new DigestInputStream(buffered, digest)) {
                written = storage.put(storageKey, digesting);
            }
            checksum = HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "업로드 처리 중 오류가 발생했습니다.", ex);
        }

        if (written > properties.getMaxBytes()) {
            // 선언된 크기를 믿지 않는다. 실제로 쓴 양이 넘으면 지우고 거절한다
            storage.delete(storageKey);
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE, "허용 용량을 초과했습니다.");
        }

        FileRow row = new FileRow(fileId, projectId, sanitizeName(upload.getOriginalFilename()),
                contentType, written, checksum, storageKey, "REFERENCE", user.id(), user.name(), null);
        files.insert(row);

        history.user(projectId, user.id(), "FILE_UPLOADED", "FILE", fileId,
                Map.of("name", row.originalName(), "bytes", written));
        audit.success(user, "FILE_UPLOAD", "FILE", fileId, projectId);
        return files.findById(fileId).orElseThrow(() -> ApiException.notFound("파일"));
    }

    /** 다운로드는 모두 감사 대상이다 (05_API_DB_SPEC 1절). */
    public DownloadHandle download(AuthenticatedUser user, UUID fileId) {
        UUID projectId = guard.requireForFile(fileId, user, ProjectRole.VIEWER);
        FileRow meta = files.findById(fileId).orElseThrow(() -> ApiException.notFound("파일"));
        audit.success(user, "FILE_DOWNLOAD", "FILE", fileId, projectId);
        return new DownloadHandle(meta, storage.read(meta.storageKey()));
    }

    /** Version 산출물 다운로드. 파일이 그 Version 에 속하는지까지 확인한다 (IDOR). */
    public DownloadHandle downloadVersionFile(AuthenticatedUser user, UUID versionId, UUID fileId) {
        UUID projectId = guard.requireForVersion(versionId, user, ProjectRole.VIEWER);
        if (!files.isLinkedToVersion(versionId, fileId)) {
            throw ApiException.notFound("Version 산출물");
        }
        FileRow meta = files.findById(fileId).orElseThrow(() -> ApiException.notFound("파일"));
        audit.success(user, "VERSION_FILE_DOWNLOAD", "FILE", fileId, projectId);
        return new DownloadHandle(meta, storage.read(meta.storageKey()));
    }

    @Transactional
    public void delete(AuthenticatedUser user, UUID projectId, UUID fileId) {
        guard.require(projectId, user, ProjectRole.EDITOR);
        FileRow meta = files.findById(fileId).orElseThrow(() -> ApiException.notFound("파일"));
        if (!meta.projectId().equals(projectId)) {
            throw ApiException.notFound("파일");
        }
        files.softDelete(fileId);
        history.user(projectId, user.id(), "FILE_DELETED", "FILE", fileId,
                Map.of("name", meta.originalName()));
        audit.success(user, "FILE_DELETE", "FILE", fileId, projectId);
    }

    private void verifySignature(BufferedInputStream buffered, String contentType) throws IOException {
        if (!FileTypeSniffer.hasSignature(contentType)) {
            return;
        }
        buffered.mark(FileTypeSniffer.PEEK_BYTES + 1);
        byte[] head = buffered.readNBytes(FileTypeSniffer.PEEK_BYTES);
        buffered.reset();
        if (!FileTypeSniffer.matches(contentType, head)) {
            throw ApiException.invalid("파일 내용이 선언된 형식과 다릅니다.");
        }
    }

    private static String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw ApiException.invalid("Content-Type 이 필요합니다.");
        }
        int separator = contentType.indexOf(';');
        return (separator < 0 ? contentType : contentType.substring(0, separator)).trim().toLowerCase();
    }

    /** 경로 구분자와 제어문자를 지운다. 저장 경로에는 쓰지 않지만 다운로드 헤더에 실린다. */
    private static String sanitizeName(String original) {
        if (original == null || original.isBlank()) {
            return "unnamed";
        }
        String name = original.replaceAll("[\\\\/\\p{Cntrl}]", "_").trim();
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
    }
}
