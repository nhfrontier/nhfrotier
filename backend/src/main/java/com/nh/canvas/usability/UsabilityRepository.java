package com.nh.canvas.usability;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UsabilityRepository {

    private final JdbcClient db;

    public UsabilityRepository(JdbcClient db) {
        this.db = db;
    }

    /** {@code requestedBy} 가 FR-14 와 다른 컬럼이다. 수동 트리거라 누가 불렀는지가 의미를 갖는다. */
    public record ReviewRow(UUID id, UUID versionId, String status, String model, String error,
                            UUID requestedBy, String requestedByName,
                            Instant createdAt, Instant finishedAt) {}

    public record FindingRow(UUID id, UUID reviewId, String lensId, String severity, String title,
                             String evidence, String evidenceSource, String why, String suggestion,
                             String decision, UUID decisionBy, String decisionByName,
                             String decisionReason, Instant decidedAt, Instant createdAt) {}

    public UUID insertReview(UUID versionId, UUID requestedBy) {
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO usability_reviews (id, version_id, requested_by) VALUES (?, ?, ?)")
                .params(id, versionId, requestedBy)
                .update();
        return id;
    }

    public void finishReview(UUID reviewId, String model) {
        db.sql("UPDATE usability_reviews SET status = 'DONE', model = ?, finished_at = now() WHERE id = ?")
                .params(model, reviewId)
                .update();
    }

    public void failReview(UUID reviewId, String error) {
        db.sql("UPDATE usability_reviews SET status = 'FAILED', error = ?, finished_at = now() WHERE id = ?")
                .params(error, reviewId)
                .update();
    }

    private static final String REVIEW_SELECT = """
            SELECT r.id, r.version_id, r.status, r.model, r.error, r.requested_by,
                   u.name AS requested_by_name, r.created_at, r.finished_at
              FROM usability_reviews r
              JOIN users u ON u.id = r.requested_by
            """;

    public Optional<ReviewRow> findLatest(UUID versionId) {
        return db.sql(REVIEW_SELECT + " WHERE r.version_id = ? ORDER BY r.created_at DESC LIMIT 1")
                .param(versionId)
                .query(ReviewRow.class)
                .optional();
    }

    public void insertFinding(UUID reviewId, String lensId, String severity, String title, String evidence,
                              String evidenceSource, String why, String suggestion) {
        db.sql("""
                INSERT INTO usability_findings
                    (id, review_id, lens_id, severity, title, evidence, evidence_source, why, suggestion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)
                .params(UUID.randomUUID(), reviewId, lensId, severity, title, evidence,
                        evidenceSource, why, suggestion)
                .update();
    }

    private static final String FINDING_SELECT = """
            SELECT f.id, f.review_id, f.lens_id, f.severity, f.title, f.evidence, f.evidence_source,
                   f.why, f.suggestion, f.decision, f.decision_by, u.name AS decision_by_name,
                   f.decision_reason, f.decided_at, f.created_at
              FROM usability_findings f
              LEFT JOIN users u ON u.id = f.decision_by
            """;

    public List<FindingRow> listFindings(UUID reviewId) {
        return db.sql(FINDING_SELECT + " WHERE f.review_id = ? ORDER BY f.severity, f.lens_id")
                .param(reviewId)
                .query(FindingRow.class)
                .list();
    }

    /**
     * 프로젝트의 모든 UX 지적. 의견 목록에 사람 댓글과 시간순으로 섞어 보여주기 위한 것이다
     * (08_DECISIONS — 저장은 분리하고 합치는 것은 화면에서만 한다).
     */
    public List<FindingRow> listByProject(UUID projectId) {
        return db.sql(FINDING_SELECT + """
                  JOIN usability_reviews r ON r.id = f.review_id
                  JOIN versions v ON v.id = r.version_id
                 WHERE v.project_id = ?
                 ORDER BY f.created_at
                """)
                .param(projectId)
                .query(FindingRow.class)
                .list();
    }

    public Optional<FindingRow> findFinding(UUID findingId) {
        return db.sql(FINDING_SELECT + " WHERE f.id = ?").param(findingId).query(FindingRow.class).optional();
    }

    public Optional<UUID> findVersionIdOfFinding(UUID findingId) {
        return db.sql("""
                SELECT r.version_id FROM usability_findings f
                  JOIN usability_reviews r ON r.id = f.review_id
                 WHERE f.id = ?
                """)
                .param(findingId)
                .query(UUID.class)
                .optional();
    }

    public void decide(UUID findingId, String decision, UUID decidedBy, String reason) {
        db.sql("""
                UPDATE usability_findings
                   SET decision = ?, decision_by = ?, decision_reason = ?, decided_at = now()
                 WHERE id = ?
                """)
                .params(decision, decidedBy, reason, findingId)
                .update();
    }
}
