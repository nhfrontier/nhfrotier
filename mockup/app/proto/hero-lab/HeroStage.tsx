"use client";

import { useState, type ReactNode } from "react";
import { gsap } from "gsap";

const SPEEDS = [1, 0.5, 0.25];

/**
 * 히어로 시안 하나를 대시보드와 같은 캔버스 폭에 얹어 보여준다.
 * 다시 재생은 key를 바꿔 자식을 통째로 unmount/mount 시킨다 — GSAP 타임라인이
 * 마운트 시점에 만들어지므로 이게 가장 확실한 재생 방법이다.
 */
export function HeroStage({
  label,
  note,
  contained = true,
  resetKeys,
  children,
}: {
  label: string;
  note: string;
  /** 시안이 자체 컨테이너(max-w-6xl px-8)를 갖고 있으면 false로 둔다. */
  contained?: boolean;
  /** 다시 재생 시 지울 sessionStorage 키. 세션당 한 번만 도는 연출(커튼 등)을 다시 보기 위한 것. */
  resetKeys?: string[];
  children: ReactNode;
}) {
  const [run, setRun] = useState(0);
  const [speed, setSpeed] = useState(1);

  function replay() {
    resetKeys?.forEach((k) => window.sessionStorage.removeItem(k));
    setRun((n) => n + 1);
  }

  function changeSpeed(v: number) {
    setSpeed(v);
    gsap.globalTimeline.timeScale(v);
  }

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[15px] font-bold text-slate-900">{label}</h2>
        <p className="text-xs text-slate-400 flex-1 min-w-0 truncate">{note}</p>
        <div className="flex items-center gap-1 shrink-0">
          {SPEEDS.map((v) => (
            <button
              key={v}
              onClick={() => changeSpeed(v)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                speed === v ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {v}x
            </button>
          ))}
          <button
            onClick={replay}
            className="ml-1.5 flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[11px] font-semibold rounded-md hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 00-14.9-2M4 15a8 8 0 0014.9 2" />
            </svg>
            다시 재생
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
        {contained ? (
          <div className="max-w-6xl mx-auto px-8 py-8">
            <div key={run}>{children}</div>
          </div>
        ) : (
          <div key={run}>{children}</div>
        )}
      </div>
    </section>
  );
}
