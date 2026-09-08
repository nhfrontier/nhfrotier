package com.nh.canvas.responsibility;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.responsibility.ResponsibilityRepository.FindingRow;
import com.nh.canvas.responsibility.ResponsibilityService.ReviewView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ResponsibilityController {

    private final ResponsibilityService service;

    public ResponsibilityController(ResponsibilityService service) {
        this.service = service;
    }

    public record DecisionRequest(@NotBlank String decision, String reason) {}

    @PostMapping("/versions/{versionId}/responsibility-review")
    public ReviewView run(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId) {
        return service.run(user, versionId);
    }

    @GetMapping("/versions/{versionId}/responsibility-review")
    public ReviewView latest(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId) {
        return service.latest(user, versionId);
    }

    /** decision: ACCEPTED / DEFERRED / REJECTED / COMPLIANCE_REQUESTED */
    @PatchMapping("/responsibility-findings/{findingId}")
    public FindingRow decide(@CurrentUser AuthenticatedUser user, @PathVariable UUID findingId,
                             @Valid @RequestBody DecisionRequest request) {
        return service.decide(user, findingId, request.decision(), request.reason());
    }
}
