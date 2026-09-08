package com.nh.canvas.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 이 판정이 뚫리면 검증할 수 없는 지적이 담당자 화면에 쌓인다 (FR-14 · FR-15).
 */
class EvidenceVerifierTest {

    private final EvidenceVerifier verifier = new EvidenceVerifier();

    private static final String CORPUS = """
            <p>지금 신청하면 연 5.0% 특별 우대금리를 드립니다</p>
            <button>바로 가입</button>
            """;

    @Test
    @DisplayName("원문에 그대로 있는 인용은 통과한다")
    void should_keep_quote_when_verbatim() {
        List<String> verified = verifier.verify(List.of("연 5.0% 특별 우대금리"), CORPUS);

        assertThat(verified).containsExactly("연 5.0% 특별 우대금리");
    }

    @Test
    @DisplayName("의역한 인용은 탈락한다")
    void should_drop_quote_when_paraphrased() {
        List<String> verified = verifier.verify(List.of("높은 금리를 강조하는 문구"), CORPUS);

        assertThat(verified).isEmpty();
    }

    @Test
    @DisplayName("공백 차이만 있는 인용은 통과한다")
    void should_keep_quote_when_only_whitespace_differs() {
        List<String> verified = verifier.verify(List.of("연  5.0%   특별 우대금리"), CORPUS);

        assertThat(verified).hasSize(1);
    }

    @Test
    @DisplayName("너무 짧은 인용은 우연히 맞을 수 있어 탈락한다")
    void should_drop_quote_when_shorter_than_minimum() {
        List<String> verified = verifier.verify(List.of("가입"), CORPUS);

        assertThat(verified).isEmpty();
    }

    @Test
    @DisplayName("빈 입력은 빈 결과다 — 호출부가 그 지적을 버려야 한다")
    void should_return_empty_when_no_quotes() {
        assertThat(verifier.verify(null, CORPUS)).isEmpty();
        assertThat(verifier.verify(List.of(), CORPUS)).isEmpty();
        assertThat(verifier.verify(List.of("  "), CORPUS)).isEmpty();
    }

    @Test
    @DisplayName("근거가 하나라도 없으면 지적 자체가 성립하지 않는다")
    void should_report_not_grounded_when_quote_absent() {
        assertThat(verifier.isGrounded("존재하지 않는 문구입니다", CORPUS)).isFalse();
        assertThat(verifier.isGrounded("지금 신청하면", CORPUS)).isTrue();
    }

    @Test
    @DisplayName("최소 길이 미만은 원문에 있어도 탈락한다 — 우연히 맞는 것을 막는다")
    void should_report_not_grounded_when_quote_too_short() {
        // "바로 가입" 은 원문에 실제로 있지만 5자라 최소 길이(6자)에 못 미친다
        assertThat(verifier.isGrounded("바로 가입", CORPUS)).isFalse();
    }
}
