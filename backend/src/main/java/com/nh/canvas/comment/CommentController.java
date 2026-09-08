package com.nh.canvas.comment;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.comment.CommentRepository.CommentRow;
import com.nh.canvas.common.web.CursorPage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class CommentController {

    private final CommentService service;

    public CommentController(CommentService service) {
        this.service = service;
    }

    public record CreateCommentRequest(@NotBlank @Size(max = 4000) String body, UUID versionId) {}

    public record CreateScreenCommentRequest(@NotBlank @Size(max = 4000) String body,
                                             String nhId, UUID parentId) {}

    public record UpdateCommentRequest(@Size(max = 4000) String body, Boolean resolved) {}

    @GetMapping("/projects/{projectId}/comments")
    public CursorPage<CommentRow> list(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                                       @RequestParam(required = false) UUID versionId,
                                       @RequestParam(required = false) Boolean resolved,
                                       @RequestParam(required = false) String cursor,
                                       @RequestParam(required = false) Integer limit) {
        return service.list(user, projectId, versionId, resolved, cursor, limit);
    }

    @PostMapping("/projects/{projectId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentRow create(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                             @Valid @RequestBody CreateCommentRequest request) {
        return service.createProjectComment(user, projectId, request.versionId(), request.body());
    }

    @GetMapping("/screens/{screenId}/comments")
    public List<CommentRow> listByScreen(@CurrentUser AuthenticatedUser user, @PathVariable UUID screenId) {
        return service.listByScreen(user, screenId);
    }

    /** {@code parentId} 를 실으면 답글이 된다. 답글은 앵커를 갖지 않는다. */
    @PostMapping("/screens/{screenId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentRow createOnScreen(@CurrentUser AuthenticatedUser user, @PathVariable UUID screenId,
                                     @Valid @RequestBody CreateScreenCommentRequest request) {
        return service.createScreenComment(user, screenId, request.nhId(),
                request.body(), request.parentId());
    }

    @PatchMapping("/comments/{commentId}")
    public CommentRow update(@CurrentUser AuthenticatedUser user, @PathVariable UUID commentId,
                             @Valid @RequestBody UpdateCommentRequest request) {
        return service.update(user, commentId, request.body(), request.resolved());
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser AuthenticatedUser user, @PathVariable UUID commentId) {
        service.delete(user, commentId);
    }
}
