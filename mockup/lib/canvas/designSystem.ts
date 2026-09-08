import fs from 'fs';
import path from 'path';

/**
 * 디자인 시스템 레지스트리.
 *
 * 저장소 루트 design-systems/ 아래 폴더 하나가 디자인 시스템 하나다.
 * 선택지 정본은 registry.json이고, 각 시스템에서 읽는 것은
 * _ds_manifest.json의 tokens[]·templates[] 두 개뿐이다.
 *
 * naru-bank만 갖고 있는 tokens.json에는 의존하지 않는다 —
 * Claude Design export마다 있을 수도 없을 수도 있어서다.
 *
 * 주의: 자산의 실체는 design-systems/README.md를 볼 것.
 * naru-bank는 UI 라벨이 "올원뱅크"지만 실제로는 창작 브랜드(teal, 로고 없음)이고,
 * nh-ibz는 색만 실제 NH이며 로고·폰트·아이콘은 대체재다.
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

export function listTemplates(id?: string | null): string[] {
  const system = resolveDesignSystem(id);
  if (!system) return [];
  return (readManifest(system)?.templates ?? []).map((t) => t.name);
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
