package com.nh.canvas.usability;

import com.fasterxml.jackson.core.type.TypeReference;
import com.nh.canvas.ai.AiOrchestrator;
import com.nh.canvas.ai.LlmProperties;
import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.comment.CommentRepository;
import com.nh.canvas.comment.CommentRepository.CommentRow;
import com.nh.canvas.common.EvidenceVerifier;
import com.nh.canvas.common.Json;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.screen.ScreenBaker;
import com.nh.canvas.screen.ScreenRepository;
import com.nh.canvas.screen.ScreenRepository.ScreenRow;
import com.nh.canvas.usability.UsabilityRepository.FindingRow;
import com.nh.canvas.usability.UsabilityRepository.ReviewRow;
import com.nh.canvas.version.VersionRepository.VersionRow;
import com.nh.canvas.version.VersionService;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UX 리스크 검토 (FR-15).
 *
 * <p>FR-14 와 셋이 다르다 — 입력(전 화면 + 기획안 + 의견 전문), 기준(질문 렌즈 vs 위반 규칙),
 * 실행 시점(담당자 요청 시에만 vs 생성 직후 자동). 한 모듈에 넣으면 규칙과 렌즈가 한 프롬프트에
 * 섞여 양쪽 결과가 다 흐려진다 (ARCHITECTURE 12절).
 *
 * <p><b>이 계층은 사람이 작성한 의견 원문을 LLM 에 보낸다.</b> FR-14 까지는 목업과 기획안뿐이었다.
 * 허용 범위는 미결이다 (SECURITY_CHECKLIST 1절).
 */
@Service
public class UsabilityService {

    private static final Set<String> DECISIONS = Set.of("ACCEPTED", "DEFERRED", "REJECTED");
    private static final Set<String> SEVERITIES = Set.of("HIGH", "MEDIUM", "LOW");
    private static final Set<String> SOURCES = Set.of("PROPOSAL", "SCREEN", "DISCUSSION");

    private final UsabilityRepository repository;
    private final UsabilityLenses lenses;
    private final ScreenRepository screens;
    private final ScreenBaker baker;
    private final CommentRepository comments;
    private final VersionService versions;
    private final AiOrchestrator ai;
    private final EvidenceVerifier evidence;
    private final LlmProperties llm;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;
    private final Json json;

    public UsabilityService(UsabilityRepository repository, UsabilityLenses lenses, ScreenRepository screens,
                            ScreenBaker baker, CommentRepository comments, VersionService versions,
                            AiOrchestrator ai, EvidenceVerifier evidence, LlmProperties llm,
                            ProjectAccessGuard guard, HistoryRecorder history, AuditLogger audit, Json json) {
        this.repository = repository;
        this.lenses = lenses;
        this.screens = screens;
        this.baker = baker;
        this.comments = comments;
        this.versions = versions;
        this.ai = ai;
        this.evidence = evidence;
        this.llm = llm;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
        this.json = json;
    }

    public record ReviewView(ReviewRow review, List<FindingRow> findings, int discardedCount) {}

    private record ModelFinding(String lensId, String severity, String title, List<String> evidence,
                                String evidenceSource, String why, String suggestion) {}

    private record ModelReport(List<ModelFinding> findings) {}

    /** 세 corpus 를 따로 들고 있는 이유는 인용이 어디서 왔는지를 대조해 판정하기 위해서다. */
    private record Corpus(String proposal, String screens, String discussion) {
        String all() {
            return proposal + "\n\n" + screens + "\n\n" + discussion;
        }
    }

    /**
     * 검토 실행. <b>담당자가 요청할 때만</b> 돈다.
     *
     * <p>댓글마다 자동 실행하면 같은 지적이 반복되어 스레드를 오염시키고, 호출 비용·지연이
     * 논의 속도에 묶인다 (08_DECISIONS).
     */
    @Transactional
    public ReviewView run(AuthenticatedUser user, UUID versionId) {
        UUID projectId = guard.requireForVersion(versionId, user, ProjectRole.REVIEWER);
        VersionRow version = versions.require(versionId);

        Corpus corpus = buildCorpus(projectId, version);
        String combined = corpus.all();
        if (combined.isBlank()) {
            throw ApiException.ruleViolation("검토할 내용이 없습니다.");
        }
        // 잘라내면 잘린 뒷부분의 문제를 못 봐서 결과가 조용히 틀린다. 거절이 낫다 (05_API_DB_SPEC)
        if (combined.length() > llm.getMaxInputChars()) {
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE,
                    "검토 대상이 허용 크기를 초과했습니다. 화면 수나 논의 범위를 줄여 주세요.");
        }

        UUID reviewId = repository.insertReview(versionId, user.id());
        try {
            var response = ai.complete("USABILITY_REVIEW", systemPrompt(), combined, 8_000);
            int discarded = store(reviewId, parse(response.text()), corpus);
            repository.finishReview(reviewId, response.model());

            history.ai(projectId, "USABILITY_REVIEWED", "VERSION", versionId,
                    Map.of("reviewId", reviewId.toString(), "requestedBy", user.loginId(),
                            "discarded", discarded));
            audit.success(user, "USABILITY_REVIEW_RUN", "VERSION", versionId, projectId);

            ReviewRow review = repository.findLatest(versionId).orElseThrow();
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

    /** 의견 목록에 사람 댓글과 섞어 보여주기 위한 조회. 저장은 분리되어 있다. */
    public List<FindingRow> listByProject(AuthenticatedUser user, UUID projectId) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        return repository.listByProject(projectId);
    }

    /** {@code COMPLIANCE_REQUESTED} 는 없다. 준법 축은 FR-14 고유다. */
    @Transactional
    public FindingRow decide(AuthenticatedUser user, UUID findingId, String decision, String reason) {
        UUID versionId = repository.findVersionIdOfFinding(findingId)
                .orElseThrow(() -> ApiException.notFound("지적"));
        UUID projectId = guard.requireForVersion(versionId, user, ProjectRole.EDITOR);

        if (!DECISIONS.contains(decision)) {
            throw ApiException.invalid("decision 은 " + DECISIONS + " 중 하나여야 합니다.");
        }
        repository.decide(findingId, decision, user.id(), reason);
        history.user(projectId, user.id(), "USABILITY_FINDING_DECIDED", "VERSION", versionId,
                Map.of("findingId", findingId.toString(), "decision", decision));
        audit.success(user, "USABILITY_FINDING_DECIDE", "FINDING", findingId, projectId);
        return repository.findFinding(findingId).orElseThrow();
    }

    // ------------------------------------------------------------------ 내부

    /**
     * 입력은 요청 본문이 아니라 <b>서버가 DB 에서 조립한다</b> (05_API_DB_SPEC).
     * 클라이언트가 무엇을 보낼지 정하면 검토 범위가 요청마다 달라져 결과를 비교할 수 없다.
     */
    private Corpus buildCorpus(UUID projectId, VersionRow version) {
        StringBuilder screenText = new StringBuilder();
        for (ScreenRow screen : screens.listByVersion(version.id())) {
            if (screen.htmlContent() == null || screen.htmlContent().isBlank()) {
                continue;
            }
            screenText.append("\n\n## 화면: ").append(screen.name())
                    .append(" (").append(screen.screenKey()).append(")\n\n")
                    .append(baker.bake(screen.id(), screen.htmlContent()));
        }

        StringBuilder discussion = new StringBuilder();
        for (CommentRow comment : comments.listAllForReview(projectId)) {
            discussion.append("\n- [").append(comment.authorName()).append("] ")
                    .append(comment.body());
        }

        String proposal = version.proposal() == null ? "" : version.proposal();
        return new Corpus(
                proposal.isBlank() ? "" : "# 기획안\n\n" + proposal,
                screenText.isEmpty() ? "" : "# 화면" + screenText,
                discussion.isEmpty() ? "" : "# 논의\n" + discussion);
    }

    private String systemPrompt() {
        return """
                당신은 UX 리스크 검토자다. 화면 전체와 그동안의 논의를 함께 읽고,
                의견들이 합쳐졌을 때 생기는 사용성 문제를 찾는다.

                의견 하나하나는 각자 타당하다. 당신이 볼 것은 그 총합이다 —
                서로 다른 담당자가 각자의 이유로 요청한 팝업 네 개는 어느 의견을 읽어도 문제로 보이지 않는다.

                ## 출력 형식

                아래 형태의 JSON 만 출력한다. 지적할 것이 없으면 findings 를 빈 배열로 둔다.

                {"findings":[{"lensId":"UR-01","severity":"HIGH","title":"...",
                 "evidence":["원문에서 그대로 옮긴 조각", "..."],
                 "evidenceSource":"SCREEN","why":"...","suggestion":"..."}]}

                ## 반드시 지킬 것

                1. evidence 는 입력에 실제로 있는 문구를 <b>글자 그대로</b> 옮긴다. 요약·의역은 탈락한다.
                   그대로 옮길 것이 없으면 그 항목을 보고하지 않는다.
                2. evidenceSource 는 그 인용이 어디서 왔는지다: PROPOSAL(기획안) / SCREEN(화면) / DISCUSSION(의견).
                3. lensId 는 아래 목록에 있는 것만 쓴다. 새 ID 를 만들지 않는다.
                4. 요소 하나로 판정되는 문제(문구가 차별적이다 등)는 여기서 다루지 않는다.
                   개수와 맥락이 문제인 것만 본다.

                ## 심각도 기준

                - HIGH: 그대로 두면 사용자가 흐름을 완주하지 못할 가능성이 큰 것
                - MEDIUM: 완주는 하지만 피로·오해가 쌓이는 것
                - LOW: 개선하면 좋은 것

                ## 검토 렌즈

                """ + lenses.reviewPrompt();
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
     * 근거 대조를 FR-14 보다 조인다. 렌즈는 규칙보다 느슨해서 지어낸 근거가 통과할 여지가 크다.
     *
     * <p>인용을 <b>선언한 출처의 원문</b>과 대조하고, 거기서 실패하면 전체 입력과 한 번 더 맞춰
     * 출처만 틀린 것인지 지어낸 것인지 가른다. 살아남은 인용이 없으면 지적을 통째로 버린다.
     */
    private int store(UUID reviewId, List<ModelFinding> findings, Corpus corpus) {
        int discarded = 0;
        for (ModelFinding finding : findings) {
            if (finding.lensId() == null || !lenses.isKnown(finding.lensId())
                    || finding.title() == null || finding.title().isBlank()
                    || !SEVERITIES.contains(finding.severity())) {
                discarded++;
                continue;
            }
            String declaredSource = SOURCES.contains(finding.evidenceSource())
                    ? finding.evidenceSource() : null;

            List<String> verified = declaredSource == null
                    ? List.of()
                    : evidence.verify(finding.evidence(), corpusOf(corpus, declaredSource));
            String source = declaredSource;

            if (verified.isEmpty()) {
                verified = evidence.verify(finding.evidence(), corpus.all());
                source = verified.isEmpty() ? null : resolveSource(corpus, verified.get(0));
            }
            if (verified.isEmpty() || source == null) {
                discarded++;
                continue;
            }
            repository.insertFinding(reviewId, finding.lensId(), finding.severity(), finding.title(),
                    String.join("\n", verified), source, finding.why(), finding.suggestion());
        }
        return discarded;
    }

    private String corpusOf(Corpus corpus, String source) {
        return switch (source) {
            case "PROPOSAL" -> corpus.proposal();
            case "SCREEN" -> corpus.screens();
            case "DISCUSSION" -> corpus.discussion();
            default -> "";
        };
    }

    private String resolveSource(Corpus corpus, String quote) {
        for (String source : List.of("SCREEN", "DISCUSSION", "PROPOSAL")) {
            if (!evidence.verify(List.of(quote), corpusOf(corpus, source)).isEmpty()) {
                return source;
            }
        }
        return null;
    }
}
