package com.nh.canvas.common;

import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * AI 지적의 근거 대조 (FR-14 · FR-15).
 *
 * <p>모델이 낸 인용 조각이 원문에 <b>글자 그대로</b> 있는지 확인한다. 요약·의역은 여기서 탈락한다.
 * 근거 없는 지적은 담당자가 검증할 수 없어 결정을 내릴 수 없고, 검증 불가능한 카드가 한 장만
 * 섞여도 담당자는 나머지 카드까지 읽지 않는다 (08_DECISIONS).
 *
 * <p>LLM 을 부르지 않는 순수 판정으로 떼어 둔다 — 이 판정이 뚫리면 검증할 수 없는 지적이
 * 의견 패널에 쌓이므로, 따로 시험할 수 있어야 한다.
 */
@Component
public class EvidenceVerifier {

    /** 인용이 우연히 맞는 것을 막는 최소 길이. */
    public static final int MIN_QUOTE_LENGTH = 6;

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    /** 대조를 위해 공백을 한 칸으로 줄이고 소문자화한다. */
    public String canonical(String text) {
        if (text == null) {
            return "";
        }
        return WHITESPACE.matcher(text).replaceAll(" ").trim().toLowerCase();
    }

    /** @return 원문에 실제로 존재하는 인용만. 비면 호출부가 그 지적을 통째로 버려야 한다. */
    public List<String> verify(List<String> quotes, String corpus) {
        if (quotes == null || quotes.isEmpty()) {
            return List.of();
        }
        String haystack = canonical(corpus);
        return quotes.stream()
                .filter(quote -> quote != null && !quote.isBlank())
                .map(String::trim)
                .filter(quote -> {
                    String needle = canonical(quote);
                    return needle.length() >= MIN_QUOTE_LENGTH && haystack.contains(needle);
                })
                .toList();
    }

    /** 인용이 하나뿐인 경우(FR-14 evidence)의 편의 메서드. */
    public boolean isGrounded(String quote, String corpus) {
        return !verify(List.of(quote == null ? "" : quote), corpus).isEmpty();
    }
}
