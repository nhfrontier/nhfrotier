package com.nh.canvas.review;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.review.ReviewRepository.SummaryRow;
import com.nh.canvas.review.ReviewService.DecisionInput;
import com.nh.canvas.review.ReviewService.SummaryView;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    public record SummarizeRequest(UUID versionId) {}

    public record DecisionsRequest(List<DecisionInput> decisions, UUID resultingVersionId) {}

    /** 취합은 비동기다. 202 로 돌려주고 상태는 {@code GET /projects/{id}/reviews} 로 본다. */
    @PostMapping("/projects/{projectId}/reviews/summarize")
    public ResponseEntity<SummaryRow> summarize(@CurrentUser AuthenticatedUser user,
                                                @PathVariable UUID projectId,
                                                @RequestBody(required = false) SummarizeRequest request) {
        SummaryRow summary = service.summarize(user, projectId,
                request == null ? null : request.versionId());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(summary);
    }

    @GetMapping("/projects/{projectId}/reviews")
    public List<SummaryView> list(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                                  @RequestParam(defaultValue = "10") int limit) {
        return service.list(user, projectId, limit);
    }

    @GetMapping("/reviews/{reviewId}")
    public SummaryView get(@CurrentUser AuthenticatedUser user, @PathVariable UUID reviewId) {
        return service.get(user, reviewId);
    }

    /** 항목별 반영 / 보류 / 반려. 여러 건을 한 번에 확정한다. */
    @PostMapping("/reviews/{reviewId}/decisions")
    public SummaryView decide(@CurrentUser AuthenticatedUser user, @PathVariable UUID reviewId,
                              @Valid @RequestBody DecisionsRequest request) {
        return service.decide(user, reviewId, request.decisions(), request.resultingVersionId());
    }
}
