import { describe, expect, it } from "vitest";
import {
  EDITABLE_ATTRS,
  EDITABLE_STYLE_PROPS,
  isSafeStyleValue,
  isTrustedFrameMessage,
} from "../protocol";

/**
 * 프레임은 불투명 오리진이라 event.origin 이 항상 "null" 이다.
 * origin 으로 거를 수 없으므로 source 대조가 유일한 방어선이다. 이 테스트가 그것을 지킨다.
 */
describe("isTrustedFrameMessage", () => {
  const win = { name: "frame" } as unknown as Window;
  const frame = { contentWindow: win } as unknown as HTMLIFrameElement;

  function event(source: unknown, data: unknown): MessageEvent {
    return { source, data, origin: "null" } as unknown as MessageEvent;
  }

  it("그 프레임의 contentWindow 에서 온 것만 받는다", () => {
    expect(isTrustedFrameMessage(event(win, { type: "ready" }), frame)).toBe(true);
  });

  it("다른 창에서 온 것은 origin 이 같아 보여도 거른다", () => {
    const other = { name: "attacker" } as unknown as Window;
    expect(isTrustedFrameMessage(event(other, { type: "select" }), frame)).toBe(false);
  });

  it("프레임이 아직 없으면 받지 않는다", () => {
    expect(isTrustedFrameMessage(event(win, { type: "ready" }), null)).toBe(false);
  });

  it("type 이 없는 페이로드는 거른다", () => {
    expect(isTrustedFrameMessage(event(win, { hello: 1 }), frame)).toBe(false);
    expect(isTrustedFrameMessage(event(win, null), frame)).toBe(false);
    expect(isTrustedFrameMessage(event(win, "문자열"), frame)).toBe(false);
  });
});

/**
 * 서버(HtmlPipeline.UNSAFE_STYLE_VALUE)와 같은 판정을 해야 한다.
 * 어긋나면 "프레임에서는 반영됐는데 다운로드본에는 없다"가 되고 사용자가 원인을 알 수 없다.
 */
describe("isSafeStyleValue", () => {
  it.each(["#00a04b", "rgb(0, 0, 0)", "12px", "8px 12px", "bold", "center", "0.5"])(
    "통과: %s",
    (value) => expect(isSafeStyleValue(value)).toBe(true)
  );

  it.each([
    "red; background-image: url(http://x)",
    "url(http://x)",
    "url (http://x)",
    "expression(alert(1))",
    "EXPRESSION (1)",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "@import 'x'",
    "a{b}",
    "<b>",
  ])("차단: %s", (value) => expect(isSafeStyleValue(value)).toBe(false));
});

/** 화이트리스트가 서버(EditProtocol.java)와 어긋나면 저장이 400 으로 튕긴다. */
describe("편집 화이트리스트", () => {
  it("스타일 속성은 서버와 같은 11개다", () => {
    expect([...EDITABLE_STYLE_PROPS]).toEqual([
      "color",
      "background-color",
      "font-size",
      "font-weight",
      "text-align",
      "border-radius",
      "border-color",
      "padding",
      "margin",
      "opacity",
      "display",
    ]);
  });

  it("속성은 서버와 같은 5개다", () => {
    expect([...EDITABLE_ATTRS]).toEqual(["placeholder", "alt", "title", "aria-label", "data-goto"]);
  });
});
