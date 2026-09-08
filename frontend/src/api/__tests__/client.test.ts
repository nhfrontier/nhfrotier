import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, isHeaderSafe, setDevIdentity } from "../client";

/** localStorage 는 Node 에 없다. 브라우저 것을 흉내 내는 최소 구현으로 대신한다. */
function installLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
}

function respond(body: unknown, init: ResponseInit = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

let calls: Array<{ url: string; init: RequestInit }>;

beforeEach(() => {
  installLocalStorage();
  calls = [];
});

afterEach(() => vi.unstubAllGlobals());

function mockFetch(response: Response) {
  vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(response);
  });
}

describe("dev 신원 헤더", () => {
  it("로그인 ID 를 헤더로 보낸다", async () => {
    setDevIdentity("kyj", "kyj");
    mockFetch(respond({ ok: 1 }));
    await api.get("/me");
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get("X-Dev-Login-Id")).toBe("kyj");
  });

  it("한글 이름은 헤더에 싣지 않는다", async () => {
    // HTTP 헤더는 ISO-8859-1 만 담는다. 실으면 fetch 가 요청 전에 TypeError 를 던져
    // "서버에 연결할 수 없습니다" 로만 보인다. 한글 이름을 쓰는 사용자 전원이 막힌다.
    setDevIdentity("kyj", "김영준");
    mockFetch(respond({ ok: 1 }));
    await api.get("/me");
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get("X-Dev-Name")).toBeNull();
    expect(headers.get("X-Dev-Login-Id")).toBe("kyj");
  });

  it("ASCII 이름은 그대로 보낸다", async () => {
    setDevIdentity("kyj", "Lucas");
    mockFetch(respond({ ok: 1 }));
    await api.get("/me");
    expect(new Headers(calls[0].init.headers).get("X-Dev-Name")).toBe("Lucas");
  });

  it("로그인 ID 가 없으면 신원 헤더를 아예 붙이지 않는다", async () => {
    mockFetch(respond({ ok: 1 }));
    await api.get("/me");
    expect(new Headers(calls[0].init.headers).get("X-Dev-Login-Id")).toBeNull();
  });
});

describe("isHeaderSafe", () => {
  it.each(["kyj", "Lucas", "a-b_c.1"])("통과: %s", (v) => expect(isHeaderSafe(v)).toBe(true));
  it.each(["김영준", "日本語", "emoji 🙂"])("차단: %s", (v) => expect(isHeaderSafe(v)).toBe(false));
});

describe("오류 정규화", () => {
  it("서버가 준 code·message 를 그대로 옮긴다", async () => {
    mockFetch(respond({ code: "FORBIDDEN", message: "권한이 없습니다.", traceId: "t1" }, { status: 403 }));
    await expect(api.get("/projects")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "권한이 없습니다.",
      traceId: "t1",
    });
  });

  it("기동 중 502 는 프록시가 답한 것이라 본문이 JSON 이 아니다 — 재시도 안내로 바꾼다", async () => {
    mockFetch(new Response("<html>502</html>", { status: 502 }));
    const error = await api.get("/me").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("UPSTREAM_UNAVAILABLE");
    expect((error as ApiError).message).toContain("잠시 후");
  });

  it("LLM·프록시 장애는 재시도 가능으로 분류한다", async () => {
    for (const status of [502, 504, 429]) {
      mockFetch(new Response("x", { status }));
      const error = (await api.get("/me").catch((e: unknown) => e)) as ApiError;
      expect(error.retryable).toBe(true);
    }
  });

  it("업무 규칙 위반(422)은 재시도해도 소용없다", async () => {
    mockFetch(respond({ code: "RULE_VIOLATION", message: "안 됩니다." }, { status: 422 }));
    const error = (await api.get("/me").catch((e: unknown) => e)) as ApiError;
    expect(error.retryable).toBe(false);
  });

  it("204 는 본문을 파싱하지 않는다", async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(api.delete("/comments/1")).resolves.toBeUndefined();
  });
});
