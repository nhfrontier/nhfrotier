package com.nh.canvas.screen;

import java.util.List;

/**
 * 요소 편집의 허용 범위 (프로토타입 {@code lib/canvas/protocol.ts} 대응).
 *
 * <p>화이트리스트를 저장 시점과 반영(baking) 시점 <b>양쪽</b>에서 확인한다.
 * DB 에 어떤 값이 들어 있든 나가는 것은 허용된 것이어야 한다는 전제다.
 */
public final class EditProtocol {

    private EditProtocol() {}

    public static final List<String> EDITABLE_STYLE_PROPS = List.of(
            "color", "background-color", "font-size", "font-weight", "text-align",
            "border-radius", "border-color", "padding", "margin", "opacity", "display");

    public static final List<String> EDITABLE_ATTRS = List.of(
            "placeholder", "alt", "title", "aria-label", "data-goto");

    public static final List<String> OPS = List.of("setText", "setStyle", "setAttr", "aiRewrite");

    /** 화면 HTML 에 실제로 반영되는 연산. */
    public sealed interface PatchOp {
        String nhId();

        record Text(String nhId, String value) implements PatchOp {}

        record Style(String nhId, String prop, String value) implements PatchOp {}

        record Attr(String nhId, String name, String value) implements PatchOp {}

        /** AI 가 다시 만든 HTML 로 요소를 교체한다. 정제를 마친 값만 들어온다. */
        record Replace(String nhId, String html) implements PatchOp {}
    }
}
