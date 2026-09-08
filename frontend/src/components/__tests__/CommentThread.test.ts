import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import CommentThread from "../CommentThread.vue";
import type { Comment } from "@/api/types";

function comment(over: Partial<Comment> = {}): Comment {
  return {
    id: "c1",
    projectId: "p1",
    versionId: "v1",
    screenId: "s1",
    parentId: null,
    nhId: "a1b2c3d4",
    anchorStatus: "anchored",
    body: "이 문구가 딱딱합니다.",
    authorId: "u1",
    authorName: "kyj",
    createdAt: "2026-09-08T00:00:00Z",
    updatedAt: null,
    resolvedAt: null,
    ...over,
  };
}

function thread(comments: Comment[], anchorNhId: string | null = null) {
  return mount(CommentThread, { props: { comments, anchorNhId, busy: false } });
}

describe("스레드 구성", () => {
  it("답글은 뿌리 의견 아래로 접어 넣는다", () => {
    const wrapper = thread([
      comment(),
      comment({ id: "c2", parentId: "c1", nhId: null, anchorStatus: "none", body: "동의합니다." }),
    ]);
    // 뿌리는 하나뿐이고 답글은 그 안에 들어간다. 나란히 서면 스레드가 아니다.
    expect(wrapper.findAll(".list > li")).toHaveLength(1);
    expect(wrapper.find(".replies").text()).toContain("동의합니다");
  });

  it("핀은 뿌리에만 붙는다 — 답글은 자기 앵커를 갖지 않는다", () => {
    const wrapper = thread([
      comment(),
      comment({ id: "c2", parentId: "c1", nhId: null, anchorStatus: "none" }),
    ]);
    expect(wrapper.findAll(".head .badge")).toHaveLength(1);
  });
});

describe("앵커 표시", () => {
  it("요소에 붙은 의견은 그 식별자를 보여 준다", () => {
    expect(thread([comment()]).text()).toContain("a1b2c3d4");
  });

  it("앵커를 잃은 의견을 숨기지 않고 드러낸다", () => {
    // 조용히 사라지는 것보다 사람이 다시 붙일 수 있게 보이는 편이 낫다.
    const wrapper = thread([comment({ anchorStatus: "orphaned" })]);
    expect(wrapper.text()).toContain("위치를 잃음");
  });

  it("화면 전체 의견은 그렇게 표시한다", () => {
    expect(thread([comment({ nhId: null, anchorStatus: "none" })]).text()).toContain("화면 전체");
  });

  it("앵커를 누르면 캔버스에 그 요소를 짚으라고 알린다", async () => {
    const wrapper = thread([comment()]);
    await wrapper.get(".head .badge").trigger("click");
    expect(wrapper.emitted("focusAnchor")).toEqual([["a1b2c3d4"]]);
  });
});

describe("새 의견", () => {
  it("요소를 고른 상태면 그 요소에 붙인다", async () => {
    const wrapper = thread([], "z9y8x7w6");
    await wrapper.find("textarea").setValue("여기 문구를 고쳐주세요");
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("create")).toEqual([["여기 문구를 고쳐주세요", "z9y8x7w6", null]]);
  });

  it("고른 요소가 없으면 화면 전체 의견이 된다", async () => {
    const wrapper = thread([]);
    await wrapper.find("textarea").setValue("전반적으로 복잡합니다");
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("create")).toEqual([["전반적으로 복잡합니다", null, null]]);
  });

  it("빈 의견은 올리지 않는다", async () => {
    const wrapper = thread([]);
    await wrapper.find("textarea").setValue("   ");
    await wrapper.get("form").trigger("submit");
    expect(wrapper.emitted("create")).toBeUndefined();
  });
});

describe("해결 토글", () => {
  it("해결된 의견은 흐리게 두고 다시 열 수 있게 한다", () => {
    const wrapper = thread([comment({ resolvedAt: "2026-09-08T01:00:00Z" })]);
    expect(wrapper.get(".list > li").classes()).toContain("resolved");
    expect(wrapper.text()).toContain("다시 열기");
  });

  it("토글하면 그 의견을 올린다", async () => {
    const wrapper = thread([comment()]);
    await wrapper.findAll("button").find((b) => b.text() === "해결")!.trigger("click");
    expect(wrapper.emitted("toggleResolved")?.[0]?.[0]).toMatchObject({ id: "c1" });
  });
});
