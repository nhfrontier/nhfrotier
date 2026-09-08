package com.nh.canvas.project;

import com.nh.canvas.common.web.Cursors;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProjectRepository {

    private final JdbcClient db;

    public ProjectRepository(JdbcClient db) {
        this.db = db;
    }

    /**
     * 목록 행. 화면이 행마다 추가 호출하지 않도록 집계를 함께 담는다
     * (05_API_DB_SPEC 1절 "N+1 금지").
     */
    public record ProjectSummaryRow(
            UUID id, String name, String purpose, String status,
            Instant lastActivityAt, Instant createdAt,
            String myRole, long memberCount, long pendingReviewCount) {}

    public record ProjectRow(
            UUID id, String name, String purpose, String description, String status,
            UUID createdBy, Instant createdAt, Instant updatedAt, Instant lastActivityAt) {}

    public record MemberRow(UUID userId, String loginId, String name, String department,
                            String role, Instant createdAt) {}

    private static final String SUMMARY_SELECT = """
            SELECT p.id, p.name, p.purpose, p.status, p.last_activity_at, p.created_at,
                   pm.role AS my_role,
                   (SELECT count(*) FROM project_members m WHERE m.project_id = p.id) AS member_count,
                   (
                     (SELECT count(*) FROM responsibility_findings rf
                        JOIN responsibility_reviews rr ON rr.id = rf.review_id
                        JOIN versions v ON v.id = rr.version_id
                       WHERE v.project_id = p.id AND rf.decision IS NULL)
                   + (SELECT count(*) FROM usability_findings uf
                        JOIN usability_reviews ur ON ur.id = uf.review_id
                        JOIN versions v ON v.id = ur.version_id
                       WHERE v.project_id = p.id AND uf.decision IS NULL)
                   + (SELECT count(*) FROM review_items ri
                        JOIN review_summaries rs ON rs.id = ri.summary_id
                        LEFT JOIN review_decisions rd ON rd.review_item_id = ri.id
                       WHERE rs.project_id = p.id AND rd.id IS NULL)
                   ) AS pending_review_count
              FROM projects p
              JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
             WHERE p.status <> 'DELETED'
            """;

    /** 커서는 (last_activity_at, id) 두 값을 함께 비교한다. 같은 시각의 행에서 페이지가 어긋나지 않도록. */
    public List<ProjectSummaryRow> listForUser(UUID userId, Cursors.Position cursor, int limit) {
        StringBuilder sql = new StringBuilder(SUMMARY_SELECT);
        List<Object> params = new ArrayList<>();
        params.add(userId);
        if (cursor != null) {
            sql.append(" AND (p.last_activity_at, p.id) < (?, ?)");
            params.add(cursor.at());
            params.add(cursor.id());
        }
        sql.append(" ORDER BY p.last_activity_at DESC, p.id DESC LIMIT ?");
        params.add(limit + 1);

        return db.sql(sql.toString()).params(params).query(ProjectSummaryRow.class).list();
    }

    public List<ProjectSummaryRow> recentForUser(UUID userId, int limit) {
        return db.sql(SUMMARY_SELECT + " ORDER BY p.last_activity_at DESC, p.id DESC LIMIT ?")
                .params(userId, limit)
                .query(ProjectSummaryRow.class)
                .list();
    }

    public Optional<ProjectRow> findById(UUID id) {
        return db.sql("""
                SELECT id, name, purpose, description, status, created_by, created_at, updated_at, last_activity_at
                  FROM projects WHERE id = ? AND status <> 'DELETED'
                """)
                .param(id)
                .query(ProjectRow.class)
                .optional();
    }

    public void insert(UUID id, String name, String purpose, String description, UUID createdBy) {
        db.sql("INSERT INTO projects (id, name, purpose, description, created_by) VALUES (?, ?, ?, ?, ?)")
                .params(id, name, purpose, description, createdBy)
                .update();
    }

    /** null 인 필드는 건드리지 않는다 (PATCH 의미론). */
    public void update(UUID id, String name, String purpose, String description, String status) {
        db.sql("""
                UPDATE projects
                   SET name        = COALESCE(?, name),
                       purpose     = COALESCE(?, purpose),
                       description = COALESCE(?, description),
                       status      = COALESCE(?, status),
                       updated_at  = now()
                 WHERE id = ?
                """)
                .params(name, purpose, description, status, id)
                .update();
    }

    /** 목록 정렬 기준. 프로젝트에 무슨 일이 생길 때마다 올린다. */
    public void touchActivity(UUID projectId) {
        db.sql("UPDATE projects SET last_activity_at = now() WHERE id = ?").param(projectId).update();
    }

    public void addMember(UUID projectId, UUID userId, ProjectRole role, UUID addedBy) {
        db.sql("""
                INSERT INTO project_members (project_id, user_id, role, added_by)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role
                """)
                .params(projectId, userId, role.name(), addedBy)
                .update();
    }

    public int removeMember(UUID projectId, UUID userId) {
        return db.sql("DELETE FROM project_members WHERE project_id = ? AND user_id = ?")
                .params(projectId, userId)
                .update();
    }

    public List<MemberRow> listMembers(UUID projectId) {
        return db.sql("""
                SELECT u.id AS user_id, u.login_id, u.name, u.department, pm.role, pm.created_at
                  FROM project_members pm
                  JOIN users u ON u.id = pm.user_id
                 WHERE pm.project_id = ?
                 ORDER BY pm.created_at
                """)
                .param(projectId)
                .query(MemberRow.class)
                .list();
    }

    public long countOwners(UUID projectId) {
        return db.sql("SELECT count(*) FROM project_members WHERE project_id = ? AND role = 'OWNER'")
                .param(projectId)
                .query(Long.class)
                .single();
    }
}
