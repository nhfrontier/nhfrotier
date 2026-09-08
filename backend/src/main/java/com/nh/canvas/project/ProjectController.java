package com.nh.canvas.project;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.project.ProjectRepository.MemberRow;
import com.nh.canvas.project.ProjectRepository.ProjectRow;
import com.nh.canvas.project.ProjectRepository.ProjectSummaryRow;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ProjectController {

    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    public record CreateProjectRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 500) String purpose,
            @Size(max = 4000) String description) {}

    public record UpdateProjectRequest(
            @Size(max = 200) String name,
            @Size(max = 500) String purpose,
            @Size(max = 4000) String description,
            String status) {}

    public record AddMemberRequest(@NotBlank String loginId, @NotBlank String role) {}

    public record ChangeRoleRequest(@NotBlank String role) {}

    @GetMapping("/projects")
    public CursorPage<ProjectSummaryRow> list(@CurrentUser AuthenticatedUser user,
                                              @RequestParam(required = false) String cursor,
                                              @RequestParam(required = false) Integer limit) {
        return service.list(user, cursor, limit);
    }

    @PostMapping("/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectRow create(@CurrentUser AuthenticatedUser user,
                             @Valid @RequestBody CreateProjectRequest request) {
        return service.create(user, request.name(), request.purpose(), request.description());
    }

    @GetMapping("/projects/{projectId}")
    public ProjectDetail get(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId) {
        ProjectRow project = service.get(user, projectId);
        return new ProjectDetail(project, service.myRole(user, projectId),
                service.listMembers(user, projectId));
    }

    public record ProjectDetail(ProjectRow project, ProjectRole myRole, List<MemberRow> members) {}

    @PatchMapping("/projects/{projectId}")
    public ProjectRow update(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                             @Valid @RequestBody UpdateProjectRequest request) {
        return service.update(user, projectId, request.name(), request.purpose(),
                request.description(), request.status());
    }

    @GetMapping("/projects/{projectId}/members")
    public List<MemberRow> members(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId) {
        return service.listMembers(user, projectId);
    }

    @PostMapping("/projects/{projectId}/members")
    public List<MemberRow> addMember(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                                     @Valid @RequestBody AddMemberRequest request) {
        return service.addMember(user, projectId, request.loginId(), parseRole(request.role()));
    }

    @PatchMapping("/projects/{projectId}/members/{userId}")
    public List<MemberRow> changeRole(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                                      @PathVariable UUID userId, @Valid @RequestBody ChangeRoleRequest request) {
        return service.changeMemberRole(user, projectId, userId, parseRole(request.role()));
    }

    @DeleteMapping("/projects/{projectId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                             @PathVariable UUID userId) {
        service.removeMember(user, projectId, userId);
    }

    private static ProjectRole parseRole(String value) {
        try {
            return ProjectRole.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw com.nh.canvas.common.error.ApiException.invalid(
                    "role 은 OWNER / EDITOR / REVIEWER / VIEWER 중 하나여야 합니다.");
        }
    }
}
