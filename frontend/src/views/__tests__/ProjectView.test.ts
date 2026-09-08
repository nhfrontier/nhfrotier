import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProjectView from "../ProjectView.vue";
import { installLocalStorage, mockApi } from "./helpers";

/**
 * 이 뷰에서 제가 낸 버그가 둘 있었다.
 *  - GET /projects/{id} 를 `Project` 로 가정했는데 실제는 `{project, myRole, members}` 다.
 *  - GET /projects/{id}/members 를 CursorPage 로 가정했는데 실제는 배열이다.
 * 둘 다 제목과 멤버가 통째로 안 나오는 결과였고, API 응답만 봐서는 티가 안 났다.
 * 여기서는 **실제 백엔드가 주는 모양** 그대로 두고 화면이 그것을 읽는지 본다.
 */
const PROJECT_ID = "p-1";

const DETAIL = {
  project: {
    id: PROJECT_ID,
    name: "퇴직연금 가입 화면",
    purpose: "신규 상품 안내",
    description: null,
    status: "ACTIVE",
    createdBy: "u-1",
    createdAt: "2026-09-08T00:00:00Z",
    updatedAt: null,
    lastActivityAt: "2026-09-08T01:00:00Z",
  },
  myRole: "OWNER",
  members: [
    { userId: "u-1", loginId: "kyj", name: "kyj", department: null, role: "OWNER", createdAt: "2026-09-08T00:00:00Z" },
  ],
};

const VERSIONS = {
  items: [
    {
      id: "v-1",
      projectId: PROJECT_ID,
      parentVersionId: null,
      versionNo: 1,
      sourceType: "AI_GENERATION",
      sourceJobId: null,
      designSystemId: null,
      proposal: "기획안",
      summary: "화면 2장",
      status: "DRAFT",
      createdBy: "u-1",
      createdByName: "kyj",
      createdAt: "2026-09-08T00:10:00Z",
      screenCount: 2,
      openFindingCount: 3,
    },
  ],
  nextCursor: null,
  hasMore: false,
};

const RouterLink = { props: ["to"], template: "<a><slot /></a>" };

function view() {
  return mount(ProjectView, {
    props: { projectId: PROJECT_ID },
    global: { stubs: { RouterLink } },
  });
}

beforeEach(() => installLocalStorage());
afterEach(() => vi.unstubAllGlobals());

describe("프로젝트 상세", () => {
  it("중첩된 응답에서 프로젝트를 꺼내 보여 준다", async () => {
    mockApi({
      [`/api/v1/projects/${PROJECT_ID}`]: { body: DETAIL },
      [`/api/v1/projects/${PROJECT_ID}/versions`]: { body: VERSIONS },
    });
    const wrapper = view();
    await flushPromises();

    expect(wrapper.text()).toContain("퇴직연금 가입 화면");
    expect(wrapper.text()).toContain("신규 상품 안내");
  });

  it("멤버와 내 권한을 상세 응답에서 읽는다", async () => {
    mockApi({
      [`/api/v1/projects/${PROJECT_ID}`]: { body: DETAIL },
      [`/api/v1/projects/${PROJECT_ID}/versions`]: { body: VERSIONS },
    });
    const wrapper = view();
    await flushPromises();

    expect(wrapper.text()).toContain("OWNER");
    expect(wrapper.text()).toContain("kyj");
  });

  it("멤버를 따로 부르지 않는다 — 상세 응답에 이미 있다", async () => {
    const calls = mockApi({
      [`/api/v1/projects/${PROJECT_ID}`]: { body: DETAIL },
      [`/api/v1/projects/${PROJECT_ID}/versions`]: { body: VERSIONS },
    });
    view();
    await flushPromises();

    expect(calls.some((c) => c.url.endsWith("/members"))).toBe(false);
  });

  it("버전 목록과 미처리 지적 수를 보여 준다", async () => {
    mockApi({
      [`/api/v1/projects/${PROJECT_ID}`]: { body: DETAIL },
      [`/api/v1/projects/${PROJECT_ID}/versions`]: { body: VERSIONS },
    });
    const wrapper = view();
    await flushPromises();

    expect(wrapper.text()).toContain("v1");
    expect(wrapper.text()).toContain("화면 2장");
    expect(wrapper.text()).toContain("미처리 지적 3건");
  });

  it("멤버가 아니면 403 메시지를 그대로 보여 준다", async () => {
    // 없는 것과 권한이 없는 것은 다르다. 사용자가 구분할 수 있어야 한다.
    mockApi({
      [`/api/v1/projects/${PROJECT_ID}`]: {
        status: 403,
        body: { code: "FORBIDDEN", message: "이 프로젝트에 접근할 수 없습니다.", traceId: null },
      },
    });
    const wrapper = view();
    await flushPromises();

    expect(wrapper.text()).toContain("이 프로젝트에 접근할 수 없습니다");
  });
});
