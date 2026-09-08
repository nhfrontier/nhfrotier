package com.nh.canvas.responsibility;

import com.fasterxml.jackson.core.type.TypeReference;
import com.nh.canvas.ai.AiOrchestrator;
import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.EvidenceVerifier;
import com.nh.canvas.common.Json;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.responsibility.ResponsibilityRepository.FindingRow;
import com.nh.canvas.responsibility.ResponsibilityRepository.ReviewRow;
import com.nh.canvas.screen.ScreenBaker;
import com.nh.canvas.screen.ScreenRepository;
import com.nh.canvas.screen.ScreenRepository.ScreenRow;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 책임성 검토 (FR-14).
 *
 * <p><b>차단 게이트가 아니라 자문 계층이다.</b> AI 는 준법 검토가 필요한 지점을 제시할 뿐
 * 적법성을 판정하지 않으며, Export·공유를 막지 않는다 (ARCHITECTURE 11절).
 *
 * <p>지적은 목업에서 그대로 인용한 근거가 있는 것만 저장한다. 담당자가 검증할 수 없는 지적은
 * 결정을 내릴 수 없기 때문이다.
 */
@Service
public class ResponsibilityService {

    private static final Set<String> DECISIONS =
            Set.of("ACCEPTED", "DEFERRED", "REJECTED", "COMPLIANCE_REQUESTED");
    private static final Set<String> SEVERITIES = Set.of("HIGH", "MEDIUM", "LOW");

    private final ResponsibilityRepository repository;
    private final ResponsibilityRules rules;
    private final ScreenRepository screens;
    private final ScreenBaker baker;
    private final AiOrchestrator ai;
    private final EvidenceVerifier evidence;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;
    private final Json json;

    public ResponsibilityService(ResponsibilityRepository repository, ResponsibilityRules rules,
                                 ScreenRepository screens, ScreenBaker baker, AiOrchestrator ai,
                                 EvidenceVerifier evidence, ProjectAccessGuard guard,
                                 HistoryRecorder history, AuditLogger audit, Json json) {
        this.repository = repository;
        this.rules = rules;
        this.screens = screens;
        this.baker = baker;
        this.ai = ai;
        this.evidence = evidence;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
        this.json = json;
    }

    public record ReviewView(ReviewRow review, List<FindingRow> findings, int discardedCount) {}

    private record ModelFinding(String ruleId, String category, String severity, String title,
                                String evidence, String why, String suggestion) {}

    private record ModelReport(List<ModelFinding> findings) {}

    /** 검토 실행. 이전 검토를 덮어쓰지 않고 새 이력을 만든다. */
    @Transactional
    public ReviewView run(AuthenticatedUser user, UUID versionId) {
        UUID projectId = guard.requireForVersion(versionId, user, ProjectRole.REVIEWER);

        List<ScreenRow> screenRows = screens.listByVersion(versionId);
        String corpus = buildCorpus(screenRows);
        if (corpus.isBlank()) {
            throw ApiException.ruleViolation("검토할 화면이 없습니다.");
        }

        UUID reviewId = repository.insertReview(versionId);
        try {
            var response = ai.complete("RESPONSIBILITY_REVIEW", systemPrompt(), corpus, 8_000);
            int discarded = store(reviewId, parse(response.text()), corpus);
            repository.finishReview(reviewId, response.model());

            history.ai(projectId, "RESPONSIBILITY_REVIEWED", "VERSION", versionId,
                    Map.of("reviewId", reviewId.toString(), "discarded", discarded));
            audit.success(user, "RESPONSIBILITY_REVIEW_RUN", "VERSION", versionId, projectId);

            var review = repository.findLatest(versionId).orElseThrow();
            return new ReviewView(review, repository.listFindings(reviewId), discarded);
        } catch (ApiException ex) {
            repository.failReview(reviewId, ex.getMessage());
            throw ex;
        }
    }

    public ReviewView latest(AuthenticatedUser user, UUID versionId) {
        guard.requireForVersion(versionId, user, ProjectRole.VIEWER);
        return repository.findLatest(versionId)
                .map(review -> new ReviewView(review, repository.listFindings(review.id()), 0))
                .orElse(new ReviewView(null, List.of(), 0));
    }

    /**
     * 반영 / 보류 / 반려 / 준법 검토 요청 중 하나를 담당자가 고른다.
     *
     * <p>{@code COMPLIANCE_REQUESTED} 는 현재 <b>상태로만 남는다.</b> 수신자·알림·SLA 가
     * 미결이라 실제로 누구에게도 전달되지 않는다 (08_DECISIONS 2절 업무).
     */
    @Transactional
    public FindingRow decide(AuthenticatedUser user, UUID findingId, String decision, String reason) {
        UUID versionId = repository.findVersionIdOfFinding(findingId)
                .orElseThrow(() -> ApiException.notFound("지적"));
        UUID projectId = guard.requireForVersion(versionId, user, ProjectRole.EDITOR);

        if (!DECISIONS.contains(decision)) {
            throw ApiException.invalid("decision 은 " + DECISIONS + " 중 하나여야 합니다.");
        }
        repository.decide(findingId, decision, user.id(), reason);
        history.user(projectId, user.id(), "RESPONSIBILITY_FINDING_DECIDED", "VERSION", versionId,
                Map.of("findingId", findingId.toString(), "decision", decision));
        audit.success(user, "RESPONSIBILITY_FINDING_DECIDE", "FINDING", findingId, projectId);
        return repository.findFinding(findingId).orElseThrow();
    }

    // ------------------------------------------------------------------ 내부

    /** 검토 대상은 <b>편집이 반영된</b> HTML 이다. 저장본을 읽으면 편집 이전 상태를 검토하게 된다. */
    private String buildCorpus(List<ScreenRow> screenRows) {
        StringBuilder text = new StringBuilder();
        for (ScreenRow screen : screenRows) {
            if (screen.htmlContent() == null || screen.htmlContent().isBlank()) {
                continue;
            }
            text.append("\n\n## 화면: ").append(screen.name())
                    .append(" (").append(screen.screenKey()).append(")\n\n")
                    .append(baker.bake(screen.id(), screen.htmlContent()));
        }
        return text.toString();
    }

    private String systemPrompt() {
        return """
                당신은 은행 산출물의 책임성 검토자다. 아래 목업을 규칙에 비추어 읽고 지적을 보고한다.

                ## 출력 형식

                아래 형태의 JSON 만 출력한다. 지적할 것이 없으면 findings 를 빈 배열로 둔다.

                {"findings":[{"ruleId":"RR-B01","category":"CONSUMER","severity":"HIGH",
                 "title":"...","evidence":"...","why":"...","suggestion":"..."}]}

                ## 반드시 지킬 것

                1. 판정하지 않는다. "위법", "적법", "법 위반", "규정 위반" 같은 판정 표현을 쓰지 않는다.
                   적법성 판단은 준법 담당자의 몫이다. "검토가 필요해 보인다"까지만 말한다.
                2. 근거 없이 지적하지 않는다. evidence 에는 목업에 실제로 있는 문구나 요소를 그대로 옮긴다.
                   그대로 옮길 것이 없으면 그 항목을 아예 보고하지 않는다.
                3. 없는 것을 만들어내지 않는다. 해당하는 것이 없으면 빈 배열로 보고한다.
                   억지로 채우면 담당자가 전체를 신뢰하지 않게 되어 검토 자체가 무의미해진다.
                4. ruleId 는 아래 목록에 있는 것만 쓴다. 새 ID 를 만들지 않는다.

                ## 심각도 기준

                - HIGH: 그대로 실제 화면이 되면 고객이 오인하거나 배제될 가능성이 큰 것
                - MEDIUM: 고쳐야 하지만 대안이 명확한 것
                - LOW: 개선하면 좋은 것

                ## 검토 규칙

                """ + rules.reviewPrompt();
    }

    private List<ModelFinding> parse(String raw) {
        String text = raw == null ? "" : raw.trim();
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw ApiException.ruleViolation("AI 검토 응답을 해석하지 못했습니다.");
        }
        try {
            ModelReport report = json.mapper().readValue(text.substring(start, end + 1),
                    new TypeReference<ModelReport>() {});
            return report.findings() == null ? List.of() : report.findings();
        } catch (Exception ex) {
            throw ApiException.ruleViolation("AI 검토 응답을 해석하지 못했습니다.");
        }
    }

    /**
     * 저장 전에 두 가지를 확인한다 — 규칙 ID 가 실제 규칙인지, 근거가 목업에 글자 그대로 있는지.
     * 둘 중 하나라도 실패하면 <b>그 지적을 저장하지 않는다.</b>
     *
     * @return 버린 지적 수. 몇 개가 걸러졌는지는 담당자가 알아야 한다
     */
    private int store(UUID reviewId, List<ModelFinding> findings, String corpus) {
        int discarded = 0;
        for (ModelFinding finding : findings) {
            if (finding.ruleId() == null || !rules.isKnown(finding.ruleId())
                    || finding.title() == null || finding.title().isBlank()
                    || !SEVERITIES.contains(finding.severity())
                    || !evidence.isGrounded(finding.evidence(), corpus)) {
                discarded++;
                continue;
            }
            repository.insertFinding(reviewId, finding.ruleId(), finding.severity(), finding.title(),
                    finding.evidence().trim(), finding.why(), finding.suggestion(),
                    rules.needsComplianceReview(finding.ruleId()));
        }
        return discarded;
    }
}
