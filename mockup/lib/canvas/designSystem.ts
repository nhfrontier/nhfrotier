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
}

interface Manifest {
  tokens?: ManifestToken[];
  templates?: ManifestTemplate[];
}

const ROOT = path.join(process.cwd(), '..', 'design-systems');

let registryCache: { systems: DesignSystemMeta[]; defaultId: string } | null | undefined;
const sectionCache = new Map<string, string>();

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
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, system.dir, '_ds_manifest.json'), 'utf8'));
  } catch {
    return null;
  }
}

export function listTemplates(id?: string | null): string[] {
  const system = resolveDesignSystem(id);
  if (!system) return [];
  return (readManifest(system)?.templates ?? []).map((t) => t.name);
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
