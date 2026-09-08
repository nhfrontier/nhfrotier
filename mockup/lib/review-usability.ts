import Anthropic from '@anthropic-ai/sdk';
import { LENS_IDS, buildLensInstruction, findLens } from './usability-lenses';
import { verifyQuotes } from './usability-evidence';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const USABILITY_MODEL = 'claude-opus-5';

/**
 * 입력 총량 상한. 넘으면 잘라내지 않고 거부한다 —
 * 잘린 뒷부분에 있던 팝업을 못 보면 "문제 없음"이라는 틀린 결과가 조용히 나온다.
 */
export const MAX_INPUT_CHARS = 300_000;

export class InputTooLargeError extends Error {}

/** FR-14의 Severity와 값은 같지만 모듈을 묶지 않기 위해 여기서 다시 선언한다 */
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceSource = 'PROPOSAL' | 'SCREEN' | 'DISCUSSION';

export interface ReviewScreen {
  screenKey: string;
  name: string;
  html: string;
}

export interface ReviewComment {
  /** 지적에서 "의견 #3"으로 되짚을 수 있게 매기는 번호 */
  no: number;
  author: string;
  createdAt: string;
  /** 요소를 지목한 의견이면 "화면 s02 / 요소 nh-14" 형태, 아니면 null */
  anchor: string | null;
  content: string;
}

export interface UsabilityInput {
  proposal: string;
  screens: ReviewScreen[];
  comments: ReviewComment[];
}

export interface UsabilityFinding {
  lens_id: string;
  severity: Severity;
  title: string;
  /** 원문 대조를 통과한 인용만 남긴 것. 개행으로 이어 붙인다. */
  evidence: string;
  evidence_source: EvidenceSource;
  why: string;
  suggestion: string;
}

const REPORT_TOOL: Anthropic.Tool = {
  name: 'report_usability_findings',
  description:
    'UX 리스크 검토 결과를 보고한다. 지적할 항목이 없으면 findings를 빈 배열로 보고한다.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['findings'],
    properties: {
      findings: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'lens_id',
            'severity',
            'title',
            'evidence_quotes',
            'evidence_source',
            'why',
            'suggestion',
          ],
          properties: {
            lens_id: { type: 'string', description: '렌즈 ID. 예: UR-01' },
            severity: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
            title: { type: 'string', description: '지적 내용 한 줄 (한국어)' },
            evidence_quotes: {
              type: 'array',
              minItems: 1,
              maxItems: 3,
              items: { type: 'string' },
              description:
                '기획안·화면 HTML·의견 원문에서 그대로 복사한 조각. 요약·의역은 서버 대조에서 탈락한다.',
            },
            evidence_source: {
              type: 'string',
              enum: ['PROPOSAL', 'SCREEN', 'DISCUSSION'],
              description: '인용의 주된 출처',
            },
            why: {
              type: 'string',
              description: '이 조합이 왜 사용자를 불편하게 하는지 (한국어, 2~3문장)',
            },
            suggestion: { type: 'string', description: '어떻게 하면 되는지 (한국어, 1~2문장)' },
          },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `당신은 농협은행 내부 화면 설계 논의에 참여하는 **UX 리스크 검토자**다.
전달받은 기획안·전 화면의 HTML 목업·의견 전문을 함께 읽고,
담당자들이 짚지 못한 사용성 문제를 찾아 report_usability_findings 도구로 보고한다.

## 이 검토의 성격

당신이 읽는 의견은 기획·개발·디자인 담당자가 각자의 관점으로 남긴 것이다.
**개별 의견은 대부분 타당하다.** 문제는 그것들이 합쳐졌을 때 생긴다.
예를 들어 서로 다른 의견에서 나온 팝업 네 개는 각각 필요해 보이지만,
사용자는 한 흐름에서 팝업을 네 번 닫아야 한다.

**요소 하나의 결함이 아니라 흐름 전체에 걸친 누적을 본다. 화면 한 장만 보고 판단하지 말 것.**
색 대비·대체 텍스트·기본 체크된 동의처럼 요소 하나로 답이 나오는 것은 다른 검토가 이미 맡고 있다.
여기서는 개수와 맥락이 문제인 것만 본다.

## 반드시 지킬 경계

1. **판정하지 않는다.** "잘못됐다", "나쁜 설계다" 같은 판정 표현을 쓰지 말 것.
   "이 결정들이 합쳐지면 이런 결과가 됩니다"까지만 말한다.
2. **특정 의견이나 작성자를 지목해 틀렸다고 말하지 않는다.** 당신은 사람의 의견을 반박하러 온 것이 아니라
   아무도 보지 않은 총합을 하나 더 얹으러 왔다.
3. **근거는 원문 그대로 복사한다.** evidence_quotes에는 기획안·화면 HTML·의견에 실제로 있는 문구를
   글자 그대로 옮겨 적는다. 요약하거나 바꿔 쓰면 서버 대조에서 탈락해 그 지적이 통째로 버려진다.
   그대로 옮길 것이 없으면 그 항목을 아예 보고하지 않는다.
4. **없는 것을 만들어내지 않는다.** 렌즈에 해당하는 것이 없으면 findings를 빈 배열로 보고한다.
   억지로 채우면 담당자가 전체를 신뢰하지 않게 되어 검토 자체가 무의미해진다.
5. **lens_id는 아래 목록에 있는 것만 쓴다.** 새 ID를 만들지 말 것.

## 심각도 기준

- HIGH: 그대로 만들어지면 상당수 사용자가 흐름을 끝내지 못하거나 중요한 정보를 놓치는 것
- MEDIUM: 불편하지만 사용자가 넘어갈 수 있는 것
- LOW: 개선하면 좋은 것

## 검토 렌즈

${buildLensInstruction()}

## 출력

반드시 report_usability_findings 도구를 호출해서 답한다. 도구 없이 텍스트로만 답하지 말 것.
title, why, suggestion은 한국어로 쓴다.`;

interface RawFinding {
  lens_id?: unknown;
  severity?: unknown;
  title?: unknown;
  evidence_quotes?: unknown;
  evidence_source?: unknown;
  why?: unknown;
  suggestion?: unknown;
}

const SEVERITIES: Severity[] = ['HIGH', 'MEDIUM', 'LOW'];
const SOURCES: EvidenceSource[] = ['PROPOSAL', 'SCREEN', 'DISCUSSION'];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function buildUserMessage(input: UsabilityInput): string {
  const screens = input.screens
    .map((s) => `### 화면 ${s.screenKey} — ${s.name}\n\n${s.html}`)
    .join('\n\n');

  const comments = input.comments.length
    ? input.comments
        .map(
          (c) =>
            `[의견 #${c.no}] ${c.author} · ${c.createdAt}${c.anchor ? ` · ${c.anchor}` : ''}\n${c.content}`
        )
        .join('\n\n')
    : '(아직 의견이 없다. 화면과 기획안만 보고 판단한다.)';

  return `아래는 기획안, 그 기획안으로 생성된 전 화면의 HTML 목업, 그리고 담당자들이 남긴 의견 전문이다.
셋을 함께 읽고 report_usability_findings를 호출하라.

## 기획안

${input.proposal}

## 생성된 화면 (전체)

${screens}

## 담당자 의견 (전체)

${comments}`;
}

/**
 * 모델 출력을 검증한다.
 *
 * FR-14(review-responsibility.ts)는 근거가 비어 있지 않은지만 본다.
 * 여기서는 한 단계 더 간다 — 렌즈가 규칙보다 느슨한 만큼 지어낸 근거가 통과할 여지가 크기 때문에,
 * 인용 조각이 원문에 글자 그대로 있는지 대조하고 하나도 맞지 않으면 그 지적을 통째로 버린다.
 */
function normalize(raw: RawFinding[], corpus: string): UsabilityFinding[] {
  const seen = new Set<string>();
  const out: UsabilityFinding[] = [];

  for (const item of raw) {
    if (!isNonEmptyString(item.lens_id) || !LENS_IDS.has(item.lens_id)) continue;
    if (!findLens(item.lens_id)) continue;
    if (
      !isNonEmptyString(item.title) ||
      !isNonEmptyString(item.why) ||
      !isNonEmptyString(item.suggestion)
    ) {
      continue;
    }
    // 살아남은 인용이 없으면 담당자가 검증할 수 없는 지적이다
    const verified = verifyQuotes(item.evidence_quotes, corpus);
    if (verified.length === 0) continue;

    const evidence = verified.join('\n');
    const key = `${item.lens_id}::${evidence}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      lens_id: item.lens_id,
      severity: SEVERITIES.includes(item.severity as Severity)
        ? (item.severity as Severity)
        : 'MEDIUM',
      title: item.title.trim(),
      evidence,
      evidence_source: SOURCES.includes(item.evidence_source as EvidenceSource)
        ? (item.evidence_source as EvidenceSource)
        : 'SCREEN',
      why: item.why.trim(),
      suggestion: item.suggestion.trim(),
    });
  }

  return out;
}

export async function reviewUsability(input: UsabilityInput): Promise<UsabilityFinding[]> {
  const userMessage = buildUserMessage(input);
  if (userMessage.length > MAX_INPUT_CHARS) {
    throw new InputTooLargeError('검토 대상이 한 번에 보낼 수 있는 크기를 넘었습니다.');
  }

  // 대조 코퍼스는 모델에게 보낸 것과 같은 원문이어야 한다
  const corpus = [
    input.proposal,
    ...input.screens.map((s) => s.html),
    ...input.comments.map((c) => c.content),
  ].join('\n');

  const stream = client.messages.stream({
    model: USABILITY_MODEL,
    max_tokens: 32000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    tools: [REPORT_TOOL],
    messages: [{ role: 'user', content: userMessage }],
  });

  const response = await stream.finalMessage();

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'report_usability_findings'
  );

  if (!toolUse) {
    throw new Error('AI가 검토 결과를 보고하지 못했습니다.');
  }

  const toolInput = toolUse.input as { findings?: unknown };
  if (!Array.isArray(toolInput.findings)) return [];

  return normalize(toolInput.findings as RawFinding[], corpus);
}
