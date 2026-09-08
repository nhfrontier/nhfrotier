package com.nh.canvas.usability;

import com.fasterxml.jackson.core.type.TypeReference;
import com.nh.canvas.common.Json;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * UX 검토 렌즈 사본 (FR-15).
 *
 * <p><b>정본은 {@code docs/guidelines/USABILITY_REVIEW.md} 다.</b>
 * 렌즈는 규칙(FR-14)과 달리 "위반 여부"가 아니라 <b>질문</b>이다 — 요소 하나로 답이 나오지 않고
 * 개수와 맥락을 봐야 한다. 그래서 판정이 느슨한 만큼 근거 대조를 더 조인다.
 */
@Component
public class UsabilityLenses {

    public record Lens(String id, String docSection, String title, String question,
                       String lookFor, String remedy) {}

    private final List<Lens> lenses;
    private final Set<String> lensIds;

    public UsabilityLenses(Json json) {
        try (InputStream stream = new ClassPathResource("rules/usability-lenses.json").getInputStream()) {
            Map<String, Object> document = json.mapper()
                    .readValue(stream, new TypeReference<Map<String, Object>>() {});
            this.lenses = json.mapper().convertValue(document.get("lenses"), new TypeReference<List<Lens>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("UX 검토 렌즈를 읽지 못했습니다.", ex);
        }
        this.lensIds = lenses.stream().map(Lens::id).collect(Collectors.toUnmodifiableSet());
    }

    public List<Lens> all() {
        return lenses;
    }

    public boolean isKnown(String lensId) {
        return lensIds.contains(lensId);
    }

    public String reviewPrompt() {
        StringBuilder text = new StringBuilder();
        for (Lens lens : lenses) {
            text.append(lens.id()).append(' ').append(lens.title()).append('\n')
                    .append("  질문: ").append(lens.question()).append('\n')
                    .append("  볼 것: ").append(lens.lookFor()).append('\n')
                    .append("  조치: ").append(lens.remedy()).append('\n');
        }
        return text.toString();
    }
}
