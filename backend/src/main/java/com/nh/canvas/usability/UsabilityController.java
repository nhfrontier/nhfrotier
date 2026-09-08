package com.nh.canvas.usability;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.usability.UsabilityRepository.FindingRow;
import com.nh.canvas.usability.UsabilityService.ReviewView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
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
public class UsabilityController {

    private final UsabilityService service;

    public UsabilityController(UsabilityService service) {
        this.service = service;
    }

    public record DecisionRequest(@NotBlank String decision, String reason) {}

    /**
     * 담당자 요청 시에만 호출된다. 요청자는 {@code requested_by} 로 기록된다.
     * 입력은 요청 본문이 아니라 서버가 DB 에서 조립한다.
     */
    @PostMapping("/versions/{versionId}/usability-review")
    public ReviewView run(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId) {
        return service.run(user, versionId);
    }

    @GetMapping("/versions/{versionId}/usability-review")
    public ReviewView latest(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId) {
        return service.latest(user, versionId);
    }

    /** 의견 목록에 사람 댓글과 시간순으로 섞기 위한 조회. */
    @GetMapping("/projects/{projectId}/usability-findings")
    public List<FindingRow> listByProject(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId) {
        return service.listByProject(user, projectId);
    }

    /** decision: ACCEPTED / DEFERRED / REJECTED (COMPLIANCE_REQUESTED 없음) */
    @PatchMapping("/usability-findings/{findingId}")
    public FindingRow decide(@CurrentUser AuthenticatedUser user, @PathVariable UUID findingId,
                             @Valid @RequestBody DecisionRequest request) {
        return service.decide(user, findingId, request.decision(), request.reason());
    }
}
