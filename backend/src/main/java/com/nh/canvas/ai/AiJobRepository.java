package com.nh.canvas.ai;

import com.nh.canvas.common.Json;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AiJobRepository {

    private final JdbcClient db;
    private final Json json;

    public AiJobRepository(JdbcClient db, Json json) {
        this.db = db;
        this.json = json;
    }

    public record JobRow(UUID id, UUID projectId, String jobType, String status, String requestPayload,
                         String idempotencyKey, String model, String errorCode, String errorMessage,
                         int attemptCount, UUID requestedBy, Instant createdAt,
                         Instant startedAt, Instant finishedAt) {}

    public record JobOutputRow(UUID id, UUID jobId, int variantNo, String variantLabel,
                               String outputType, String content, UUID fileId, Instant createdAt) {}

    private static final String SELECT = """
            SELECT id, project_id, job_type, status, request_payload::text AS request_payload,
                   idempotency_key, model, error_code, error_message, attempt_count, requested_by,
                   created_at, started_at, finished_at
              FROM ai_jobs
            """;

    public UUID insert(UUID projectId, String jobType, Map<String, Object> payload,
                       String idempotencyKey, UUID requestedBy) {
        UUID id = UUID.randomUUID();
        db.sql("""
                INSERT INTO ai_jobs (id, project_id, job_type, request_payload, idempotency_key, requested_by)
                VALUES (?, ?, ?, ?::jsonb, ?, ?)
                """)
                .params(id, projectId, jobType, json.write(payload), idempotencyKey, requestedBy)
                .update();
        return id;
    }

    /** 같은 키로 다시 오면 이미 만든 Job 을 돌려준다 (ARCHITECTURE 6절 idempotency). */
    public Optional<JobRow> findByIdempotencyKey(UUID projectId, String key) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }
        return db.sql(SELECT + " WHERE project_id = ? AND idempotency_key = ?")
                .params(projectId, key)
                .query(JobRow.class)
                .optional();
    }

    public Optional<JobRow> findById(UUID id) {
        return db.sql(SELECT + " WHERE id = ?").param(id).query(JobRow.class).optional();
    }

    /**
     * 처리할 Job 하나를 집어 PROCESSING 으로 올린다.
     *
     * <p>{@code UPDATE ... WHERE status = 'REQUESTED'} 의 갱신 건수로 소유권을 정한다.
     * 워커가 여러 개 떠도 한 Job 을 두 번 처리하지 않는다 — stateless 컨테이너를 늘려도
     * 중복 실행이 생기지 않아야 한다 (ARCHITECTURE 7절).
     */
    @org.springframework.transaction.annotation.Transactional
    public Optional<JobRow> claimNext() {
        Optional<UUID> candidate = db.sql("""
                SELECT id FROM ai_jobs
                 WHERE status = 'REQUESTED'
                 ORDER BY created_at
                 LIMIT 1
                 FOR UPDATE SKIP LOCKED
                """)
                .query(UUID.class)
                .optional();

        if (candidate.isEmpty()) {
            return Optional.empty();
        }
        int updated = db.sql("""
                UPDATE ai_jobs
                   SET status = 'PROCESSING', started_at = now(), attempt_count = attempt_count + 1
                 WHERE id = ? AND status = 'REQUESTED'
                """)
                .param(candidate.get())
                .update();
        return updated == 1 ? findById(candidate.get()) : Optional.empty();
    }

    public void markCompleted(UUID jobId, String model) {
        db.sql("UPDATE ai_jobs SET status = 'COMPLETED', model = ?, finished_at = now() WHERE id = ?")
                .params(model, jobId)
                .update();
    }

    public void markFailed(UUID jobId, String errorCode, String errorMessage) {
        db.sql("""
                UPDATE ai_jobs SET status = 'FAILED', error_code = ?, error_message = ?, finished_at = now()
                 WHERE id = ?
                """)
                .params(errorCode, errorMessage, jobId)
                .update();
    }

    /** REQUESTED/PROCESSING 에서만 취소된다 (05_API_DB_SPEC 2절). */
    public int cancel(UUID jobId) {
        return db.sql("""
                UPDATE ai_jobs SET status = 'CANCELLED', finished_at = now()
                 WHERE id = ? AND status IN ('REQUESTED', 'PROCESSING')
                """)
                .param(jobId)
                .update();
    }

    /** 재시도는 새 Job 을 만들지 않고 같은 Job 을 REQUESTED 로 되돌린다. 이력이 한 줄로 남는다. */
    public int retry(UUID jobId) {
        return db.sql("""
                UPDATE ai_jobs
                   SET status = 'REQUESTED', error_code = NULL, error_message = NULL,
                       started_at = NULL, finished_at = NULL
                 WHERE id = ? AND status IN ('FAILED', 'CANCELLED')
                """)
                .param(jobId)
                .update();
    }

    public void addInput(UUID jobId, String inputType, UUID refId, String textValue) {
        db.sql("INSERT INTO ai_job_inputs (id, job_id, input_type, ref_id, text_value) VALUES (?, ?, ?, ?, ?)")
                .params(UUID.randomUUID(), jobId, inputType, refId, textValue)
                .update();
    }

    public void addOutput(UUID jobId, int variantNo, String variantLabel, String outputType,
                          String content, UUID fileId) {
        db.sql("""
                INSERT INTO ai_job_outputs (id, job_id, variant_no, variant_label, output_type, content, file_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (job_id, variant_no, output_type)
                DO UPDATE SET content = EXCLUDED.content, variant_label = EXCLUDED.variant_label
                """)
                .params(UUID.randomUUID(), jobId, variantNo, variantLabel, outputType, content, fileId)
                .update();
    }

    public List<JobOutputRow> listOutputs(UUID jobId) {
        return db.sql("""
                SELECT id, job_id, variant_no, variant_label, output_type, content, file_id, created_at
                  FROM ai_job_outputs WHERE job_id = ? ORDER BY variant_no
                """)
                .param(jobId)
                .query(JobOutputRow.class)
                .list();
    }

    public List<UUID> listInputFileIds(UUID jobId) {
        return db.sql("SELECT ref_id FROM ai_job_inputs WHERE job_id = ? AND input_type = 'FILE' AND ref_id IS NOT NULL")
                .param(jobId)
                .query(UUID.class)
                .list();
    }

    public List<String> listInputTexts(UUID jobId) {
        return db.sql("SELECT text_value FROM ai_job_inputs WHERE job_id = ? AND input_type = 'TEXT'")
                .param(jobId)
                .query(String.class)
                .list();
    }

    public List<JobRow> listByProject(UUID projectId, int limit) {
        List<Object> params = new ArrayList<>();
        params.add(projectId);
        params.add(limit);
        return db.sql(SELECT + " WHERE project_id = ? ORDER BY created_at DESC LIMIT ?")
                .params(params)
                .query(JobRow.class)
                .list();
    }
}
