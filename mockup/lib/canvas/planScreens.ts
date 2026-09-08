import Anthropic from '@anthropic-ai/sdk';
import type { ReferenceScreen } from '../db';
import { buildSurfaceHint } from './designSystem';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** 화면 HTML 생성과 같은 모델을 쓴다. lib/generate.ts의 GENERATE_MODEL과 맞춘다. */
const PLAN_MODEL = 'claude-opus-5';

export interface PlannedScreen {
  /** data-goto가 가리키는 값. 영문 소문자·숫자·하이픈만. */
  screenKey: string;
  name: string;
  /** 이 화면이 무슨 일을 하는지 한 줄. 2단계 생성 프롬프트에 그대로 들어간다. */
  role: string;
  /** 이 화면에서 갈 수 있는 다른 화면들. */
  linksTo: string[];
}

const PLAN_TOOL: Anthropic.Tool = {
  name: 'report_screen_plan',
  description: '기획안을 화면 흐름으로 쪼개어 보고한다.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['screens'],
    properties: {
      screens: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['screenKey', 'name', 'role', 'linksTo'],
          properties: {
            screenKey: {
              type: 'string',
              description: '영문 소문자·숫자·하이픈만. 예: home, account-detail, transfer-confirm',
            },
            name: { type: 'string', description: '화면 이름 (한국어, 10자 이내)' },
            role: {
              type: 'string',
              description: '이 화면이 하는 일과 담아야 할 내용 (한국어, 2~3문장)',
            },
            linksTo: {
              type: 'array',
              description: '이 화면에서 이동할 수 있는 다른 화면의 screenKey 목록',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const PLAN_SYSTEM = `당신은 업무 화면 설계자다.
전달받은 기획안을 읽고, 사용자가 실제로 거치게 될 **화면들의 흐름**으로 쪼갠 뒤 report_screen_plan 도구로 보고한다.

## 규칙

- 화면은 **3~6개**로 만든다. 억지로 늘리지 말고, 기획안이 한 화면이면 1개로 보고한다.
- 첫 번째 화면이 진입 화면이다. 사용자가 처음 보는 것을 맨 앞에 둔다.
- linksTo에는 **반드시 같은 목록 안에 있는 screenKey만** 넣는다. 없는 화면을 가리키면 그 링크는 버려진다.
- 흐름이 이어지게 만든다. 어디서도 갈 수 없는 고아 화면을 만들지 말 것.
- screenKey는 영문 소문자·숫자·하이픈만 쓴다. 한글·공백·대문자 금지.
- role에는 그 화면에 무엇이 보여야 하는지를 적는다. 디자인 지시가 아니라 **내용**을 적는다.

## 하지 말 것

- 기획안에 없는 기능을 지어내지 말 것.
- 로그인·설정처럼 기획안이 요구하지 않은 곁가지 화면을 끼워 넣지 말 것.`;

/** screenKey 규칙을 코드로도 강제한다. AI 출력은 검증 없이 신뢰하지 않는다. */
const SCREEN_KEY_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * 1단계: 화면 목록과 전환 관계만 만든다.
 *
 * HTML을 만들지 않으므로 응답이 짧고 빠르다. 화면별 HTML은 2단계에서 따로 생성한다.
 * 이렇게 나눠야 토큰 한도에 걸리지 않고, 실패한 화면만 다시 만들 수 있다.
 */
export async function planScreens(
  proposalContent: string,
  referenceScreens: ReferenceScreen[],
  designSystemId?: string | null
): Promise<PlannedScreen[]> {
  const content: Anthropic.MessageParam['content'] = [];

  if (referenceScreens.length > 0) {
    content.push({
      type: 'text',
      text: `참고 화면 ${referenceScreens.length}장이 있다. 기존 시스템의 화면 구성을 참고하라.`,
    });
    for (const screen of referenceScreens) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: screen.mime_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: screen.image_data,
        },
      });
    }
  }

  content.push({
    type: 'text',
    text: `아래 기획안을 화면 흐름으로 쪼개어 report_screen_plan으로 보고하라.

---
${proposalContent}
---`,
  });

  const stream = client.messages.stream({
    model: PLAN_MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: PLAN_SYSTEM + buildSurfaceHint(designSystemId),
    tools: [PLAN_TOOL],
    messages: [{ role: 'user', content }],
  });

  const response = await stream.finalMessage();

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'report_screen_plan'
  );
  if (!toolUse) throw new Error('AI가 화면 목록을 만들지 못했습니다.');

  const raw = (toolUse.input as { screens?: unknown }).screens;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('AI가 화면을 하나도 만들지 못했습니다.');
  }

  return normalize(raw as PlannedScreen[]);
}

/**
 * AI 출력을 쓸 수 있는 형태로 정리한다.
 * 규칙에 맞지 않는 key는 버리고, 존재하지 않는 화면을 가리키는 링크도 끊는다.
 */
function normalize(raw: PlannedScreen[]): PlannedScreen[] {
  const seen = new Set<string>();
  const screens: PlannedScreen[] = [];

  for (const item of raw) {
    const key = String(item?.screenKey ?? '').trim().toLowerCase();
    if (!SCREEN_KEY_RE.test(key) || seen.has(key)) continue;
    seen.add(key);

    screens.push({
      screenKey: key,
      name: String(item?.name ?? key).trim().slice(0, 30) || key,
      role: String(item?.role ?? '').trim().slice(0, 500),
      linksTo: Array.isArray(item?.linksTo) ? item.linksTo.map((k) => String(k).trim().toLowerCase()) : [],
    });
  }

  if (screens.length === 0) throw new Error('쓸 수 있는 화면이 없습니다. 기획안을 더 구체적으로 적어주세요.');

  // 존재하지 않는 화면으로 가는 링크는 여기서 끊는다. 남겨두면 눌러도 반응 없는 버튼이 된다.
  const valid = new Set(screens.map((s) => s.screenKey));
  for (const screen of screens) {
    screen.linksTo = [...new Set(screen.linksTo.filter((k) => valid.has(k) && k !== screen.screenKey))];
  }

  return screens.slice(0, 8);
}
