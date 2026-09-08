import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GATE_COOKIE, gateToken, isTokenEqual } from '@/lib/gate';

const PUBLIC_PATHS = ['/gate', '/api/gate'];

export async function proxy(request: NextRequest) {
  const password = process.env.PREVIEW_ACCESS_PASSWORD;

  // 비밀번호를 걸지 않으면 로컬 개발은 그대로 통과시키되, 배포본은 절대 열어두지 않는다.
  if (!password) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    return new NextResponse('PREVIEW_ACCESS_PASSWORD가 설정되지 않았습니다.', { status: 503 });
  }

  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(GATE_COOKIE)?.value;
  if (cookie && isTokenEqual(cookie, await gateToken(password))) {
    return NextResponse.next();
  }

  // API를 리다이렉트하면 fetch가 HTML을 받아 파싱 오류로 둔갑한다. 상태코드로 끊는다.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 401 });
  }

  const gate = new URL('/gate', request.url);
  gate.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
