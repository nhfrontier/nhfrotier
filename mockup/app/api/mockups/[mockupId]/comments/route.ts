import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mockupId: string }> }
) {
  try {
    const { mockupId } = await params;
    const db = await getDb();
    // screen_key를 함께 내려야 클라이언트가 어느 화면의 핀인지 알 수 있다.
    const comments = await db.prepare(`
      SELECT c.*, u.name as user_name, u.color as user_color, s.screen_key
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN screens s ON c.screen_id = s.id
      WHERE c.mockup_version_id = ?
      ORDER BY c.created_at ASC
    `).all(mockupId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '의견 목록을 불러올 수 없습니다.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mockupId: string }> }
) {
  try {
    const { mockupId } = await params;
    const { userId, content, screenKey, nhId, parentId } = await req.json();

    if (!userId) return NextResponse.json({ error: '사용자를 선택해주세요.' }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });

    const db = await getDb();

    const mockup = await db.prepare('SELECT id FROM mockup_versions WHERE id = ?').get(mockupId);
    if (!mockup) return NextResponse.json({ error: '목업을 찾을 수 없습니다.' }, { status: 404 });

    // 답글이면 뿌리를 검증한다. 스레드는 한 겹까지만 둔다 —
    // 답글의 답글을 허용하면 화면에서 들여쓰기가 계속 깊어지고, 어느 요소를 가리키는
    // 스레드인지도 흐려진다. 부모가 이미 답글이면 그 부모의 뿌리에 붙인다.
    let rootId: string | null = null;
    if (parentId) {
      const parent = (await db
        .prepare('SELECT id, mockup_version_id, parent_id FROM comments WHERE id = ?')
        .get(parentId)) as
        | { id: string; mockup_version_id: string; parent_id: string | null }
        | undefined;
      if (!parent || parent.mockup_version_id !== mockupId) {
        return NextResponse.json({ error: '답글을 달 의견을 찾을 수 없습니다.' }, { status: 404 });
      }
      rootId = parent.parent_id ?? parent.id;
    }

    // 요소를 지목한 의견이면 앵커를 검증한다.
    // 화면과 요소가 실제로 존재할 때만 앵커로 인정하고, 아니면 일반 의견으로 떨어뜨린다.
    //
    // 답글에는 앵커를 주지 않는다. 스레드가 가리키는 요소는 뿌리의 것이고,
    // 답글마다 앵커를 주면 같은 요소에 핀이 여러 개 겹친다.
    let screenId: string | null = null;
    let anchorNhId: string | null = null;

    if (!rootId && screenKey && nhId) {
      const screen = (await db
        .prepare('SELECT id FROM screens WHERE mockup_version_id = ? AND screen_key = ?')
        .get(mockupId, screenKey)) as { id: string } | undefined;

      if (!screen) {
        return NextResponse.json({ error: '화면을 찾을 수 없습니다.' }, { status: 404 });
      }

      const element = (await db
        .prepare('SELECT id FROM screen_elements WHERE screen_id = ? AND nh_id = ?')
        .get(screen.id, nhId)) as { id: string } | undefined;

      if (!element) {
        return NextResponse.json({ error: '지목한 요소를 찾을 수 없습니다.' }, { status: 404 });
      }

      screenId = screen.id;
      anchorNhId = nhId;
    }

    const commentId = uuidv4();
    await db.prepare(
      `INSERT INTO comments (id, mockup_version_id, user_id, content, screen_id, nh_id, anchor_status, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      commentId,
      mockupId,
      userId,
      content.trim(),
      screenId,
      anchorNhId,
      anchorNhId ? 'anchored' : 'none',
      rootId
    );

    // screen_key까지 실어 보낸다. 클라이언트가 곧바로 AI 편집을 이어 부를 때
    // 어느 화면의 어느 요소인지 다시 조회하지 않아도 되게 하기 위해서다.
    const comment = await db.prepare(`
      SELECT c.*, u.name as user_name, u.color as user_color, s.screen_key
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN screens s ON c.screen_id = s.id
      WHERE c.id = ?
    `).get(commentId);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '의견 작성에 실패했습니다.' }, { status: 500 });
  }
}
