package com.nh.canvas.ai;

import com.nh.canvas.ai.AiJobRepository.JobOutputRow;
import com.nh.canvas.ai.AiJobRepository.JobRow;
import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.screen.HtmlPipeline;
import com.nh.canvas.screen.ScreenRepository;
import com.nh.canvas.version.VersionRepository.VersionRow;
import com.nh.canvas.version.VersionService;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 비동기 AI Job (ARCHITECTURE 4절).
 *
 * <p>등록은 즉시 202 로 끝나고 실제 호출은 워커가 한다. 동기 응답으로 묶으면 LLM 장애 시
 * 요청이 유실되어 사용자가 처음부터 다시 입력해야 한다.
 */
@Service
public class AiJobService {

    /**
     * API 로 직접 만들 수 있는 Job 종류.
     *
     * <p>{@code SCREEN_MOCKUP} 이 빠진 것은 의도적이다 — 화면 생성은 계획/생성 2단계 동기
     * 호출이고 팬아웃은 클라이언트가 한다 (05_API_DB_SPEC 3-2절). {@code REVIEW_SUMMARY}·
     * {@code EXPORT} 는 각자의 엔드포인트가 만든다.
     */
    private static final Set<String> CLIENT_CREATABLE = Set.of("DOC_DRAFT", "BRAND_CONCEPT");

    private final AiJobRepository jobs;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;
    private final VersionService versions;
    private final ScreenRepository screens;
    private final HtmlPipeline pipeline;

    public AiJobService(AiJobRepository jobs, ProjectAccessGuard guard,
                        HistoryRecorder history, AuditLogger audit,
                        VersionService versions, ScreenRepository screens, HtmlPipeline pipeline) {
        this.jobs = jobs;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
        this.versions = versions;
        this.screens = screens;
        this.pipeline = pipeline;
    }

    public record JobView(JobRow job, List<JobOutputRow> outputs) {}

    @Transactional
    public JobRow create(AuthenticatedUser user, UUID projectId, String jobType,
                         Map<String, Object> payload, List<UUID> fileIds, String instruction,
                         String idempotencyKey) {
        guard.require(projectId, user, ProjectRole.EDITOR);

        if (!CLIENT_CREATABLE.contains(jobType)) {
            throw ApiException.invalid("job_type 은 " + CLIENT_CREATABLE + " 중 하나여야 합니다.");
        }
        // 같은 요청이 두 번 들어와도 Job 은 하나다. 중복 제출은 LLM 비용과 결과 혼선을 함께 만든다
        var existing = jobs.findByIdempotencyKey(projectId, idempotencyKey);
        if (existing.isPresent()) {
            return existing.get();
        }

        UUID jobId = jobs.insert(projectId, jobType, payload, idempotencyKey, user.id());

        // AI 에 넣을 자료는 사용자가 명시적으로 고른 것만이다 (SECURITY 5절)
        for (UUID fileId : fileIds) {
            guard.requireForFile(fileId, user, ProjectRole.VIEWER);
            jobs.addInput(jobId, "FILE", fileId, null);
        }
        if (instruction != null && !instruction.isBlank()) {
            jobs.addInput(jobId, "TEXT", null, instruction);
        }

        history.user(projectId, user.id(), "AI_JOB_REQUESTED", "AI_JOB", jobId,
                Map.of("jobType", jobType, "inputFiles", fileIds.size()));
        audit.success(user, "AI_JOB_CREATE", "AI_JOB", jobId, projectId);
        return jobs.findById(jobId).orElseThrow(() -> ApiException.notFound("AI 작업"));
    }

    public JobView get(AuthenticatedUser user, UUID jobId) {
        guard.requireForJob(jobId, user, ProjectRole.VIEWER);
        JobRow job = jobs.findById(jobId).orElseThrow(() -> ApiException.notFound("AI 작업"));
        return new JobView(job, jobs.listOutputs(jobId));
    }

    @Transactional
    public JobRow retry(AuthenticatedUser user, UUID jobId) {
        UUID projectId = guard.requireForJob(jobId, user, ProjectRole.EDITOR);
        if (jobs.retry(jobId) == 0) {
            throw ApiException.ruleViolation("실패했거나 취소된 작업만 재시도할 수 있습니다.");
        }
        history.user(projectId, user.id(), "AI_JOB_RETRIED", "AI_JOB", jobId, Map.of());
        audit.success(user, "AI_JOB_RETRY", "AI_JOB", jobId, projectId);
        return jobs.findById(jobId).orElseThrow(() -> ApiException.notFound("AI 작업"));
    }

    @Transactional
    public JobRow cancel(AuthenticatedUser user, UUID jobId) {
        UUID projectId = guard.requireForJob(jobId, user, ProjectRole.EDITOR);
        if (jobs.cancel(jobId) == 0) {
            throw ApiException.ruleViolation("진행 중이거나 대기 중인 작업만 취소할 수 있습니다.");
        }
        history.user(projectId, user.id(), "AI_JOB_CANCELLED", "AI_JOB", jobId, Map.of());
        audit.success(user, "AI_JOB_CANCEL", "AI_JOB", jobId, projectId);
        return jobs.findById(jobId).orElseThrow(() -> ApiException.notFound("AI 작업"));
    }

    /**
     * 브랜드 시안 3안 중 하나를 고른다 (FR-13 · 05_API_DB_SPEC 8-3절).
     *
     * <p><b>선택하는 순간에야 Version 이 생긴다.</b> 고르지 않은 시안은 Version 이 되지 않고
     * {@code ai_job_outputs} 에 후보로 남는다 — 값은 시안 자체가 아니라 "어느 방향으로 갈지"가
     * Version·History 에 기록되는 데 있다.
     */
    @Transactional
    public VersionRow selectBrandConcept(AuthenticatedUser user, UUID jobId, int variantNo) {
        UUID projectId = guard.requireForJob(jobId, user, ProjectRole.EDITOR);
        JobRow job = jobs.findById(jobId).orElseThrow(() -> ApiException.notFound("AI 작업"));

        if (!"BRAND_CONCEPT".equals(job.jobType())) {
            throw ApiException.ruleViolation("브랜드 시안 작업이 아닙니다.");
        }
        if (!"COMPLETED".equals(job.status())) {
            throw ApiException.ruleViolation("완료된 작업의 시안만 선택할 수 있습니다.");
        }
        var chosen = jobs.listOutputs(jobId).stream()
                .filter(output -> output.variantNo() == variantNo)
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("시안"));

        VersionRow version = versions.create(projectId, null, "AI_GENERATION", jobId, null, null,
                chosen.variantLabel() == null ? "선택한 시안" : chosen.variantLabel(), user.id());

        // 시안도 화면 한 장으로 담는다. 의견·편집·검토가 화면 단위로 붙기 때문이다
        UUID screenId = UUID.randomUUID();
        screens.insertScreen(screenId, version.id(), "concept",
                chosen.variantLabel() == null ? "시안" : chosen.variantLabel(), "브랜드 컨셉 시안", 0);
        var processed = pipeline.process(chosen.content(), List.of("concept"));
        screens.saveHtml(screenId, processed.html());
        screens.replaceElements(screenId, processed.elements());

        history.user(projectId, user.id(), "BRAND_CONCEPT_SELECTED", "VERSION", version.id(),
                Map.of("jobId", jobId.toString(), "variantNo", variantNo));
        audit.success(user, "BRAND_CONCEPT_SELECT", "VERSION", version.id(), projectId);
        return versions.require(version.id());
    }

    public List<JobRow> listByProject(AuthenticatedUser user, UUID projectId, int limit) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        return jobs.listByProject(projectId, Math.min(Math.max(limit, 1), 100));
    }
}
