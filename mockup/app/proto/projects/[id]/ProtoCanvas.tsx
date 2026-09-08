'use client';

import { useState } from 'react';
import DesignCanvas from '@/app/components/canvas/DesignCanvas';
import { ElementPanel } from '@/app/components/canvas/ElementPanel';
import { ScreenFlow } from '@/app/components/canvas/ScreenFlow';
import { SAMPLE_SCREENS } from '../../sampleScreens';
import type { CanvasMode, ElementMeta } from '@/lib/canvas/protocol';

/**
 * proto 작업공간의 중앙 영역.
 *
 * 동작 앱과 **같은 DesignCanvas**를 쓴다. 다른 것은 데이터 출처뿐이다 —
 * 여기는 하드코딩 샘플이라 DB도 AI도 필요 없다.
 * 편집은 저장할 곳이 없으므로 읽기 전용이다.
 */
export function ProtoCanvas() {
  const [activeScreenKey, setActiveScreenKey] = useState(SAMPLE_SCREENS[0].screenKey);
  const [selected, setSelected] = useState<ElementMeta | null>(null);
  const [mode, setMode] = useState<CanvasMode>('select');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showFlow, setShowFlow] = useState(false);

  const links = SAMPLE_SCREENS.flatMap((s) => {
    const targets = new Set([...(s.html ?? '').matchAll(/data-goto="([^"]+)"/g)].map((m) => m[1]));
    return [...targets].map((to) => ({ from: s.screenKey, to }));
  });

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 min-w-0">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center gap-2.5 px-4 shrink-0">
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">v3</span>
          <span className="text-[12.5px] font-medium text-slate-700">포인트 조회 흐름</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['select', 'preview'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === 'preview') setSelected(null); }}
                  className={`px-3 py-1.5 text-[11.5px] rounded-md transition-colors ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  {m === 'select' ? '선택' : '미리보기'}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['desktop', 'mobile'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 text-[11.5px] rounded-md transition-colors ${viewMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  {m === 'desktop' ? '데스크톱' : '모바일'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          {SAMPLE_SCREENS.map((s, i) => (
            <button
              key={s.screenKey}
              onClick={() => { setActiveScreenKey(s.screenKey); setSelected(null); }}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors ${activeScreenKey === s.screenKey ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {i + 1}. {s.name}
            </button>
          ))}
          <button
            onClick={() => setShowFlow(!showFlow)}
            className={`ml-auto shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors ${showFlow ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {showFlow ? '캔버스' : '흐름 보기'}
          </button>
        </div>

        {showFlow ? (
          <ScreenFlow
            screens={SAMPLE_SCREENS.map((s) => ({ screenKey: s.screenKey, name: s.name, status: s.status }))}
            links={links}
            activeScreenKey={activeScreenKey}
            onSelect={(key) => { setActiveScreenKey(key); setSelected(null); }}
          />
        ) : (
          <div className="flex-1 overflow-auto flex items-start justify-center p-6">
            <DesignCanvas
              screens={SAMPLE_SCREENS}
              activeScreenKey={activeScreenKey}
              selectedNhId={selected?.nhId ?? null}
              mode={mode}
              viewMode={viewMode}
              onSelect={(_nhId, meta) => setSelected(meta)}
              onNavigate={(key) => { setActiveScreenKey(key); setSelected(null); }}
            />
          </div>
        )}
      </main>

      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
        <div className="flex border-b border-slate-100 shrink-0">
          <span className="flex-1 text-center py-3 text-xs font-semibold text-indigo-600 border-b-2 border-indigo-600">속성</span>
          <span className="flex-1 text-center py-3 text-xs font-semibold text-slate-300">의견</span>
          <span className="flex-1 text-center py-3 text-xs font-semibold text-slate-300">AI 의견요약</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* 시연본이라 저장할 곳이 없다. 값은 보여주되 편집은 막는다. */}
          <ElementPanel meta={selected} editable={false} />
        </div>
        <p className="border-t border-slate-100 p-3 text-[10px] leading-relaxed text-slate-400 shrink-0">
          시연용 화면입니다. 요소 선택과 화면 전환은 실제로 동작하지만,
          수정·메모는 저장되지 않습니다.
        </p>
      </aside>
    </>
  );
}
