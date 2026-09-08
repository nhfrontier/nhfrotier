import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FindingCard from "../FindingCard.vue";

/**
 * 여기서 지키는 것은 **두 검토의 결정 축이 다르다**는 제품 규칙이다.
 * `준법 검토 요청`은 책임성 검토(FR-14) 고유이고 UX 리스크 검토(FR-15)에는 없다.
 * 한 카드를 공유하므로, 선택지를 한쪽 기준으로 통일하려는 유혹이 생기는 자리다.
 */
const BASE = {
  severity: "HIGH",
  title: "수익률을 단정적으로 표현했습니다",
  evidence: "연 5% 수익 보장",
  why: "확정 표현은 문제가 됩니다.",
  suggestion: "과거 평균으로 바꿉니다.",
  decision: null,
  decisionByName: null,
  decisionReason: null,
  busy: false,
};

const RESPONSIBILITY = ["ACCEPTED", "DEFERRED", "REJECTED", "COMPLIANCE_REQUESTED"];
const USABILITY = ["ACCEPTED", "DEFERRED", "REJECTED"];

function card(extra: Record<string, unknown> = {}) {
  return mount(FindingCard, {
    props: { kind: "책임성", basis: "RR-EXPR-02", decisions: RESPONSIBILITY, ...BASE, ...extra },
  });
}

describe("결정 선택지", () => {
  it("책임성 검토에는 준법 검토 요청이 있다", async () => {
    const wrapper = card();
    await wrapper.get("button").trigger("click");
    expect(wrapper.text()).toContain("준법 검토 요청");
  });

  it("UX 리스크 검토에는 준법 검토 요청이 없다", async () => {
    const wrapper = card({ kind: "UX", basis: "UR-ACCUM-01", decisions: USABILITY });
    await wrapper.get("button").trigger("click");
    expect(wrapper.text()).not.toContain("준법 검토 요청");
    expect(wrapper.findAll("input[type=radio]")).toHaveLength(3);
  });

  it("결정 코드를 한글로 보여 준다", async () => {
    const wrapper = card();
    await wrapper.get("button").trigger("click");
    const labels = wrapper.text();
    for (const label of ["반영", "보류", "반려"]) expect(labels).toContain(label);
    expect(labels).not.toContain("ACCEPTED");
  });
});

describe("근거 출처", () => {
  it("코드값이 아니라 사람이 읽는 말로 보여 준다", () => {
    // 실제로 화면에 "DISCUSSION" 이 노출됐던 자리다. API 응답만 봐서는 잡히지 않았다.
    const wrapper = card({ kind: "UX", basis: "UR-1", decisions: USABILITY, evidenceSource: "DISCUSSION" });
    expect(wrapper.text()).toContain("의견에서 인용");
    expect(wrapper.text()).not.toContain("DISCUSSION");
  });

  it("모르는 출처 코드는 그대로 두어 정보를 잃지 않는다", () => {
    const wrapper = card({ kind: "UX", basis: "UR-1", decisions: USABILITY, evidenceSource: "UNKNOWN_SRC" });
    expect(wrapper.text()).toContain("UNKNOWN_SRC");
  });

  it("출처가 없으면(책임성) 표시하지 않는다", () => {
    expect(card().text()).not.toContain("인용");
  });
});

describe("결정 흐름", () => {
  it("고르지 않으면 확정할 수 없다", async () => {
    const wrapper = card();
    await wrapper.get("button").trigger("click");
    const submit = wrapper.findAll("button").find((b) => b.text() === "확정")!;
    expect(submit.attributes("disabled")).toBeDefined();
  });

  it("고르면 decision 과 이유를 함께 올린다", async () => {
    const wrapper = card();
    await wrapper.get("button").trigger("click");
    await wrapper.findAll("input[type=radio]")[3].setValue();
    await wrapper.get('input[placeholder="이유 (선택)"]').setValue("준법팀 확인 필요");
    // 확정은 form submit 이다. 버튼 click 은 happy-dom 에서 제출로 이어지지 않는다.
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("decide")).toEqual([["COMPLIANCE_REQUESTED", "준법팀 확인 필요"]]);
  });

  it("이미 결정된 지적은 결정 버튼 대신 결정자를 보여 준다", () => {
    const wrapper = card({ decision: "ACCEPTED", decisionByName: "kyj", decisionReason: "고치겠습니다" });
    expect(wrapper.text()).toContain("반영");
    expect(wrapper.text()).toContain("kyj");
    expect(wrapper.text()).toContain("고치겠습니다");
    expect(wrapper.findAll("button").some((b) => b.text() === "결정하기")).toBe(false);
  });

  it("근거를 반드시 보여 준다 — 검증할 수 없는 지적은 결정할 수 없다", () => {
    expect(card().text()).toContain("연 5% 수익 보장");
  });
});
