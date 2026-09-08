import fs from 'fs';
import path from 'path';
import { sanitizeFragment } from './htmlPipeline';

/**
 * 디자인 시스템 레지스트리.
 *
 * 저장소 루트 design-systems/ 아래 폴더 하나가 디자인 시스템 하나다.
 * 선택지 정본은 registry.json이고, 각 시스템에서 읽는 것은 _ds_manifest.json의
 * tokens[]·templates[] 두 개다. templates[]는 이름만이 아니라 entryPath가 가리키는
 * 완성 화면 HTML 본문까지 읽어 생성 프롬프트의 예시로 넣는다.
 *
 * allone-bank만 갖고 있는 tokens.json에는 의존하지 않는다 —
 * Claude Design export마다 있을 수도 없을 수도 있어서다.
 *
 * 주의: 자산의 실체는 design-systems/README.md를 볼 것.
 * allone-bank는 올원뱅크에서 UX 패턴만 가져왔고 색(teal)·로고는 실제 CI가 아닌 대체재이며,
 * nh-ibz는 색만 실제 NH이고 로고·폰트·아이콘은 대체재다.
 */

export interface DesignSystemMeta {
  id: string;
  dir: string;
  label: string;
  surface: 'mobile' | 'web';
  /** 기준 캔버스 폭. 모바일은 '360x780', 웹은 '1200'처럼 적는다. */
  canvas: string;
  note: string;
}

interface ManifestToken {
  name: string;
  value: string;
  kind: string;
}

interface ManifestTemplate {
  name: string;
  entryPath: string;
  description?: string;
  folder?: string;
}

interface ManifestComponent {
  name: string;
}

interface Manifest {
  tokens?: ManifestToken[];
  templates?: ManifestTemplate[];
  components?: ManifestComponent[];
}

/** Template 화면 카드가 쓰는 값. 개수·스와치를 손으로 적지 않기 위해 매니페스트에서 뽑는다. */
export interface DesignSystemDetail extends DesignSystemMeta {
  swatches: string[];
  /** 썸네일 배경용 옅은 브랜드 색. */
  tint: string;
  tokenCount: number;
  componentCount: number;
  templateItems: { name: string; description: string; slug: string }[];
}

const ROOT = path.join(process.cwd(), '..', 'design-systems');

let registryCache: { systems: DesignSystemMeta[]; defaultId: string } | null | undefined;
const sectionCache = new Map<string, string>();
const exampleCache = new Map<string, string>();
const manifestCache = new Map<string, Manifest | null>();

function readRegistry() {
  if (registryCache === undefined) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry.json'), 'utf8'));
      registryCache = { systems: raw.systems ?? [], defaultId: raw.default ?? '' };
    } catch {
      // 레지스트리가 없어도 생성은 계속되어야 한다. 프롬프트에서 이 절만 빠진다.
      registryCache = null;
    }
  }
  return registryCache;
}

export function listDesignSystems(): DesignSystemMeta[] {
  return readRegistry()?.systems ?? [];
}

/** 모르는 id거나 비어 있으면 registry의 default로 떨어진다. */
export function resolveDesignSystem(id?: string | null): DesignSystemMeta | null {
  const registry = readRegistry();
  if (!registry) return null;
  return (
    registry.systems.find((s) => s.id === id) ??
    registry.systems.find((s) => s.id === registry.defaultId) ??
    null
  );
}

function readManifest(system: DesignSystemMeta): Manifest | null {
  const cached = manifestCache.get(system.id);
  if (cached !== undefined) return cached;

  let manifest: Manifest | null;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(ROOT, system.dir, '_ds_manifest.json'), 'utf8'));
  } catch {
    manifest = null;
  }
  manifestCache.set(system.id, manifest);
  return manifest;
}

const SWATCH_COUNT = 4;
/** 색 계열의 대표값으로 삼을 밝기 단계. 50~900 스케일에서 브랜드 색이 놓이는 자리다. */
const SWATCH_STEP = 500;
/** 자산을 못 읽었을 때 카드 배경으로 쓸 중립색. */
const FALLBACK_TINT = '#f1f5f9';

interface ColorEntry { value: string; step: number; }

/**
 * 색 토큰을 계열별로 묶는다.
 *
 * --nh-blue-500 과 --nh-blue-deep 은 같은 계열이다. 마지막 조각을 떼어 계열을 잡고,
 * 단계가 아닌 이름(-deep)은 정렬에서 뒤로 밀리도록 큰 수를 준다.
 * 다른 토큰을 가리키는 별칭(var(...))은 값을 알 수 없으므로 건너뛴다.
 */
function groupColorFamilies(tokens: ManifestToken[]): ColorEntry[][] {
  const families = new Map<string, ColorEntry[]>();

  for (const token of tokens) {
    if (token.kind !== 'color' || token.value.startsWith('var(')) continue;

    const cut = token.name.lastIndexOf('-');
    const family = cut > 1 ? token.name.slice(0, cut) : token.name;
    const parsed = Number(token.name.slice(cut + 1));
    const entry = { value: token.value, step: Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER };

    const list = families.get(family);
    if (list) list.push(entry);
    else families.set(family, [entry]);
  }

  return [...families.values()];
}

/**
 * 카드에 찍을 대표 색.
 *
 * 같은 계열의 명도 단계를 나란히 보여주면 팔레트가 아니라 그라데이션으로 읽히므로 계열마다 하나씩만 뽑는다.
 */
function pickSwatches(families: ColorEntry[][]): string[] {
  return families
    .slice(0, SWATCH_COUNT)
    .map((entries) => entries.reduce((a, b) => (Math.abs(b.step - SWATCH_STEP) < Math.abs(a.step - SWATCH_STEP) ? b : a)))
    .map((entry) => entry.value);
}

/**
 * 썸네일 배경으로 쓸 옅은 색. 첫 계열(브랜드 색)의 가장 밝은 단계다.
 *
 * 대표 색을 그대로 깔면 카드가 시끄러워지고, 중립 회색만 쓰면 어느 시스템인지 구분되지 않는다.
 */
function pickTint(families: ColorEntry[][]): string {
  const first = families[0];
  if (!first) return FALLBACK_TINT;
  return first.reduce((a, b) => (b.step < a.step ? b : a)).value;
}

/** templates/login → login. 정적 목업의 링크(?tpl=login)와 같은 값을 쓴다. */
function templateSlug(template: ManifestTemplate): string {
  const source = template.folder ?? template.entryPath ?? template.name;
  return source.split('/').filter(Boolean).pop() ?? template.name;
}

/**
 * Template 화면이 카드를 그리는 데 필요한 값 전부.
 *
 * 토큰·컴포넌트 개수와 대표 색을 화면에 손으로 적지 않기 위한 것이다.
 * 자산을 못 읽어도 메타데이터만으로 카드가 그려져야 하므로 빈 배열/0으로 떨어진다.
 */
export function describeDesignSystem(id?: string | null): DesignSystemDetail | null {
  const system = resolveDesignSystem(id);
  if (!system) return null;

  const manifest = readManifest(system);
  const tokens = manifest?.tokens ?? [];
  const families = groupColorFamilies(tokens);

  return {
    ...system,
    swatches: pickSwatches(families),
    tint: pickTint(families),
    tokenCount: tokens.length,
    componentCount: manifest?.components?.length ?? 0,
    templateItems: (manifest?.templates ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? '',
      slug: templateSlug(t),
    })),
  };
}

const SURFACE_RULES: Record<DesignSystemMeta['surface'], string> = {
  mobile:
    '모바일 앱 화면이다. 폰 한 대 안에 들어가는 세로 화면으로 만든다. 상단 앱바와 하단 내비게이션을 둔다.',
  web: '데스크톱 웹 화면이다. 콘텐츠를 중앙 정렬된 고정 폭 컬럼에 넣고, 상단 GNB를 둔다.',
};

/**
 * 화면 계획(1단계)에 쓰는 짧은 힌트. 토큰 전체는 필요 없고 표면만 알면 된다.
 * 모바일이면 폰 화면 흐름이, 웹이면 페이지 흐름이 나와야 하기 때문이다.
 */
export function buildSurfaceHint(id?: string | null): string {
  const system = resolveDesignSystem(id);
  if (!system) return '';

  return `

## 대상 화면 표면

${SURFACE_RULES[system.surface] ?? ''}
디자인 시스템: ${system.label} — ${system.note}`;
}

function formatTokens(tokens: ManifestToken[]): string {
  const byKind = new Map<string, ManifestToken[]>();
  for (const token of tokens) {
    const list = byKind.get(token.kind);
    if (list) list.push(token);
    else byKind.set(token.kind, [token]);
  }

  return [...byKind.entries()]
    .map(([kind, list]) => {
      const lines = list.map((t) => `${t.name}: ${t.value}`).join('\n');
      return `### ${kind}\n\n${lines}`;
    })
    .join('\n\n');
}

/**
 * 선택된 디자인 시스템의 토큰을 프롬프트에 넣을 텍스트로 만든다.
 *
 * 자산을 못 읽으면 빈 문자열을 반환한다 — 디자인 시스템이 없어도 화면 생성 자체는 계속되어야 한다.
 */
export function buildDesignTokenSection(id?: string | null): string {
  const system = resolveDesignSystem(id);
  if (!system) return '';

  const cached = sectionCache.get(system.id);
  if (cached !== undefined) return cached;

  const tokens = readManifest(system)?.tokens ?? [];
  const section = tokens.length
    ? `

## 디자인 시스템: ${system.label}

${system.note}
${SURFACE_RULES[system.surface] ?? ''}
기준 폭: ${system.canvas}

## 디자인 토큰 (반드시 이 값만 사용)

아래 목록에 있는 값만 쓴다. 여기 없는 hex 색상, radius, shadow를 지어내지 말 것.
CSS 변수를 쓸 수 없으므로(인라인 스타일만 허용) 값을 직접 적되, 반드시 아래 목록에 있는 값이어야 한다.

${formatTokens(tokens)}`
    : '';

  sectionCache.set(system.id, section);
  return section;
}

/** 완성 화면 예시가 프롬프트에서 차지할 수 있는 최대 길이. 넘으면 뒤쪽 화면을 버린다. */
const EXAMPLE_BUDGET = 60000;

/** 토큰 별칭이 다른 별칭을 가리킬 수 있다. 순환에 갇히지 않도록 상한을 둔다. */
const VAR_RESOLVE_DEPTH = 8;

/**
 * 예시 HTML의 var(--token)을 실제 값으로 바꾼다.
 *
 * 생성 프롬프트가 "CSS 변수를 쓸 수 없다"고 지시하므로 예시도 같은 형태여야 한다.
 * 예시에 var()가 남아 있으면 모델이 그대로 따라 하고, 프레임에는 그 변수를 정의한 곳이 없어 색이 통째로 빠진다.
 * --color-primary: var(--nh-blue-500) 같은 별칭이 있어 한 번으로 끝나지 않는다.
 */
function resolveCssVars(css: string, tokens: Map<string, string>): string {
  let out = css;

  for (let depth = 0; depth < VAR_RESOLVE_DEPTH && out.includes('var('); depth += 1) {
    const next = out.replace(
      /var\(\s*(--[\w-]+)\s*(?:,([^()]*))?\)/g,
      (whole: string, name: string, fallback?: string) => tokens.get(name) ?? fallback?.trim() ?? whole
    );
    // 더 줄어들지 않으면 남은 것은 해석할 수 없는 변수다. 원문 그대로 둔다.
    if (next === out) break;
    out = next;
  }

  return out;
}

/** Claude Design 캔버스 전용 문법. 표준 HTML이 아니라 모델이 흉내 내면 안 된다. */
function stripCanvasSyntax(html: string): string {
  return html
    .replace(/<helmet>[\s\S]*?<\/helmet>/gi, '')
    .replace(/\sstyle-hover="[^"]*"/gi, '');
}

/** <x-dc> 래퍼 안쪽만 꺼낸다. 없으면 <body>, 그것도 없으면 원문 그대로. */
function extractTemplateBody(html: string): string {
  const wrapped = html.match(/<x-dc[^>]*>([\s\S]*)<\/x-dc>/i);
  if (wrapped) return wrapped[1];

  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return body ? body[1] : html;
}

/**
 * 완성 화면 한 장을 프롬프트에 넣을 수 있는 형태로 읽는다.
 *
 * 저장소가 관리하는 자산이지만 정제를 거치지 않은 HTML을 프롬프트에 넣지 않는다.
 * 예시에 들어간 <script>·외부 URL은 생성 결과로 그대로 옮겨간다.
 */
function readTemplateHtml(
  system: DesignSystemMeta,
  template: ManifestTemplate,
  tokens: Map<string, string>
): string | null {
  try {
    const raw = fs.readFileSync(path.join(ROOT, system.dir, template.entryPath), 'utf8');
    const body = stripCanvasSyntax(extractTemplateBody(raw));
    const { html } = sanitizeFragment(resolveCssVars(body, tokens), { knownScreenKeys: [] });
    const trimmed = html.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * 선택된 디자인 시스템의 완성 화면을 프롬프트에 넣을 예시 절로 만든다.
 *
 * 사용자에게 참고 템플릿을 고르게 하는 대신 그 시스템의 완성 화면을 전부 넣는다.
 * 어느 예시가 지금 만들 화면에 가까운지는 모델이 판단한다.
 *
 * 자산을 못 읽으면 빈 문자열을 반환한다 — 예시가 없어도 화면 생성 자체는 계속되어야 한다.
 */
export function buildExampleScreensSection(id?: string | null): string {
  const system = resolveDesignSystem(id);
  if (!system) return '';

  const cached = exampleCache.get(system.id);
  if (cached !== undefined) return cached;

  const manifest = readManifest(system);
  // 토큰 값이 style="..." 안으로 들어가므로 큰따옴표를 남기면 속성이 그 자리에서 끊긴다.
  // --font-sans: "Noto Sans KR", ... 가 실제로 그렇다. CSS는 두 따옴표를 같게 보므로 작은따옴표로 바꿔 넣는다.
  const tokens = new Map((manifest?.tokens ?? []).map((t) => [t.name, t.value.replace(/"/g, "'")]));

  const blocks: string[] = [];
  const skipped: string[] = [];
  let used = 0;

  for (const template of manifest?.templates ?? []) {
    const html = readTemplateHtml(system, template, tokens);
    if (html === null || used + html.length > EXAMPLE_BUDGET) {
      skipped.push(template.name);
      continue;
    }

    used += html.length;
    // 이름과 설명을 한 줄에 붙이면 설명 안의 —와 겹쳐 읽기 어렵다.
    const caption = template.description ? `\n${template.description}\n` : '';
    blocks.push(`### ${template.name}\n${caption}\n\`\`\`html\n${html}\n\`\`\``);
  }

  const note = skipped.length ? `\n\n(불러오지 못해 제외한 예시: ${skipped.join(', ')})` : '';
  const section = blocks.length
    ? `

## 이 디자인 시스템의 완성 화면 예시

아래는 실제로 이 디자인 시스템으로 만든 화면들이다.
여백·타이포 위계·컴포넌트 조립 방식을 이 예시에 맞춘다.

**내용을 베끼지 말 것.** 문구·데이터·화면 목적은 기획안을 따른다. 가져올 것은 짜임새뿐이다.
지금 만들 화면과 가장 가까운 예시를 골라 참고하되, 해당하는 예시가 없으면 공통 규칙만 따른다.

${blocks.join('\n\n')}${note}`
    : '';

  exampleCache.set(system.id, section);
  return section;
}
