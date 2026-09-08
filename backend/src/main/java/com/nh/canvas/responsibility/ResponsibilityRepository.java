package com.nh.canvas.responsibility;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ResponsibilityRepository {

    private final JdbcClient db;

    public ResponsibilityRepository(JdbcClient db) {
        this.db = db;
    }

    public record ReviewRow(UUID id, UUID versionId, String status, String model, String error,
                            Instant createdAt, Instant finishedAt) {}

    public record FindingRow(UUID id, UUID reviewId, String ruleId, String severity, String title,
                             String evidence, String why, String suggestion,
                             boolean needsComplianceReview, String decision, UUID decisionBy,
                             String decisionByName, String decisionReason, Instant decidedAt,
                             Instant createdAt) {}

    public UUID insertReview(UUID versionId) {
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO responsibility_reviews (id, version_id) VALUES (?, ?)")
                .params(id, versionId)
                .update();
        return id;
    }

    public void finishReview(UUID reviewId, String model) {
        db.sql("UPDATE responsibility_reviews SET status = 'DONE', model = ?, finished_at = now() WHERE id = ?")
                .params(model, reviewId)
                .update();
    }

    public void failReview(UUID reviewId, String error) {
        db.sql("UPDATE responsibility_reviews SET status = 'FAILED', error = ?, finished_at = now() WHERE id = ?")
                .params(error, reviewId)
                .update();
    }

    /** 이전 검토를 덮어쓰지 않고 새 이력을 만든다 (05_API_DB_SPEC 2절). */
    public Optional<ReviewRow> findLatest(UUID versionId) {
        return db.sql("""
                SELECT id, version_id, status, model, error, created_at, finished_at
                  FROM responsibility_reviews
                 WHERE version_id = ?
                 ORDER BY created_at DESC
                 LIMIT 1
                """)
                .param(versionId)
                .query(ReviewRow.class)
                .optional();
    }

    public void insertFinding(UUID reviewId, String ruleId, String severity, String title, String evidence,
                              String why, String suggestion, boolean needsComplianceReview) {
        db.sql("""
                INSERT INTO responsibility_findings
                    (id, review_id, rule_id, severity, title, evidence, why, suggestion, needs_compliance_review)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)
                .params(UUID.randomUUID(), reviewId, ruleId, severity, title, evidence,
                        why, suggestion, needsComplianceReview)
                .update();
    }

    public List<FindingRow> listFindings(UUID reviewId) {
        return db.sql(FINDING_SELECT + " WHERE f.review_id = ? ORDER BY f.severity, f.rule_id")
                .param(reviewId)
                .query(FindingRow.class)
                .list();
    }

    private static final String FINDING_SELECT = """
            SELECT f.id, f.review_id, f.rule_id, f.severity, f.title, f.evidence, f.why, f.suggestion,
                   f.needs_compliance_review, f.decision, f.decision_by, u.name AS decision_by_name,
                   f.decision_reason, f.decided_at, f.created_at
              FROM responsibility_findings f
              LEFT JOIN users u ON u.id = f.decision_by
            """;

    public Optional<FindingRow> findFinding(UUID findingId) {
        return db.sql(FINDING_SELECT + " WHERE f.id = ?").param(findingId).query(FindingRow.class).optional();
    }

    public Optional<UUID> findVersionIdOfFinding(UUID findingId) {
        return db.sql("""
                SELECT r.version_id FROM responsibility_findings f
                  JOIN responsibility_reviews r ON r.id = f.review_id
                 WHERE f.id = ?
                """)
                .param(findingId)
                .query(UUID.class)
                .optional();
    }

    public void decide(UUID findingId, String decision, UUID decidedBy, String reason) {
        db.sql("""
                UPDATE responsibility_findings
                   SET decision = ?, decision_by = ?, decision_reason = ?, decided_at = now()
                 WHERE id = ?
                """)
                .params(decision, decidedBy, reason, findingId)
                .update();
    }
}
