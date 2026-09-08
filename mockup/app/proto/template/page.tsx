'use client';

import { useEffect, useState } from 'react';
import { ProtoHeader } from '../components/ProtoHeader';
import { ProjectPicker, type PickerTarget } from './ProjectPicker';

interface TemplateItem { name: string; description: string; slug: string; }

interface DesignSystem {
  id: string;
  label: string;
  surface: 'mobile' | 'web';
  canvas: string;
  note: string;
  swatches: string[];
  tint: string;
  tokenCount: number;
  componentCount: number;
  templateItems: TemplateItem[];
}

const SURFACE_LABEL: Record<DesignSystem['surface'], string> = { mobile: '모바일 앱', web: '웹' };

/** 문서 양식은 디자인 시스템 자산이 아니라 업무 서식이다. 아직 생성 흐름과 연결되지 않았다. */
const DOCUMENT_FORMS = [
  { name: 'NH 대시보드 공통형', category: '대시보드', note: '고객 요약 카드 + 최근 활동 리스트 구성' },
  { name: '간편 온보딩 폼', category: '폼/온보딩', note: '단계형 입력 + 진행률 표시' },
  { name: '이벤트 배너형', category: '프로모션', note: '헤드라인 + CTA 버튼 중심 배너' },
  { name: '안내문 리플렛형', category: '문서', note: '지점 비치용 인쇄물 레이아웃' },
];

export default function ProtoTemplatePage() {
  const [systems, setSystems] = useState<DesignSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<PickerTarget | null>(null);

  useEffect(() => {
    fetch('/api/design-systems')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSystems(data?.systems ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <ProtoHeader active="template" />

      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-slate-900 mb-1">Template</h1>
          <p className="text-sm text-slate-500">디자인 시스템을 고르면 그 디자인으로 화면을 만듭니다. 자주 쓰는 문서 양식도 여기서 불러오세요.</p>
        </div>

        {/* ── 디자인 시스템 ── */}
        <section className="mb-7">
          <h2 className="text-[15px] font-bold text-slate-900 mb-0.5">디자인 시스템</h2>
          <p className="text-[12.5px] text-slate-400 mb-3.5">고르면 그 시스템의 컬러 토큰·컴포넌트 규칙과 완성 화면 예시를 가진 채 화면 만들기로 들어갑니다. 참고할 화면을 따로 고를 필요는 없습니다.</p>

          {loading ? (
            <div className="flex gap-3.5">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1 h-[150px] bg-white border border-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : systems.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-xl p-5">
              디자인 시스템 자산을 읽지 못했습니다. 저장소 루트의 design-systems/ 를 확인하세요.
            </p>
          ) : (
            <div className="flex gap-3.5">
              {systems.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => setTarget({ designSystemId: ds.id, designSystemLabel: ds.label })}
                  className="group flex-1 text-left bg-white border border-slate-200 rounded-xl p-[18px] hover:border-indigo-300 hover:shadow-[0_4px_12px_rgba(79,70,229,0.08)] transition-all"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-sm font-bold text-slate-900">{ds.label}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {SURFACE_LABEL[ds.surface]}
                    </span>
                  </div>
                  <div className="flex gap-1.5 mb-2.5">
                    {ds.swatches.map((color) => (
                      <div key={color} className="w-5 h-5 rounded-[5px] border border-slate-900/10" style={{ background: color }} />
                    ))}
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed">
                    {ds.note}
                    <br />
                    기준 폭 {ds.canvas} · 토큰 {ds.tokenCount}개 · 컴포넌트 {ds.componentCount}개 · 예시 화면 {ds.templateItems.length}장
                  </p>
                  <p className="mt-3 text-[12px] font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    이 디자인으로 시작 →
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── 문서 양식 ── */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-0.5">문서 양식</h2>
          <p className="text-[12.5px] text-slate-400 mb-3.5">보고서·안내물 등 업무 문서 양식입니다. 아직 화면 생성과 연결되지 않았습니다.</p>

          <div className="grid grid-cols-4 gap-4">
            {DOCUMENT_FORMS.map((doc) => (
              <div key={doc.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden opacity-70">
                <div className="h-[110px] bg-slate-100 p-3.5 flex flex-col gap-1.5">
                  <div className="h-2 w-3/5 rounded bg-slate-300" />
                  <div className="h-2 w-4/5 rounded bg-slate-200" />
                  <div className="h-2 w-1/2 rounded bg-slate-200" />
                </div>
                <div className="p-3.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{doc.category}</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1.5 mb-1">{doc.name}</h4>
                  <p className="text-[11.5px] text-slate-400 mb-2.5">{doc.note}</p>
                  <button disabled className="w-full py-1.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-md cursor-not-allowed">
                    준비 중
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {target && <ProjectPicker target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
