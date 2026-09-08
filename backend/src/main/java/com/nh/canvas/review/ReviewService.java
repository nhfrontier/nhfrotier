package com.nh.canvas.review;

import com.nh.canvas.ai.AiJobRepository;
import com.nh.canvas.audit.AuditLogger;
import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.comment.CommentRepository;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.history.HistoryRecorder;
import com.nh.canvas.project.ProjectAccessGuard;
import com.nh.canvas.project.ProjectRole;
import com.nh.canvas.review.ReviewRepository.ItemRow;
import com.nh.canvas.review.ReviewRepository.SummaryRow;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AI 의견 취합 (FR-07) 과 반영 결정 (FR-08).
 *
 * <p>이 제품의 차별점은 의견을 <b>의사결정과 Version 에 잇는</b> 데 있다. 댓글만으로는
 * "이 의견이 반영됐는지"를 알 수 없어 결국 사람이 별도 문서로 정리하게 된다 (ARCHITECTURE 6절).
 *
 * <p>취합은 비동기 Job 이다. 의견이 수십 건이면 한 요청 안에서 끝나지 않는다.
 */
@Service
public class ReviewService {

    private static final Set<String> DECISIONS = Set.of("ACCEPTED", "DEFERRED", "REJECTED");

    private final ReviewRepository reviews;
    private final CommentRepository comments;
    private final AiJobRepository jobs;
    private final ProjectAccessGuard guard;
    private final HistoryRecorder history;
    private final AuditLogger audit;

    public ReviewService(ReviewRepository reviews, CommentRepository comments, AiJobRepository jobs,
                         ProjectAccessGuard guard, HistoryRecorder history, AuditLogger audit) {
        this.reviews = reviews;
        this.comments = comments;
        this.jobs = jobs;
        this.guard = guard;
        this.history = history;
        this.audit = audit;
    }

    public record SummaryView(SummaryRow summary, List<ItemView> items) {}

    public record ItemView(ItemRow item, List<UUID> evidenceCommentIds) {}

    public record DecisionInput(UUID reviewItemId, String decision, String reason) {}

    /** 취합 요청. Job 을 만들고 즉시 돌려준다. 실제 호출은 워커가 한다. */
    @Transactional
    public SummaryRow summarize(AuthenticatedUser user, UUID projectId, UUID versionId) {
        guard.require(projectId, user, ProjectRole.REVIEWER);

        if (comments.listAllForReview(projectId).isEmpty()) {
            throw ApiException.ruleViolation("취합할 의견이 없습니다.");
        }
        UUID jobId = jobs.insert(projectId, "REVIEW_SUMMARY",
                Map.of("versionId", versionId == null ? "" : versionId.toString()),
                null, user.id());
        UUID summaryId = reviews.insertSummary(projectId, versionId, jobId, user.id());

        history.user(projectId, user.id(), "REVIEW_SUMMARY_REQUESTED", "REVIEW", summaryId, Map.of());
        audit.success(user, "REVIEW_SUMMARIZE", "REVIEW", summaryId, projectId);
        return reviews.findSummary(summaryId).orElseThrow();
    }

    public List<SummaryView> list(AuthenticatedUser user, UUID projectId, int limit) {
        guard.require(projectId, user, ProjectRole.VIEWER);
        return reviews.listSummaries(projectId, Math.min(Math.max(limit, 1), 50)).stream()
                .map(summary -> new SummaryView(summary, itemsOf(summary.id())))
                .toList();
    }

    public SummaryView get(AuthenticatedUser user, UUID summaryId) {
        SummaryRow summary = reviews.findSummary(summaryId)
                .orElseThrow(() -> ApiException.notFound("검토"));
        guard.require(summary.projectId(), user, ProjectRole.VIEWER);
        return new SummaryView(summary, itemsOf(summaryId));
    }

    /**
     * 담당자가 항목별로 반영 / 보류 / 반려를 정한다. 결정은 새 Version 의 근거로 남는다.
     *
     * <p>여러 항목을 한 번에 받는 이유는, 검토 화면에서 담당자가 항목을 훑으며 정한 뒤
     * 한 번에 확정하기 때문이다. 항목마다 호출하면 중간에 끊긴 상태가 남는다.
     */
    @Transactional
    public SummaryView decide(AuthenticatedUser user, UUID summaryId, List<DecisionInput> decisions,
                              UUID resultingVersionId) {
        SummaryRow summary = reviews.findSummary(summaryId)
                .orElseThrow(() -> ApiException.notFound("검토"));
        guard.require(summary.projectId(), user, ProjectRole.EDITOR);

        if (decisions == null || decisions.isEmpty()) {
            throw ApiException.invalid("결정할 항목이 없습니다.");
        }
        for (DecisionInput input : decisions) {
            if (!DECISIONS.contains(input.decision())) {
                throw ApiException.invalid("decision 은 " + DECISIONS + " 중 하나여야 합니다.");
            }
            UUID itemProjectId = reviews.findProjectIdOfItem(input.reviewItemId())
                    .orElseThrow(() -> ApiException.notFound("검토 항목"));
            if (!itemProjectId.equals(summary.projectId())) {
                // 다른 프로젝트의 항목을 이 검토에 끼워 결정하는 경로를 막는다
                throw ApiException.notFound("검토 항목");
            }
            reviews.decide(input.reviewItemId(), input.decision(), input.reason(),
                    user.id(), resultingVersionId);
            history.user(summary.projectId(), user.id(), "REVIEW_ITEM_DECIDED", "REVIEW_ITEM",
                    input.reviewItemId(), Map.of("decision", input.decision()));
        }
        audit.success(user, "REVIEW_DECIDE", "REVIEW", summaryId, summary.projectId());
        return new SummaryView(reviews.findSummary(summaryId).orElseThrow(), itemsOf(summaryId));
    }

    private List<ItemView> itemsOf(UUID summaryId) {
        Map<UUID, List<UUID>> evidence = new LinkedHashMap<>();
        List<ItemRow> items = reviews.listItems(summaryId);
        for (ItemRow item : items) {
            evidence.put(item.id(), reviews.listItemCommentIds(item.id()));
        }
        return items.stream()
                .map(item -> new ItemView(item, evidence.getOrDefault(item.id(), List.of())))
                .toList();
    }
}
