/**
 * 공유 비밀번호 게이트.
 *
 * 프로토타입을 임시 공개 URL(Vercel Hobby는 production 도메인을 보호할 수 없다)에 올릴 때
 * ANTHROPIC_API_KEY가 붙은 /api 경로가 그대로 열리는 것을 막는 차단막이다.
 * 사용자별 인증이 아니므로 운영 코드로 이식하지 않는다. docs/guidelines/SECURITY_CHECKLIST.md 6절 참고.
 */

export const GATE_COOKIE = 'nh_gate';

/** 비밀번호 원문을 쿠키에 담지 않기 위한 파생값. Web Crypto라 Edge/Node 런타임 양쪽에서 동작한다. */
export async function gateToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`nh-gate:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isTokenEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
