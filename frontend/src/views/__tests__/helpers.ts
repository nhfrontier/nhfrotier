import { vi } from "vitest";

/**
 * 뷰 테스트용 가짜 서버.
 *
 * 여기 적는 응답은 **실제 백엔드가 주는 모양이어야 한다.** 이 파일이 정확해야
 * 테스트가 계약 위반을 잡는다. 백엔드 record 가 바뀌면 여기부터 고칠 것.
 * 근거: backend/src/main/java/com/nh/canvas 의 각 Controller·Repository record.
 */
export interface Route {
  method?: string;
  status?: number;
  body?: unknown;
}

export function mockApi(routes: Record<string, Route>) {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];

  vi.stubGlobal("fetch", (url: string, init: RequestInit = {}) => {
    const method = (init.method ?? "GET").toUpperCase();
    calls.push({ url, method, body: init.body ? JSON.parse(String(init.body)) : null });

    const key = `${method} ${url}`;
    const route = routes[key] ?? routes[url];
    if (!route) {
      // 정의하지 않은 호출은 조용히 200 을 주지 않는다. 뷰가 예상 밖 호출을 하면 드러나야 한다.
      return Promise.resolve(
        new Response(JSON.stringify({ code: "NOT_MOCKED", message: `정의되지 않은 호출: ${key}` }), {
          status: 599,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    return Promise.resolve(
      new Response(route.body === undefined ? null : JSON.stringify(route.body), {
        status: route.status ?? 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  return calls;
}

export function installLocalStorage(loginId = "kyj") {
  const store = new Map<string, string>([["nh.devLoginId", loginId]]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
}

/** 뷰가 onMounted 안에서 여러 번 await 한다. 마이크로태스크를 몇 번 흘려 보낸다. */
export async function settle(times = 6) {
  for (let i = 0; i < times; i += 1) await Promise.resolve();
}
