package com.nh.canvas.export;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ExportRepository {

    private final JdbcClient db;

    public ExportRepository(JdbcClient db) {
        this.db = db;
    }

    public record ExportRow(UUID id, UUID versionId, String format, String status, UUID fileId,
                            String errorMessage, UUID requestedBy, String requestedByName,
                            Instant createdAt, Instant finishedAt) {}

    private static final String SELECT = """
            SELECT e.id, e.version_id, e.format, e.status, e.file_id, e.error_message,
                   e.requested_by, u.name AS requested_by_name, e.created_at, e.finished_at
              FROM exports e
              JOIN users u ON u.id = e.requested_by
            """;

    public UUID insert(UUID versionId, String format, UUID requestedBy) {
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO exports (id, version_id, format, requested_by) VALUES (?, ?, ?, ?)")
                .params(id, versionId, format, requestedBy)
                .update();
        return id;
    }

    public Optional<ExportRow> findById(UUID id) {
        return db.sql(SELECT + " WHERE e.id = ?").param(id).query(ExportRow.class).optional();
    }

    public List<ExportRow> listByVersion(UUID versionId) {
        return db.sql(SELECT + " WHERE e.version_id = ? ORDER BY e.created_at DESC")
                .param(versionId)
                .query(ExportRow.class)
                .list();
    }

    /** 소유권 다툼 없이 하나만 집는다. AI Job 큐와 같은 방식이다. */
    public Optional<ExportRow> claimNext() {
        Optional<UUID> candidate = db.sql("""
                SELECT id FROM exports WHERE status = 'REQUESTED'
                 ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
                """)
                .query(UUID.class)
                .optional();
        if (candidate.isEmpty()) {
            return Optional.empty();
        }
        int updated = db.sql("UPDATE exports SET status = 'PROCESSING' WHERE id = ? AND status = 'REQUESTED'")
                .param(candidate.get())
                .update();
        return updated == 1 ? findById(candidate.get()) : Optional.empty();
    }

    public void markCompleted(UUID exportId, UUID fileId) {
        db.sql("UPDATE exports SET status = 'COMPLETED', file_id = ?, finished_at = now() WHERE id = ?")
                .params(fileId, exportId)
                .update();
    }

    public void markFailed(UUID exportId, String message) {
        db.sql("UPDATE exports SET status = 'FAILED', error_message = ?, finished_at = now() WHERE id = ?")
                .params(message, exportId)
                .update();
    }
}
