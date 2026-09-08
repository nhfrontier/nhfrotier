#!/usr/bin/env node
/**
 * 농협 공식 CI 래스터 원본(JPG)에서 벡터 SVG 를 유도한다.
 *
 * 왜 스크립트인가 — 산출물이 손으로 그린 것이 아니라 원본에서 기계적으로 나온 것임을
 * 증명할 수 있고, 정밀도를 올리거나 원본이 갱신될 때 다시 돌리면 되기 때문이다.
 * 로고를 눈대중으로 다시 그리는 것은 CI 왜곡이다.
 *
 *   node scripts/trace-nh-ci.mjs            산출물을 다시 만든다
 *   node scripts/trace-nh-ci.mjs --verify   기존 산출물의 일치율만 잰다 (파일을 쓰지 않는다)
 *
 * 일치율(IoU)이 MIN_IOU 미만이면 비정상 종료한다. 조용히 나쁜 로고가 커밋되는 것을 막는다.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

// sharp 는 mockup/ 의 의존성이다. 이 스크립트를 위해 새로 설치하지 않는다.
const require = createRequire(path.join(ROOT, 'mockup', 'package.json'));
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('sharp 를 찾을 수 없습니다. 먼저 `cd mockup && npm install` 을 실행하세요.');
  process.exit(1);
}

/** 이 값 아래로 떨어지면 재현본을 공식 로고라 부를 수 없다. */
const MIN_IOU = 99.0;

/**
 * PANTONE 규격서(mockup/public/assets/nh/ci/nh-colors.jpg)의 값이다.
 * 원본 JPG 의 실측색(#fdb813 / #0066b3)은 압축이 섞인 값이라 쓰지 않는다.
 * mockup/app/proto/assets/data.ts 의 NH_CI_COLORS 와 같은 값이어야 한다.
 */
const TARGETS = [
  {
    src: 'mockup/public/assets/nh/logo/nh-symbol.jpg',
    out: 'design-systems/nh-ibz/assets/nh-symbol.svg',
    fill: '#FBBA00',
    label: 'NH 심볼마크',
    aria: 'NH농협',
  },
  {
    src: 'mockup/public/assets/nh/logo/nh-wordmark.jpg',
    out: 'design-systems/nh-ibz/assets/nh-wordmark.svg',
    fill: '#005CA9',
    label: 'NH 워드마크',
    aria: 'NH',
  },
];

/**
 * 락업(심볼 + 워드마크 + 서비스명)도 여기서 만든다.
 *
 * 손으로 쓰지 않는 이유 — 같은 path 를 세 파일에 베껴 두면 원본을 다시 뜰 때
 * 한 곳만 갱신되어 조용히 갈라진다. 위 TARGETS 의 산출물에서 조립한다.
 *
 * "기업뱅킹"은 상표가 아니라 서비스명이라 활자로 조판한다. 다만 폰트가 없는 환경에서
 * 락업 폭이 흔들리지 않도록 textLength 로 폭을 고정한다.
 */
const LOCKUP_DIR = 'design-systems/nh-ibz/assets';
const SYMBOL_H = 30;   // 락업 안 심볼 높이
const WORDMARK_H = 18; // 락업 안 워드마크 높이
const SERVICE_LABEL = '기업뱅킹';
const SERVICE_FONT_SIZE = 22;
const SERVICE_WIDTH = 92; // textLength 고정폭
const GAP_SYMBOL = 10;
const GAP_WORDMARK = 9;
const LOCKUP_H = 36;

/** 심볼 노랑은 다크 배경에서도 그대로 둔다. 바뀌는 것은 워드마크·서비스명 쪽이다. */
const LOCKUP_VARIANTS = [
  { out: 'logo.svg', wordmark: '#005CA9', service: '#1a1c1f', aria: 'NH 기업뱅킹' },
  { out: 'logo-white.svg', wordmark: '#ffffff', service: '#ffffff', aria: 'NH 기업뱅킹' },
];

/** 흰 배경에서 잉크를 뽑는다. 색상이 무엇이든(노랑·파랑) 같은 기준으로 다룬다. */
async function readMask(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const ink = new Uint8Array(W * H);
  let peak = 0;
  for (let i = 0, p = 0; p < W * H; p += 1, i += C) {
    const v = Math.max(255 - data[i], 255 - data[i + 1], 255 - data[i + 2]);
    ink[p] = v;
    if (v > peak) peak = v;
  }
  // 임계를 고정값이 아니라 그 이미지의 최대 잉크량 절반으로 잡는다.
  // 노랑(최대 236)과 파랑(최대 255)에 같은 상수를 쓰면 노랑 쪽이 깎인다.
  const cut = Math.max(24, Math.round(peak / 2));
  const mask = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p += 1) mask[p] = ink[p] >= cut ? 1 : 0;
  return { mask, W, H };
}

/** 잉크가 실제로 차지하는 사각형. 워드마크 원본은 여백이 대부분이다. */
function contentBox(mask, W, H) {
  let minX = W;
  let maxX = -1;
  let minY = H;
  let maxY = -1;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (!mask[y * W + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('잉크가 없습니다.');
  return { minX, minY, maxX, maxY };
}

function cropMask(mask, W, H, box) {
  const w = box.maxX - box.minX + 1;
  const h = box.maxY - box.minY + 1;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      out[y * w + x] = mask[(y + box.minY) * W + (x + box.minX)];
    }
  }
  return { mask: out, W: w, H: h };
}

/**
 * Marching squares 로 경계 선분을 뽑는다.
 * 좌표는 픽셀 중심 기준이며, SVG 로 낼 때 +0.5 해 픽셀 격자에 맞춘다.
 */
function boundarySegments(mask, W, H) {
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : mask[y * W + x]);
  const segs = [];
  for (let y = -1; y < H; y += 1) {
    for (let x = -1; x < W; x += 1) {
      const code = at(x, y) * 8 + at(x + 1, y) * 4 + at(x + 1, y + 1) * 2 + at(x, y + 1);
      if (code === 0 || code === 15) continue;
      const T = [x + 0.5, y];
      const R = [x + 1, y + 0.5];
      const B = [x + 0.5, y + 1];
      const L = [x, y + 0.5];
      const add = (a, b) => segs.push([a, b]);
      switch (code) {
        case 1: add(L, B); break;
        case 2: add(B, R); break;
        case 3: add(L, R); break;
        case 4: add(R, T); break;
        case 5: add(L, T); add(R, B); break;
        case 6: add(B, T); break;
        case 7: add(L, T); break;
        case 8: add(T, L); break;
        case 9: add(T, B); break;
        case 10: add(T, R); add(B, L); break;
        case 11: add(T, R); break;
        case 12: add(R, L); break;
        case 13: add(R, B); break;
        case 14: add(B, L); break;
        default: break;
      }
    }
  }
  return segs;
}

const keyOf = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);

/** 선분을 닫힌 고리로 잇는다. 고리 하나가 윤곽선 하나(바깥 또는 구멍)다. */
function chainLoops(segs) {
  const startIndex = new Map();
  segs.forEach((s, i) => {
    const k = keyOf(s[0]);
    if (!startIndex.has(k)) startIndex.set(k, []);
    startIndex.get(k).push(i);
  });

  const used = new Uint8Array(segs.length);
  const loops = [];
  for (let i = 0; i < segs.length; i += 1) {
    if (used[i]) continue;
    used[i] = 1;
    const loop = [segs[i][0], segs[i][1]];
    let cur = segs[i][1];
    for (;;) {
      const cands = startIndex.get(keyOf(cur));
      if (!cands) break;
      let next = -1;
      for (const j of cands) {
        if (!used[j]) { next = j; break; }
      }
      if (next < 0) break;
      used[next] = 1;
      cur = segs[next][1];
      loop.push(cur);
      if (keyOf(cur) === keyOf(loop[0])) break;
    }
    if (loop.length > 8) loops.push(loop);
  }
  return loops;
}

/** Ramer-Douglas-Peucker. 열린 폴리라인용. */
function simplifyOpen(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    if (j <= i + 1) continue;
    const [ax, ay] = pts[i];
    const [bx, by] = pts[j];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    let dmax = -1;
    let idx = -1;
    for (let k = i + 1; k < j; k += 1) {
      const d = len < 1e-9
        ? Math.hypot(pts[k][0] - ax, pts[k][1] - ay)
        : Math.abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / len;
      if (d > dmax) { dmax = d; idx = k; }
    }
    if (dmax > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([i, idx], [idx, j]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/**
 * 닫힌 고리는 시작점과 끝점이 같아 RDP 를 그대로 적용하면 기준선 길이가 0 이 되어
 * 전부 버려진다. 반으로 갈라 두 번 적용한다.
 */
function simplifyClosed(loop, eps) {
  const n = loop.length;
  if (n < 6) return loop.slice(0, -1);
  const half = Math.floor(n / 2);
  const a = simplifyOpen(loop.slice(0, half + 1), eps);
  const b = simplifyOpen(loop.slice(half), eps);
  return a.slice(0, -1).concat(b.slice(0, -1));
}

/**
 * 좌표는 언제나 0.5 격자 위에 있다(픽셀 중심 또는 변의 중점 + 0.5).
 * 그래서 소수 한 자리로 적어도 **무손실**이고, `.00` 을 붙이는 것보다 눈에 띄게 짧다.
 * 이 로고는 프롬프트에 인라인으로 들어가므로 길이가 곧 예산이다.
 */
function fmt(v) {
  return String(Math.round(v * 2) / 2);
}

function toPathData(loops, eps) {
  return loops
    .map((loop) => {
      const pts = simplifyClosed(loop, eps);
      if (pts.length < 3) return '';
      // 픽셀 중심 좌표 -> SVG 좌표. 이 0.5 를 빼먹으면 도형 전체가 반 픽셀 어긋난다.
      const d = pts.map((p) => fmt(p[0] + 0.5) + ' ' + fmt(p[1] + 0.5)).join('L');
      return 'M' + d + 'Z';
    })
    .filter(Boolean)
    .join('');
}

function buildSvg(opts) {
  const head = '<svg xmlns="http://www.w3.org/2000/svg" width="' + opts.W + '" height="' + opts.H
    + '" viewBox="0 0 ' + opts.W + ' ' + opts.H + '" role="img" aria-label="' + opts.aria + '">';
  const body = '<path fill-rule="evenodd" fill="' + opts.fill + '" d="' + opts.d + '"/>';
  return head + '\n  ' + body + '\n</svg>\n';
}

/**
 * 만든 SVG 를 다시 래스터로 그려 원본 마스크와 겹쳐 본다.
 *
 * 칠해진 자리를 밝기가 아니라 **알파**로 판정한다. 밝기로 재면 NH Yellow 처럼
 * 밝은 색은 흰 배경과 구분되지 않아 일치율이 0 으로 나온다.
 */
async function measureIou(svg, mask, W, H) {
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(W, H, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const C = info.channels;
  let inter = 0;
  let union = 0;
  for (let p = 0; p < W * H; p += 1) {
    const a = mask[p];
    const b = data[p * C + C - 1] >= 128 ? 1 : 0;
    if (a || b) union += 1;
    if (a && b) inter += 1;
  }
  return union === 0 ? 0 : (100 * inter) / union;
}

/**
 * 굵게 단순화한 것부터 시도해 기준을 넘는 가장 작은 산출물을 고른다.
 *
 * 0.5 부터 시작하는 이유 — 1.2 도 IoU 기준은 넘지만 심볼의 안쪽 원이 눈에 띄게
 * 다각형이 된다. 로고는 확대해 쓰는 자산이라 곡선이 매끄러워야 하고,
 * 그 대가(수 KB)는 프롬프트 예산에 여유가 있어 감당된다.
 * `--eps=0.9` 로 개별 지정할 수 있다.
 */
const EPS_LADDER = [0.5, 0.35, 0.25, 0.15, 0];

async function loadCroppedMask(target) {
  const srcPath = path.join(ROOT, target.src);
  if (!fs.existsSync(srcPath)) throw new Error('원본이 없습니다: ' + target.src);
  const full = await readMask(srcPath);
  const box = contentBox(full.mask, full.W, full.H);
  return cropMask(full.mask, full.W, full.H, box);
}

async function trace(target, epsOverride) {
  const { mask, W, H } = await loadCroppedMask(target);
  const loops = chainLoops(boundarySegments(mask, W, H));
  loops.sort((a, b) => b.length - a.length);

  const ladder = epsOverride === null ? EPS_LADDER : [epsOverride];
  let best = null;
  for (const eps of ladder) {
    const d = toPathData(loops, eps);
    if (!d) continue;
    const svg = buildSvg({ d, W, H, fill: target.fill, aria: target.aria });
    const iou = await measureIou(svg, mask, W, H);
    if (!best || iou > best.iou) best = { eps, svg, iou, d };
    if (iou >= MIN_IOU) { best = { eps, svg, iou, d }; break; }
  }

  return Object.assign({}, best, { W, H, loops: loops.length, target });
}

/**
 * 락업 3종을 조립한다.
 *
 * `transform="scale()"` 로 배치한다 — 중첩 <svg> 보다 렌더러 호환이 넓고,
 * 정제 파이프라인에서도 transform 은 URL 속성이 아니라 그대로 살아남는다.
 * 색은 `style` 이 아니라 `fill` **속성**으로 준다. sanitizeCss 가 style 안의
 * url() 을 무력화하는 비대칭이 있어 속성 쪽이 안전하다.
 */
function buildLockups(parts) {
  const sym = parts.symbol;
  const wm = parts.wordmark;
  const symScale = SYMBOL_H / sym.H;
  const symW = sym.W * symScale;
  const wmScale = WORDMARK_H / wm.H;
  const wmW = wm.W * wmScale;

  const symX = 0;
  const symY = (LOCKUP_H - SYMBOL_H) / 2;
  const wmX = symW + GAP_SYMBOL;
  const wmY = (LOCKUP_H - WORDMARK_H) / 2;
  const svcX = wmX + wmW + GAP_WORDMARK;
  const totalW = Math.ceil(svcX + SERVICE_WIDTH);

  const written = [];
  for (const v of LOCKUP_VARIANTS) {
    const lines = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalW + '" height="' + LOCKUP_H
        + '" viewBox="0 0 ' + totalW + ' ' + LOCKUP_H + '" role="img" aria-label="' + v.aria + '">',
      '  <g transform="translate(' + fmt2(symX) + ' ' + fmt2(symY) + ') scale(' + fmt4(symScale) + ')">',
      '    <path fill-rule="evenodd" fill="' + parts.symbolFill + '" d="' + sym.d + '"/>',
      '  </g>',
      '  <g transform="translate(' + fmt2(wmX) + ' ' + fmt2(wmY) + ') scale(' + fmt4(wmScale) + ')">',
      '    <path fill-rule="evenodd" fill="' + v.wordmark + '" d="' + wm.d + '"/>',
      '  </g>',
      '  <text x="' + fmt2(svcX) + '" y="26" textLength="' + SERVICE_WIDTH + '" lengthAdjust="spacingAndGlyphs"'
        + ' font-family="\'Noto Sans KR\', \'Apple SD Gothic Neo\', sans-serif"'
        + ' font-size="' + SERVICE_FONT_SIZE + '" font-weight="700" letter-spacing="-0.03em"'
        + ' fill="' + v.service + '">' + SERVICE_LABEL + '</text>',
      '</svg>',
      '',
    ];
    const svg = lines.join('\n');
    fs.writeFileSync(path.join(ROOT, LOCKUP_DIR, v.out), svg, 'utf8');
    written.push({ name: v.out, bytes: Buffer.byteLength(svg), svg });
  }

  // 심볼 단독. 예전의 파란 라운드 사각형 플레이스홀더를 대체한다.
  const mark = '<svg xmlns="http://www.w3.org/2000/svg" width="' + sym.W + '" height="' + sym.H
    + '" viewBox="0 0 ' + sym.W + ' ' + sym.H + '" role="img" aria-label="NH농협 심볼마크">\n'
    + '  <path fill-rule="evenodd" fill="' + parts.symbolFill + '" d="' + sym.d + '"/>\n</svg>\n';
  fs.writeFileSync(path.join(ROOT, LOCKUP_DIR, 'logo-mark.svg'), mark, 'utf8');
  written.push({ name: 'logo-mark.svg', bytes: Buffer.byteLength(mark) });

  return written;
}

const fmt2 = (v) => String(Math.round(v * 100) / 100);
const fmt4 = (v) => String(Math.round(v * 10000) / 10000);

/**
 * 템플릿에는 로고를 **인라인 SVG** 로 박는다.
 *
 * 왜 파일 참조로는 안 되는가 — 템플릿은 AI 화면 생성 프롬프트의 "완성 화면 예시"로
 * 들어가는데, 그 전에 lib/canvas/htmlPipeline.ts 의 정제를 지난다. 상대경로 src 는
 * 허용 URL 이 아니라 **속성째 잘려** 모델은 빈 <img> 만 보게 된다.
 * 인라인 <svg> 는 DROP_TAGS 에 없어 그대로 살아남는다.
 */
const LOGO_HOST_TEMPLATES = [
  'design-systems/nh-ibz/templates/login/Login.dc.html',
  'design-systems/nh-ibz/templates/dashboard/Dashboard.dc.html',
  'design-systems/nh-ibz/templates/product-detail/ProductDetail.dc.html',
];
const LOGO_BEGIN = '<!--nh-logo-->';
const LOGO_END = '<!--/nh-logo-->';
/** 첫 실행에서 바꿔 낄 예전 형태. 두 번째부터는 위 주석 표식 사이를 갈아 끼운다. */
const LEGACY_LOGO_IMG = /<img\s+src="\.\.\/\.\.\/assets\/logo\.svg"[^>]*>/;
const TEMPLATE_LOGO_HEIGHT = 32;

/** 헤더에 그대로 넣을 한 줄짜리 락업. 표시 크기를 속성으로 못 박는다. */
function inlineLockup(lockupSvg) {
  const box = lockupSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const viewW = box ? Number(box[1]) : LOCKUP_H;
  const viewH = box ? Number(box[2]) : LOCKUP_H;
  const width = Math.round((viewW * TEMPLATE_LOGO_HEIGHT) / viewH);
  return lockupSvg
    .replace(/\n\s*/g, '')
    .replace(
      /width="\d+" height="\d+"/,
      'width="' + width + '" height="' + TEMPLATE_LOGO_HEIGHT + '"'
    )
    .trim();
}

function inlineLogoIntoTemplates(lockupSvg) {
  const inline = inlineLockup(lockupSvg);
  const block = LOGO_BEGIN + inline + LOGO_END;
  const touched = [];

  for (const rel of LOGO_HOST_TEMPLATES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      console.error('템플릿이 없습니다: ' + rel);
      continue;
    }
    const before = fs.readFileSync(file, 'utf8');
    const marked = new RegExp(
      LOGO_BEGIN.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
        + '[\\s\\S]*?'
        + LOGO_END.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
    );

    let after;
    if (marked.test(before)) after = before.replace(marked, block);
    else if (LEGACY_LOGO_IMG.test(before)) after = before.replace(LEGACY_LOGO_IMG, block);
    else {
      console.error('로고 자리를 찾지 못했습니다: ' + rel);
      continue;
    }

    if (after !== before) fs.writeFileSync(file, after, 'utf8');
    touched.push({ rel, bytes: Buffer.byteLength(after) });
  }
  return touched;
}

async function verifyExisting(target) {
  const outPath = path.join(ROOT, target.out);
  if (!fs.existsSync(outPath)) throw new Error('산출물이 없습니다: ' + target.out);
  const svg = fs.readFileSync(outPath, 'utf8');
  const { mask, W, H } = await loadCroppedMask(target);
  const iou = await measureIou(svg, mask, W, H);
  return { iou, W, H, bytes: Buffer.byteLength(svg), target };
}

async function main() {
  const verifyOnly = process.argv.includes('--verify');
  const epsArg = process.argv.find((a) => a.startsWith('--eps='));
  const epsOverride = epsArg ? Number(epsArg.slice('--eps='.length)) : null;
  if (epsArg && !Number.isFinite(epsOverride)) {
    console.error('--eps 값이 숫자가 아닙니다: ' + epsArg);
    process.exit(1);
  }
  let failed = false;
  const parts = {};

  for (const target of TARGETS) {
    if (verifyOnly) {
      const r = await verifyExisting(target);
      const ok = r.iou >= MIN_IOU;
      if (!ok) failed = true;
      console.log(
        (ok ? 'OK   ' : 'FAIL ') + r.target.label.padEnd(12)
        + ' ' + r.W + 'x' + r.H
        + '  ' + String(r.bytes).padStart(6) + 'B'
        + '  IoU ' + r.iou.toFixed(3) + '%'
      );
      continue;
    }

    const r = await trace(target, epsOverride);
    const ok = r.iou >= MIN_IOU;
    if (!ok) failed = true;
    const outPath = path.join(ROOT, target.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, r.svg, 'utf8');
    parts[target.out.includes('symbol') ? 'symbol' : 'wordmark'] = { d: r.d, W: r.W, H: r.H };
    console.log(
      (ok ? 'OK   ' : 'FAIL ') + target.label.padEnd(12)
      + ' ' + r.W + 'x' + r.H
      + '  윤곽 ' + String(r.loops).padStart(2) + '개'
      + '  eps ' + String(r.eps).padEnd(4)
      + '  ' + String(Buffer.byteLength(r.svg)).padStart(6) + 'B'
      + '  IoU ' + r.iou.toFixed(3) + '%'
      + '  -> ' + target.out
    );
  }

  if (failed) {
    console.error('\n일치율이 기준(' + MIN_IOU + '%)에 못 미칩니다. 이 산출물을 공식 로고로 쓰지 마세요.');
    process.exit(1);
  }

  if (!verifyOnly) {
    const written = buildLockups({
      symbol: parts.symbol,
      wordmark: parts.wordmark,
      symbolFill: TARGETS[0].fill,
    });
    for (const w of written) {
      console.log('     락업          ' + String(w.bytes).padStart(6) + 'B  -> ' + LOCKUP_DIR + '/' + w.name);
    }

    const primary = written.find((w) => w.name === 'logo.svg');
    for (const t of inlineLogoIntoTemplates(primary.svg)) {
      console.log('     템플릿 인라인  ' + String(t.bytes).padStart(6) + 'B  -> ' + t.rel);
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
