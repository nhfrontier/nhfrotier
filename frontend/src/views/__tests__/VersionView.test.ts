import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VersionView from "../VersionView.vue";
import { installLocalStorage, mockApi } from "./helpers";

/**
 * 화면 하나 안에서 일어나는 흐름 전체를 본다:
 * 화면 목록 → 생성 → 편집 → 의견 → 검토 결정.
 *
 * 여기서 잡으려는 것은 렌더링 모양이 아니라 **어떤 요청을 어떤 모양으로 보내는가**다.
 * 상태값(PLANNED)을 PENDING 으로 잘못 알고 있었던 것 같은 종류가 이 자리에서 드러난다.
 */
const VERSION_ID = "v-1";
const SCREEN_ID = "s-1";

const SCREEN = {
  id: SCREEN_ID,
  versionId: VERSION_ID,
  screenKey: "home",
  name: "홈",
  role: "진입 화면",
  sortOrder: 0,
  status: "PLANNED",
  errorMessage: null,
};

const DETAIL = {
  version: {
    id: VERSION_ID,
    projectId: "p-1",
    parentVersionId: null,
    versionNo: 1,
    sourceType: "AI_GENERATION",
    sourceJobId: null,
    designSystemId: null,
    proposal: "기획안",
    summary: null,
    status: "DRAFT",
    createdBy: "u-1",
    createdByName: "kyj",
    createdAt: "2026-09-08T00:00:00Z",
    screenCount: 1,
    openFindingCount: 0,
  },
  screens: [SCREEN],
  files: [],
};

const HTML = `<html><head></head><body><h1 data-nh-id="a1">홈</h1></body></html>`;
const EMPTY_REVIEW = { review: null, findings: [], discardedCount: 0 };

function baseRoutes(extra: Record<string, { status?: number; body?: unknown }> = {}) {
  return {
    [`/api/v1/versions/${VERSION_ID}`]: { body: DETAIL },
    [`/api/v1/versions/${VERSION_ID}/patches`]: { body: [] },
    [`/api/v1/screens/${SCREEN_ID}/comments`]: { body: [] },
    [`/api/v1/versions/${VERSION_ID}/responsibility-review`]: { body: EMPTY_REVIEW },
    [`/api/v1/versions/${VERSION_ID}/usability-review`]: { body: EMPTY_REVIEW },
    ...extra,
  };
}

const RouterLink = { props: ["to"], template: "<a><slot /></a>" };

function view() {
  return mount(VersionView, {
    props: { versionId: VERSION_ID },
    global: { stubs: { RouterLink } },
  });
}

beforeEach(() => installLocalStorage());
afterEach(() => vi.unstubAllGlobals());

describe("화면 목록", () => {
  it("PLANNED 를 '대기'로 보여 준다 — 코드값을 그대로 노출하지 않는다", async () => {
    mockApi(baseRoutes());
    const wrapper = view();
    await flushPromises();

    expect(wrapper.text()).toContain("대기");
    expect(wrapper.text()).not.toContain("PLANNED");
  });

  it("READY 인 화면은 HTML 을 미리 받아 둔다", async () => {
    const calls = mockApi(
      baseRoutes({
        [`/api/v1/versions/${VERSION_ID}`]: {
          body: { ...DETAIL, screens: [{ ...SCREEN, status: "READY" }] },
        },
        [`/api/v1/screens/${SCREEN_ID}/html`]: { body: { screenId: SCREEN_ID, screenKey: "home", html: HTML, warnings: [] } },
      })
    );
    view();
    await flushPromises();

    expect(calls.some((c) => c.url.endsWith(`/screens/${SCREEN_ID}/html`))).toBe(true);
  });
});

describe("화면 생성", () => {
  it("만들기를 누르면 그 화면만 생성 요청한다 — 팬아웃은 클라이언트 몫이다", async () => {
    const calls = mockApi(
      baseRoutes({
        [`POST /api/v1/screens/${SCREEN_ID}/generate`]: {
          body: { screenId: SCREEN_ID, screenKey: "home", html: HTML, warnings: [] },
        },
      })
    );
    const wrapper = view();
    await flushPromises();

    await wrapper.findAll("button").find((b) => b.text() === "만들기")!.trigger("click");
    await flushPromises();

    const generate = calls.filter((c) => c.url.endsWith("/generate"));
    expect(generate).toHaveLength(1);
    expect(generate[0].method).toBe("POST");
    expect(wrapper.text()).toContain("완료");
  });

  it("생성이 실패하면 그 화면만 실패로 두고 이유를 보여 준다", async () => {
    mockApi(
      baseRoutes({
        [`POST /api/v1/screens/${SCREEN_ID}/generate`]: {
          status: 502,
          body: { code: "LLM_UNAVAILABLE", message: "AI 응답을 받지 못했습니다.", traceId: null },
        },
      })
    );
    const wrapper = view();
    await flushPromises();

    await wrapper.findAll("button").find((b) => b.text() === "만들기")!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("AI 응답을 받지 못했습니다");
    expect(wrapper.text()).toContain("실패");
  });
});

describe("의견", () => {
  it("화면의 의견을 그 화면 경로로 부른다", async () => {
    const calls = mockApi(baseRoutes());
    view();
    await flushPromises();

    expect(calls.some((c) => c.url === `/api/v1/screens/${SCREEN_ID}/comments`)).toBe(true);
  });

  it("고른 요소가 없으면 nhId 없이 올린다", async () => {
    const calls = mockApi(
      baseRoutes({ [`POST /api/v1/screens/${SCREEN_ID}/comments`]: { status: 201, body: {} } })
    );
    const wrapper = view();
    await flushPromises();

    await wrapper.find("textarea").setValue("전반적으로 복잡합니다");
    await wrapper.findAll("form").at(-1)!.trigger("submit");
    await flushPromises();

    const posted = calls.find((c) => c.method === "POST" && c.url.endsWith("/comments"));
    expect(posted?.body).toEqual({ body: "전반적으로 복잡합니다", nhId: null, parentId: null });
  });
});

describe("AI 검토", () => {
  it("돌지 않은 검토는 조용히 넘긴다 — 오류로 시끄럽게 하지 않는다", async () => {
    mockApi(baseRoutes());
    const wrapper = view();
    await flushPromises();

    expect(wrapper.text()).toContain("아직 검토 결과가 없습니다");
    expect(wrapper.find(".error").exists()).toBe(false);
  });

  it("버려진 지적 수를 알린다 — 왜 적게 나왔는지의 답이 된다", async () => {
    mockApi(
      baseRoutes({
        [`/api/v1/versions/${VERSION_ID}/responsibility-review`]: {
          body: { review: { id: "r1", versionId: VERSION_ID, status: "DONE", model: "stub", error: null, createdAt: "" }, findings: [], discardedCount: 2 },
        },
      })
    );
    const wrapper = view();
    await flushPromises();

    expect(wrapper.text()).toContain("2건");
  });

  it("검토 실행은 Version 경로로 보낸다 — 화면 단위가 아니다", async () => {
    const calls = mockApi(
      baseRoutes({ [`POST /api/v1/versions/${VERSION_ID}/usability-review`]: { body: EMPTY_REVIEW } })
    );
    const wrapper = view();
    await flushPromises();

    await wrapper.findAll("button").find((b) => b.text() === "UX 리스크 검토")!.trigger("click");
    await flushPromises();

    const posted = calls.find((c) => c.method === "POST" && c.url.includes("usability-review"));
    expect(posted?.url).toBe(`/api/v1/versions/${VERSION_ID}/usability-review`);
  });
});
