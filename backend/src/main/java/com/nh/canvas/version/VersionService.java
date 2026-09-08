package com.nh.canvas.version;

import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.file.FileRepository;
import com.nh.canvas.file.FileRepository.FileRow;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRepository;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.screen.ScreenBaker;
import com.nh.canvas.screen.ScreenRepository;
import com.nh.canvas.screen.ScreenRepository.ScreenRow;
import com.nh.canvas.screen.ScreenRepository.ScreenSummaryRow;
import com.nh.canvas.template.TemplateService;
import com.nh.canvas.version.VersionRepository.VersionRow;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Version = 결과물의 논리적 스냅샷 (ARCHITECTURE 5절 · FR-09).
 *
 * <p>"왜 이렇게 됐는가"는 History 가 담당한다. 여기서는 "지금 어떤 상태인가"만 다룬다.
 */
@Service
public class VersionService {

    private final VersionRepository versions;
    private final ProjectRepository projects;
    private final ProjectAccessGuard guard;
    private final ScreenRepository screens;
    private final ScreenBaker baker;
    private final FileRepository files;
    private final TemplateService templates;
    private final HistoryRecorder history;
    private final AuditLogger audit;

    public VersionService(VersionRepository versions, ProjectRepository projects, ProjectAccessGuard guard,
                          ScreenRepository screens, ScreenBaker baker, FileRepository files,
                          TemplateService templates, HistoryRecorder history, AuditLogger audit) {
        this.versions = versions;
        this.projects = projects;
        this.guard = guard;
        this.screens = screens;
        this.baker = baker;
        this.files = files;
        this.templates = templates;
        this.history = history;
        this.audit = audit;
    }

    public record VersionDetail(VersionRow version, List<ScreenSummaryRow> screens, List<FileRow> files) {}

    public record ScreenDiff(String screenKey, String name, String change,
                             String beforeHtml, String afterHtml) {}

    public record FileDiff(String name, String change, UUID beforeFileId, UUID afterFileId) {}

    public record CompareResult(VersionRow base, VersionRow target,
                                List<ScreenDiff> screens, List<FileDiff> files) {}

    // ------------------------------------------------------------------ 조회

    public CursorPage<VersionRow> list(AuthenticatedUser user, UUID projectId,
                                       Integer beforeVersionNo, Integer limit) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        int size = limit == null ? 20 : Math.min(Math.max(limit, 1), 100);
        List<VersionRow> rows = versions.listByProject(projectId, beforeVersionNo, size);
        boolean hasMore = rows.size() > size;
        List<VersionRow> items = hasMore ? rows.subList(0, size) : rows;
        String nextCursor = hasMore && !items.isEmpty()
                ? String.valueOf(items.get(items.size() - 1).versionNo())
                : null;
        return new CursorPage<>(List.copyOf(items), nextCursor, hasMore);
    }

    public VersionDetail get(AuthenticatedUser user, UUID versionId) {
        guard.requireForVersion(versionId, user, ProjectRole.VIEWER);
        VersionRow version = versions.findById(versionId).orElseThrow(() -> ApiException.notFound("Version"));
        return new VersionDetail(version, screens.listSummaries(versionId), files.findAllByVersion(versionId));
    }

    /**
     * 두 Version 을 화면 key·파일 이름으로 짝지어 전후를 돌려준다 (05_API_DB_SPEC 2절).
     *
     * <p>화면 HTML 은 <b>baking 을 거친 값</b>이다. 저장본을 그대로 비교하면 요소 편집이
     * 비교 결과에서 통째로 빠져 "바뀐 게 없다"고 나온다.
     */
    public CompareResult compare(AuthenticatedUser user, UUID targetVersionId, UUID baseVersionId) {
        UUID projectId = guard.requireForVersion(targetVersionId, user, ProjectRole.VIEWER);
        VersionRow target = versions.findById(targetVersionId).orElseThrow(() -> ApiException.notFound("Version"));
        VersionRow base = versions.findById(baseVersionId).orElseThrow(() -> ApiException.notFound("비교 대상 Version"));

        if (!base.projectId().equals(projectId)) {
            // 다른 프로젝트의 Version 과는 비교하지 않는다. 권한이 다르고 의미도 없다
            throw ApiException.invalid("같은 프로젝트의 Version 끼리만 비교할 수 있습니다.");
        }

        Map<String, ScreenRow> beforeScreens = screens.listByVersion(baseVersionId).stream()
                .collect(Collectors.toMap(ScreenRow::screenKey, Function.identity(), (a, b) -> a));
        Map<String, ScreenRow> afterScreens = screens.listByVersion(targetVersionId).stream()
                .collect(Collectors.toMap(ScreenRow::screenKey, Function.identity(), (a, b) -> a));

        Set<String> keys = new LinkedHashSet<>();
        keys.addAll(afterScreens.keySet());
        keys.addAll(beforeScreens.keySet());

        List<ScreenDiff> screenDiffs = new ArrayList<>();
        for (String key : keys) {
            ScreenRow before = beforeScreens.get(key);
            ScreenRow after = afterScreens.get(key);
            String beforeHtml = before == null ? null : baker.bake(before.id(), before.htmlContent());
            String afterHtml = after == null ? null : baker.bake(after.id(), after.htmlContent());
            screenDiffs.add(new ScreenDiff(key,
                    after != null ? after.name() : before.name(),
                    classify(beforeHtml, afterHtml),
                    beforeHtml, afterHtml));
        }

        List<FileDiff> fileDiffs = compareFiles(baseVersionId, targetVersionId);
        audit.success(user, "VERSION_COMPARE", "VERSION", targetVersionId, projectId);
        return new CompareResult(base, target, screenDiffs, fileDiffs);
    }

    private List<FileDiff> compareFiles(UUID baseVersionId, UUID targetVersionId) {
        Map<String, FileRow> before = files.findAllByVersion(baseVersionId).stream()
                .collect(Collectors.toMap(FileRow::originalName, Function.identity(), (a, b) -> a));
        Map<String, FileRow> after = files.findAllByVersion(targetVersionId).stream()
                .collect(Collectors.toMap(FileRow::originalName, Function.identity(), (a, b) -> a));

        Set<String> names = new LinkedHashSet<>();
        names.addAll(after.keySet());
        names.addAll(before.keySet());

        List<FileDiff> diffs = new ArrayList<>();
        for (String name : names) {
            FileRow oldFile = before.get(name);
            FileRow newFile = after.get(name);
            String change;
            if (oldFile == null) {
                change = "ADDED";
            } else if (newFile == null) {
                change = "REMOVED";
            } else {
                // 이름이 같아도 내용이 같다는 보장은 없다. 체크섬으로 판단한다
                change = Objects.equals(oldFile.checksumSha256(), newFile.checksumSha256())
                        ? "UNCHANGED" : "CHANGED";
            }
            diffs.add(new FileDiff(name, change,
                    oldFile == null ? null : oldFile.id(),
                    newFile == null ? null : newFile.id()));
        }
        return diffs;
    }

    private String classify(String before, String after) {
        if (before == null) {
            return "ADDED";
        }
        if (after == null) {
            return "REMOVED";
        }
        return before.equals(after) ? "UNCHANGED" : "CHANGED";
    }

    // ------------------------------------------------------------------ 생성

    /**
     * 새 Version 을 만든다. AI 생성·수정·수동 편집·Import 가 모두 이 경로를 지난다.
     *
     * <p>{@code designSystemId} 는 값 검증만 하고 FK 로 묶지 않는다 (05_API_DB_SPEC 9-2절).
     */
    @Transactional
    public VersionRow create(UUID projectId, UUID parentVersionId, String sourceType, UUID sourceJobId,
                             UUID designSystemId, String proposal, String summary, UUID createdBy) {
        if (designSystemId != null && !templates.isBrandAsset(designSystemId)) {
            throw ApiException.invalid("designSystemId 는 BRAND_ASSET Template 이어야 합니다.");
        }
        int versionNo = versions.nextVersionNo(projectId);
        UUID id = UUID.randomUUID();
        versions.insert(id, projectId, parentVersionId, versionNo, sourceType, sourceJobId,
                designSystemId, proposal, summary, createdBy);
        projects.touchActivity(projectId);
        history.record(projectId,
                sourceJobId != null ? HistoryRecorder.ActorType.AI : HistoryRecorder.ActorType.USER,
                createdBy, "VERSION_CREATED", "VERSION", id,
                Map.of("versionNo", versionNo, "sourceType", sourceType));
        return versions.findById(id).orElseThrow(() -> ApiException.notFound("Version"));
    }

    /** 결과물이 완성되면 READY 로 올리고 이전 READY 를 SUPERSEDED 로 내린다. */
    @Transactional
    public void markReady(UUID versionId) {
        VersionRow version = versions.findById(versionId).orElseThrow(() -> ApiException.notFound("Version"));
        versions.updateStatus(versionId, "READY");
        versions.supersedeOthers(version.projectId(), versionId);
    }

    public Optional<VersionRow> latest(UUID projectId) {
        return versions.findLatest(projectId);
    }

    public VersionRow require(UUID versionId) {
        return versions.findById(versionId).orElseThrow(() -> ApiException.notFound("Version"));
    }
}
