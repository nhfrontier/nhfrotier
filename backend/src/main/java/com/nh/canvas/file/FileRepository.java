package com.nh.canvas.file;

import com.nh.canvas.common.web.Cursors;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class FileRepository {

    private final JdbcClient db;

    public FileRepository(JdbcClient db) {
        this.db = db;
    }

    public record FileRow(UUID id, UUID projectId, String originalName, String contentType,
                          long byteSize, String checksumSha256, String storageKey, String kind,
                          UUID uploadedBy, String uploadedByName, Instant createdAt) {}

    private static final String SELECT = """
            SELECT f.id, f.project_id, f.original_name, f.content_type, f.byte_size, f.checksum_sha256,
                   f.storage_key, f.kind, f.uploaded_by, u.name AS uploaded_by_name, f.created_at
              FROM files f
              JOIN users u ON u.id = f.uploaded_by
             WHERE f.deleted_at IS NULL
            """;

    public void insert(FileRow row) {
        db.sql("""
                INSERT INTO files
                    (id, project_id, original_name, content_type, byte_size, checksum_sha256,
                     storage_key, kind, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)
                .params(row.id(), row.projectId(), row.originalName(), row.contentType(), row.byteSize(),
                        row.checksumSha256(), row.storageKey(), row.kind(), row.uploadedBy())
                .update();
    }

    public Optional<FileRow> findById(UUID id) {
        return db.sql(SELECT + " AND f.id = ?").param(id).query(FileRow.class).optional();
    }

    public List<FileRow> listByProject(UUID projectId, String kind, Cursors.Position cursor, int limit) {
        StringBuilder sql = new StringBuilder(SELECT + " AND f.project_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(projectId);
        if (kind != null) {
            sql.append(" AND f.kind = ?");
            params.add(kind);
        }
        if (cursor != null) {
            sql.append(" AND (f.created_at, f.id) < (?, ?)");
            params.add(cursor.at());
            params.add(cursor.id());
        }
        sql.append(" ORDER BY f.created_at DESC, f.id DESC LIMIT ?");
        params.add(limit + 1);
        return db.sql(sql.toString()).params(params).query(FileRow.class).list();
    }

    public List<FileRow> findAllByVersion(UUID versionId) {
        return db.sql("""
                SELECT f.id, f.project_id, f.original_name, f.content_type, f.byte_size, f.checksum_sha256,
                       f.storage_key, f.kind, f.uploaded_by, u.name AS uploaded_by_name, f.created_at
                  FROM version_files vf
                  JOIN files f ON f.id = vf.file_id AND f.deleted_at IS NULL
                  JOIN users u ON u.id = f.uploaded_by
                 WHERE vf.version_id = ?
                 ORDER BY f.created_at
                """)
                .param(versionId)
                .query(FileRow.class)
                .list();
    }

    public boolean isLinkedToVersion(UUID versionId, UUID fileId) {
        return db.sql("SELECT true FROM version_files WHERE version_id = ? AND file_id = ?")
                .params(versionId, fileId)
                .query(Boolean.class)
                .optional()
                .orElse(false);
    }

    public void linkToVersion(UUID versionId, UUID fileId, String role) {
        db.sql("""
                INSERT INTO version_files (id, version_id, file_id, role) VALUES (?, ?, ?, ?)
                ON CONFLICT (version_id, file_id) DO NOTHING
                """)
                .params(UUID.randomUUID(), versionId, fileId, role)
                .update();
    }

    /**
     * 소프트 삭제. Version 산출물과 AI Job 입력이 파일을 참조하고 있어 물리 삭제하면
     * 과거 결과물의 근거가 사라진다.
     */
    public int softDelete(UUID id) {
        return db.sql("UPDATE files SET deleted_at = now() WHERE id = ? AND deleted_at IS NULL")
                .param(id)
                .update();
    }
}
