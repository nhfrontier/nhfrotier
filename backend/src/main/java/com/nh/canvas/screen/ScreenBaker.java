package com.nh.canvas.screen;

import com.nh.canvas.common.Json;
import com.nh.canvas.screen.EditProtocol.PatchOp;
import com.nh.canvas.screen.ScreenRepository.PatchRow;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * 화면 하나의 "지금 보이는 그대로"의 HTML을 만든다 (05_API_DB_SPEC 3-2절 baking).
 *
 * <p>요소 편집은 {@code screens.html_content} 를 덮어쓰지 않고 패치로 쌓인다. 화면에 보이는 것은
 * 프레임이 얹은 결과지만, <b>HTML 다운로드·AI 검토(FR-14·15)·Export 는 서버에서 저장본을 읽는다</b> —
 * 얹지 않으면 그쪽만 편집 이전 상태를 본다.
 *
 * <p><b>서버에서 화면 HTML 을 읽는 곳은 전부 이 클래스를 거쳐야 한다.</b> 별도 컴포넌트로 뺀 것은
 * 호출부(다운로드·검토·Export·버전 비교)가 서로 다른 도메인에 흩어져 있어서다.
 */
@Component
public class ScreenBaker {

    private final ScreenRepository screens;
    private final HtmlPipeline pipeline;
    private final Json json;

    public ScreenBaker(ScreenRepository screens, HtmlPipeline pipeline, Json json) {
        this.screens = screens;
        this.pipeline = pipeline;
        this.json = json;
    }

    /** 저장본에 활성 편집을 얹은 사본. 저장본은 건드리지 않는다. */
    public String bake(UUID screenId, String storedHtml) {
        if (storedHtml == null || storedHtml.isBlank()) {
            return "";
        }
        List<PatchOp> ops = toOps(screens.listActivePatches(screenId));
        return pipeline.applyPatches(storedHtml, ops).html();
    }

    /**
     * 지금 보이는 문서에 그 요소가 있는가. 편집·의견 앵커의 대상 검증은 이것을 기준으로 한다.
     *
     * <p>{@code screen_elements} 는 생성 시점의 지문이라 교체 조각의 자손은 없고, 교체·되돌리기로
     * 사라진 요소는 남아 있다. 그 표를 믿으면 "받아 놓고 반영은 안 되는" 편집이 생긴다.
     */
    public boolean hasElement(UUID screenId, String nhId) {
        return screens.findById(screenId)
                .map(screen -> pipeline.extractOuterHtml(bake(screenId, screen.htmlContent()), nhId) != null)
                .orElse(false);
    }

    /**
     * DB 행을 반영 연산으로 바꾼다.
     *
     * <p>화이트리스트를 여기서 <b>한 번 더</b> 확인한다. 저장 시점에도 검사하지만,
     * DB 에 무엇이 들어 있든 나가는 것은 허용된 것이어야 한다는 것이 전제다.
     */
    public List<PatchOp> toOps(List<PatchRow> rows) {
        List<PatchOp> ops = new ArrayList<>();
        for (PatchRow row : rows) {
            Map<String, Object> payload;
            try {
                payload = json.readMap(row.payload());
            } catch (RuntimeException ex) {
                continue;
            }
            switch (row.op()) {
                case "setText" -> {
                    if (payload.get("value") instanceof String value) {
                        ops.add(new PatchOp.Text(row.nhId(), value));
                    }
                }
                case "setStyle" -> {
                    if (payload.get("prop") instanceof String prop
                            && payload.get("value") instanceof String value
                            && EditProtocol.EDITABLE_STYLE_PROPS.contains(prop)) {
                        ops.add(new PatchOp.Style(row.nhId(), prop, value));
                    }
                }
                case "setAttr" -> {
                    if (payload.get("name") instanceof String name
                            && payload.get("value") instanceof String value
                            && EditProtocol.EDITABLE_ATTRS.contains(name)) {
                        ops.add(new PatchOp.Attr(row.nhId(), name, value));
                    }
                }
                case "aiRewrite" -> {
                    if (payload.get("html") instanceof String html) {
                        ops.add(new PatchOp.Replace(row.nhId(), html));
                    }
                }
                default -> {
                    // 알 수 없는 연산은 조용히 건너뛴다. 스키마 CHECK 가 막고 있어 도달하지 않는다
                }
            }
        }
        return ops;
    }
}
