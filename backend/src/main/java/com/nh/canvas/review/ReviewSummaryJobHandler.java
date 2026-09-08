package com.nh.canvas.review;

import com.fasterxml.jackson.core.type.TypeReference;
import com.nh.canvas.ai.AiJobHandler;
import com.nh.canvas.ai.AiJobRepository.JobRow;
import com.nh.canvas.ai.AiOrchestrator;
import com.nh.canvas.comment.CommentRepository;
import com.nh.canvas.comment.CommentRepository.CommentRow;
import com.nh.canvas.common.Json;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.review.ReviewRepository.SummaryRow;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 의견 취합 Job 처리기 (FR-07).
 *
 * <p>합의 / 이견 / 추가확인 세 갈래로 묶는다. 각 항목은 <b>근거 댓글</b>을 갖는다 —
 * 근거가 없는 항목은 담당자가 "누가 그런 말을 했는지" 확인할 수 없어 결정을 내릴 수 없다.
 */
@Component
public class ReviewSummaryJobHandler implements AiJobHandler {

    private static final Set<String> CATEGORIES = Set.of("AGREED", "CONFLICTED", "NEEDS_INFO");

    private final ReviewRepository reviews;
    private final CommentRepository comments;
    private final AiOrchestrator ai;
    private final Json json;

    public ReviewSummaryJobHandler(ReviewRepository reviews, CommentRepository comments,
                                   AiOrchestrator ai, Json json) {
        this.reviews = reviews;
        this.comments = comments;
        this.ai = ai;
        this.json = json;
    }

    private record ModelItem(String category, String title, String body, List<Integer> commentRefs) {}

    private record ModelReport(List<ModelItem> items) {}

    @Override
    public String jobType() {
        return "REVIEW_SUMMARY";
    }

    @Override
    @Transactional
    public String handle(JobRow job) {
        SummaryRow summary = reviews.findSummaryByJob(job.id())
                .orElseThrow(() -> ApiException.notFound("검토"));

        List<CommentRow> source = comments.listAllForReview(job.projectId());
        if (source.isEmpty()) {
            reviews.failSummary(summary.id(), "취합할 의견이 없습니다.");
            throw ApiException.ruleViolation("취합할 의견이 없습니다.");
        }

        try {
            var response = ai.complete("REVIEW_SUMMARY", systemPrompt(), userPrompt(source), 8_000);
            store(summary.id(), parse(response.text()), source);
            reviews.finishSummary(summary.id(), response.model());
            return response.model();
        } catch (RuntimeException ex) {
            reviews.failSummary(summary.id(), ex.getMessage());
            throw ex;
        }
    }

    private String systemPrompt() {
        return """
                당신은 회의 의견을 정리하는 실무자다. 아래 의견 목록을 읽고 세 갈래로 묶는다.

                - AGREED: 여러 사람이 같은 방향으로 말한 것
                - CONFLICTED: 서로 다른 방향으로 갈린 것
                - NEEDS_INFO: 결정하려면 확인이 더 필요한 것

                ## 출력 형식

                아래 형태의 JSON 만 출력한다.

                {"items":[{"category":"AGREED","title":"...","body":"...","commentRefs":[1,3]}]}

                ## 반드시 지킬 것

                1. commentRefs 에는 그 항목의 근거가 된 의견 번호를 넣는다. 번호는 아래 목록의 앞 숫자다.
                   근거가 없는 항목은 보고하지 않는다.
                2. 의견에 없는 내용을 지어내지 않는다. 요약이지 창작이 아니다.
                3. 결정을 내리지 않는다. 무엇이 갈렸는지까지만 적고 어느 쪽이 옳은지는 말하지 않는다.
                   반영 여부는 담당자가 정한다.
                """;
    }

    private String userPrompt(List<CommentRow> source) {
        StringBuilder text = new StringBuilder("## 의견 목록\n\n");
        for (int index = 0; index < source.size(); index++) {
            CommentRow comment = source.get(index);
            text.append(index + 1).append(". [").append(comment.authorName()).append("] ")
                    .append(comment.body()).append('\n');
        }
        return text.toString();
    }

    private List<ModelItem> parse(String raw) {
        String text = raw == null ? "" : raw.trim();
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw ApiException.ruleViolation("AI 취합 응답을 해석하지 못했습니다.");
        }
        try {
            ModelReport report = json.mapper().readValue(text.substring(start, end + 1),
                    new TypeReference<ModelReport>() {});
            return report.items() == null ? List.of() : report.items();
        } catch (Exception ex) {
            throw ApiException.ruleViolation("AI 취합 응답을 해석하지 못했습니다.");
        }
    }

    /** 근거 댓글이 하나도 남지 않는 항목은 저장하지 않는다. */
    private void store(UUID summaryId, List<ModelItem> items, List<CommentRow> source) {
        Map<Integer, UUID> byIndex = new LinkedHashMap<>();
        for (int index = 0; index < source.size(); index++) {
            byIndex.put(index + 1, source.get(index).id());
        }

        int order = 0;
        for (ModelItem item : items) {
            if (!CATEGORIES.contains(item.category()) || item.title() == null || item.title().isBlank()) {
                continue;
            }
            List<UUID> evidence = (item.commentRefs() == null ? List.<Integer>of() : item.commentRefs())
                    .stream()
                    .map(byIndex::get)
                    .filter(java.util.Objects::nonNull)
                    .toList();
            if (evidence.isEmpty()) {
                continue;
            }
            UUID itemId = reviews.insertItem(summaryId, item.category(), item.title(),
                    item.body() == null ? "" : item.body(), order++);
            for (UUID commentId : evidence) {
                reviews.linkComment(itemId, commentId);
            }
        }
    }
}
