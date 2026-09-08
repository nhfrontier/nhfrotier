package com.nh.canvas.export;

import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.export.ExportRepository.ExportRow;
import com.nh.canvas.file.FileRepository;
import com.nh.canvas.file.FileRepository.FileRow;
import com.nh.canvas.file.FileStorage;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.screen.ScreenBaker;
import com.nh.canvas.screen.ScreenRepository;
import com.nh.canvas.screen.ScreenRepository.ScreenRow;
import com.nh.canvas.version.VersionRepository.VersionRow;
import com.nh.canvas.version.VersionService;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Export (FR-11).
 *
 * <p>지원 포맷은 <b>ZIP 하나</b>다 — 화면마다 HTML 파일 하나씩 담는다. 화면 한 장의 HTML 이
 * 이미 결정된 반출 단위이므로(FR-11 2절), 그것을 묶기만 하고 새 문서 형식을 만들지 않는다.
 * PDF/PNG 는 별도 렌더러가 필요하고 포맷 우선순위 자체가 미결이라 422 로 거절한다
 * (08_DECISIONS 2절 업무).
 *
 * <p>반출되는 HTML 은 <b>편집이 반영된 것</b>이다. 저장본을 그대로 내보내면 사람이 고친 내용이
 * 빠진 파일이 나간다.
 */
@Service
public class ExportService {

    private static final Set<String> SUPPORTED = Set.of("ZIP");
    private static final Set<String> KNOWN_BUT_UNAVAILABLE = Set.of("PDF", "PNG", "HTML");

    private final ExportRepository exports;
    private final ScreenRepository screens;
    private final ScreenBaker baker;
    private final FileRepository files;
    private final FileStorage storage;
    private final VersionService versions;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;

    public ExportService(ExportRepository exports, ScreenRepository screens, ScreenBaker baker,
                         FileRepository files, FileStorage storage, VersionService versions,
                         ProjectAccessGuard guard, HistoryRecorder history, AuditLogger audit) {
        this.exports = exports;
        this.screens = screens;
        this.baker = baker;
        this.files = files;
        this.storage = storage;
        this.versions = versions;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
    }

    public record DownloadHandle(FileRow meta, InputStream content) {}

    /** 요청만 남기고 즉시 돌려준다. 변환은 워커가 한다. */
    @Transactional
    public ExportRow request(AuthenticatedUser user, UUID versionId, String format) {
        UUID projectId = guard.requireForVersion(versionId, user, ProjectRole.EDITOR);
        String normalized = format == null ? "ZIP" : format.toUpperCase();

        if (KNOWN_BUT_UNAVAILABLE.contains(normalized)) {
            throw ApiException.ruleViolation(
                    normalized + " 반출은 아직 지원하지 않습니다. 현재 지원 포맷은 ZIP 입니다.");
        }
        if (!SUPPORTED.contains(normalized)) {
            throw ApiException.invalid("format 은 ZIP 이어야 합니다.");
        }

        UUID exportId = exports.insert(versionId, normalized, user.id());
        history.user(projectId, user.id(), "EXPORT_REQUESTED", "VERSION", versionId,
                Map.of("format", normalized, "exportId", exportId.toString()));
        audit.success(user, "EXPORT_REQUEST", "EXPORT", exportId, projectId);
        return exports.findById(exportId).orElseThrow();
    }

    public ExportRow get(AuthenticatedUser user, UUID exportId) {
        guard.requireForExport(exportId, user, ProjectRole.VIEWER);
        return exports.findById(exportId).orElseThrow(() -> ApiException.notFound("Export"));
    }

    public List<ExportRow> listByVersion(AuthenticatedUser user, UUID versionId) {
        guard.requireForVersion(versionId, user, ProjectRole.VIEWER);
        return exports.listByVersion(versionId);
    }

    /** 다운로드는 감사 대상이다. 반출된 파일이 어느 Version 에서 나왔는지가 남아야 한다. */
    public DownloadHandle download(AuthenticatedUser user, UUID exportId) {
        UUID projectId = guard.requireForExport(exportId, user, ProjectRole.VIEWER);
        ExportRow export = exports.findById(exportId).orElseThrow(() -> ApiException.notFound("Export"));

        if (!"COMPLETED".equals(export.status()) || export.fileId() == null) {
            throw ApiException.ruleViolation("아직 완료되지 않은 Export 입니다.");
        }
        FileRow meta = files.findById(export.fileId()).orElseThrow(() -> ApiException.notFound("파일"));
        audit.success(user, "EXPORT_DOWNLOAD", "EXPORT", exportId, projectId);
        return new DownloadHandle(meta, storage.read(meta.storageKey()));
    }

    /**
     * 실제 변환. 워커가 부른다.
     *
     * <p>결과 파일은 File Storage 에 두고 DB 에는 메타데이터만 남긴다. Version 과도 연결해
     * 반출된 산출물이 어느 버전에서 나왔는지 추적할 수 있게 한다.
     */
    @Transactional
    public void process(ExportRow export) {
        VersionRow version = versions.require(export.versionId());
        List<ScreenRow> screenRows = screens.listByVersion(export.versionId());
        if (screenRows.isEmpty()) {
            exports.markFailed(export.id(), "반출할 화면이 없습니다.");
            return;
        }

        byte[] archive = zipScreens(screenRows);
        UUID fileId = UUID.randomUUID();
        String storageKey = "projects/%s/exports/%s/%s.zip"
                .formatted(version.projectId(), LocalDate.now(), fileId);
        long written = storage.put(storageKey, new ByteArrayInputStream(archive));

        FileRow row = new FileRow(fileId, version.projectId(),
                "version-%d-screens.zip".formatted(version.versionNo()),
                "application/zip", written, sha256(archive), storageKey, "EXPORT",
                export.requestedBy(), export.requestedByName(), null);
        files.insert(row);
        files.linkToVersion(export.versionId(), fileId, "OUTPUT");
        exports.markCompleted(export.id(), fileId);

        history.system(version.projectId(), "EXPORT_COMPLETED", "VERSION", export.versionId(),
                Map.of("exportId", export.id().toString(), "screens", screenRows.size()));
    }

    private byte[] zipScreens(List<ScreenRow> screenRows) {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(buffer, StandardCharsets.UTF_8)) {
            int order = 1;
            for (ScreenRow screen : screenRows) {
                if (screen.htmlContent() == null || screen.htmlContent().isBlank()) {
                    continue;
                }
                String entryName = "%02d-%s.html".formatted(order++, screen.screenKey());
                zip.putNextEntry(new ZipEntry(entryName));
                zip.write(baker.bake(screen.id(), screen.htmlContent()).getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        } catch (IOException ex) {
            throw new com.nh.canvas.common.error.ApiException(
                    com.nh.canvas.common.error.ErrorCode.INTERNAL_ERROR, "반출 파일을 만들지 못했습니다.", ex);
        }
        return buffer.toByteArray();
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception ex) {
            throw new com.nh.canvas.common.error.ApiException(
                    com.nh.canvas.common.error.ErrorCode.INTERNAL_ERROR, "체크섬 계산에 실패했습니다.", ex);
        }
    }
}
