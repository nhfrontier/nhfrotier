import { writeFileSync, rmSync } from 'node:fs';

/* ─────────────────────────────────────────────────────────────
   NH 협업 캔버스 — S03 작업공간 아트보드

   색은 지어내지 않는다. mockup-site/template.html 과
   mockup-site/workspace.html 에서 그대로 뜬 값이다.
   초록 팔레트 실험(방향 A·B)은 폐기했다.
   ───────────────────────────────────────────────────────────── */

/* 크롬 — workspace.html 계열을 유지하되 채도를 내렸다.
   원래 #4f46e5 는 oklch(0.511 0.230 277). chroma 0.230 은 UI 주색으로 높아
   버튼·핀·탭처럼 넓은 면에 깔리면 눈을 찌른다("쨍하다").
   hue 와 명도는 거의 그대로 두고 chroma 만 0.230 → 0.155 로 내렸다.
   같은 색 계열로 읽히면서 기존 목업 18장과도 어긋나지 않는다. */
const IND = '#4E58BB';        // 주색  oklch(0.505 0.155 275) · 흰 글자 대비 6.13:1
const IND_DK = '#3B4299';     // hover / 진한 글자  oklch(0.425 0.140 275)
const IND_SOFT = '#EEF0F8';   // 연한 배경  oklch(0.955 0.012 277)
const IND_BORDER = '#CED2EA'; // 강조 테두리  oklch(0.868 0.033 277)

const BG = '#f8fafc';         // 페이지 바탕
const SURFACE = '#ffffff';
const BORDER = '#e2e8f0';
const BORDER2 = '#f1f5f9';

const INK = '#0f172a';        // 제목
const TXT = '#334155';        // 본문
const MID = '#475569';        // 버튼 글자
const MUTE = '#64748b';       // 설명
const FAINT = '#94a3b8';      // 보조 · 비활성 탭
const LINE = '#cbd5e1';       // 구분자

/* 상태 팔레트 — template.html 의 카테고리 칩 짝을 그대로 쓴다 */
const OK_BG = '#f0fdf4', OK_FG = '#15803d';       // 폼/온보딩 칩
const WARN_BG = '#fffbeb', WARN_FG = '#b45309';   // 프로모션 칩
const IDLE_BG = '#f1f5f9', IDLE_FG = '#475569';   // 문서 칩
const FAIL_BG = '#fff1f2', FAIL_FG = '#be123c';   // 같은 계열로 새로 짝지음

const PIN = IND;
const PIN_DONE = '#9ca3af';   // DesignCanvas.tsx 의 resolved 핀 색

const NH_GREEN = '#04A64B';   // 산출물 안의 NH CI — 크롬과 무관

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

const ico = (d, size = 14, sw = 2) =>
  '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';

const D_LAYERS = 'M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4M4 12l8 4 8-4';
const D_CLOCK = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0';
const D_CHAT = 'M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.1A8 8 0 1121 12z';
const D_UNDO = 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3';
const D_SPARK = 'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17l-1.9-5.1L4.5 10l5.6-1.4L12 3z';
const D_FLOW = 'M4 6h6M14 6h6M4 18h6M14 18h6M10 6v12M14 6v12';
const D_DOWN = 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4';
const D_CARD = 'M3 10h18M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3M4 10h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9z';
const D_BELL = 'M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 01-3.4 0';
const D_MENU = 'M4 7h16M4 12h16M4 17h16';
const D_APP = 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';

/* 화면 썸네일 — template.html 의 카드 썸네일 톤을 따른다 */
function thumb(active) {
  const tint = active ? IND_SOFT : BORDER2;
  const bar = active ? IND_BORDER : LINE;
  return '<div style="width:38px;height:52px;border-radius:6px;background:' + tint + ';border:1px solid ' + (active ? IND_BORDER : BORDER) + ';padding:4px;display:flex;flex-direction:column;gap:3px;flex-shrink:0">' +
    '<div style="height:5px;width:60%;border-radius:2px;background:' + bar + '"></div>' +
    '<div style="flex:1;display:grid;grid-template-columns:repeat(2,1fr);gap:3px">' +
      '<div style="background:' + SURFACE + ';border-radius:3px"></div>' +
      '<div style="background:' + SURFACE + ';border-radius:3px"></div>' +
      '<div style="background:' + SURFACE + ';border-radius:3px"></div>' +
      '<div style="background:' + SURFACE + ';border-radius:3px"></div>' +
    '</div>' +
    '<div style="height:6px;border-radius:2px;background:' + SURFACE + '"></div>' +
  '</div>';
}

function pin(n, x, y, resolved) {
  return '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:999px;border:2px solid #fff;background:' +
    (resolved ? PIN_DONE : PIN) + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;box-shadow:0 1px 3px rgba(15,23,42,.25)">' + n + '</div>';
}

/* ── 가운데 산출물 (AI가 만든 NH 화면) ── */
function artifact() {
  const row = (cat, name, num, amount, dim) =>
    '<div style="display:flex;align-items:center;gap:12px;padding:13px 20px;border-top:1px solid ' + BORDER2 + (dim ? ';opacity:.55' : '') + '">' +
      '<div style="width:34px;height:34px;border-radius:9px;background:#F0F8F3;display:flex;align-items:center;justify-content:center;color:' + NH_GREEN + ';flex-shrink:0">' + ico(D_CARD, 15, 1.7) + '</div>' +
      '<div style="min-width:0;flex:1">' +
        '<div style="font-size:10.5px;color:' + FAINT + ';letter-spacing:.02em">' + cat + '</div>' +
        '<div style="font-size:13px;font-weight:600;color:' + INK + ';margin-top:1px">' + name + '</div>' +
        '<div style="font-size:10.5px;color:' + FAINT + ';font-variant-numeric:tabular-nums;margin-top:1px">' + num + '</div>' +
      '</div>' +
      '<div style="font-size:14px;font-weight:700;color:' + INK + ';font-variant-numeric:tabular-nums">' + amount + '</div>' +
    '</div>';

  return '' +
  '<div style="position:relative;width:640px;background:' + SURFACE + ';border-radius:12px;border:1px solid ' + BORDER + ';box-shadow:0 4px 16px rgba(78,88,187,.10)">' +
    '<div style="height:46px;display:flex;align-items:center;gap:10px;padding:0 20px;border-bottom:1px solid ' + BORDER2 + '">' +
      '<div style="width:22px;height:22px;border-radius:6px;background:' + NH_GREEN + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:-.02em">NH</div>' +
      '<div style="font-size:13.5px;font-weight:700;color:' + INK + '">전체계좌조회</div>' +
      '<div style="margin-left:auto;display:flex;gap:14px;color:' + LINE + '">' + ico(D_BELL, 17, 1.7) + ico(D_MENU, 17, 1.7) + '</div>' +
    '</div>' +
    '<div style="padding:22px 20px 18px">' +
      '<div style="font-size:11.5px;color:' + FAINT + ';letter-spacing:.02em">총 보유자산</div>' +
      '<div style="margin-top:5px;font-size:30px;font-weight:800;color:' + INK + ';letter-spacing:-.02em;font-variant-numeric:tabular-nums">12,480,300<span style="font-size:16px;font-weight:600;color:' + MUTE + ';margin-left:4px">원</span></div>' +
      '<div style="display:flex;gap:9px;margin-top:16px">' +
        '<div style="width:150px;height:42px;border-radius:8px;background:' + BORDER2 + ';border:1px solid ' + BORDER + ';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:' + MUTE + ';outline:2px solid ' + IND + ';outline-offset:2px">이체하기</div>' +
        '<div style="width:130px;height:42px;border-radius:8px;background:' + SURFACE + ';border:1px solid ' + BORDER + ';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;color:' + MUTE + '">상세보기</div>' +
      '</div>' +
    '</div>' +
    row('입출금', 'NH주거래우대통장', '352-0000-1234-56', '8,240,100원', false) +
    row('적금', 'NH올원e적금', '301-0000-5678-01', '3,120,000원', false) +
    row('청약', '주택청약종합저축', '302-0000-9012-33', '1,120,200원', true) +
    pin('1', 152, 200, false) +
    pin('2', 250, 120, false) +
    pin('3', 616, 396, true) +
  '</div>';
}

function avatar(initial, color, size) {
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:' + (size <= 22 ? 9.5 : 11.5) + 'px;font-weight:600;flex-shrink:0">' + initial + '</div>';
}

/* obtn — workspace.html */
function obtn(label, icon) {
  return '<div style="display:flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid ' + BORDER + ';border-radius:8px;font-size:12.5px;font-weight:500;color:' + MID + ';background:' + SURFACE + '">' + (icon || '') + label + '</div>';
}

function seg(items) {
  return '<div style="display:flex;gap:2px;background:' + BORDER2 + ';border-radius:8px;padding:3px">' +
    items.map((it, i) =>
      '<div style="padding:4px 11px;border-radius:6px;font-size:12px;font-weight:' + (i === 0 ? '600' : '500') + ';' +
      (i === 0 ? 'background:' + SURFACE + ';color:' + INK + ';box-shadow:0 1px 2px rgba(15,23,42,.06)' : 'color:' + MUTE) + '">' + it + '</div>').join('') +
  '</div>';
}

function statusChip(status) {
  const map = {
    done: ['완료', OK_BG, OK_FG],
    running: ['생성중', WARN_BG, WARN_FG],
    failed: ['실패', FAIL_BG, FAIL_FG],
    idle: ['대기', IDLE_BG, IDLE_FG],
  }[status];
  return '<span style="font-size:10px;font-weight:600;color:' + map[2] + ';background:' + map[1] + ';padding:2px 7px;border-radius:999px">' + map[0] + '</span>';
}

function screenRow(name, status, active) {
  return '<div style="display:flex;align-items:center;gap:9px;padding:8px;border-radius:8px;background:' + (active ? IND_SOFT : BG) + ';border:1px solid ' + (active ? IND_BORDER : 'transparent') + '">' +
    thumb(active) +
    '<div style="min-width:0;flex:1">' +
      '<div style="font-size:12px;font-weight:' + (active ? '700' : '500') + ';color:' + (active ? INK : TXT) + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + name + '</div>' +
      '<div style="margin-top:5px;display:flex;align-items:center;gap:6px">' +
        statusChip(status) +
        (status === 'failed' ? '<span style="font-size:10px;font-weight:600;color:' + IND + '">다시 시도</span>' : '') +
      '</div>' +
    '</div>' +
  '</div>';
}

function historyRow(text, who, time, reverted) {
  return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0">' +
    '<div style="width:5px;height:5px;border-radius:999px;background:' + (reverted ? LINE : IND) + ';flex-shrink:0"></div>' +
    '<div style="min-width:0;flex:1">' +
      '<div style="font-size:11.5px;color:' + (reverted ? FAINT : TXT) + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis' + (reverted ? ';text-decoration:line-through' : '') + '">' + text + '</div>' +
      '<div style="font-size:9.5px;color:' + FAINT + ';margin-top:1px">' + who + ' · ' + time + '</div>' +
    '</div>' +
    '<div style="font-size:10.5px;font-weight:600;color:' + (reverted ? FAINT : IND) + ';flex-shrink:0">' + (reverted ? '되돌림' : '되돌리기') + '</div>' +
  '</div>';
}

const PTAB = (label, active) =>
  '<div style="padding:12px 16px;font-size:13px;font-weight:600;color:' + (active ? IND : FAINT) + ';border-bottom:2px solid ' + (active ? IND : 'transparent') + '">' + label + '</div>';

const STAB = (label, active) =>
  '<div style="flex:1;text-align:center;padding:10px 0;font-size:12px;font-weight:600;color:' + (active ? IND : FAINT) + ';border-bottom:2px solid ' + (active ? IND : 'transparent') + '">' + label + '</div>';

const RTAB = (label, active) =>
  '<div style="flex:1;text-align:center;padding:10px 0;font-size:12px;font-weight:600;color:' + (active ? IND : FAINT) + ';border-bottom:2px solid ' + (active ? IND : 'transparent') + '">' + label + '</div>';

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
    body { margin: 0; font-family: ${FONT}; -webkit-font-smoothing: antialiased; }
    a { color: ${IND}; text-decoration: none; }
    a:hover { color: ${IND_DK}; }
    * { box-sizing: border-box; }
  </style>
</helmet>

<div style="width:1440px;height:900px;background:${BG};display:flex;flex-direction:column;overflow:hidden">

  <!-- 헤더 56 -->
  <div style="height:56px;flex-shrink:0;background:${SURFACE};border-bottom:1px solid ${BORDER};display:flex;align-items:center;gap:10px;padding:0 24px">
    <div style="width:26px;height:26px;background:${IND};border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff">${ico(D_APP, 15, 2)}</div>
    <div style="font-size:13px;color:${FAINT}">대시보드</div>
    <div style="font-size:13px;color:${LINE}">/</div>
    <div style="font-size:13px;color:${FAINT}">프로젝트</div>
    <div style="font-size:13px;color:${LINE}">/</div>
    <div style="font-size:13px;font-weight:600;color:${INK}">고객 포털 리뉴얼</div>
    <div style="font-size:11px;font-weight:600;color:${IND};background:${IND_SOFT};padding:3px 8px;border-radius:999px">ACTIVE</div>
    <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
      ${obtn('Version', ico(D_LAYERS, 14, 2))}
      ${obtn('History', ico(D_CLOCK, 14, 2))}
      ${obtn('Export', ico(D_DOWN, 14, 2))}
      <div style="width:1px;height:20px;background:${BORDER};margin:0 2px"></div>
      ${avatar('김', IND, 28)}
    </div>
  </div>

  <!-- 프로젝트 탭 44 -->
  <div style="height:44px;flex-shrink:0;background:${SURFACE};border-bottom:1px solid ${BORDER};display:flex;align-items:center;padding:0 24px;gap:8px">
    ${PTAB('작업공간', true)}${PTAB('AI Chat', false)}${PTAB('결과/리뷰', false)}${PTAB('Version', false)}${PTAB('History', false)}
  </div>

  <!-- 캔버스 툴바 40 -->
  <div style="height:40px;flex-shrink:0;background:${SURFACE};border-bottom:1px solid ${BORDER};display:flex;align-items:center;gap:10px;padding:0 16px">
    <div style="font-size:11px;font-weight:700;color:${IND};background:${IND_SOFT};padding:3px 8px;border-radius:999px">v3</div>
    <div style="font-size:12.5px;font-weight:500;color:${MID}">전체계좌조회 개편</div>
    <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
      ${seg(['선택', '미리보기'])}
      ${seg(['데스크톱', '모바일'])}
      ${obtn('HTML', ico(D_DOWN, 14, 2))}
      <div style="display:flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid ${IND_BORDER};border-radius:8px;font-size:12.5px;font-weight:600;color:${IND};background:${IND_SOFT}">${ico(D_CHAT, 14, 2)}패널 닫기</div>
    </div>
  </div>

  <div style="flex:1;display:flex;min-height:0">

    <!-- 좌: 사이드바 240 -->
    <div style="width:240px;flex-shrink:0;background:${SURFACE};border-right:1px solid ${BORDER};display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;border-bottom:1px solid ${BORDER2};flex-shrink:0">
        ${STAB('파일', false)}${STAB('화면', true)}${STAB('멤버', false)}
      </div>
      <div style="flex:1;display:flex;flex-direction:column;padding:14px;gap:8px;min-height:0">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:11.5px;font-weight:600;color:${MUTE}">화면 4</div>
          <div style="font-size:11.5px;font-weight:600;color:${IND}">+ 화면 추가</div>
        </div>
        ${screenRow('전체계좌조회', 'done', true)}
        ${screenRow('계좌 상세', 'done', false)}
        ${screenRow('이체하기', 'running', false)}
        ${screenRow('이체 완료', 'failed', false)}
        <div style="flex:1"></div>
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;height:36px;border:1px solid ${BORDER};border-radius:8px;font-size:12.5px;font-weight:500;color:${MID};background:${SURFACE}">${ico(D_FLOW, 14, 2)}흐름 보기</div>
      </div>
    </div>

    <!-- 중앙: 캔버스 -->
    <div style="flex:1;min-width:0;background:${BG};display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow:hidden">
      ${artifact()}
    </div>

    <!-- 우: 패널 320 -->
    <div style="width:320px;flex-shrink:0;background:${SURFACE};border-left:1px solid ${BORDER};display:flex;flex-direction:column;min-height:0">

      <div style="display:flex;border-bottom:1px solid ${BORDER2};flex-shrink:0">
        ${RTAB('속성', false)}${RTAB('의견 3', true)}${RTAB('AI 검토 2', false)}${RTAB('채팅', false)}
      </div>

      <!-- 앵커 컨텍스트 -->
      <div style="flex-shrink:0;display:flex;align-items:center;gap:7px;padding:9px 12px;border-bottom:1px solid ${BORDER2};background:${IND_SOFT}">
        <div style="font-size:9.5px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:2px 6px;border-radius:4px;background:${IND};color:#fff;flex-shrink:0">&lt;button&gt;</div>
        <div style="font-size:11px;font-weight:500;color:${IND_DK};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'이체하기'에 달린 의견</div>
        <div style="margin-left:auto;font-size:10.5px;font-weight:600;color:${IND};opacity:.8;flex-shrink:0">전체 의견으로</div>
      </div>

      <!-- 스레드 -->
      <div style="flex:1;min-height:0;overflow:hidden;padding:12px;display:flex;flex-direction:column;gap:12px">

        <div style="display:flex;gap:9px">
          ${avatar('이', '#e11d48', 24)}
          <div style="min-width:0;flex:1">
            <div style="display:flex;align-items:center;gap:6px">
              <div style="font-size:12px;font-weight:600;color:${INK}">이서연</div>
              <div style="min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:${PIN};color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">1</div>
              <div style="margin-left:auto;font-size:10px;color:${FAINT}">14:02</div>
            </div>
            <div style="margin-top:5px;font-size:11.5px;line-height:1.6;color:${TXT};background:${BG};border-radius:8px;padding:8px 11px">이 버튼이 눈에 안 띄어요. 화면에서 가장 중요한 동작인데 회색이라 그냥 지나칩니다.</div>
          </div>
        </div>

        <div style="display:flex;gap:9px;padding-left:22px">
          ${avatar('박', '#3678AC', 22)}
          <div style="min-width:0;flex:1">
            <div style="display:flex;align-items:center;gap:6px">
              <div style="font-size:11.5px;font-weight:600;color:${INK}">박준혁</div>
              <div style="margin-left:auto;font-size:10px;color:${FAINT}">14:05</div>
            </div>
            <div style="margin-top:5px;font-size:11.5px;line-height:1.6;color:${TXT};background:${BG};border-radius:8px;padding:8px 11px">동의합니다. 폭도 좁아서 옆 버튼이랑 무게가 같아 보여요.</div>
          </div>
        </div>

        <div style="border-radius:8px;background:${IND_SOFT};border:1px solid ${IND_BORDER};padding:10px 11px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:6px;color:${IND_DK}">
            ${ico(D_SPARK, 13, 1.8)}
            <div style="font-size:11px;font-weight:700">AI가 반영했습니다</div>
            <div style="margin-left:auto;font-size:10px;font-weight:500;opacity:.75">14:06</div>
          </div>
          <div style="font-size:11.5px;line-height:1.6;color:${IND_DK}">배경을 브랜드 주색으로 바꾸고 폭을 100%로 넓혔습니다. '상세보기'는 테두리만 남긴 보조 버튼으로 낮췄습니다.</div>
          <div style="display:flex;gap:6px">
            <div style="padding:6px 11px;border-radius:6px;background:${IND};color:#fff;font-size:11.5px;font-weight:600">변경 보기</div>
            <div style="display:flex;align-items:center;gap:5px;padding:6px 11px;border-radius:6px;border:1px solid ${BORDER};background:${SURFACE};color:${MID};font-size:11.5px;font-weight:500">${ico(D_UNDO, 12, 2)}되돌리기</div>
          </div>
        </div>

        <div style="display:flex;gap:9px;opacity:.6">
          ${avatar('최', '#7c3aed', 24)}
          <div style="min-width:0;flex:1">
            <div style="display:flex;align-items:center;gap:6px">
              <div style="font-size:12px;font-weight:600;color:${MID}">최유진</div>
              <div style="min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:${PIN_DONE};color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">3</div>
              ${statusChip('idle').replace('대기', '해결됨')}
              <div style="margin-left:auto;font-size:10px;color:${FAINT}">13:48</div>
            </div>
            <div style="margin-top:5px;font-size:11.5px;line-height:1.6;color:${FAINT};background:${BG};border-radius:8px;padding:8px 11px;text-decoration:line-through">적금 계좌는 이 목록에서 빼는 게 맞습니다.</div>
          </div>
        </div>
      </div>

      <!-- 작성 -->
      <div style="flex-shrink:0;border-top:1px solid ${BORDER2};padding:12px;display:flex;flex-direction:column;gap:8px">
        <div style="height:54px;border-radius:8px;border:1px solid ${BORDER};background:${SURFACE};padding:9px 11px;font-size:11.5px;color:${FAINT};line-height:1.5">고쳤으면 하는 점을 적으세요…</div>
        <div style="display:flex;gap:6px">
          <div style="flex:1;height:34px;border-radius:8px;background:${IND};color:#fff;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600">${ico(D_SPARK, 13, 1.9)}AI에게 보내기</div>
          <div style="height:34px;padding:0 14px;border-radius:8px;border:1px solid ${BORDER};background:${SURFACE};color:${MID};display:flex;align-items:center;font-size:12px;font-weight:500">의견만</div>
        </div>
      </div>

      <!-- 편집 이력 -->
      <div style="flex-shrink:0;border-top:1px solid ${BORDER2};padding:11px 12px 13px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <div style="font-size:11.5px;font-weight:600;color:${MUTE}">편집 이력 3</div>
          <div style="margin-left:auto;font-size:10.5px;font-weight:500;color:${FAINT}">모두 보기</div>
        </div>
        ${historyRow("'이체하기' 버튼 재생성", 'AI', '방금', false)}
        ${historyRow('잔액 글자 20px → 30px', '김민준', '4분 전', false)}
        ${historyRow('카드 여백 24px → 32px', '김민준', '11분 전', true)}
      </div>

    </div>
  </div>
</div>
</x-dc>
</body>
</html>
`;

writeFileSync('Main.dc.html', html);
console.log('wrote Main.dc.html');

/* 초록 팔레트 실험은 폐기했다. 남겨 두면 다음에 어느 것이 정본인지 헷갈린다. */
for (const stale of ['MoreGreen.dc.html', 'DirectionA.dc.html', 'DirectionC.dc.html', 'DirectionD.dc.html']) {
  try { rmSync(stale); console.log('removed', stale); } catch { /* 이미 없음 */ }
}

const canvas = {
  artboards: [
    { file: 'Main.dc.html', x: 0, y: 0, w: 1440, h: 900, title: 'S03 작업공간 — 협업 디자인 캔버스' },
  ],
  annotations: [
    {
      id: 'palette',
      x: 0,
      y: -300,
      w: 720,
      text: '주색의 채도를 내렸습니다.\n\n기존 #4f46e5 는 oklch(0.511 0.230 277)로, chroma 0.230 은 UI 주색으로 높은 값입니다. 버튼·핀·활성 탭처럼 넓은 면에 깔리면 눈을 찌릅니다. hue와 명도는 거의 그대로 두고 chroma만 0.230 → 0.155 로 내렸습니다.\n\n#4f46e5 → #4E58BB  (주색, 흰 글자 대비 6.13:1)\n#4338ca → #3B4299  (진한 글자)\n#eef2ff → #EEF0F8  (연한 배경)\n#c7d2fe → #CED2EA  (강조 테두리)\n\n나머지는 mockup-site/template.html · workspace.html 값 그대로입니다 — 바탕 #f8fafc, 테두리 #e2e8f0/#f1f5f9, 글자 #0f172a / #334155 / #475569 / #64748b / #94a3b8.\n\n화면 상태 배지는 Template 화면의 카테고리 칩 짝을 그대로 씁니다 — 완료 #f0fdf4/#15803d(폼·온보딩), 생성중 #fffbeb/#b45309(프로모션), 해결됨 #f1f5f9/#475569(문서). 실패만 같은 계열로 새로 짝지었습니다(#fff1f2/#be123c).\n\n가운데 산출물의 NH 초록 #04A64B 는 도구의 색과 무관하게 그대로 둡니다.',
    },
    {
      id: 'note-new',
      x: 800,
      y: -300,
      w: 640,
      text: '지금 코드에 없는 UI를 일부러 그려 넣었습니다 — 코멘트 스레드의 답글, AI에게 보내기, AI 반영 결과 카드, 되돌리기, 편집 이력.\n\n치수는 실제 코드 값입니다. 헤더 56 · 프로젝트 탭 44 · 사이드바 240 · 우측 패널 320 · 핀 24(흰 테두리 2) · obtn 7/12 12.5px.',
    },
  ],
  launch: { view: 'canvas' },
};
writeFileSync('canvas.json', JSON.stringify(canvas, null, 2));
console.log('wrote canvas.json');
