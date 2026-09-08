import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ElementPanel from "../ElementPanel.vue";
import { EDITABLE_ATTRS, EDITABLE_STYLE_PROPS, type ElementMeta } from "@/canvas/protocol";

const ELEMENT: ElementMeta = {
  nhId: "a1b2c3d4",
  tag: "h2",
  text: "원래 문구",
  attrs: { placeholder: "", alt: "", title: "제목", "aria-label": "", "data-goto": "" },
  styles: { color: "rgb(0, 0, 0)", "font-size": "24px" } as Record<string, string>,
};

function panel(props: Record<string, unknown> = {}) {
  return mount(ElementPanel, { props: { element: ELEMENT, busy: false, ...props } });
}

describe("선택 상태", () => {
  it("고른 요소가 없으면 안내만 보여 준다", () => {
    const wrapper = panel({ element: null });
    expect(wrapper.text()).toContain("캔버스에서 요소를 클릭하세요");
    expect(wrapper.find("textarea").exists()).toBe(false);
  });

  it("고른 요소의 태그와 식별자를 보여 준다", () => {
    expect(panel().text()).toContain("<h2>");
    expect(panel().text()).toContain("a1b2c3d4");
  });

  it("입력칸을 현재 값으로 채운다", () => {
    const wrapper = panel();
    expect((wrapper.find("textarea").element as HTMLTextAreaElement).value).toBe("원래 문구");
  });
});

describe("화이트리스트", () => {
  it("서버가 허용한 스타일 속성만 고를 수 있다", () => {
    const options = panel().findAll("select")[0].findAll("option").map((o) => o.element.value);
    expect(options).toEqual([...EDITABLE_STYLE_PROPS]);
  });

  it("서버가 허용한 속성만 고를 수 있다", () => {
    const options = panel().findAll("select")[1].findAll("option").map((o) => o.element.value);
    expect(options).toEqual([...EDITABLE_ATTRS]);
  });
});

describe("스타일 값 가드", () => {
  /**
   * 서버는 이런 값을 201 로 저장하고 baking 에서 버린다.
   * 막지 않으면 프레임에는 반영돼 보이는데 다운로드본에는 없고, 사용자가 원인을 알 수 없다.
   */
  it("선언을 쪼갤 수 있는 값이면 반영 버튼을 막고 이유를 적는다", async () => {
    const wrapper = panel();
    await wrapper.findAll('input[type="text"], input:not([type])')[0].setValue("red; background-image: url(http://x)");
    const button = wrapper.findAll("button").find((b) => b.text() === "스타일 반영")!;
    expect(button.attributes("disabled")).toBeDefined();
    expect(wrapper.text()).toContain("반영되지 않습니다");
  });

  it("정상 값이면 막지 않는다", async () => {
    const wrapper = panel();
    await wrapper.findAll('input[type="text"], input:not([type])')[0].setValue("#00a04b");
    const button = wrapper.findAll("button").find((b) => b.text() === "스타일 반영")!;
    expect(button.attributes("disabled")).toBeUndefined();
  });
});

describe("편집 전달", () => {
  it("텍스트를 올린다", async () => {
    const wrapper = panel();
    await wrapper.find("textarea").setValue("바꾼 문구");
    await wrapper.findAll("button").find((b) => b.text() === "텍스트 반영")!.trigger("click");
    expect(wrapper.emitted("setText")).toEqual([["바꾼 문구"]]);
  });

  it("스타일을 속성과 함께 올린다", async () => {
    const wrapper = panel();
    await wrapper.findAll('input[type="text"], input:not([type])')[0].setValue("#00a04b");
    await wrapper.findAll("button").find((b) => b.text() === "스타일 반영")!.trigger("click");
    expect(wrapper.emitted("setStyle")).toEqual([["color", "#00a04b"]]);
  });

  it("AI 편집 지시를 올린다", async () => {
    const wrapper = panel();
    await wrapper.findAll("textarea")[1].setValue("더 부드럽게");
    await wrapper.findAll("button").find((b) => b.text() === "AI 편집")!.trigger("click");
    expect(wrapper.emitted("aiEdit")).toEqual([["더 부드럽게"]]);
  });

  it("busy 면 전부 잠근다 — 같은 편집을 두 번 보내지 않는다", () => {
    const wrapper = panel({ busy: true });
    expect(wrapper.findAll("button").every((b) => b.attributes("disabled") !== undefined)).toBe(true);
  });
});
