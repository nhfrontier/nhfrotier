package com.nh.canvas.auth;

import com.nh.canvas.auth.AuthenticationProvider.SsoPrincipal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 계정 저장소. SSO 인증이 성공하면 계정을 생성하거나 조회한다 (FR-01 2절).
 *
 * <p>비밀번호를 보관하지 않는다. 인증은 전적으로 사내 SSO 에 위임한다 (SECURITY A-2).
 */
@Repository
public class UserDirectory {

    private final JdbcClient db;

    public UserDirectory(JdbcClient db) {
        this.db = db;
    }

    public record UserRow(UUID id, String loginId, String name, String department, String email) {}

    /** SSO subject 기준으로 계정을 찾고, 없으면 만든다. 표시 정보는 매번 최신으로 맞춘다. */
    @Transactional
    public AuthenticatedUser upsert(SsoPrincipal principal) {
        Optional<UUID> existing = db.sql("SELECT id FROM users WHERE sso_subject = ?")
                .param(principal.subject())
                .query(UUID.class)
                .optional();

        UUID id = existing.orElseGet(UUID::randomUUID);
        if (existing.isEmpty()) {
            db.sql("""
                    INSERT INTO users (id, sso_subject, login_id, name, department, email, last_seen_at)
                    VALUES (?, ?, ?, ?, ?, ?, now())
                    """)
                    .params(id, principal.subject(), principal.loginId(), principal.name(),
                            principal.department(), principal.email())
                    .update();
        } else {
            db.sql("""
                    UPDATE users
                       SET name = ?, department = ?, email = ?, last_seen_at = now()
                     WHERE id = ?
                    """)
                    .params(principal.name(), principal.department(), principal.email(), id)
                    .update();
        }
        return new AuthenticatedUser(id, principal.loginId(), principal.name(),
                principal.department(), principal.email());
    }

    public Optional<UserRow> findById(UUID id) {
        return db.sql("SELECT id, login_id, name, department, email FROM users WHERE id = ?")
                .param(id)
                .query(UserRow.class)
                .optional();
    }

    public List<UserRow> findAllByIds(List<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        String placeholders = String.join(", ", java.util.Collections.nCopies(ids.size(), "?"));
        return db.sql("SELECT id, login_id, name, department, email FROM users WHERE id IN (" + placeholders + ")")
                .params(ids.stream().map(Object.class::cast).toList())
                .query(UserRow.class)
                .list();
    }

    public Optional<UserRow> findByLoginId(String loginId) {
        return db.sql("SELECT id, login_id, name, department, email FROM users WHERE login_id = ?")
                .param(loginId)
                .query(UserRow.class)
                .optional();
    }
}
