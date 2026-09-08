import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * 의견의 해결 표시와 앵커 재부착.
 * 재생성으로 앵커가 끊긴(orphaned) 의견을 사용자가 요소를 다시 골라 붙일 때 쓴다.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { resolved, screenKey, nhId } = await req.json();
    const db = getDb();

    const comment = db
      .prepare('SELECT id, mockup_version_id FROM comments WHERE id = ?')
      .get(commentId) as { id: string; mockup_version_id: string } | undefined;
    if (!comment) return NextResponse.json({ error: '의견을 찾을 수 없습니다.' }, { status: 404 });

    if (typeof resolved === 'boolean') {
      db.prepare('UPDATE comments SET resolved_at = ? WHERE id = ?').run(
        resolved ? new Date().toISOString() : null,
        commentId
      );
    }

    if (screenKey && nhId) {
      const screen = db
        .prepare('SELECT id FROM screens WHERE mockup_version_id = ? AND screen_key = ?')
        .get(comment.mockup_version_id, screenKey) as { id: string } | undefined;
      if (!screen) return NextResponse.json({ error: '화면을 찾을 수 없습니다.' }, { status: 404 });

      const element = db
        .prepare('SELECT id FROM screen_elements WHERE screen_id = ? AND nh_id = ?')
        .get(screen.id, nhId) as { id: string } | undefined;
      if (!element) {
        return NextResponse.json({ error: '지목한 요소를 찾을 수 없습니다.' }, { status: 404 });
      }

      db.prepare(
        "UPDATE comments SET screen_id = ?, nh_id = ?, anchor_status = 'anchored' WHERE id = ?"
      ).run(screen.id, nhId, commentId);
    }

    const updated = db.prepare(`
      SELECT c.*, u.name as user_name, u.color as user_color, s.screen_key
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN screens s ON c.screen_id = s.id
      WHERE c.id = ?
    `).get(commentId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '의견 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const db = getDb();
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
  }
}
