import { NextRequest, NextResponse } from 'next/server';
import { getDb, type ReferenceScreen } from '@/lib/db';
import { planScreens } from '@/lib/canvas/planScreens';
import { resolveDesignSystem } from '@/lib/canvas/designSystem';
import { v4 as uuidv4 } from 'uuid';

/**
 * 1단계: 기획안을 화면 흐름으로 쪼갠다.
 *
 * HTML은 만들지 않는다. 화면 행을 pending 상태로 만들어 두고,
 * 클라이언트가 화면마다 /api/screens/[screenId]/generate 를 호출해 채운다.
 * 서버가 한 요청에서 전부 만들면 타임아웃에 걸리고 부분 실패도 보이지 않는다.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { proposalContent, description, designSystemId } = await req.json();

    if (!proposalContent?.trim()) {
      return NextResponse.json({ error: '기획안 내용을 입력해주세요.' }, { status: 400 });
    }

    const db = getDb();

    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(id);
    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const refScreens = db
      .prepare('SELECT * FROM reference_screens WHERE project_id = ? ORDER BY created_at ASC')
      .all(id) as ReferenceScreen[];

    // 모르는 id는 registry의 default로 떨어진다. 옛 클라이언트가 값을 안 보내도 같은 경로다.
    const designSystem = resolveDesignSystem(designSystemId);

    const planned = await planScreens(proposalContent, refScreens, designSystem?.id);

    const lastVersion = db
      .prepare('SELECT MAX(version) as max_version FROM mockup_versions WHERE project_id = ?')
      .get(id) as { max_version: number | null };

    const version = (lastVersion.max_version ?? 0) + 1;
    const mockupId = uuidv4();

    db.transaction(() => {
      // html_content는 NOT NULL이다. 첫 화면이 만들어지면 그 HTML로 채워진다.
      db.prepare(
        `INSERT INTO mockup_versions (id, project_id, version, proposal_content, html_content, description, design_system_id)
         VALUES (?, ?, ?, ?, '', ?, ?)`
      ).run(
        mockupId,
        id,
        version,
        proposalContent.trim(),
        description?.trim() || null,
        designSystem?.id ?? null
      );

      const insert = db.prepare(
        `INSERT INTO screens (id, mockup_version_id, screen_key, name, role, sort_order, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
      );
      planned.forEach((screen, i) => {
        insert.run(uuidv4(), mockupId, screen.screenKey, screen.name, screen.role, i);
      });
    })();

    const screens = db
      .prepare('SELECT * FROM screens WHERE mockup_version_id = ? ORDER BY sort_order ASC')
      .all(mockupId);

    return NextResponse.json(
      { id: mockupId, version, screens, designSystemId: designSystem?.id ?? null },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : '화면 목록을 만들지 못했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
