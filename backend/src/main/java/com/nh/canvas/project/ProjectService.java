package com.nh.canvas.project;

import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.UserDirectory;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.common.web.Cursors;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectRepository.MemberRow;
import com.nh.canvas.project.ProjectRepository.ProjectRow;
import com.nh.canvas.project.ProjectRepository.ProjectSummaryRow;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

    private final ProjectRepository projects;
    private final ProjectAccessGuard guard;
    private final UserDirectory users;
    private final HistoryRecorder history;
    private final AuditLogger audit;

    public ProjectService(ProjectRepository projects, ProjectAccessGuard guard, UserDirectory users,
                          HistoryRecorder history, AuditLogger audit) {
        this.projects = projects;
        this.guard = guard;
        this.users = users;
        this.history = history;
        this.audit = audit;
    }

    public CursorPage<ProjectSummaryRow> list(AuthenticatedUser user, String cursor, Integer limit) {
        int size = Cursors.normalizeLimit(limit);
        List<ProjectSummaryRow> rows = projects.listForUser(user.id(), Cursors.decode(cursor), size);
        return CursorPage.of(rows, size, ProjectSummaryRow::lastActivityAt, ProjectSummaryRow::id);
    }

    /** 만든 사람은 자동으로 OWNER 가 된다. 주인 없는 프로젝트가 생기면 멤버를 붙일 방법이 없다. */
    @Transactional
    public ProjectRow create(AuthenticatedUser user, String name, String purpose, String description) {
        UUID id = UUID.randomUUID();
        projects.insert(id, name, purpose, description, user.id());
        projects.addMember(id, user.id(), ProjectRole.OWNER, user.id());
        history.user(id, user.id(), "PROJECT_CREATED", "PROJECT", id, Map.of("name", name));
        audit.success(user, "PROJECT_CREATE", "PROJECT", id, id);
        return projects.findById(id).orElseThrow(() -> ApiException.notFound("프로젝트"));
    }

    public ProjectRow get(AuthenticatedUser user, UUID projectId) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        return projects.findById(projectId).orElseThrow(() -> ApiException.notFound("프로젝트"));
    }

    public ProjectRole myRole(AuthenticatedUser user, UUID projectId) {
        return guard.require(projectId, user, ProjectRole.VIEWER);
    }

    @Transactional
    public ProjectRow update(AuthenticatedUser user, UUID projectId,
                             String name, String purpose, String description, String status) {
        guard.require(projectId, user, ProjectRole.OWNER);
        if (status != null && !List.of("ACTIVE", "ARCHIVED", "DELETED").contains(status)) {
            throw ApiException.invalid("status 값이 올바르지 않습니다.");
        }
        projects.update(projectId, name, purpose, description, status);
        projects.touchActivity(projectId);
        history.user(projectId, user.id(), "PROJECT_UPDATED", "PROJECT", projectId,
                Map.of("fields", changedFields(name, purpose, description, status)));
        audit.success(user, "PROJECT_UPDATE", "PROJECT", projectId, projectId);
        return projects.findById(projectId).orElseThrow(() -> ApiException.notFound("프로젝트"));
    }

    public List<MemberRow> listMembers(AuthenticatedUser user, UUID projectId) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        return projects.listMembers(projectId);
    }

    @Transactional
    public List<MemberRow> addMember(AuthenticatedUser user, UUID projectId, String loginId, ProjectRole role) {
        guard.require(projectId, user, ProjectRole.OWNER);
        UUID targetId = users.findByLoginId(loginId)
                .orElseThrow(() -> ApiException.notFound("사용자"))
                .id();
        projects.addMember(projectId, targetId, role, user.id());
        projects.touchActivity(projectId);
        history.user(projectId, user.id(), "MEMBER_ADDED", "USER", targetId, Map.of("role", role.name()));
        audit.success(user, "PROJECT_MEMBER_ADD", "USER", targetId, projectId);
        return projects.listMembers(projectId);
    }

    /**
     * 마지막 OWNER 를 내리거나 빼지 못하게 막는다. 막지 않으면 아무도 멤버를 관리할 수 없는
     * 프로젝트가 남는다 — 데이터로는 정상이지만 업무로는 복구 불가다.
     */
    @Transactional
    public List<MemberRow> changeMemberRole(AuthenticatedUser user, UUID projectId, UUID targetUserId,
                                            ProjectRole role) {
        guard.require(projectId, user, ProjectRole.OWNER);
        ProjectRole current = guard.roleOf(projectId, targetUserId)
                .orElseThrow(() -> ApiException.notFound("멤버"));
        if (current == ProjectRole.OWNER && role != ProjectRole.OWNER && projects.countOwners(projectId) <= 1) {
            throw ApiException.ruleViolation("마지막 OWNER 의 권한은 내릴 수 없습니다.");
        }
        projects.addMember(projectId, targetUserId, role, user.id());
        history.user(projectId, user.id(), "MEMBER_ROLE_CHANGED", "USER", targetUserId,
                Map.of("from", current.name(), "to", role.name()));
        audit.success(user, "PROJECT_MEMBER_ROLE_CHANGE", "USER", targetUserId, projectId);
        return projects.listMembers(projectId);
    }

    @Transactional
    public void removeMember(AuthenticatedUser user, UUID projectId, UUID targetUserId) {
        guard.require(projectId, user, ProjectRole.OWNER);
        ProjectRole current = guard.roleOf(projectId, targetUserId)
                .orElseThrow(() -> ApiException.notFound("멤버"));
        if (current == ProjectRole.OWNER && projects.countOwners(projectId) <= 1) {
            throw ApiException.ruleViolation("마지막 OWNER 는 제거할 수 없습니다.");
        }
        projects.removeMember(projectId, targetUserId);
        history.user(projectId, user.id(), "MEMBER_REMOVED", "USER", targetUserId, Map.of());
        audit.success(user, "PROJECT_MEMBER_REMOVE", "USER", targetUserId, projectId);
    }

    private static List<String> changedFields(String name, String purpose, String description, String status) {
        List<String> fields = new java.util.ArrayList<>();
        if (name != null) fields.add("name");
        if (purpose != null) fields.add("purpose");
        if (description != null) fields.add("description");
        if (status != null) fields.add("status");
        return fields;
    }
}
