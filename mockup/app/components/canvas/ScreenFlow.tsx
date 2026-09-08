'use client';

export interface FlowNode {
  screenKey: string;
  name: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
}

export interface ScreenFlowProps {
  screens: FlowNode[];
  /** data-goto에서 읽어낸 이동 관계. 별도 테이블 없이 HTML이 곧 출처다. */
  links: Array<{ from: string; to: string }>;
  activeScreenKey: string;
  onSelect(screenKey: string): void;
}

const NODE_W = 150;
const NODE_H = 62;
const GAP_X = 90;
const GAP_Y = 40;
const PER_ROW = 4;
const PAD = 24;

/**
 * 화면 사이의 이동 관계를 그린다.
 * 그래프 라이브러리를 쓰지 않는다 — 화면 8개 이하에 격자 배치면 충분하고,
 * 의존성 하나를 더 늘릴 만한 복잡도가 아니다.
 */
export function ScreenFlow({ screens, links, activeScreenKey, onSelect }: ScreenFlowProps) {
  const pos = new Map<string, { x: number; y: number }>();
  screens.forEach((s, i) => {
    pos.set(s.screenKey, {
      x: PAD + (i % PER_ROW) * (NODE_W + GAP_X),
      y: PAD + Math.floor(i / PER_ROW) * (NODE_H + GAP_Y),
    });
  });

  const rows = Math.ceil(screens.length / PER_ROW);
  const width = PAD * 2 + Math.min(screens.length, PER_ROW) * (NODE_W + GAP_X) - GAP_X;
  const height = PAD * 2 + rows * (NODE_H + GAP_Y) - GAP_Y;

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="relative mx-auto" style={{ width, height }}>
        <svg
          className="pointer-events-none absolute inset-0"
          width={width}
          height={height}
          aria-hidden="true"
        >
          <defs>
            <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
            </marker>
          </defs>
          {links.map(({ from, to }) => {
            const a = pos.get(from);
            const b = pos.get(to);
            if (!a || !b) return null;

            // 같은 줄이면 오른쪽 변에서 왼쪽 변으로, 아니면 아래에서 위로 잇는다.
            const sameRow = a.y === b.y;
            const x1 = sameRow ? a.x + NODE_W : a.x + NODE_W / 2;
            const y1 = sameRow ? a.y + NODE_H / 2 : a.y + NODE_H;
            const x2 = sameRow ? b.x : b.x + NODE_W / 2;
            const y2 = sameRow ? b.y + NODE_H / 2 : b.y;

            return (
              <line
                key={`${from}->${to}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#94a3b8"
                strokeWidth={1.5}
                markerEnd="url(#flow-arrow)"
              />
            );
          })}
        </svg>

        {screens.map((s, i) => {
          const p = pos.get(s.screenKey);
          if (!p) return null;
          const active = s.screenKey === activeScreenKey;

          return (
            <button
              key={s.screenKey}
              onClick={() => onSelect(s.screenKey)}
              className={`absolute flex flex-col items-start justify-center rounded-lg border-2 bg-white px-3 text-left shadow-sm transition-colors ${
                active ? 'border-indigo-600' : 'border-slate-200 hover:border-slate-400'
              }`}
              style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
            >
              <span className="text-[10px] text-slate-400">{i + 1}</span>
              <span className="w-full truncate text-xs font-medium text-slate-800">{s.name}</span>
              <span className="w-full truncate font-mono text-[10px] text-slate-400">
                {s.status === 'ready' ? s.screenKey : s.status === 'failed' ? '생성 실패' : '생성 대기'}
              </span>
            </button>
          );
        })}
      </div>
      {links.length === 0 && (
        <p className="mt-4 text-center text-xs text-slate-400">
          화면 사이를 잇는 링크가 아직 없습니다.
        </p>
      )}
    </div>
  );
}
