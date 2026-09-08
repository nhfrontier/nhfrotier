import Anthropic from '@anthropic-ai/sdk';
import type { ReferenceScreen } from '../db';
import { buildGuardrailSection } from '../responsibility-rules';
import { buildDesignTokenSection, buildExampleScreensSection } from './designSystem';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCREEN_MODEL = 'claude-opus-5';

/**
 * 인라인 CSS를 포함한 화면 한 장이 8K 토큰을 쉽게 넘는다.
 * 큰 값은 스트리밍으로만 안전하다(논스트리밍은 HTTP 타임아웃에 걸린다).
 */
const SCREEN_MAX_TOKENS = 64000;

export interface ScreenContext {
  screenKey: string;
  name: string;
  role: string;
  /** 이 화면에서 갈 수 있는 화면들. data-goto 값으로 쓰인다. */
  linksTo: Array<{ screenKey: string; name: string }>;
}

function buildSystemPrompt(
  allScreens: Array<{ screenKey: string; name: string }>,
  designSystemId?: string | null
): string {
  const list = allScreens.map((s) => `- \`${s.screenKey}\` — ${s.name}`).join('\n');

  return `당신은 업무 화면 목업을 만드는 UI 디자이너다.
요청받은 화면 **한 장**을 완결된 HTML 문서로 만든다.

## 출력 형식

- \`<html>\`·\`<head>\`·\`<body>\`를 포함한 완전한 HTML 문서만 출력한다. 설명 문장을 덧붙이지 말 것.
- 스타일은 전부 인라인 \`style\` 속성 또는 \`<head>\`의 \`<style>\`로 넣는다. 외부 스타일시트 금지.
- **JavaScript를 쓰지 않는다.** 정적 목업이다.
- 외부 이미지·폰트·스크립트를 불러오지 않는다. 아이콘이 필요하면 인라인 SVG나 문자로 대신한다.
- 한국어 화면이다. 현실적인 더미 데이터를 넣는다.

## 화면 이동 (중요)

다른 화면으로 가는 버튼·링크·목록 항목에는 \`data-goto="화면key"\` 속성을 단다.
쓸 수 있는 화면key는 아래가 전부다. 여기 없는 값을 쓰면 그 링크는 버려진다.

${list}

자기 자신으로 가는 링크는 만들지 않는다.

## 요소 이름표 (선택)

의미가 분명한 주요 요소에는 \`data-nh-key="primary-cta"\`처럼 짧은 영문 이름표를 달아도 좋다.
협업자가 그 요소에 남긴 메모가 화면을 다시 만들어도 붙어 있게 하는 데 쓰인다. 없어도 무방하다.
${buildDesignTokenSection(designSystemId)}${buildExampleScreensSection(designSystemId)}${buildGuardrailSection()}`;
}

/**
 * 2단계: 화면 한 장의 HTML을 만든다.
 *
 * 화면마다 따로 호출하므로 토큰 한도에 걸리지 않고, 실패한 화면만 다시 만들 수 있다.
 * 시스템 프롬프트에 cache_control을 붙여, 화면을 연달아 만들 때 디자인 토큰 접두가 캐시 히트하게 한다.
 */
export async function generateScreenHtml(
  proposalContent: string,
  screen: ScreenContext,
  allScreens: Array<{ screenKey: string; name: string }>,
  referenceScreens: ReferenceScreen[],
  designSystemId?: string | null
): Promise<string> {
  const content: Anthropic.MessageParam['content'] = [];

  if (referenceScreens.length > 0) {
    content.push({
      type: 'text',
      text: `참고 화면 ${referenceScreens.length}장이다. 색·레이아웃·타이포·컴포넌트 스타일을 분석해 적용하라.`,
    });
    for (const ref of referenceScreens) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: ref.mime_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: ref.image_data,
        },
      });
    }
  }

  const links = screen.linksTo.length
    ? screen.linksTo.map((l) => `- \`${l.screenKey}\` (${l.name})`).join('\n')
    : '- (이 화면에서 이동할 곳 없음)';

  content.push({
    type: 'text',
    text: `## 전체 기획안

${proposalContent}

## 지금 만들 화면

이름: ${screen.name}
key: ${screen.screenKey}
역할: ${screen.role}

이 화면에서 이동할 수 있는 곳:
${links}

이 화면 한 장의 완전한 HTML 문서를 출력하라.`,
  });

  const stream = client.messages.stream({
    model: SCREEN_MODEL,
    max_tokens: SCREEN_MAX_TOKENS,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: buildSystemPrompt(allScreens, designSystemId),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content }],
  });

  const response = await stream.finalMessage();

  // 잘린 응답을 통과시키면 아래 폴백이 <html>로 감싸 겉보기 정상인 깨진 문서를 저장한다.
  if (response.stop_reason === 'max_tokens') {
    throw new Error('HTML이 너무 길어 생성이 중단되었습니다. 이 화면의 역할을 더 좁혀주세요.');
  }

  const textBlock = response.content.find((c) => c.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI가 응답을 생성하지 못했습니다.');
  }

  let html = textBlock.text;

  const fenced = html.match(/```html\n?([\s\S]*?)\n?```/);
  if (fenced) html = fenced[1];

  if (!html.trim().startsWith('<!DOCTYPE') && !html.trim().startsWith('<html')) {
    html = `<!DOCTYPE html>\n<html lang="ko">\n${html}\n</html>`;
  }

  return html;
}
