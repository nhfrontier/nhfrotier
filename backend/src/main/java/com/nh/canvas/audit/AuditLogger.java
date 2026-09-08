package com.nh.canvas.audit;

import com.nh.canvas.auth.AuthenticatedUser;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 감사 로그 (FR-12 · SECURITY L-1).
 *
 * <p>표준 포맷 [시각, 사용자 ID, 출발지 IP, 요청/행위, 성공/실패] 를 강제한다.
 * {@code detail} 에 <b>원문·민감정보를 넣지 않는다</b> — 무엇을 했는지만 남기고 내용은 남기지 않는다.
 *
 * <p>업무 트랜잭션이 롤백돼도 "시도했다"는 사실은 남아야 하므로 별도 트랜잭션에서 기록한다.
 */
@Component
public class AuditLogger {

    private final JdbcClient db;

    public AuditLogger(JdbcClient db) {
        this.db = db;
    }

    public enum Outcome { SUCCESS, FAILURE }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuthenticatedUser actor, String action, String targetType, UUID targetId,
                       UUID projectId, Outcome outcome, String detail) {
        db.sql("""
                INSERT INTO audit_logs
                    (id, actor_id, actor_login_id, source_ip, action, target_type, target_id, project_id, outcome, detail)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)
                .params(UUID.randomUUID(),
                        actor == null ? null : actor.id(),
                        actor == null ? null : actor.loginId(),
                        currentSourceIp(),
                        action, targetType, targetId, projectId, outcome.name(), detail)
                .update();
    }

    public void success(AuthenticatedUser actor, String action, String targetType, UUID targetId, UUID projectId) {
        record(actor, action, targetType, targetId, projectId, Outcome.SUCCESS, null);
    }

    public void failure(AuthenticatedUser actor, String action, String targetType, UUID targetId,
                        UUID projectId, String reason) {
        record(actor, action, targetType, targetId, projectId, Outcome.FAILURE, reason);
    }

    /** 워커 스레드처럼 요청 밖에서 호출되면 IP 가 없다. 없는 것을 지어내지 않는다. */
    private String currentSourceIp() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return null;
        }
        var request = attributes.getRequest();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
