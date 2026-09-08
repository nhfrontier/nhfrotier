import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import DesignCanvas from "../DesignCanvas.vue";

/**
 * 이 파일이 지키는 것은 화면 모양이 아니라 **샌드박스 조합**이다.
 *
 * `allow-scripts` 와 `allow-same-origin` 을 함께 주면 프레임이 부모 DOM·쿠키에 닿는다.
 * 금지 조합이며(SECURITY_CHECKLIST 4절), 편집 기능이 안 된다는 이유로 나중에 누가
 * `allow-same-origin` 을 더하는 것이 가장 그럴듯한 사고 경로다. 그것을 여기서 막는다.
 */
const HTML = `<html><head></head><body><h1 data-nh-id="a1">제목</h1></body></html>`;

function canvas(props: Partial<{ html: string | null; mode: "view" | "edit"; name: string }> = {}) {
  return mount(DesignCanvas, {
    props: { html: HTML, mode: "view", name: "화면", ...props },
  });
}

describe("DesignCanvas 샌드박스", () => {
  it("sandbox 는 allow-scripts 하나뿐이다", () => {
    const frame = canvas().find("iframe");
    expect(frame.attributes("sandbox")).toBe("allow-scripts");
  });

  it("allow-same-origin 을 절대 함께 주지 않는다", () => {
    const sandbox = canvas().find("iframe").attributes("sandbox") ?? "";
    expect(sandbox).not.toContain("allow-same-origin");
  });

  it("편집 모드에서도 샌드박스가 느슨해지지 않는다", () => {
    const sandbox = canvas({ mode: "edit" }).find("iframe").attributes("sandbox") ?? "";
    expect(sandbox).toBe("allow-scripts");
  });

  it("srcdoc 에 CSP 와 런타임이 들어간다", () => {
    const doc = canvas().find("iframe").attributes("srcdoc") ?? "";
    expect(doc).toContain("Content-Security-Policy");
    expect(doc).toContain("<script>");
  });

  it("html 이 없으면 프레임을 만들지 않는다", () => {
    const wrapper = canvas({ html: null });
    expect(wrapper.find("iframe").exists()).toBe(false);
    expect(wrapper.text()).toContain("아직 만들어지지 않았습니다");
  });
});

describe("DesignCanvas 메시지 신뢰", () => {
  it("다른 창에서 온 select 는 무시한다", async () => {
    const wrapper = canvas({ mode: "edit" });
    // 프레임이 아닌 창이 보낸 메시지. 받아들이면 아무나 선택 상태를 조작할 수 있다.
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "select", element: { nhId: "가짜" } },
        source: window as unknown as Window,
      })
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("select")).toBeUndefined();
  });

  it("type 이 없는 메시지는 무시한다", async () => {
    const wrapper = canvas({ mode: "edit" });
    const frameWindow = (wrapper.find("iframe").element as HTMLIFrameElement).contentWindow;
    window.dispatchEvent(
      new MessageEvent("message", { data: { nope: 1 }, source: frameWindow })
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("select")).toBeUndefined();
  });
});
