import { NextRequest, NextResponse } from 'next/server';
import { getDb, type MockupVersion } from '@/lib/db';
import { ensureScreens } from '@/lib/canvas/screens';
import { listActivePatches, toPatchOps } from '@/lib/canvas/patches';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mockupId: string }> }
) {
  try {
    const { mockupId } = await params;
    const db = await getDb();
    const mockup = (await db
      .prepare('SELECT * FROM mockup_versions WHERE id = ?')
      .get(mockupId)) as MockupVersion | undefined;
    if (!mockup) {
      return NextResponse.json({ error: '목업을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 캔버스 이전에 만들어진 목업도 화면 배열 하나의 형태로 내려간다.
    // 덕분에 클라이언트에 legacy 분기가 없다.
    const screens = await Promise.all(
      (await ensureScreens(db, mockupId, mockup.html_content)).map(async (screen) => ({
        ...screen,
        // 편집은 html_content를 덮어쓰지 않고 patch로 쌓인다.
        // 클라이언트가 프레임에 postMessage로 적용하므로 여기서는 연산만 내려보낸다.
        patches: toPatchOps(await listActivePatches(db, screen.id)),
      }))
    );

    return NextResponse.json({ ...mockup, screens });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '목업을 불러올 수 없습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ mockupId: string }> }
) {
  try {
    const { mockupId } = await params;
    const db = await getDb();
    await db.prepare('DELETE FROM mockup_versions WHERE id = ?').run(mockupId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
  }
}
