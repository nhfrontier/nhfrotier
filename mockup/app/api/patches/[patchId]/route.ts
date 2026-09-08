import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * 패치를 되돌린다.
 * 행을 지우지 않고 reverted_at만 채운다 — 누가 무엇을 왜 바꿨고 되돌렸는지가 남아야 한다.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ patchId: string }> }
) {
  try {
    const { patchId } = await params;
    const db = getDb();

    const patch = db.prepare('SELECT id FROM element_patches WHERE id = ?').get(patchId);
    if (!patch) return NextResponse.json({ error: '편집 내역을 찾을 수 없습니다.' }, { status: 404 });

    db.prepare('UPDATE element_patches SET reverted_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      patchId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '되돌리기에 실패했습니다.' }, { status: 500 });
  }
}
