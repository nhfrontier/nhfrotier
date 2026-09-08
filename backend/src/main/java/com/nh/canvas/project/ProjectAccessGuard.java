package com.nh.canvas.project;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.error.ApiException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * 인가의 단일 지점 (SECURITY_CHECKLIST 3절 A01 · FR-01).
 *
 * <p><b>UUID PK 는 권한 검증의 대체재가 아니다.</b> projectId·fileId·versionId 를 URL 로 받는
 * 모든 경로는 이 가드를 지나야 한다. 프론트의 버튼 노출 제어는 편의이며 통제가 아니다.
 *
 * <p>리소스 id 로 프로젝트를 거슬러 올라가는 메서드를 함께 두는 이유는, 호출부마다 조인을
 * 손으로 쓰면 한 곳만 빠뜨려도 IDOR 이 되기 때문이다.
 */
@Component
public class ProjectAccessGuard {

    private final JdbcClient db;

    public ProjectAccessGuard(JdbcClient db) {
        this.db = db;
    }

    /** 프로젝트에 대해 최소 권한을 요구한다. 통과하면 실제 보유 역할을 돌려준다. */
    public ProjectRole require(UUID projectId, AuthenticatedUser user, ProjectRole minimum) {
        boolean exists = Boolean.TRUE.equals(db.sql(
                        "SELECT true FROM projects WHERE id = ? AND status <> 'DELETED'")
                .param(projectId)
                .query(Boolean.class)
                .optional()
                .orElse(false));
        if (!exists) {
            throw ApiException.notFound("프로젝트");
        }

        ProjectRole role = roleOf(projectId, user.id())
                .orElseThrow(() -> ApiException.forbidden("이 프로젝트의 멤버가 아닙니다."));
        if (!role.atLeast(minimum)) {
            throw ApiException.forbidden("이 작업에는 " + minimum + " 이상의 권한이 필요합니다.");
        }
        return role;
    }

    public Optional<ProjectRole> roleOf(UUID projectId, UUID userId) {
        return db.sql("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
                .params(projectId, userId)
                .query(String.class)
                .optional()
                .map(ProjectRole::valueOf);
    }

    /** Version 이 속한 프로젝트를 확인한 뒤 권한을 요구한다. */
    public UUID requireForVersion(UUID versionId, AuthenticatedUser user, ProjectRole minimum) {
        UUID projectId = db.sql("SELECT project_id FROM versions WHERE id = ?")
                .param(versionId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("Version"));
        require(projectId, user, minimum);
        return projectId;
    }

    public UUID requireForScreen(UUID screenId, AuthenticatedUser user, ProjectRole minimum) {
        UUID projectId = db.sql("""
                SELECT v.project_id FROM screens s JOIN versions v ON v.id = s.version_id WHERE s.id = ?
                """)
                .param(screenId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("화면"));
        require(projectId, user, minimum);
        return projectId;
    }

    public UUID requireForFile(UUID fileId, AuthenticatedUser user, ProjectRole minimum) {
        UUID projectId = db.sql("SELECT project_id FROM files WHERE id = ? AND deleted_at IS NULL")
                .param(fileId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("파일"));
        require(projectId, user, minimum);
        return projectId;
    }

    public UUID requireForComment(UUID commentId, AuthenticatedUser user, ProjectRole minimum) {
        UUID projectId = db.sql("SELECT project_id FROM comments WHERE id = ? AND deleted_at IS NULL")
                .param(commentId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("의견"));
        require(projectId, user, minimum);
        return projectId;
    }

    public UUID requireForJob(UUID jobId, AuthenticatedUser user, ProjectRole minimum) {
        UUID projectId = db.sql("SELECT project_id FROM ai_jobs WHERE id = ?")
                .param(jobId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("AI 작업"));
        require(projectId, user, minimum);
        return projectId;
    }

    public UUID requireForExport(UUID exportId, AuthenticatedUser user, ProjectRole minimum) {
        UUID projectId = db.sql("""
                SELECT v.project_id FROM exports e JOIN versions v ON v.id = e.version_id WHERE e.id = ?
                """)
                .param(exportId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("Export"));
        require(projectId, user, minimum);
        return projectId;
    }
}
