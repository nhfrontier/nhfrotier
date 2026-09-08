import type { CanvasScreen } from '@/app/components/canvas/DesignCanvas';

/**
 * proto 작업공간이 쓰는 샘플 화면.
 *
 * DB도 AI도 쓰지 않는다. 동작 앱과 **같은 DesignCanvas 컴포넌트**에 그대로 먹여
 * 선택·전환이 시연에서도 실제로 동작하게 하는 것이 목적이다.
 *
 * data-nh-id는 손으로 붙였다. 동작 앱에서는 서버 파이프라인이 붙이지만,
 * 여기는 서버를 거치지 않으므로 미리 넣어 둔다.
 */
function page(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title><style>
    *{box-sizing:border-box}
    body{margin:0;font-family:-apple-system,'Malgun Gothic',sans-serif;background:#fff;color:#1e293b}
    .bar{display:flex;align-items:center;gap:10px;padding:14px 18px;background:#4f46e5;color:#fff}
    .bar b{font-size:13px;font-weight:600}
    .pill{margin-left:auto;font-size:11px;background:rgba(255,255,255,.2);padding:4px 10px;border-radius:999px}
    .wrap{padding:20px;display:flex;flex-direction:column;gap:16px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .tile{padding:14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:12px}
    .tile.on{background:#eef2ff;border-color:#c7d2fe}
    h2{margin:0 0 10px;font-size:12px;color:#64748b;font-weight:600}
    .row{padding:12px 14px;border:1px solid #f1f5f9;border-radius:10px;background:#f8fafc;font-size:12px;margin-bottom:8px}
    .btn{display:block;width:100%;padding:12px;border:0;border-radius:10px;background:#4f46e5;color:#fff;font-size:13px;font-weight:600;text-align:center}
    .btn.ghost{background:#f1f5f9;color:#475569}
  </style></head><body>${body}</body></html>`;
}

export const SAMPLE_SCREENS: CanvasScreen[] = [
  {
    screenKey: 'dashboard',
    name: '대시보드',
    status: 'ready',
    html: page(
      '대시보드',
      `<div class="bar" data-nh-id="s1-bar"><b data-nh-id="s1-title">환영합니다, 고객님</b><span class="pill" data-nh-id="s1-point">포인트 12,400P</span></div>
       <div class="wrap" data-nh-id="s1-wrap">
         <div class="grid" data-nh-id="s1-grid">
           <div class="tile on" data-nh-id="s1-t1">이번 달 사용<br>3건</div>
           <div class="tile" data-nh-id="s1-t2">적립 예정<br>1,200P</div>
           <div class="tile" data-nh-id="s1-t3">만료 임박<br>400P</div>
         </div>
         <div data-nh-id="s1-recent">
           <h2 data-nh-id="s1-recent-h">최근 내역</h2>
           <div class="row" data-nh-id="s1-r1">카페 결제 · 4,500원</div>
           <div class="row" data-nh-id="s1-r2">편의점 결제 · 2,300원</div>
           <div class="row" data-nh-id="s1-r3">교통 이용 · 1,250원</div>
         </div>
         <button class="btn" data-goto="detail" data-nh-id="s1-cta">포인트 상세 보기</button>
         <button class="btn ghost" data-goto="use" data-nh-id="s1-use">포인트 사용하기</button>
       </div>`
    ),
  },
  {
    screenKey: 'detail',
    name: '포인트 상세',
    status: 'ready',
    html: page(
      '포인트 상세',
      `<div class="bar" data-nh-id="s2-bar"><b data-nh-id="s2-title">포인트 상세</b><span class="pill" data-nh-id="s2-point">12,400P</span></div>
       <div class="wrap" data-nh-id="s2-wrap">
         <div data-nh-id="s2-list">
           <h2 data-nh-id="s2-h">적립 내역</h2>
           <div class="row" data-nh-id="s2-r1">2026-09-01 · 카페 적립 · +45P</div>
           <div class="row" data-nh-id="s2-r2">2026-08-28 · 편의점 적립 · +23P</div>
           <div class="row" data-nh-id="s2-r3">2026-08-20 · 이벤트 적립 · +1,000P</div>
         </div>
         <div class="tile" data-nh-id="s2-note">만료 예정 400P는 9월 30일까지 사용해야 합니다.</div>
         <button class="btn ghost" data-goto="dashboard" data-nh-id="s2-back">대시보드로 돌아가기</button>
       </div>`
    ),
  },
  {
    screenKey: 'use',
    name: '포인트 사용',
    status: 'ready',
    html: page(
      '포인트 사용',
      `<div class="bar" data-nh-id="s3-bar"><b data-nh-id="s3-title">포인트 사용</b></div>
       <div class="wrap" data-nh-id="s3-wrap">
         <div data-nh-id="s3-form">
           <h2 data-nh-id="s3-h">사용할 포인트</h2>
           <div class="row" data-nh-id="s3-input">10,000 P</div>
           <div class="tile" data-nh-id="s3-hint">사용 후 남는 포인트 2,400P</div>
         </div>
         <button class="btn" data-nh-id="s3-confirm">사용 신청</button>
         <button class="btn ghost" data-goto="dashboard" data-nh-id="s3-cancel">취소</button>
       </div>`
    ),
  },
];
