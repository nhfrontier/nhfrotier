import { ProjectChrome } from "../../components/ProjectChrome";
import { ProtoCanvas } from "./ProtoCanvas";

export default function ProtoWorkspacePage() {
  return (
    <ProjectChrome active="workspace">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="flex border-b border-slate-100">
          <span className="flex-1 text-center py-2.5 text-xs font-semibold text-indigo-600 border-b-2 border-indigo-600">파일</span>
          <span className="flex-1 text-center py-2.5 text-xs font-semibold text-slate-400">Template</span>
          <span className="flex-1 text-center py-2.5 text-xs font-semibold text-slate-400">멤버</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <p className="text-[11.5px] text-slate-400 leading-relaxed mb-3">참고자료를 등록하면 AI가 스타일을 참고해 결과물을 생성합니다.</p>
          <div className="flex flex-col gap-2 mb-3">
            {["기존_포털_UI.png", "브랜드가이드.pdf", "경쟁사_벤치마크.pdf"].map((name) => (
              <div key={name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-[11.5px] text-slate-700">{name}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-[11.5px]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            자료 추가 (3/3)
          </div>
        </div>
      </aside>

      <ProtoCanvas />
    </ProjectChrome>
  );
}
