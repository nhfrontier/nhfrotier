import { NextRequest, NextResponse } from 'next/server';
import { getDb, type MockupVersion, type ReferenceScreen, type Screen } from '@/lib/db';
import { generateScreenHtml } from '@/lib/canvas/generateScreen';
import { saveScreenHtml } from '@/lib/canvas/screens';

/**
 * 2단계: 화면 한 장의 HTML을 만들어 저장한다.
 *
 * 다시 호출하면 그대로 재시도다 — 실패한 화면만 골라 다시 만들 수 있다.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  const { screenId } = await params;
  const db = await getDb();

  const screen = await db.prepare('SELECT * FROM screens WHERE id = ?').get(screenId) as
    | Screen
    | undefined;
  if (!screen) return NextResponse.json({ error: '화면을 찾을 수 없습니다.' }, { status: 404 });

  const mockup = (await db
    .prepare('SELECT * FROM mockup_versions WHERE id = ?')
    .get(screen.mockup_version_id)) as MockupVersion | undefined;
  if (!mockup) return NextResponse.json({ error: '목업을 찾을 수 없습니다.' }, { status: 404 });

  const siblings = (await db
    .prepare('SELECT * FROM screens WHERE mockup_version_id = ? ORDER BY sort_order ASC')
    .all(screen.mockup_version_id)) as Screen[];

  const refScreens = (await db
    .prepare('SELECT * FROM reference_screens WHERE project_id = ? ORDER BY created_at ASC')
    .all(mockup.project_id)) as ReferenceScreen[];

  await db.prepare("UPDATE screens SET status = 'generating', error_message = NULL WHERE id = ?").run(
    screenId
  );

  try {
    const allScreens = siblings.map((s) => ({ screenKey: s.screen_key, name: s.name }));

    const rawHtml = await generateScreenHtml(
      mockup.proposal_content,
      {
        screenKey: screen.screen_key,
        name: screen.name,
        role: screen.role ?? '',
        // 갈 수 있는 곳은 자기 자신을 뺀 나머지 전부로 둔다.
        // 실제 링크는 AI가 고르고, 잘못된 값은 저장 시 정제 단계에서 끊긴다.
        linksTo: allScreens.filter((s) => s.screenKey !== screen.screen_key),
      },
      allScreens,
      refScreens,
      mockup.design_system_id
    );

    const saved = await db.transaction((tx) =>
      saveScreenHtml(tx, {
        mockupVersionId: screen.mockup_version_id,
        screenKey: screen.screen_key,
        name: screen.name,
        role: screen.role,
        sortOrder: screen.sort_order,
        rawHtml,
        knownScreenKeys: allScreens.map((s) => s.screenKey),
      })
    );

    // 첫 화면의 HTML은 mockup_versions.html_content에도 넣는다.
    // 그래야 기존 조회·HTML 다운로드가 캔버스를 몰라도 그대로 동작한다.
    if (screen.sort_order === 0) {
      await db.prepare('UPDATE mockup_versions SET html_content = ? WHERE id = ?').run(
        saved.html,
        screen.mockup_version_id
      );
    }

    const updated = await db.prepare('SELECT * FROM screens WHERE id = ?').get(screenId);
    return NextResponse.json({ screen: updated, warnings: saved.warnings });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : '화면을 만들지 못했습니다.';
    await db.prepare("UPDATE screens SET status = 'failed', error_message = ? WHERE id = ?").run(
      message,
      screenId
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
