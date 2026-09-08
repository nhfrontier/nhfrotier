import { NextRequest, NextResponse } from 'next/server';
import { GATE_COOKIE, gateToken, isTokenEqual } from '@/lib/gate';

const MAX_AGE_SECONDS = 60 * 60 * 12;

/** 오픈 리다이렉트 방지 — 같은 사이트의 절대경로만 허용한다. */
function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === 'string' ? value : '';
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
}

export async function POST(req: NextRequest) {
  try {
    const password = process.env.PREVIEW_ACCESS_PASSWORD;
    if (!password) {
      return NextResponse.json({ error: '게이트가 설정되지 않았습니다.' }, { status: 503 });
    }

    const form = await req.formData();
    const next = safeNext(form.get('next'));
    const input = form.get('password');

    if (typeof input !== 'string' || !isTokenEqual(await gateToken(input), await gateToken(password))) {
      const retry = new URL('/gate', req.url);
      retry.searchParams.set('next', next);
      retry.searchParams.set('error', '1');
      return NextResponse.redirect(retry, { status: 303 });
    }

    const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
    res.cookies.set(GATE_COOKIE, await gateToken(password), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    });
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '인증에 실패했습니다.' }, { status: 500 });
  }
}
