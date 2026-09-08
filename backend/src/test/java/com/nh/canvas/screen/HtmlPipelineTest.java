package com.nh.canvas.screen;

import static org.assertj.core.api.Assertions.assertThat;

import com.nh.canvas.screen.EditProtocol.PatchOp;
import com.nh.canvas.screen.HtmlPipeline.PipelineResult;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 정제가 뚫리면 저장형 XSS 가 된다. 이 클래스가 SECURITY_CHECKLIST 4절의 회귀 방지선이다.
 */
class HtmlPipelineTest {

    private final HtmlPipeline pipeline = new HtmlPipeline();

    @Test
    @DisplayName("script 태그는 내용까지 통째로 제거된다")
    void should_drop_script_tag_when_present() {
        PipelineResult result = pipeline.process(
                "<html><body><div>안녕</div><script>alert(1)</script></body></html>", List.of());

        assertThat(result.html()).doesNotContain("script").doesNotContain("alert");
        assertThat(result.warnings()).anyMatch(warning -> warning.contains("script"));
    }

    @Test
    @DisplayName("인라인 이벤트 핸들러는 제거된다")
    void should_drop_inline_event_handler_when_present() {
        PipelineResult result = pipeline.process(
                "<html><body><button onclick=\"steal()\">확인</button></body></html>", List.of());

        assertThat(result.html()).doesNotContain("onclick");
        assertThat(result.html()).contains("확인");
    }

    @Test
    @DisplayName("javascript: URL 속성은 제거된다")
    void should_drop_javascript_url_when_present() {
        PipelineResult result = pipeline.process(
                "<html><body><a href=\"javascript:alert(1)\">링크</a></body></html>", List.of());

        assertThat(result.html()).doesNotContain("javascript:");
    }

    @Test
    @DisplayName("data:image/svg+xml 은 허용하지 않는다 — SVG 는 스크립트를 운반할 수 있다")
    void should_drop_svg_data_url_when_present() {
        PipelineResult result = pipeline.process(
                "<html><body><img src=\"data:image/svg+xml;base64,PHN2Zz4=\"></body></html>", List.of());

        assertThat(result.html()).doesNotContain("svg+xml");
    }

    @Test
    @DisplayName("data:image/png 은 허용한다")
    void should_keep_png_data_url_when_present() {
        PipelineResult result = pipeline.process(
                "<html><body><img src=\"data:image/png;base64,iVBORw0KGgo=\"></body></html>", List.of());

        assertThat(result.html()).contains("data:image/png;base64");
    }

    @Test
    @DisplayName("CSS 의 @import 와 외부 url() 은 무력화된다")
    void should_neutralize_external_css_when_present() {
        PipelineResult result = pipeline.process("""
                <html><head><style>@import url('http://evil/x.css');
                body { background: url(http://evil/x.png); }</style></head><body></body></html>
                """, List.of());

        assertThat(result.html()).doesNotContain("@import").doesNotContain("evil");
    }

    @Test
    @DisplayName("AI 가 붙인 data-nh-id 는 버리고 서버가 다시 부여한다")
    void should_reassign_nh_id_when_ai_supplied_one() {
        PipelineResult result = pipeline.process(
                "<html><body><div data-nh-id=\"attacker\">본문</div></body></html>", List.of());

        assertThat(result.html()).doesNotContain("attacker");
        assertThat(result.elements()).isNotEmpty();
        assertThat(result.html()).contains("data-nh-id=");
    }

    @Test
    @DisplayName("존재하지 않는 화면을 가리키는 data-goto 는 끊는다")
    void should_drop_unknown_goto_when_target_missing() {
        PipelineResult result = pipeline.process(
                "<html><body><a data-goto=\"nowhere\">이동</a><a data-goto=\"home\">홈</a></body></html>",
                List.of("home"));

        assertThat(result.html()).doesNotContain("nowhere");
        assertThat(result.html()).contains("data-goto=\"home\"");
    }

    @Test
    @DisplayName("같은 요소는 재생성 후에도 같은 식별자를 갖는다 — 숫자 더미 데이터는 무시한다")
    void should_produce_stable_nh_id_when_numbers_change() {
        String first = "<html><body><p>잔액 12,400원</p></body></html>";
        String second = "<html><body><p>잔액 98,700원</p></body></html>";

        String firstId = pipeline.process(first, List.of()).elements().get(0).nhId();
        String secondId = pipeline.process(second, List.of()).elements().get(0).nhId();

        assertThat(firstId).isEqualTo(secondId);
    }

    @Test
    @DisplayName("선언을 쪼갤 수 있는 스타일 값은 반영하지 않고 버린다")
    void should_reject_style_value_when_it_can_split_declaration() {
        String stored = pipeline.process("<html><body><div>본문</div></body></html>", List.of()).html();
        String nhId = pipeline.process("<html><body><div>본문</div></body></html>", List.of())
                .elements().get(0).nhId();

        var result = pipeline.applyPatches(stored,
                List.of(new PatchOp.Style(nhId, "color", "red; background-image: url(http://evil/x.png)")));

        assertThat(result.html()).doesNotContain("evil");
        assertThat(result.warnings()).anyMatch(warning -> warning.contains("안전하지 않은"));
    }

    @Test
    @DisplayName("허용된 스타일 값은 반영된다")
    void should_apply_style_when_value_is_safe() {
        PipelineResult processed = pipeline.process("<html><body><div>본문</div></body></html>", List.of());
        String nhId = processed.elements().get(0).nhId();

        var result = pipeline.applyPatches(processed.html(),
                List.of(new PatchOp.Style(nhId, "color", "#19b3a6")));

        assertThat(result.html()).contains("color: #19b3a6");
    }

    @Test
    @DisplayName("화이트리스트에 없는 속성은 반영하지 않는다")
    void should_ignore_attr_patch_when_not_whitelisted() {
        PipelineResult processed = pipeline.process(
                "<html><body><a>링크</a></body></html>", List.of());
        String nhId = processed.elements().get(0).nhId();

        var result = pipeline.applyPatches(processed.html(),
                List.of(new PatchOp.Attr(nhId, "href", "http://evil")));

        assertThat(result.html()).doesNotContain("evil");
    }

    @Test
    @DisplayName("교체 조각은 반영 시점에 다시 정제된다 — DB 값을 신뢰하지 않는다")
    void should_resanitize_replacement_when_baking() {
        PipelineResult processed = pipeline.process("<html><body><div>본문</div></body></html>", List.of());
        String nhId = processed.elements().get(0).nhId();

        var result = pipeline.applyPatches(processed.html(),
                List.of(new PatchOp.Replace(nhId, "<div onclick=\"steal()\">새 본문<script>x()</script></div>")));

        assertThat(result.html()).contains("새 본문");
        assertThat(result.html()).doesNotContain("onclick").doesNotContain("script");
    }

    @Test
    @DisplayName("텍스트 편집은 요소 내용을 통째로 바꾼다")
    void should_replace_text_when_text_patch_applied() {
        PipelineResult processed = pipeline.process("<html><body><div>이전</div></body></html>", List.of());
        String nhId = processed.elements().get(0).nhId();

        var result = pipeline.applyPatches(processed.html(), List.of(new PatchOp.Text(nhId, "이후")));

        assertThat(result.html()).contains("이후").doesNotContain("이전");
    }

    @Test
    @DisplayName("요소 조각 정제는 문서 골격을 만들지 않는다")
    void should_not_add_document_skeleton_when_sanitizing_fragment() {
        var result = pipeline.sanitizeFragment("<span>조각</span>", List.of());

        assertThat(result.html()).isEqualTo("<span>조각</span>");
    }
}
