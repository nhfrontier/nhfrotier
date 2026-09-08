import type { ApiErrorBody } from "./types";

/**
 * 백엔드 호출 창구.
 *
 * 여기를 거치지 않고 fetch 를 직접 부르지 말 것 — 인증 헤더와 오류 정규화가 한 곳에 모여야
 * 화면마다 다르게 처리되는 것을 막을 수 있다.
 *
 * 브라우저는 LLM 을 직접 부르지 않는다. 모든 AI 호출은 백엔드의 AI Orchestrator 를 거친다
 * (ARCHITECTURE 2절). 이 파일에 LLM endpoint 나 credential 이 들어갈 일은 없다.
 */

const BASE = "/api/v1";

/** 서버가 내려준 오류를 그대로 담는다. 화면은 code 로 분기하고 message 를 보여준다. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly traceId: string | null
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** 재시도가 의미 있는 오류인가 (LLM·외부 연계 장애). */
  get retryable(): boolean {
    return this.status === 502 || this.status === 504 || this.status === 429;
  }
}

/**
 * 개발용 신원. AUTH_PROVIDER=dev 일 때 백엔드가 이 헤더를 그대로 믿는다.
 * 운영에서는 SSO 가 대신하므로 이 값은 보내지 않는다 — 인증 수단이 아니라 개발 편의다.
 */
const DEV_LOGIN_KEY = "nh.devLoginId";
const DEV_NAME_KEY = "nh.devName";

export function devIdentity(): { loginId: string; name: string } {
  return {
    loginId: localStorage.getItem(DEV_LOGIN_KEY) ?? "",
    name: localStorage.getItem(DEV_NAME_KEY) ?? "",
  };
}

export function setDevIdentity(loginId: string, name: string): void {
  localStorage.setItem(DEV_LOGIN_KEY, loginId);
  localStorage.setItem(DEV_NAME_KEY, name);
}

/** 헤더로 실어 보낼 수 있는 값인가. 한글 이름은 여기서 걸린다. */
export function isHeaderSafe(value: string): boolean {
  return !/[^\u0000-\u00ff]/.test(value);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const { loginId, name } = devIdentity();
  if (loginId) {
    headers.set("X-Dev-Login-Id", loginId);
    // HTTP 헤더에는 ISO-8859-1 밖 문자를 넣을 수 없다. 한글 이름을 그대로 넣으면
    // fetch 가 요청을 보내기도 전에 TypeError 를 던져 "서버에 연결할 수 없습니다" 로만 보인다.
    // 백엔드는 X-Dev-Name 이 없으면 loginId 를 이름으로 쓰므로, 보낼 수 없는 값은 보내지 않는다.
    if (name && isHeaderSafe(name)) headers.set("X-Dev-Name", name);
  }

  const response = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!response.ok) {
    throw new ApiError(response.status, ...(await readError(response)));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** 오류 본문이 JSON 이 아닐 수도 있다(프록시가 끼어든 경우). 그때도 화면이 죽지 않아야 한다. */
async function readError(response: Response): Promise<[string, string, string | null]> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return [body.code ?? "UNKNOWN", body.message ?? "요청을 처리하지 못했습니다.", body.traceId ?? null];
  } catch {
    // 본문이 JSON 이 아니면 백엔드가 아니라 프록시가 답한 것이다.
    // 첫 기동은 Flyway 때문에 수십 초 걸리고 그동안 502 가 난다. 원인을 짐작할 수 있게 적는다.
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return ["UPSTREAM_UNAVAILABLE", "서버가 기동 중이거나 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.", null];
    }
    return ["UNKNOWN", `요청을 처리하지 못했습니다. (HTTP ${response.status})`, null];
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
