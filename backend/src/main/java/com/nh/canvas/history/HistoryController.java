package com.nh.canvas.history;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.common.web.Cursors;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * History 조회 (FR-10).
 *
 * <p>무한히 증가하는 리소스라 전체 반환을 하지 않는다 — 커서 기반만 제공한다
 * (05_API_DB_SPEC 1절). 여기가 가장 먼저 느려지는 지점이다.
 */
@RestController
@RequestMapping("/api/v1")
public class HistoryController {

    private final JdbcClient db;
    private final ProjectAccessGuard guard;

    public HistoryController(JdbcClient db, ProjectAccessGuard guard) {
        this.db = db;
        this.guard = guard;
    }

    public record HistoryEventRow(UUID id, UUID projectId, String actorType, UUID actorId, String actorName,
                                  String actionType, String targetType, UUID targetId,
                                  String payloadSummary, Instant createdAt) {}

    @GetMapping("/projects/{projectId}/history")
    public CursorPage<HistoryEventRow> list(@CurrentUser AuthenticatedUser user,
                                            @PathVariable UUID projectId,
                                            @RequestParam(required = false) String actorType,
                                            @RequestParam(required = false) String cursor,
                                            @RequestParam(required = false) Integer limit) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        int size = Cursors.normalizeLimit(limit);
        Cursors.Position position = Cursors.decode(cursor);

        StringBuilder sql = new StringBuilder("""
                SELECT h.id, h.project_id, h.actor_type, h.actor_id, u.name AS actor_name,
                       h.action_type, h.target_type, h.target_id,
                       h.payload_summary::text AS payload_summary, h.created_at
                  FROM history_events h
                  LEFT JOIN users u ON u.id = h.actor_id
                 WHERE h.project_id = ?
                """);
        List<Object> params = new ArrayList<>();
        params.add(projectId);
        if (actorType != null) {
            sql.append(" AND h.actor_type = ?");
            params.add(actorType);
        }
        if (position != null) {
            sql.append(" AND (h.created_at, h.id) < (?, ?)");
            params.add(position.at());
            params.add(position.id());
        }
        sql.append(" ORDER BY h.created_at DESC, h.id DESC LIMIT ?");
        params.add(size + 1);

        List<HistoryEventRow> rows = db.sql(sql.toString()).params(params)
                .query(HistoryEventRow.class).list();
        return CursorPage.of(rows, size, HistoryEventRow::createdAt, HistoryEventRow::id);
    }
}
