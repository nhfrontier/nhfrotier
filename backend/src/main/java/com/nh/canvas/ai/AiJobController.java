package com.nh.canvas.ai;

import com.nh.canvas.ai.AiJobRepository.JobRow;
import com.nh.canvas.ai.AiJobService.JobView;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AiJobController {

    private final AiJobService service;

    public AiJobController(AiJobService service) {
        this.service = service;
    }

    public record CreateJobRequest(
            @NotBlank String jobType,
            String instruction,
            List<UUID> fileIds,
            UUID templateId,
            UUID designSystemId,
            UUID baseVersionId,
            Map<String, Object> options) {}

    /** 등록만 하고 즉시 202 를 돌려준다. 상태는 폴링으로 본다(권장 2~3초). */
    @PostMapping("/projects/{projectId}/ai/jobs")
    public ResponseEntity<JobRow> create(@CurrentUser AuthenticatedUser user,
                                         @PathVariable UUID projectId,
                                         @Valid @RequestBody CreateJobRequest request,
                                         @RequestHeader(value = "Idempotency-Key", required = false)
                                         String idempotencyKey) {
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("templateId", request.templateId());
        payload.put("designSystemId", request.designSystemId());
        payload.put("baseVersionId", request.baseVersionId());
        payload.put("options", request.options() == null ? Map.of() : request.options());

        JobRow job = service.create(user, projectId, request.jobType(), payload,
                request.fileIds() == null ? List.of() : request.fileIds(),
                request.instruction(), idempotencyKey);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(job);
    }

    @GetMapping("/ai/jobs/{jobId}")
    public JobView get(@CurrentUser AuthenticatedUser user, @PathVariable UUID jobId) {
        return service.get(user, jobId);
    }

    @PostMapping("/ai/jobs/{jobId}/retry")
    public JobRow retry(@CurrentUser AuthenticatedUser user, @PathVariable UUID jobId) {
        return service.retry(user, jobId);
    }

    @PostMapping("/ai/jobs/{jobId}/cancel")
    public JobRow cancel(@CurrentUser AuthenticatedUser user, @PathVariable UUID jobId) {
        return service.cancel(user, jobId);
    }

    /** 시안 3안 중 하나를 고른다. 이때 Version 이 생긴다. */
    @PostMapping("/ai/jobs/{jobId}/outputs/{variantNo}/select")
    public com.nh.canvas.version.VersionRepository.VersionRow selectVariant(
            @CurrentUser AuthenticatedUser user, @PathVariable UUID jobId, @PathVariable int variantNo) {
        return service.selectBrandConcept(user, jobId, variantNo);
    }

    @GetMapping("/projects/{projectId}/ai/jobs")
    public List<JobRow> list(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                             @RequestParam(defaultValue = "20") int limit) {
        return service.listByProject(user, projectId, limit);
    }
}
