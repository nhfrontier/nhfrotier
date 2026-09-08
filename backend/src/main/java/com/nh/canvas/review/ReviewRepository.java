package com.nh.canvas.review;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ReviewRepository {

    private final JdbcClient db;

    public ReviewRepository(JdbcClient db) {
        this.db = db;
    }

    public record SummaryRow(UUID id, UUID projectId, UUID versionId, UUID jobId, String status,
                             String model, String error, UUID requestedBy, String requestedByName,
                             Instant createdAt, Instant finishedAt) {}

    public record ItemRow(UUID id, UUID summaryId, String category, String title, String body,
                          int sortOrder, String decision, String decisionReason,
                          UUID decidedBy, String decidedByName, Instant decidedAt,
                          UUID resultingVersionId, Instant createdAt) {}

    public UUID insertSummary(UUID projectId, UUID versionId, UUID jobId, UUID requestedBy) {
        UUID id = UUID.randomUUID();
        db.sql("""
                INSERT INTO review_summaries (id, project_id, version_id, job_id, requested_by)
                VALUES (?, ?, ?, ?, ?)
                """)
                .params(id, projectId, versionId, jobId, requestedBy)
                .update();
        return id;
    }

    public void finishSummary(UUID summaryId, String model) {
        db.sql("UPDATE review_summaries SET status = 'DONE', model = ?, finished_at = now() WHERE id = ?")
                .params(model, summaryId)
                .update();
    }

    public void failSummary(UUID summaryId, String error) {
        db.sql("UPDATE review_summaries SET status = 'FAILED', error = ?, finished_at = now() WHERE id = ?")
                .params(error, summaryId)
                .update();
    }

    private static final String SUMMARY_SELECT = """
            SELECT s.id, s.project_id, s.version_id, s.job_id, s.status, s.model, s.error,
                   s.requested_by, u.name AS requested_by_name, s.created_at, s.finished_at
              FROM review_summaries s
              JOIN users u ON u.id = s.requested_by
            """;

    public Optional<SummaryRow> findSummary(UUID summaryId) {
        return db.sql(SUMMARY_SELECT + " WHERE s.id = ?").param(summaryId).query(SummaryRow.class).optional();
    }

    public Optional<SummaryRow> findSummaryByJob(UUID jobId) {
        return db.sql(SUMMARY_SELECT + " WHERE s.job_id = ?").param(jobId).query(SummaryRow.class).optional();
    }

    public List<SummaryRow> listSummaries(UUID projectId, int limit) {
        return db.sql(SUMMARY_SELECT + " WHERE s.project_id = ? ORDER BY s.created_at DESC LIMIT ?")
                .params(projectId, limit)
                .query(SummaryRow.class)
                .list();
    }

    public UUID insertItem(UUID summaryId, String category, String title, String body, int sortOrder) {
        UUID id = UUID.randomUUID();
        db.sql("""
                INSERT INTO review_items (id, summary_id, category, title, body, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
                """)
                .params(id, summaryId, category, title, body, sortOrder)
                .update();
        return id;
    }

    /** 어떤 댓글이 이 항목의 근거인가. 근거가 하나도 없는 항목은 호출부가 저장하지 않는다. */
    public void linkComment(UUID reviewItemId, UUID commentId) {
        db.sql("""
                INSERT INTO review_item_comments (review_item_id, comment_id) VALUES (?, ?)
                ON CONFLICT DO NOTHING
                """)
                .params(reviewItemId, commentId)
                .update();
    }

    private static final String ITEM_SELECT = """
            SELECT i.id, i.summary_id, i.category, i.title, i.body, i.sort_order,
                   d.decision, d.reason AS decision_reason, d.decided_by, u.name AS decided_by_name,
                   d.decided_at, d.resulting_version_id, i.created_at
              FROM review_items i
              LEFT JOIN review_decisions d ON d.review_item_id = i.id
              LEFT JOIN users u ON u.id = d.decided_by
            """;

    public List<ItemRow> listItems(UUID summaryId) {
        return db.sql(ITEM_SELECT + " WHERE i.summary_id = ? ORDER BY i.sort_order")
                .param(summaryId)
                .query(ItemRow.class)
                .list();
    }

    public List<UUID> listItemCommentIds(UUID reviewItemId) {
        return db.sql("SELECT comment_id FROM review_item_comments WHERE review_item_id = ?")
                .param(reviewItemId)
                .query(UUID.class)
                .list();
    }

    public Optional<UUID> findProjectIdOfItem(UUID reviewItemId) {
        return db.sql("""
                SELECT s.project_id FROM review_items i
                  JOIN review_summaries s ON s.id = i.summary_id
                 WHERE i.id = ?
                """)
                .param(reviewItemId)
                .query(UUID.class)
                .optional();
    }

    /** 결정은 항목당 하나다. 다시 결정하면 덮어쓰되 누가 언제 바꿨는지는 History 에 남는다. */
    public void decide(UUID reviewItemId, String decision, String reason, UUID decidedBy,
                       UUID resultingVersionId) {
        db.sql("""
                INSERT INTO review_decisions
                    (id, review_item_id, decision, reason, decided_by, resulting_version_id)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (review_item_id) DO UPDATE
                   SET decision = EXCLUDED.decision, reason = EXCLUDED.reason,
                       decided_by = EXCLUDED.decided_by, decided_at = now(),
                       resulting_version_id = EXCLUDED.resulting_version_id
                """)
                .params(UUID.randomUUID(), reviewItemId, decision, reason, decidedBy, resultingVersionId)
                .update();
    }
}
