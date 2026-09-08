package com.nh.canvas.template;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.Json;
import com.nh.canvas.common.error.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Template / 브랜드 자산 (FR-04 · FR-13).
 *
 * <p>디자인 시스템은 별도 리소스가 아니라 {@code template_type = BRAND_ASSET} 레코드다
 * (05_API_DB_SPEC 9-1절). 새 테이블·엔드포인트를 만들지 않는다.
 */
@Service
public class TemplateService {

    private final JdbcClient db;
    private final Json json;

    public TemplateService(JdbcClient db, Json json) {
        this.db = db;
        this.json = json;
    }

    public record TemplateRow(UUID id, String code, String name, String description,
                              String templateType, String scope, String status, Instant updatedAt) {}

    public record TemplateDetail(TemplateRow template, int versionNo, Map<String, Object> payload) {}

    public List<TemplateRow> list(AuthenticatedUser user, String type) {
        if (type != null && !List.of("DOCUMENT", "BRAND_ASSET").contains(type)) {
            throw ApiException.invalid("type 은 DOCUMENT 또는 BRAND_ASSET 이어야 합니다.");
        }
        StringBuilder sql = new StringBuilder("""
                SELECT id, code, name, description, template_type, scope, status, updated_at
                  FROM templates
                 WHERE status = 'ACTIVE'
                   AND (scope = 'OFFICIAL' OR owner_id = ?)
                """);
        if (type != null) {
            sql.append(" AND template_type = ?");
            return db.sql(sql + " ORDER BY template_type, name")
                    .params(user.id(), type)
                    .query(TemplateRow.class)
                    .list();
        }
        return db.sql(sql + " ORDER BY template_type, name")
                .param(user.id())
                .query(TemplateRow.class)
                .list();
    }

    /** 상세는 최신 버전의 payload 를 함께 준다. 프론트가 버전 목록을 다시 묻지 않도록. */
    public TemplateDetail get(AuthenticatedUser user, UUID templateId) {
        TemplateRow template = db.sql("""
                SELECT id, code, name, description, template_type, scope, status, updated_at
                  FROM templates
                 WHERE id = ? AND status = 'ACTIVE' AND (scope = 'OFFICIAL' OR owner_id = ?)
                """)
                .params(templateId, user.id())
                .query(TemplateRow.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("Template"));

        record VersionRow(int versionNo, String payload) {}
        VersionRow latest = db.sql("""
                SELECT version_no, payload::text AS payload
                  FROM template_versions
                 WHERE template_id = ?
                 ORDER BY version_no DESC
                 LIMIT 1
                """)
                .param(templateId)
                .query(VersionRow.class)
                .optional()
                .orElse(new VersionRow(0, "{}"));

        return new TemplateDetail(template, latest.versionNo(), json.readMap(latest.payload()));
    }

    /** Version 생성 시 design_system_id 로 받은 값이 실제 BRAND_ASSET 인지 확인한다 (05 9-2절). */
    public boolean isBrandAsset(UUID templateId) {
        return db.sql("""
                SELECT true FROM templates
                 WHERE id = ? AND template_type = 'BRAND_ASSET' AND status = 'ACTIVE'
                """)
                .param(templateId)
                .query(Boolean.class)
                .optional()
                .orElse(false);
    }
}
