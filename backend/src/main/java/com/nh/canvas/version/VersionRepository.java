package com.nh.canvas.version;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class VersionRepository {

    private final JdbcClient db;

    public VersionRepository(JdbcClient db) {
        this.db = db;
    }

    public record VersionRow(UUID id, UUID projectId, UUID parentVersionId, int versionNo,
                             String sourceType, UUID sourceJobId, UUID designSystemId,
                             String proposal, String summary, String status,
                             UUID createdBy, String createdByName, Instant createdAt,
                             long screenCount, long openFindingCount) {}

    private static final String SELECT = """
            SELECT v.id, v.project_id, v.parent_version_id, v.version_no, v.source_type, v.source_job_id,
                   v.design_system_id, v.proposal, v.summary, v.status, v.created_by,
                   u.name AS created_by_name, v.created_at,
                   (SELECT count(*) FROM screens s WHERE s.version_id = v.id) AS screen_count,
                   (
                     (SELECT count(*) FROM responsibility_findings rf
                        JOIN responsibility_reviews rr ON rr.id = rf.review_id
                       WHERE rr.version_id = v.id AND rf.decision IS NULL)
                   + (SELECT count(*) FROM usability_findings uf
                        JOIN usability_reviews ur ON ur.id = uf.review_id
                       WHERE ur.version_id = v.id AND uf.decision IS NULL)
                   ) AS open_finding_count
              FROM versions v
              JOIN users u ON u.id = v.created_by
            """;

    public Optional<VersionRow> findById(UUID id) {
        return db.sql(SELECT + " WHERE v.id = ?").param(id).query(VersionRow.class).optional();
    }

    /** Version 목록은 version_no 역순이다. 시각이 아니라 번호가 사용자에게 보이는 순서다. */
    public List<VersionRow> listByProject(UUID projectId, Integer beforeVersionNo, int limit) {
        StringBuilder sql = new StringBuilder(SELECT + " WHERE v.project_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(projectId);
        if (beforeVersionNo != null) {
            sql.append(" AND v.version_no < ?");
            params.add(beforeVersionNo);
        }
        sql.append(" ORDER BY v.version_no DESC LIMIT ?");
        params.add(limit + 1);
        return db.sql(sql.toString()).params(params).query(VersionRow.class).list();
    }

    public Optional<VersionRow> findLatest(UUID projectId) {
        return db.sql(SELECT + " WHERE v.project_id = ? ORDER BY v.version_no DESC LIMIT 1")
                .param(projectId)
                .query(VersionRow.class)
                .optional();
    }

    /**
     * 다음 version_no 는 프로젝트 행을 잠근 뒤 계산한다. 두 요청이 동시에 들어오면
     * 같은 번호를 만들어 unique 제약에 걸리고, 사용자에게는 원인 모를 실패로 보인다.
     */
    public int nextVersionNo(UUID projectId) {
        db.sql("SELECT id FROM projects WHERE id = ? FOR UPDATE").param(projectId).query(UUID.class).single();
        return db.sql("SELECT COALESCE(max(version_no), 0) + 1 FROM versions WHERE project_id = ?")
                .param(projectId)
                .query(Integer.class)
                .single();
    }

    public void insert(UUID id, UUID projectId, UUID parentVersionId, int versionNo, String sourceType,
                       UUID sourceJobId, UUID designSystemId, String proposal, String summary,
                       UUID createdBy) {
        db.sql("""
                INSERT INTO versions
                    (id, project_id, parent_version_id, version_no, source_type, source_job_id,
                     design_system_id, proposal, summary, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)
                .params(id, projectId, parentVersionId, versionNo, sourceType, sourceJobId,
                        designSystemId, proposal, summary, createdBy)
                .update();
    }

    public void updateStatus(UUID versionId, String status) {
        db.sql("UPDATE versions SET status = ? WHERE id = ?").params(status, versionId).update();
    }

    /** 새 Version 이 READY 가 되면 같은 프로젝트의 이전 READY 는 SUPERSEDED 로 내린다. */
    public void supersedeOthers(UUID projectId, UUID keepVersionId) {
        db.sql("""
                UPDATE versions SET status = 'SUPERSEDED'
                 WHERE project_id = ? AND id <> ? AND status = 'READY'
                """)
                .params(projectId, keepVersionId)
                .update();
    }
}
