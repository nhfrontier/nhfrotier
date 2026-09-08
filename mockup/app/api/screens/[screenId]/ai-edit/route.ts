import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb, type Screen } from '@/lib/db';
import { extractOuterHtml, sanitizeFragment } from '@/lib/canvas/htmlPipeline';
import { insertPatch } from '@/lib/canvas/patches';
import { buildDesignTokenSection } from '@/lib/canvas/designSystem';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** 디자인 토큰 절이 버전마다 다르므로 상수가 아니라 함수다. */
function buildSystem(designSystemId?: string | null): string {
  return `당신은 HTML 목업의 한 요소만 고치는 편집자다.

## 규칙

- 요청받은 **요소 하나만** 다시 만든다. 주변 요소나 문서 전체를 만들지 않는다.
- 출력은 요소 하나의 HTML뿐이다. 설명 문장, 코드펜스, 주변 태그를 붙이지 말 것.
- 원래 요소의 태그를 바꿔도 되지만, 하나의 요소로만 감싸서 돌려준다.
- 스타일은 인라인 style 속성으로 넣는다. class는 원본 문서의 CSS를 모르므로 새로 만들지 말 것.
- JavaScript, 외부 이미지·폰트·스크립트를 쓰지 않는다.
- data-goto 속성이 원본에 있었고 여전히 의미가 있으면 유지한다.
${buildDesignTokenSection(designSystemId)}`;
}

/**
 * 선택한 요소만 AI에게 다시 만들게 한다.
 *
 * 요소의 outerHTML만 보내므로 토큰이 적게 들고, 결과도 그 요소로 한정된다.
 * 돌려받은 조각은 저장 전에 정제하고, 원본 HTML을 덮어쓰지 않고 patch로 쌓는다.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const { screenId } = await params;
    const { userId, nhId, prompt, commentId } = await req.json();

    if (!userId) return NextResponse.json({ error: '사용자를 선택해주세요.' }, { status: 400 });
    if (!nhId) return NextResponse.json({ error: '수정할 요소를 지정해주세요.' }, { status: 400 });
    if (!prompt?.trim()) {
      return NextResponse.json({ error: '어떻게 바꿀지 입력해주세요.' }, { status: 400 });
    }

    const db = getDb();

    const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(screenId) as
      | Screen
      | undefined;
    if (!screen?.html_content) {
      return NextResponse.json({ error: '화면을 찾을 수 없습니다.' }, { status: 404 });
    }

    const original = extractOuterHtml(screen.html_content, nhId);
    if (!original) {
      return NextResponse.json({ error: '수정할 요소를 찾을 수 없습니다.' }, { status: 404 });
    }

    const siblings = db
      .prepare('SELECT screen_key FROM screens WHERE mockup_version_id = ?')
      .all(screen.mockup_version_id) as Array<{ screen_key: string }>;

    // 편집 결과가 원래 화면과 다른 팔레트로 나오지 않도록, 이 버전을 만든 디자인 시스템을 그대로 쓴다.
    const version = db
      .prepare('SELECT design_system_id FROM mockup_versions WHERE id = ?')
      .get(screen.mockup_version_id) as { design_system_id: string | null } | undefined;

    const stream = client.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: buildSystem(version?.design_system_id),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `## 원본 요소

\`\`\`html
${original}
\`\`\`

## 요청

${prompt.trim()}

이 요소를 고쳐서 HTML 하나만 출력하라.`,
        },
      ],
    });

    const response = await stream.finalMessage();
    if (response.stop_reason === 'max_tokens') {
      return NextResponse.json(
        { error: '응답이 너무 길어 중단되었습니다. 요청을 더 좁혀주세요.' },
        { status: 502 }
      );
    }

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI가 응답을 생성하지 못했습니다.' }, { status: 502 });
    }

    let raw = textBlock.text.trim();
    const fenced = raw.match(/```(?:html)?\n?([\s\S]*?)\n?```/);
    if (fenced) raw = fenced[1];

    // AI 출력은 신뢰할 수 없는 입력이다. 프레임에 보내기 전에 반드시 정제한다.
    const { html, warnings } = sanitizeFragment(raw, {
      knownScreenKeys: siblings.map((s) => s.screen_key),
    });

    if (!html.trim()) {
      return NextResponse.json({ error: 'AI가 빈 결과를 내놓았습니다.' }, { status: 502 });
    }

    // 의견에서 부른 편집이면 그 의견을 함께 기록한다.
    // 존재하지 않는 id가 오면 링크만 버리고 편집은 살린다 — 이미 모델 호출을 마쳤고,
    // 스레드에 붙지 않는 것이 편집 자체를 잃는 것보다 낫다.
    const linkedComment =
      typeof commentId === 'string' && commentId
        ? (db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId) as
            | { id: string }
            | undefined)
        : undefined;

    const patch = insertPatch(db, uuidv4(), {
      screenId,
      nhId,
      userId,
      op: 'aiRewrite',
      payload: { html },
      reason: prompt.trim(),
      source: 'ai',
      commentId: linkedComment?.id ?? null,
    });

    return NextResponse.json({ patch, html, warnings }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : '요소를 다시 만들지 못했습니다.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
