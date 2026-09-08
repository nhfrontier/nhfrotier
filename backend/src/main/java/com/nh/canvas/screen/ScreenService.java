package com.nh.canvas.screen;

import com.fasterxml.jackson.core.type.TypeReference;
import com.nh.canvas.ai.AiOrchestrator;
import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.Json;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.screen.HtmlPipeline.PipelineResult;
import com.nh.canvas.screen.ScreenPromptBuilder.ScreenPlanContext;
import com.nh.canvas.screen.ScreenRepository.PatchRow;
import com.nh.canvas.screen.ScreenRepository.ScreenRow;
import com.nh.canvas.version.VersionRepository.VersionRow;
import com.nh.canvas.version.VersionService;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 협업 디자인 캔버스 (05_API_DB_SPEC 3-1·3-2절 · FR-05).
 *
 * <p>화면 생성은 2단계다. 한 번에 여러 화면의 HTML 을 만들면 토큰 한도와 타임아웃에 걸리고,
 * 어느 화면이 실패했는지도 보이지 않는다. <b>팬아웃은 클라이언트가 한다</b> — 서버가 한 요청에서
 * N개를 처리하면 부분 실패가 감춰진다.
 */
@Service
public class ScreenService {

    /** AI 출력은 검증 없이 신뢰하지 않는다. screenKey 규칙을 코드로도 강제한다. */
    private static final Pattern SCREEN_KEY = Pattern.compile("^[a-z0-9][a-z0-9-]{0,39}$");
    private static final int MAX_SCREENS = 12;

    private final ScreenRepository screens;
    private final ScreenBaker baker;
    private final HtmlPipeline pipeline;
    private final ScreenPromptBuilder prompts;
    private final AiOrchestrator ai;
    private final VersionService versions;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;
    private final Json json;

    public ScreenService(ScreenRepository screens, ScreenBaker baker, HtmlPipeline pipeline,
                         ScreenPromptBuilder prompts, AiOrchestrator ai, VersionService versions,
                         ProjectAccessGuard guard, HistoryRecorder history, AuditLogger audit, Json json) {
        this.screens = screens;
        this.baker = baker;
        this.pipeline = pipeline;
        this.prompts = prompts;
        this.ai = ai;
        this.versions = versions;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
        this.json = json;
    }

    public record PlanResult(VersionRow version, List<ScreenRepository.ScreenSummaryRow> screens) {}

    public record ScreenHtml(UUID screenId, String screenKey, String html, List<String> warnings) {}

    private record PlannedScreen(String screenKey, String name, String role, List<String> linksTo) {}

    private record ScreenPlan(List<PlannedScreen> screens) {}

    // ------------------------------------------------------------------ 1단계: 화면 계획

    /**
     * 기획안을 화면 목록·역할·전환 관계로 쪼갠다. HTML 은 만들지 않는다.
     * 결과로 Version 하나와 그에 속한 화면 행들이 생긴다.
     */
    @Transactional
    public PlanResult planScreens(AuthenticatedUser user, UUID projectId, String proposal,
                                  UUID designSystemId, UUID parentVersionId) {
        guard.require(projectId, user, ProjectRole.EDITOR);
        if (proposal == null || proposal.isBlank()) {
            throw ApiException.invalid("기획안 내용이 필요합니다.");
        }

        var response = ai.complete("SCREEN_PLAN",
                prompts.planSystemPrompt(designSystemId, user),
                prompts.planUserPrompt(proposal), 4_000);

        List<PlannedScreen> planned = validate(parsePlan(response.text()));

        VersionRow version = versions.create(projectId, parentVersionId, "AI_GENERATION", null,
                designSystemId, proposal, "화면 " + planned.size() + "장 계획", user.id());

        int order = 0;
        for (PlannedScreen screen : planned) {
            screens.insertScreen(UUID.randomUUID(), version.id(), screen.screenKey(),
                    screen.name(), screen.role(), order++);
        }
        // 전환 관계는 테이블로 두지 않는다. 생성 HTML 의 data-goto 가 유일한 출처다 (05 3-1절).
        // 계획 단계의 linksTo 는 2단계 프롬프트에만 쓰이므로 role 문장에 함께 남긴다
        history.ai(projectId, "SCREENS_PLANNED", "VERSION", version.id(),
                Map.of("screens", planned.size()));
        audit.success(user, "SCREEN_PLAN", "VERSION", version.id(), projectId);

        return new PlanResult(version, screens.listSummaries(version.id()));
    }

    private List<PlannedScreen> parsePlan(String raw) {
        String text = stripCodeFence(raw);
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw ApiException.ruleViolation("AI 화면 계획 응답을 해석하지 못했습니다.");
        }
        try {
            ScreenPlan plan = json.mapper().readValue(text.substring(start, end + 1),
                    new TypeReference<ScreenPlan>() {});
            return plan.screens() == null ? List.of() : plan.screens();
        } catch (Exception ex) {
            throw ApiException.ruleViolation("AI 화면 계획 응답을 해석하지 못했습니다.");
        }
    }

    /** 규칙 위반은 잘라내지 않고 거절한다. 반쯤 맞는 계획으로 화면을 만들면 뒤에서 더 비싸다. */
    private List<PlannedScreen> validate(List<PlannedScreen> planned) {
        if (planned.isEmpty()) {
            throw ApiException.ruleViolation("AI 가 화면을 하나도 만들지 못했습니다.");
        }
        if (planned.size() > MAX_SCREENS) {
            throw ApiException.ruleViolation("화면이 너무 많습니다 (" + planned.size() + "장).");
        }
        Set<String> keys = new LinkedHashSet<>();
        for (PlannedScreen screen : planned) {
            if (screen.screenKey() == null || !SCREEN_KEY.matcher(screen.screenKey()).matches()) {
                throw ApiException.ruleViolation("화면 key 형식이 올바르지 않습니다: " + screen.screenKey());
            }
            if (!keys.add(screen.screenKey())) {
                throw ApiException.ruleViolation("화면 key 가 중복됩니다: " + screen.screenKey());
            }
        }
        return planned;
    }

    // ------------------------------------------------------------------ 2단계: 화면 HTML

    /**
     * 화면 한 장의 HTML 을 만든다. 다시 호출하면 그대로 재시도다.
     *
     * <p>실패는 화면 행의 {@code status} 에 남는다. 한 장이 실패해도 나머지는 살아 있고
     * 실패한 것만 다시 만들 수 있다.
     */
    @Transactional
    public ScreenHtml generate(AuthenticatedUser user, UUID screenId, String proposal) {
        UUID projectId = guard.requireForScreen(screenId, user, ProjectRole.EDITOR);
        ScreenRow screen = screens.findById(screenId).orElseThrow(() -> ApiException.notFound("화면"));
        VersionRow version = versions.require(screen.versionId());

        List<ScreenRow> siblings = screens.listByVersion(screen.versionId());
        List<ScreenPlanContext> allScreens = siblings.stream()
                .map(row -> new ScreenPlanContext(row.screenKey(), row.name(), row.role(), List.of()))
                .toList();
        List<String> knownKeys = siblings.stream().map(ScreenRow::screenKey).toList();

        // 기획안은 Version 에 남아 있다. 요청으로 다시 받는 것은 재생성 시 문구를 바꿔 볼 때뿐이다
        String effectiveProposal = (proposal == null || proposal.isBlank())
                ? (version.proposal() == null ? "" : version.proposal())
                : proposal;

        screens.markGenerating(screenId);
        try {
            var response = ai.complete("SCREEN_HTML",
                    prompts.generateSystemPrompt(allScreens, version.designSystemId(), user),
                    prompts.generateUserPrompt(effectiveProposal,
                            new ScreenPlanContext(screen.screenKey(), screen.name(), screen.role(),
                                    knownKeys.stream().filter(key -> !key.equals(screen.screenKey())).toList()),
                            allScreens),
                    32_000);

            PipelineResult processed = pipeline.process(stripCodeFence(response.text()), knownKeys);
            screens.saveHtml(screenId, processed.html());
            screens.replaceElements(screenId, processed.elements());
            screens.reanchorComments(screenId);

            history.ai(projectId, "SCREEN_GENERATED", "SCREEN", screenId,
                    Map.of("screenKey", screen.screenKey(), "elements", processed.elements().size()));
            audit.success(user, "SCREEN_GENERATE", "SCREEN", screenId, projectId);
            return new ScreenHtml(screenId, screen.screenKey(), processed.html(), processed.warnings());
        } catch (ApiException ex) {
            screens.markFailed(screenId, ex.getMessage());
            throw ex;
        }
    }

    /** 편집이 반영된 HTML. 다운로드·검토·Export 가 읽는다. */
    public ScreenHtml bakedHtml(AuthenticatedUser user, UUID screenId) {
        guard.requireForScreen(screenId, user, ProjectRole.VIEWER);
        ScreenRow screen = screens.findById(screenId).orElseThrow(() -> ApiException.notFound("화면"));
        return new ScreenHtml(screenId, screen.screenKey(),
                baker.bake(screenId, screen.htmlContent()), List.of());
    }

    // ------------------------------------------------------------------ 요소 편집

    @Transactional
    public PatchRow addPatch(AuthenticatedUser user, UUID screenId, String nhId, String op,
                             Map<String, Object> payload, String reason, UUID commentId) {
        UUID projectId = guard.requireForScreen(screenId, user, ProjectRole.EDITOR);
        validatePatch(screenId, nhId, op, payload);

        PatchRow patch = screens.insertPatch(screenId, nhId, user.id(), op, payload, reason, "USER", commentId);
        history.user(projectId, user.id(), "ELEMENT_EDITED", "SCREEN", screenId,
                Map.of("op", op, "nhId", nhId));
        return patch;
    }

    /** 되돌리기는 soft revert 다. 행을 지우면 "누가 왜 바꿨다가 되돌렸는가"가 사라진다. */
    @Transactional
    public void revertPatch(AuthenticatedUser user, UUID patchId) {
        UUID screenId = screens.findScreenIdOfPatch(patchId)
                .orElseThrow(() -> ApiException.notFound("편집 이력"));
        UUID projectId = guard.requireForScreen(screenId, user, ProjectRole.EDITOR);
        if (screens.revertPatch(patchId) == 0) {
            throw ApiException.ruleViolation("이미 되돌린 편집입니다.");
        }
        history.user(projectId, user.id(), "ELEMENT_EDIT_REVERTED", "SCREEN", screenId,
                Map.of("patchId", patchId.toString()));
    }

    public List<PatchRow> listVersionPatches(AuthenticatedUser user, UUID versionId) {
        guard.requireForVersion(versionId, user, ProjectRole.VIEWER);
        return screens.listVersionPatches(versionId).stream()
                // payload 는 뺀다 (05 3-2절). 이력 목록에 필요한 것은 무엇을 언제 누가인지다
                .map(row -> new PatchRow(row.id(), row.screenId(), row.screenKey(), row.nhId(), row.userId(),
                        row.userName(), row.op(), null, row.reason(), row.source(), row.seq(),
                        row.commentId(), row.createdAt(), row.revertedAt()))
                .toList();
    }

    /**
     * 선택한 요소만 AI 가 다시 만든다. <b>요소의 outerHTML 만 보낸다</b> — 화면 전체를 보내면
     * 토큰과 지연이 커지고, 고칠 필요 없는 부분까지 바뀐다.
     */
    @Transactional
    public PatchRow aiEdit(AuthenticatedUser user, UUID screenId, String nhId, String instruction,
                           UUID commentId) {
        UUID projectId = guard.requireForScreen(screenId, user, ProjectRole.EDITOR);
        ScreenRow screen = screens.findById(screenId).orElseThrow(() -> ApiException.notFound("화면"));
        VersionRow version = versions.require(screen.versionId());

        String baked = baker.bake(screenId, screen.htmlContent());
        String outerHtml = pipeline.extractOuterHtml(baked, nhId);
        if (outerHtml == null) {
            throw ApiException.notFound("편집할 요소");
        }

        var response = ai.complete("ELEMENT_EDIT",
                prompts.elementEditSystemPrompt(version.designSystemId(), user),
                prompts.elementEditUserPrompt(outerHtml, instruction), 8_000);

        List<String> knownKeys = screens.listScreenKeys(screen.versionId());
        var sanitized = pipeline.sanitizeFragment(stripCodeFence(response.text()), knownKeys);
        if (sanitized.html().isBlank()) {
            throw ApiException.ruleViolation("AI 가 유효한 결과를 만들지 못했습니다.");
        }

        PatchRow patch = screens.insertPatch(screenId, nhId, user.id(), "aiRewrite",
                Map.of("html", sanitized.html(), "instruction", instruction),
                instruction, "AI", commentId);

        history.ai(projectId, "ELEMENT_AI_EDITED", "SCREEN", screenId,
                Map.of("nhId", nhId, "commentId", commentId == null ? "" : commentId.toString()));
        audit.success(user, "SCREEN_AI_EDIT", "SCREEN", screenId, projectId);
        return patch;
    }

    // ------------------------------------------------------------------ 내부

    private void validatePatch(UUID screenId, String nhId, String op, Map<String, Object> payload) {
        if (!EditProtocol.OPS.contains(op)) {
            throw ApiException.invalid("알 수 없는 편집 연산입니다: " + op);
        }
        if (!screens.hasElement(screenId, nhId)) {
            throw ApiException.notFound("편집할 요소");
        }
        switch (op) {
            case "setText" -> requireString(payload, "value");
            case "setStyle" -> {
                String prop = requireString(payload, "prop");
                requireString(payload, "value");
                if (!EditProtocol.EDITABLE_STYLE_PROPS.contains(prop)) {
                    throw ApiException.invalid("편집할 수 없는 스타일 속성입니다: " + prop);
                }
            }
            case "setAttr" -> {
                String name = requireString(payload, "name");
                requireString(payload, "value");
                if (!EditProtocol.EDITABLE_ATTRS.contains(name)) {
                    throw ApiException.invalid("편집할 수 없는 속성입니다: " + name);
                }
            }
            // aiRewrite 는 사용자가 직접 넣을 수 없다. AI 편집 경로에서만 만들어진다
            case "aiRewrite" -> throw ApiException.invalid("aiRewrite 는 AI 편집 경로로만 만들 수 있습니다.");
            default -> throw ApiException.invalid("알 수 없는 편집 연산입니다: " + op);
        }
    }

    private String requireString(Map<String, Object> payload, String key) {
        Object value = payload == null ? null : payload.get(key);
        if (!(value instanceof String text) || text.isEmpty()) {
            throw ApiException.invalid(key + " 값이 필요합니다.");
        }
        return text;
    }

    /** 모델이 코드펜스를 붙여 돌려주는 일이 잦다. 붙어 있으면 벗긴다. */
    private static String stripCodeFence(String raw) {
        if (raw == null) {
            return "";
        }
        String text = raw.trim();
        if (!text.startsWith("```")) {
            return text;
        }
        int firstLineEnd = text.indexOf('\n');
        int closing = text.lastIndexOf("```");
        if (firstLineEnd < 0 || closing <= firstLineEnd) {
            return text;
        }
        return text.substring(firstLineEnd + 1, closing).trim();
    }

    List<String> screenKeysOf(UUID versionId) {
        return new ArrayList<>(screens.listScreenKeys(versionId));
    }
}
