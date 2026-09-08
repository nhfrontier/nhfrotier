package com.nh.canvas.screen;

import com.nh.canvas.common.Json;
import com.nh.canvas.screen.HtmlPipeline.ElementFingerprint;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ScreenRepository {

    private final JdbcClient db;
    private final Json json;

    public ScreenRepository(JdbcClient db, Json json) {
        this.db = db;
        this.json = json;
    }

    public record ScreenRow(UUID id, UUID versionId, String screenKey, String name, String role,
                            int sortOrder, String htmlContent, String status, String errorMessage,
                            Instant createdAt, Instant updatedAt) {}

    /** 목록용. html_content 를 빼서 화면 여러 장을 한 번에 실어도 응답이 커지지 않게 한다. */
    public record ScreenSummaryRow(UUID id, UUID versionId, String screenKey, String name, String role,
                                   int sortOrder, String status, String errorMessage,
                                   long commentCount, long patchCount, Instant updatedAt) {}

    public record PatchRow(UUID id, UUID screenId, String screenKey, String nhId, UUID userId,
                           String userName, String op, String payload, String reason, String source,
                           long seq, UUID commentId, Instant createdAt, Instant revertedAt) {}

    public void insertScreen(UUID id, UUID versionId, String screenKey, String name, String role, int sortOrder) {
        db.sql("""
                INSERT INTO screens (id, version_id, screen_key, name, role, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
                """)
                .params(id, versionId, screenKey, name, role, sortOrder)
                .update();
    }

    public Optional<ScreenRow> findById(UUID id) {
        return db.sql("""
                SELECT id, version_id, screen_key, name, role, sort_order, html_content, status,
                       error_message, created_at, updated_at
                  FROM screens WHERE id = ?
                """)
                .param(id)
                .query(ScreenRow.class)
                .optional();
    }

    public List<ScreenRow> listByVersion(UUID versionId) {
        return db.sql("""
                SELECT id, version_id, screen_key, name, role, sort_order, html_content, status,
                       error_message, created_at, updated_at
                  FROM screens WHERE version_id = ? ORDER BY sort_order, screen_key
                """)
                .param(versionId)
                .query(ScreenRow.class)
                .list();
    }

    public List<ScreenSummaryRow> listSummaries(UUID versionId) {
        return db.sql("""
                SELECT s.id, s.version_id, s.screen_key, s.name, s.role, s.sort_order, s.status,
                       s.error_message,
                       (SELECT count(*) FROM comments c
                         WHERE c.screen_id = s.id AND c.deleted_at IS NULL) AS comment_count,
                       (SELECT count(*) FROM element_patches p
                         WHERE p.screen_id = s.id AND p.reverted_at IS NULL) AS patch_count,
                       s.updated_at
                  FROM screens s
                 WHERE s.version_id = ?
                 ORDER BY s.sort_order, s.screen_key
                """)
                .param(versionId)
                .query(ScreenSummaryRow.class)
                .list();
    }

    public List<String> listScreenKeys(UUID versionId) {
        return db.sql("SELECT screen_key FROM screens WHERE version_id = ?")
                .param(versionId)
                .query(String.class)
                .list();
    }

    public void markGenerating(UUID screenId) {
        db.sql("UPDATE screens SET status = 'GENERATING', error_message = NULL, updated_at = now() WHERE id = ?")
                .param(screenId)
                .update();
    }

    public void saveHtml(UUID screenId, String html) {
        db.sql("""
                UPDATE screens SET html_content = ?, status = 'READY', error_message = NULL, updated_at = now()
                 WHERE id = ?
                """)
                .params(html, screenId)
                .update();
    }

    public void markFailed(UUID screenId, String message) {
        db.sql("UPDATE screens SET status = 'FAILED', error_message = ?, updated_at = now() WHERE id = ?")
                .params(message, screenId)
                .update();
    }

    /**
     * 요소 지문을 다시 적재한다. 화면을 재생성하면 이전 지문은 의미를 잃으므로 통째로 바꾼다.
     * 끊긴 앵커의 복구는 {@code comments.anchor_status} 쪽에서 따로 다룬다.
     */
    public void replaceElements(UUID screenId, List<ElementFingerprint> elements) {
        db.sql("DELETE FROM screen_elements WHERE screen_id = ?").param(screenId).update();
        for (ElementFingerprint element : elements) {
            db.sql("""
                    INSERT INTO screen_elements (id, screen_id, nh_id, tag, doc_order, path_sig, text_sig)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """)
                    .params(UUID.randomUUID(), screenId, element.nhId(), element.tag(),
                            element.docOrder(), element.pathSig(), element.textSig())
                    .update();
        }
    }

    /** 재생성으로 사라진 요소를 가리키던 의견은 지우지 않고 orphaned 로 남긴다 (05 3-1절). */
    public void reanchorComments(UUID screenId) {
        db.sql("""
                UPDATE comments c
                   SET anchor_status = CASE
                         WHEN EXISTS (SELECT 1 FROM screen_elements e
                                       WHERE e.screen_id = c.screen_id AND e.nh_id = c.nh_id)
                         THEN 'anchored' ELSE 'orphaned' END
                 WHERE c.screen_id = ? AND c.nh_id IS NOT NULL
                """)
                .param(screenId)
                .update();
    }

    // ------------------------------------------------------------------ 편집 패치

    public PatchRow insertPatch(UUID screenId, String nhId, UUID userId, String op,
                                Map<String, Object> payload, String reason, String source, UUID commentId) {
        UUID id = UUID.randomUUID();
        long seq = db.sql("SELECT COALESCE(max(seq), 0) + 1 FROM element_patches WHERE screen_id = ?")
                .param(screenId)
                .query(Long.class)
                .single();
        db.sql("""
                INSERT INTO element_patches
                    (id, screen_id, nh_id, user_id, op, payload, reason, source, seq, comment_id)
                VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?)
                """)
                .params(id, screenId, nhId, userId, op, json.write(payload), reason, source, seq, commentId)
                .update();
        return findPatch(id).orElseThrow();
    }

    public Optional<PatchRow> findPatch(UUID patchId) {
        return db.sql(PATCH_SELECT + " WHERE p.id = ?").param(patchId).query(PatchRow.class).optional();
    }

    private static final String PATCH_SELECT = """
            SELECT p.id, p.screen_id, s.screen_key, p.nh_id, p.user_id, u.name AS user_name, p.op,
                   p.payload::text AS payload, p.reason, p.source, p.seq, p.comment_id,
                   p.created_at, p.reverted_at
              FROM element_patches p
              JOIN users u ON u.id = p.user_id
              JOIN screens s ON s.id = p.screen_id
            """;

    /** 되돌리지 않은 패치만, 적용 순서대로. 프레임과 baking 이 함께 쓴다. */
    public List<PatchRow> listActivePatches(UUID screenId) {
        return db.sql(PATCH_SELECT + " WHERE p.screen_id = ? AND p.reverted_at IS NULL ORDER BY p.seq")
                .param(screenId)
                .query(PatchRow.class)
                .list();
    }

    /**
     * 한 Version 의 편집 내역 전체. <b>되돌린 것을 포함한다</b> — 이력 목록이 그것도 보여줘야 한다.
     */
    public List<PatchRow> listVersionPatches(UUID versionId) {
        return db.sql(PATCH_SELECT + " WHERE s.version_id = ? ORDER BY p.created_at, p.seq")
                .param(versionId)
                .query(PatchRow.class)
                .list();
    }

    public List<PatchRow> listPatchesByComment(UUID commentId) {
        return db.sql(PATCH_SELECT + " WHERE p.comment_id = ? ORDER BY p.created_at")
                .param(commentId)
                .query(PatchRow.class)
                .list();
    }

    /** 되돌리기는 soft revert 다. 행을 지우면 "누가 왜 바꿨다가 되돌렸는가"가 사라진다. */
    public int revertPatch(UUID patchId) {
        return db.sql("UPDATE element_patches SET reverted_at = now() WHERE id = ? AND reverted_at IS NULL")
                .param(patchId)
                .update();
    }

    public Optional<UUID> findScreenIdOfPatch(UUID patchId) {
        return db.sql("SELECT screen_id FROM element_patches WHERE id = ?")
                .param(patchId)
                .query(UUID.class)
                .optional();
    }
}
