import { createHash } from 'crypto';
import { parse, parseFragment, serialize, serializeOuter, type DefaultTreeAdapterTypes } from 'parse5';
import { EDITABLE_ATTRS, EDITABLE_STYLE_PROPS, type PatchOp } from './protocol';

type Element = DefaultTreeAdapterTypes.Element;
type ChildNode = DefaultTreeAdapterTypes.ChildNode;
type ParentNode = DefaultTreeAdapterTypes.ParentNode;
type TextNode = DefaultTreeAdapterTypes.TextNode;

/** 요소를 재생성 이후에도 다시 찾아내기 위한 지문. screen_elements에 그대로 적재된다. */
export interface ElementFingerprint {
  nhId: string;
  tag: string;
  docOrder: number;
  /** 조상 태그 + 동일 태그 형제 인덱스. 구조가 유지되면 살아남는다. */
  pathSig: string;
  /** 직계 텍스트를 정규화한 값. 텍스트가 없는 컨테이너는 null. */
  textSig: string | null;
}

export interface PipelineResult {
  /** 정제 + data-nh-id 부여가 끝난 HTML. DB에 저장되는 형태이며 script를 포함하지 않는다. */
  html: string;
  elements: ElementFingerprint[];
  /** 제거한 항목과 끊어진 화면 링크. 화면에 경고로 노출할 수 있다. */
  warnings: string[];
}

export interface PipelineOptions {
  /**
   * data-goto가 가리킬 수 있는 화면 key 목록.
   * 여기 없는 값은 제거된다 — AI가 존재하지 않는 화면을 가리켜
   * "눌러도 아무 일이 없는 버튼"을 만드는 일이 잦기 때문이다.
   */
  knownScreenKeys: string[];
}

/** 통째로 걷어내는 태그. 내용까지 함께 사라진다. */
const DROP_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'base', 'link', 'noscript',
  'template', 'applet', 'frame', 'frameset', 'foreignobject',
]);

/** 값이 URL로 해석되는 속성. 허용 형태가 아니면 속성을 지운다. */
const URL_ATTRS = new Set(['href', 'src', 'action', 'poster', 'background', 'data', 'srcset']);

/** 이름만으로 무조건 지우는 속성. on* 은 별도 정규식으로 함께 처리한다. */
const DROP_ATTRS = new Set([
  'srcdoc', 'ping', 'formaction', 'xlink:href',
  // AI가 붙인 식별자는 신뢰하지 않는다. 부여 권한은 이 파이프라인에만 있다.
  'data-nh-id',
]);

/** 주소를 지정할 이유가 없는 태그. ID를 부여하지 않는다. */
const NO_ID_TAGS = new Set([
  'html', 'head', 'meta', 'title', 'style', 'br', 'wbr', 'col', 'colgroup', 'source', 'track',
]);

const ALLOWED_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,/i;

function isElement(node: ChildNode | ParentNode): node is Element {
  return typeof (node as Element).tagName === 'string';
}

function childrenOf(node: ParentNode): ChildNode[] {
  return node.childNodes ?? [];
}

function getAttr(el: Element, name: string): string | null {
  const a = el.attrs.find((x) => x.name === name);
  return a ? a.value : null;
}

function setAttr(el: Element, name: string, value: string) {
  const a = el.attrs.find((x) => x.name === name);
  if (a) a.value = value;
  else el.attrs.push({ name, value });
}

/**
 * 공백을 접고 숫자열을 #으로 치환한다.
 * 목업의 더미 데이터(금액·건수·날짜)는 재생성마다 달라지므로
 * 숫자를 지워야 같은 요소가 같은 키를 갖는다. 예: "12,400P" -> "#P"
 */
function normalizeText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\d[\d,.\s]*/g, '#')
    .slice(0, 64);
}

/**
 * CSS 텍스트에서 외부 참조와 스크립트 실행 통로를 제거한다.
 * 선언 전체를 지우면 레이아웃이 무너지므로 값만 무력화한다.
 */
function sanitizeCss(css: string, warnings: string[]): string {
  const before = css;
  let out = css;

  out = out.replace(/@import[^;]*;?/gi, '');
  out = out.replace(/expression\s*\(/gi, 'void(');
  out = out.replace(/javascript\s*:/gi, '');
  // data:image 인라인만 남기고 나머지 url()은 none으로 바꾼다.
  out = out.replace(
    /url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi,
    (whole: string, _quote: string, url: string) =>
      ALLOWED_DATA_IMAGE.test(url.trim()) ? whole : 'none'
  );

  if (out !== before) {
    warnings.push('CSS에서 외부 리소스 참조 또는 실행 가능한 표현식을 제거했습니다.');
  }
  return out;
}

/** 1단계: 신뢰할 수 없는 것을 제거한다. 가장 먼저 돌아야 한다. */
function sanitize(node: ParentNode, warnings: string[]) {
  const kept: ChildNode[] = [];

  for (const child of childrenOf(node)) {
    // 주석은 남길 이유가 없고 조건부 주석이라는 통로만 만든다.
    if (child.nodeName === '#comment') continue;

    if (!isElement(child)) {
      kept.push(child);
      continue;
    }

    const tag = child.tagName.toLowerCase();

    if (DROP_TAGS.has(tag)) {
      warnings.push(`<${tag}> 요소를 제거했습니다.`);
      continue;
    }
    // <meta http-equiv="refresh"> 같은 지시는 제거하되 charset meta는 남긴다.
    if (tag === 'meta' && getAttr(child, 'http-equiv') !== null) {
      warnings.push('<meta http-equiv> 를 제거했습니다.');
      continue;
    }

    child.attrs = child.attrs.filter((attr) => {
      const name = attr.name.toLowerCase();

      if (name.startsWith('on')) {
        warnings.push(`인라인 이벤트 핸들러 ${attr.name} 를 제거했습니다.`);
        return false;
      }
      if (DROP_ATTRS.has(name)) return false;

      if (URL_ATTRS.has(name)) {
        const value = attr.value.trim();
        if (!value.startsWith('#') && !ALLOWED_DATA_IMAGE.test(value)) {
          warnings.push(`${name}="${value.slice(0, 40)}" 를 제거했습니다 (허용되지 않는 URL).`);
          return false;
        }
      }
      if (name === 'style') {
        attr.value = sanitizeCss(attr.value, warnings);
      }
      return true;
    });

    if (tag === 'style') {
      for (const textNode of childrenOf(child)) {
        if (textNode.nodeName === '#text') {
          const t = textNode as TextNode;
          t.value = sanitizeCss(t.value, warnings);
        }
      }
    }

    sanitize(child, warnings);
    kept.push(child);
  }

  node.childNodes = kept;
}

/** 2단계: 존재하지 않는 화면을 가리키는 data-goto를 끊는다. */
function normalizeGoto(root: ParentNode, knownScreenKeys: string[], warnings: string[]) {
  for (const child of childrenOf(root)) {
    if (!isElement(child)) continue;

    const target = getAttr(child, 'data-goto');
    if (target !== null && !knownScreenKeys.includes(target)) {
      warnings.push(`data-goto="${target}" 는 존재하지 않는 화면이라 제거했습니다.`);
      child.attrs = child.attrs.filter((a) => a.name !== 'data-goto');
    }

    normalizeGoto(child, knownScreenKeys, warnings);
  }
}

/** 직계 텍스트 자식만 모은다. 자손 텍스트까지 끌어오면 컨테이너끼리 지문이 충돌한다. */
function directText(el: Element): string {
  return childrenOf(el)
    .filter((c): c is TextNode => c.nodeName === '#text')
    .map((t) => t.value)
    .join('');
}

/** 3단계: 안정적인 식별자를 부여하고 지문을 수집한다. */
function assignIds(root: ParentNode, elements: ElementFingerprint[]) {
  const used = new Set<string>();
  let order = 0;

  const walk = (node: ParentNode, path: string) => {
    const sameTagCount = new Map<string, number>();

    for (const child of childrenOf(node)) {
      if (!isElement(child)) continue;

      const tag = child.tagName.toLowerCase();
      const index = sameTagCount.get(tag) ?? 0;
      sameTagCount.set(tag, index + 1);

      const pathSig = path ? `${path}>${tag}:${index}` : `${tag}:${index}`;

      if (!NO_ID_TAGS.has(tag)) {
        const text = normalizeText(directText(child));
        const textSig = text.length > 0 ? text : null;
        // AI가 의미 키를 달아줬으면 그게 가장 안정적이다. 없으면 텍스트, 그것도 없으면 구조.
        const semanticKey = getAttr(child, 'data-nh-key') ?? textSig ?? pathSig;
        const role = getAttr(child, 'role') ?? '';

        const base = createHash('sha1')
          .update(`${tag}|${role}|${semanticKey}`)
          .digest('hex')
          .slice(0, 8);

        let nhId = base;
        let dup = 1;
        while (used.has(nhId)) nhId = `${base}-${dup++}`;
        used.add(nhId);

        setAttr(child, 'data-nh-id', nhId);
        elements.push({ nhId, tag, docOrder: order++, pathSig, textSig });
      }

      walk(child, pathSig);
    }
  };

  walk(root, '');
}

/**
 * 생성된 HTML을 저장 가능한 형태로 만든다.
 * parse5 파싱 1회 안에서 정제 -> data-goto 검증 -> ID 부여를 순서대로 수행한다.
 * 순서가 중요하다: 정제가 먼저 돌아야 제거될 요소에 ID를 낭비하지 않는다.
 *
 * 런타임 스크립트는 여기서 주입하지 않는다. 저장본을 script-free로 유지해야
 * HTML 다운로드가 안전하고, 런타임을 고쳐도 DB를 다시 쓸 필요가 없다.
 */
export function processGeneratedHtml(raw: string, opts: PipelineOptions): PipelineResult {
  const warnings: string[] = [];
  const doc = parse(raw);

  sanitize(doc, warnings);
  normalizeGoto(doc, opts.knownScreenKeys, warnings);

  const elements: ElementFingerprint[] = [];
  assignIds(doc, elements);

  return { html: serialize(doc), elements, warnings: [...new Set(warnings)] };
}

/** 저장된 화면에서 요소 하나의 outerHTML을 꺼낸다. AI에게 "이걸 고쳐라"고 줄 때 쓴다. */
export function extractOuterHtml(html: string, nhId: string): string | null {
  const doc = parse(html);
  let found: Element | null = null;

  const walk = (node: ParentNode) => {
    for (const child of childrenOf(node)) {
      if (found) return;
      if (!isElement(child)) continue;
      if (getAttr(child, 'data-nh-id') === nhId) {
        found = child;
        return;
      }
      walk(child);
    }
  };
  walk(doc);

  return found ? serializeOuter(found) : null;
}

/**
 * AI가 돌려준 요소 조각을 정제한다.
 *
 * 전체 문서와 같은 규칙을 적용하되 문서 골격을 만들지 않는다.
 * data-nh-id는 여기서도 전부 지운다 — 교체된 요소의 식별자는 부모가 다시 붙인다.
 */
export function sanitizeFragment(
  raw: string,
  opts: PipelineOptions
): { html: string; warnings: string[] } {
  const warnings: string[] = [];
  const fragment = parseFragment(raw);

  sanitize(fragment, warnings);
  normalizeGoto(fragment, opts.knownScreenKeys, warnings);

  return { html: serialize(fragment), warnings: [...new Set(warnings)] };
}

/** 문서 전체에서 data-nh-id가 일치하는 첫 요소를 찾는다. */
function findByNhId(root: ParentNode, nhId: string): Element | null {
  for (const child of childrenOf(root)) {
    if (!isElement(child)) continue;
    if (getAttr(child, 'data-nh-id') === nhId) return child;
    const found = findByNhId(child, nhId);
    if (found) return found;
  }
  return null;
}

/**
 * style 속성 한 줄에 선언 하나를 덮어쓴다.
 *
 * **런타임에는 없는 위험이 여기 있다.** 프레임에서는 `el.style.setProperty(prop, value)`를
 * 쓰므로 브라우저가 값을 검사하고, 값 하나로 선언을 여러 개 만들 수 없다.
 * 반면 baking은 문자열을 이어 붙이므로 `red; background-image: url(...)` 같은 값이
 * 선언 두 개로 갈라진다. 다운로드한 HTML은 CSP 밖에서 열리므로 그대로 외부 요청이 된다.
 * 그래서 선언을 쪼갤 수 있는 문자가 섞인 값은 **적용하지 않고 버린다.**
 */
const UNSAFE_STYLE_VALUE = /[;{}<>]|url\s*\(|expression\s*\(|javascript:|@import/i;

function mergeStyleDeclaration(existing: string, prop: string, value: string): string | null {
  if (UNSAFE_STYLE_VALUE.test(value)) return null;

  const decls = new Map<string, string>();
  for (const part of existing.split(';')) {
    const colon = part.indexOf(':');
    if (colon < 0) continue;
    const key = part.slice(0, colon).trim().toLowerCase();
    if (key) decls.set(key, part.slice(colon + 1).trim());
  }
  decls.set(prop, value.trim());

  return [...decls].map(([k, v]) => `${k}: ${v}`).join('; ');
}

function replaceWithFragment(el: Element, html: string, warnings: string[]) {
  const parent = el.parentNode;
  if (!parent) return;
  const index = parent.childNodes.indexOf(el);
  if (index < 0) return;

  // 삽입 시점에 이미 정제된 값이지만 다시 한 번 통과시킨다.
  // 이 HTML은 DB에 있던 값이고, DB에 무엇이 들어 있든 나가는 것은 정제된 것이어야 한다.
  const fragment = parseFragment(html);
  sanitize(fragment, warnings);

  const incoming = [...fragment.childNodes];
  for (const node of incoming) node.parentNode = parent;
  parent.childNodes.splice(index, 1, ...incoming);
}

/**
 * 저장된 화면 HTML에 편집 패치를 실제로 반영한다("baking").
 *
 * 화면에 보이는 것은 프레임이 postMessage로 패치를 얹은 결과다. 하지만 HTML 다운로드,
 * AI 검토, 다음 버전 생성은 서버에서 저장본을 읽는다 — 이 함수가 없으면 그쪽은 전부
 * **편집 이전 상태**를 본다. 저장본(`screens.html_content`)은 그대로 두고 사본만 만든다.
 *
 * `lib/canvas/runtime.ts`의 `applyOp`와 같은 일을 parse5로 한다.
 * 둘이 어긋나면 화면과 산출물이 달라지므로 연산을 추가할 때는 양쪽을 함께 고쳐야 한다.
 * 다만 style만은 런타임보다 엄격하다(위 `mergeStyleDeclaration` 주석).
 */
export function applyPatchesToHtml(html: string, ops: PatchOp[]): { html: string; warnings: string[] } {
  if (ops.length === 0) return { html, warnings: [] };

  const warnings: string[] = [];
  const doc = parse(html);

  for (const op of ops) {
    // 교체(replace)가 지나가면 그 아래 요소는 사라지므로 매번 새로 찾는다.
    const el = findByNhId(doc, op.nhId);
    if (!el) {
      warnings.push(`편집 대상 요소를 찾지 못해 건너뜀: ${op.nhId}`);
      continue;
    }

    if (op.kind === 'text') {
      const text: TextNode = {
        nodeName: '#text',
        value: op.value,
        parentNode: el,
      } as TextNode;
      el.childNodes = [text];
      continue;
    }

    if (op.kind === 'style') {
      if (!EDITABLE_STYLE_PROPS.includes(op.prop)) continue;
      const merged = mergeStyleDeclaration(getAttr(el, 'style') ?? '', op.prop, op.value);
      if (merged === null) {
        warnings.push(`안전하지 않은 스타일 값이라 반영하지 않음: ${op.prop}`);
        continue;
      }
      setAttr(el, 'style', merged);
      continue;
    }

    if (op.kind === 'attr') {
      if (!EDITABLE_ATTRS.includes(op.name)) continue;
      setAttr(el, op.name, op.value);
      continue;
    }

    if (op.kind === 'replace') {
      replaceWithFragment(el, op.html, warnings);
    }
  }

  return { html: serialize(doc), warnings: [...new Set(warnings)] };
}
