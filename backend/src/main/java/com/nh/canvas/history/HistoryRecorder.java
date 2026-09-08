package com.nh.canvas.history;

import com.nh.canvas.common.Json;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * History 기록 (FR-10).
 *
 * <p>History 는 <b>과정</b>이고 Version 은 <b>상태</b>다. 둘을 한 테이블에 섞지 않는 이유는
 * ARCHITECTURE 5절에 있다. AI·시스템 행위도 여기에 남으므로 {@code actorType} 을 구분한다.
 *
 * <p>감사 로그({@code audit_logs})와도 다르다. History 는 사용자가 화면에서 읽는 업무 타임라인이고,
 * 감사 로그는 보안 목적의 접근 기록이다.
 */
@Component
public class HistoryRecorder {

    private final JdbcClient db;
    private final Json json;

    public HistoryRecorder(JdbcClient db, Json json) {
        this.db = db;
        this.json = json;
    }

    public enum ActorType { USER, AI, SYSTEM }

    public void record(UUID projectId, ActorType actorType, UUID actorId,
                       String actionType, String targetType, UUID targetId,
                       Map<String, Object> payloadSummary) {
        db.sql("""
                INSERT INTO history_events
                    (id, project_id, actor_type, actor_id, action_type, target_type, target_id, payload_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb)
                """)
                .params(UUID.randomUUID(), projectId, actorType.name(), actorId,
                        actionType, targetType, targetId, json.write(payloadSummary))
                .update();
    }

    public void user(UUID projectId, UUID actorId, String actionType, String targetType, UUID targetId,
                     Map<String, Object> payloadSummary) {
        record(projectId, ActorType.USER, actorId, actionType, targetType, targetId, payloadSummary);
    }

    public void ai(UUID projectId, String actionType, String targetType, UUID targetId,
                   Map<String, Object> payloadSummary) {
        record(projectId, ActorType.AI, null, actionType, targetType, targetId, payloadSummary);
    }

    public void system(UUID projectId, String actionType, String targetType, UUID targetId,
                       Map<String, Object> payloadSummary) {
        record(projectId, ActorType.SYSTEM, null, actionType, targetType, targetId, payloadSummary);
    }
}
