package com.nh.canvas.responsibility;

import com.fasterxml.jackson.core.type.TypeReference;
import com.nh.canvas.common.Json;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * 책임성 규칙 사본 (FR-14).
 *
 * <p><b>정본은 {@code docs/guidelines/RESPONSIBLE_DESIGN.md} 다.</b> 여기 있는 것은
 * 생성 가드레일과 검토 지시문을 <b>규칙에서 생성</b>하기 위한 사본이다. 프롬프트를 손으로
 * 관리하면 규칙과 어긋나므로, 규칙을 추가하면 프롬프트 두 곳이 함께 갱신되도록 만든 것이다
 * (ARCHITECTURE 11절).
 */
@Component
public class ResponsibilityRules {

    public record Rule(String id, String category, String docSection, String title,
                       String lookFor, String remedy, boolean needsComplianceReview) {}

    private static final Map<String, String> CATEGORY_LABEL = Map.of(
            "EXPRESSION", "표현·차별",
            "CONSUMER", "금융소비자보호",
            "DARKPATTERN", "다크패턴",
            "ACCESSIBILITY", "접근성");

    private static final List<String> CATEGORY_ORDER =
            List.of("CONSUMER", "EXPRESSION", "DARKPATTERN", "ACCESSIBILITY");

    private final List<Rule> rules;
    private final Set<String> ruleIds;

    public ResponsibilityRules(Json json) {
        try (InputStream stream = new ClassPathResource("rules/responsibility-rules.json").getInputStream()) {
            Map<String, Object> document = json.mapper()
                    .readValue(stream, new TypeReference<Map<String, Object>>() {});
            this.rules = json.mapper().convertValue(document.get("rules"), new TypeReference<List<Rule>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("책임성 규칙을 읽지 못했습니다.", ex);
        }
        this.ruleIds = rules.stream().map(Rule::id).collect(Collectors.toUnmodifiableSet());
    }

    public List<Rule> all() {
        return rules;
    }

    public boolean isKnown(String ruleId) {
        return ruleIds.contains(ruleId);
    }

    public boolean needsComplianceReview(String ruleId) {
        return rules.stream().filter(rule -> rule.id().equals(ruleId))
                .findFirst()
                .map(Rule::needsComplianceReview)
                .orElse(false);
    }

    /** 생성 프롬프트에 넣을 가드레일. 규칙에서 만들어지므로 규칙을 고치면 함께 바뀐다. */
    public String guardrailPrompt() {
        StringBuilder text = new StringBuilder("""
                아래 항목을 어기지 않는 화면을 만든다. 어길 수밖에 없다고 판단되면 그 부분을 만들지 말고 비워 둔다.
                """);
        for (String category : CATEGORY_ORDER) {
            List<Rule> group = byCategory(category);
            if (group.isEmpty()) {
                continue;
            }
            text.append("\n[").append(CATEGORY_LABEL.get(category)).append("]\n");
            for (Rule rule : group) {
                text.append("- ").append(rule.title()).append(": ").append(rule.remedy()).append('\n');
            }
        }
        return text.toString();
    }

    /** 사후 검토 프롬프트에 넣을 규칙 목록. 무엇을 찾아야 하는지가 여기 들어간다. */
    public String reviewPrompt() {
        StringBuilder text = new StringBuilder();
        for (String category : CATEGORY_ORDER) {
            for (Rule rule : byCategory(category)) {
                text.append(rule.id()).append(" [").append(CATEGORY_LABEL.get(category)).append("] ")
                        .append(rule.title()).append('\n')
                        .append("  찾을 것: ").append(rule.lookFor()).append('\n')
                        .append("  조치: ").append(rule.remedy()).append('\n');
            }
        }
        return text.toString();
    }

    private List<Rule> byCategory(String category) {
        return rules.stream().filter(rule -> rule.category().equals(category)).toList();
    }

    public Map<String, String> categoryLabels() {
        return new LinkedHashMap<>(CATEGORY_LABEL);
    }
}
