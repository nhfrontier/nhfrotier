import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Screen } from '@/lib/db';
import { bakeScreenHtml } from '@/lib/canvas/patches';

/**
 * 화면 하나의 HTML을 "지금 보이는 그대로" 내려준다. 다운로드가 이걸 쓴다.
 *
 * 클라이언트가 `screens.html_content`를 그대로 받아쓰면 **편집이 빠진 파일**이 저장된다.
 * 편집은 원본을 덮어쓰지 않고 patch로 쌓이기 때문이다. 그래서 서버에서 얹어 내려준다.
 *
 * 파일로 저장되는 값이므로 텍스트로 보낸다. 정제는 저장 시점에 이미 끝났고
 * baking 단계에서 교체 조각을 한 번 더 통과시킨다.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { screenId } = await params;
    const db = getDb();

    const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(screenId) as
      | Screen
      | undefined;
    if (!screen?.html_content) {
      return NextResponse.json({ error: '화면을 찾을 수 없습니다.' }, { status: 404 });
    }

    const html = bakeScreenHtml(db, screen.id, screen.html_content);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // 브라우저가 이 HTML을 실행하지 않고 파일로만 다루게 한다.
        'Content-Disposition': `attachment; filename="${encodeURIComponent(screen.screen_key)}.html"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'HTML을 내보내지 못했습니다.' }, { status: 500 });
  }
}
