package com.nh.canvas.comment;

import com.nh.canvas.common.web.Cursors;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class CommentRepository {

    private final JdbcClient db;

    public CommentRepository(JdbcClient db) {
        this.db = db;
    }

    public record CommentRow(UUID id, UUID projectId, UUID versionId, UUID screenId, UUID parentId,
                             String nhId, String anchorStatus, String body,
                             UUID authorId, String authorName,
                             Instant createdAt, Instant updatedAt, Instant resolvedAt) {}

    private static final String SELECT = """
            SELECT c.id, c.project_id, c.version_id, c.screen_id, c.parent_id, c.nh_id, c.anchor_status,
                   c.body, c.author_id, u.name AS author_name, c.created_at, c.updated_at, c.resolved_at
              FROM comments c
              JOIN users u ON u.id = c.author_id
             WHERE c.deleted_at IS NULL
            """;

    public void insert(UUID id, UUID projectId, UUID versionId, UUID screenId, UUID parentId,
                       String nhId, String anchorStatus, String body, UUID authorId) {
        db.sql("""
                INSERT INTO comments
                    (id, project_id, version_id, screen_id, parent_id, nh_id, anchor_status, body, author_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)
                .params(id, projectId, versionId, screenId, parentId, nhId, anchorStatus, body, authorId)
                .update();
    }

    public Optional<CommentRow> findById(UUID id) {
        return db.sql(SELECT + " AND c.id = ?").param(id).query(CommentRow.class).optional();
    }

    public List<CommentRow> listByProject(UUID projectId, UUID versionId, Boolean resolved,
                                          Cursors.Position cursor, int limit) {
        StringBuilder sql = new StringBuilder(SELECT + " AND c.project_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(projectId);
        if (versionId != null) {
            sql.append(" AND c.version_id = ?");
            params.add(versionId);
        }
        if (resolved != null) {
            sql.append(resolved ? " AND c.resolved_at IS NOT NULL" : " AND c.resolved_at IS NULL");
        }
        if (cursor != null) {
            sql.append(" AND (c.created_at, c.id) < (?, ?)");
            params.add(cursor.at());
            params.add(cursor.id());
        }
        sql.append(" ORDER BY c.created_at DESC, c.id DESC LIMIT ?");
        params.add(limit + 1);
        return db.sql(sql.toString()).params(params).query(CommentRow.class).list();
    }

    /** 화면 안의 의견은 스레드로 보므로 시간 오름차순이다. */
    public List<CommentRow> listByScreen(UUID screenId) {
        return db.sql(SELECT + " AND c.screen_id = ? ORDER BY c.created_at")
                .param(screenId)
                .query(CommentRow.class)
                .list();
    }

    /** FR-15 검토 입력. 프로젝트의 의견 본문 전체를 시간순으로 모은다. */
    public List<CommentRow> listAllForReview(UUID projectId) {
        return db.sql(SELECT + " AND c.project_id = ? ORDER BY c.created_at")
                .param(projectId)
                .query(CommentRow.class)
                .list();
    }

    public void updateBody(UUID id, String body) {
        db.sql("UPDATE comments SET body = ?, updated_at = now() WHERE id = ?").params(body, id).update();
    }

    public void setResolved(UUID id, boolean resolved) {
        db.sql("UPDATE comments SET resolved_at = " + (resolved ? "now()" : "NULL")
                + ", updated_at = now() WHERE id = ?")
                .param(id)
                .update();
    }

    /** 답글이 달린 의견을 물리 삭제하면 스레드가 끊긴다. soft delete 로 남긴다. */
    public int softDelete(UUID id) {
        return db.sql("UPDATE comments SET deleted_at = now() WHERE id = ? AND deleted_at IS NULL")
                .param(id)
                .update();
    }

    public boolean isReply(UUID id) {
        return db.sql("SELECT parent_id IS NOT NULL FROM comments WHERE id = ?")
                .param(id)
                .query(Boolean.class)
                .optional()
                .orElse(false);
    }

    public Optional<UUID> findRootId(UUID id) {
        return db.sql("SELECT COALESCE(parent_id, id) FROM comments WHERE id = ? AND deleted_at IS NULL")
                .param(id)
                .query(UUID.class)
                .optional();
    }
}
