package com.nh.canvas.comment;

import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.comment.CommentRepository.CommentRow;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.common.web.Cursors;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRepository;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.screen.ScreenBaker;
import com.nh.canvas.screen.ScreenRepository;
import com.nh.canvas.screen.ScreenRepository.ScreenRow;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 협업 의견 (FR-06).
 *
 * <p>일반 의견({@code anchor_status='none'})과 요소를 지목한 의견({@code 'anchored'})을 구분한다.
 * 재생성으로 앵커가 끊기면 <b>삭제하지 않고</b> {@code 'orphaned'} 로 남겨 사람이 다시 붙일 수 있게 한다.
 */
@Service
public class CommentService {

    private final CommentRepository comments;
    private final ScreenRepository screens;
    private final ScreenBaker baker;
    private final ProjectRepository projects;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;

    public CommentService(CommentRepository comments, ScreenRepository screens, ScreenBaker baker,
                          ProjectRepository projects, ProjectAccessGuard guard, HistoryRecorder history,
                          AuditLogger audit) {
        this.comments = comments;
        this.screens = screens;
        this.baker = baker;
        this.projects = projects;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
    }

    public CursorPage<CommentRow> list(AuthenticatedUser user, UUID projectId, UUID versionId,
                                       Boolean resolved, String cursor, Integer limit) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        int size = Cursors.normalizeLimit(limit);
        List<CommentRow> rows = comments.listByProject(projectId, versionId, resolved,
                Cursors.decode(cursor), size);
        return CursorPage.of(rows, size, CommentRow::createdAt, CommentRow::id);
    }

    public List<CommentRow> listByScreen(AuthenticatedUser user, UUID screenId) {
        guard.requireForScreen(screenId, user, ProjectRole.VIEWER);
        return comments.listByScreen(screenId);
    }

    /** 프로젝트 단위 일반 의견. 화면·요소를 지목하지 않는다. */
    @Transactional
    public CommentRow createProjectComment(AuthenticatedUser user, UUID projectId, UUID versionId,
                                           String body) {
        guard.require(projectId, user, ProjectRole.REVIEWER);
        UUID id = UUID.randomUUID();
        comments.insert(id, projectId, versionId, null, null, null, "none", requireBody(body), user.id());
        projects.touchActivity(projectId);
        history.user(projectId, user.id(), "COMMENT_ADDED", "COMMENT", id, Map.of("anchored", false));
        audit.success(user, "COMMENT_CREATE", "COMMENT", id, projectId);
        return comments.findById(id).orElseThrow();
    }

    /**
     * 화면 의견. {@code nhId} 가 있으면 요소 앵커가 붙고, {@code parentId} 가 있으면 답글이다.
     *
     * <p>답글은 앵커를 갖지 않는다 — 스레드의 위치는 뿌리 의견이 정한다.
     * 답글의 답글은 뿌리로 평탄화한다. 깊이가 늘어나면 화면에서 읽을 수 없고,
     * "이 의견이 반영됐는가"를 추적하는 단위도 흐려진다.
     */
    @Transactional
    public CommentRow createScreenComment(AuthenticatedUser user, UUID screenId, String nhId,
                                          String body, UUID parentId) {
        UUID projectId = guard.requireForScreen(screenId, user, ProjectRole.REVIEWER);
        ScreenRow screen = screens.findById(screenId).orElseThrow(() -> ApiException.notFound("화면"));

        UUID rootId = null;
        if (parentId != null) {
            rootId = comments.findRootId(parentId).orElseThrow(() -> ApiException.notFound("상위 의견"));
        }

        String anchorNhId = rootId != null ? null : nhId;
        String anchorStatus = "none";
        if (anchorNhId != null) {
            if (!baker.hasElement(screenId, anchorNhId)) {
                throw ApiException.notFound("지목한 요소");
            }
            anchorStatus = "anchored";
        }

        UUID id = UUID.randomUUID();
        comments.insert(id, projectId, screen.versionId(), screenId, rootId,
                anchorNhId, anchorStatus, requireBody(body), user.id());
        projects.touchActivity(projectId);
        history.user(projectId, user.id(), rootId == null ? "COMMENT_ADDED" : "COMMENT_REPLIED",
                "COMMENT", id, Map.of("screenKey", screen.screenKey(), "anchored", anchorNhId != null));
        audit.success(user, "COMMENT_CREATE", "COMMENT", id, projectId);
        return comments.findById(id).orElseThrow();
    }

    /**
     * 본문 수정은 작성자만, 해결 토글은 EDITOR 이상이면 가능하다.
     * 남의 의견을 고쳐 쓰는 것과 논의를 닫는 것은 다른 권한이다.
     */
    @Transactional
    public CommentRow update(AuthenticatedUser user, UUID commentId, String body, Boolean resolved) {
        UUID projectId = guard.requireForComment(commentId, user, ProjectRole.REVIEWER);
        CommentRow comment = comments.findById(commentId).orElseThrow(() -> ApiException.notFound("의견"));

        if (body != null) {
            if (!comment.authorId().equals(user.id())) {
                throw ApiException.forbidden("본인이 쓴 의견만 수정할 수 있습니다.");
            }
            comments.updateBody(commentId, requireBody(body));
        }
        if (resolved != null) {
            guard.require(projectId, user, ProjectRole.EDITOR);
            comments.setResolved(commentId, resolved);
            history.user(projectId, user.id(), resolved ? "COMMENT_RESOLVED" : "COMMENT_REOPENED",
                    "COMMENT", commentId, Map.of());
        }
        return comments.findById(commentId).orElseThrow();
    }

    @Transactional
    public void delete(AuthenticatedUser user, UUID commentId) {
        UUID projectId = guard.requireForComment(commentId, user, ProjectRole.REVIEWER);
        CommentRow comment = comments.findById(commentId).orElseThrow(() -> ApiException.notFound("의견"));

        boolean isOwner = comment.authorId().equals(user.id());
        boolean isProjectOwner = guard.roleOf(projectId, user.id())
                .map(role -> role == ProjectRole.OWNER)
                .orElse(false);
        if (!isOwner && !isProjectOwner) {
            throw ApiException.forbidden("본인이 쓴 의견만 삭제할 수 있습니다.");
        }
        comments.softDelete(commentId);
        history.user(projectId, user.id(), "COMMENT_DELETED", "COMMENT", commentId, Map.of());
        audit.success(user, "COMMENT_DELETE", "COMMENT", commentId, projectId);
    }

    private String requireBody(String body) {
        if (body == null || body.isBlank()) {
            throw ApiException.invalid("의견 내용이 필요합니다.");
        }
        return body.trim();
    }
}
