import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { insertPatch, listActivePatches, validatePatch } from '@/lib/canvas/patches';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { screenId } = await params;
    const db = await getDb();
    return NextResponse.json(await listActivePatches(db, screenId));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '편집 이력을 불러올 수 없습니다.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { screenId } = await params;
    const { userId, nhId, op, payload, reason } = await req.json();

    if (!userId) return NextResponse.json({ error: '사용자를 선택해주세요.' }, { status: 400 });
    if (!nhId) return NextResponse.json({ error: '수정할 요소를 지정해주세요.' }, { status: 400 });

    const db = await getDb();

    const screen = await db.prepare('SELECT id FROM screens WHERE id = ?').get(screenId);
    if (!screen) return NextResponse.json({ error: '화면을 찾을 수 없습니다.' }, { status: 404 });

    // 존재하지 않는 요소에 패치를 남기면 되돌릴 방법 없이 쌓이기만 한다.
    const element = await db
      .prepare('SELECT id FROM screen_elements WHERE screen_id = ? AND nh_id = ?')
      .get(screenId, nhId);
    if (!element) {
      return NextResponse.json({ error: '수정할 요소를 찾을 수 없습니다.' }, { status: 404 });
    }

    const input = {
      screenId,
      nhId,
      userId,
      op,
      payload: (payload ?? {}) as Record<string, unknown>,
      reason: reason ?? null,
    };

    const invalid = validatePatch(input);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    return NextResponse.json(await insertPatch(db, uuidv4(), input), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '수정 내용을 저장하지 못했습니다.' }, { status: 500 });
  }
}
