package com.nh.canvas.screen;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.screen.ScreenRepository.PatchRow;
import com.nh.canvas.screen.ScreenService.PlanResult;
import com.nh.canvas.screen.ScreenService.ScreenHtml;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ScreenController {

    private final ScreenService service;

    public ScreenController(ScreenService service) {
        this.service = service;
    }

    public record PlanRequest(@NotBlank String proposal, UUID designSystemId, UUID parentVersionId) {}

    public record GenerateRequest(String proposal) {}

    public record PatchRequest(@NotBlank String nhId, @NotBlank String op,
                               Map<String, Object> payload, String reason, UUID commentId) {}

    public record AiEditRequest(@NotBlank String nhId, @NotBlank String instruction, UUID commentId) {}

    /** 1단계. 화면 목록·역할만 만든다. HTML 은 만들지 않는다. */
    @PostMapping("/projects/{projectId}/plan-screens")
    public PlanResult plan(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                           @Valid @RequestBody PlanRequest request) {
        return service.planScreens(user, projectId, request.proposal(),
                request.designSystemId(), request.parentVersionId());
    }

    /** 2단계. 화면 한 장. 다시 호출하면 그대로 재시도다. 팬아웃은 클라이언트가 한다. */
    @PostMapping("/screens/{screenId}/generate")
    public ScreenHtml generate(@CurrentUser AuthenticatedUser user, @PathVariable UUID screenId,
                               @RequestBody(required = false) GenerateRequest request) {
        return service.generate(user, screenId, request == null ? null : request.proposal());
    }

    /** 편집이 반영된 HTML. 다운로드가 쓴다. */
    @GetMapping("/screens/{screenId}/html")
    public ScreenHtml html(@CurrentUser AuthenticatedUser user, @PathVariable UUID screenId) {
        return service.bakedHtml(user, screenId);
    }

    @PostMapping("/screens/{screenId}/patches")
    @ResponseStatus(HttpStatus.CREATED)
    public PatchRow addPatch(@CurrentUser AuthenticatedUser user, @PathVariable UUID screenId,
                             @Valid @RequestBody PatchRequest request) {
        return service.addPatch(user, screenId, request.nhId(), request.op(),
                request.payload(), request.reason(), request.commentId());
    }

    @DeleteMapping("/patches/{patchId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revertPatch(@CurrentUser AuthenticatedUser user, @PathVariable UUID patchId) {
        service.revertPatch(user, patchId);
    }

    /** 선택한 요소만 AI 가 재생성한다. 요소의 outerHTML 만 보낸다. */
    @PostMapping("/screens/{screenId}/ai-edit")
    public PatchRow aiEdit(@CurrentUser AuthenticatedUser user, @PathVariable UUID screenId,
                           @Valid @RequestBody AiEditRequest request) {
        return service.aiEdit(user, screenId, request.nhId(), request.instruction(), request.commentId());
    }

    /** 한 Version 의 편집 내역 전체. 되돌린 것을 포함하고 payload 는 뺀다 (05 3-2절). */
    @GetMapping("/versions/{versionId}/patches")
    public List<PatchRow> versionPatches(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId) {
        return service.listVersionPatches(user, versionId);
    }
}
