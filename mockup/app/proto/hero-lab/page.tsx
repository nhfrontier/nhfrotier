import { ProtoHeader } from "../components/ProtoHeader";
import { HeroStage } from "./HeroStage";
import HeroSection, { CURTAIN_KEY } from "./variants/HeroSection";
import { HeroDark } from "./variants/HeroDark";

/**
 * 히어로 시안 비교용 작업 화면. 대시보드(/proto)에는 아직 붙이지 않는다.
 * 시안을 추가하려면 variants/ 에 "use client" 컴포넌트를 만들고 아래에 HeroStage를 하나 더 놓는다.
 */
export default function HeroLabPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProtoHeader active="dashboard" />

      <main className="max-w-[1280px] mx-auto px-8 py-8">
        <div className="mb-7">
          <h1 className="text-[22px] font-bold text-slate-900 mb-1">히어로 시안</h1>
          <p className="text-sm text-slate-500">
            대시보드와 같은 캔버스 폭(max-w-6xl)·같은 배경(slate-50)에 얹어 비교한다. 정해지면 /proto 최상단으로 옮긴다.
          </p>
        </div>

        <HeroStage
          label="커튼 프리로더"
          note="세션 첫 진입에 slate-900 커튼이 위로 걷히고, 헤드라인이 단어 단위로 올라온 뒤 3단계가 순차 강조된다"
          contained={false}
          resetKeys={[CURTAIN_KEY]}
        >
          <HeroSection />
        </HeroStage>

        <HeroStage
          label="다크 히어로 (배선 참고용)"
          note="GSAP + SplitText 기본 배선 예시 — words 마스크 리빌 + 배지 루프"
        >
          <HeroDark />
        </HeroStage>

        <div className="border border-dashed border-slate-300 rounded-xl px-6 py-8 text-center">
          <p className="text-[13px] text-slate-500 mb-1.5">시안을 추가하려면</p>
          <p className="text-xs text-slate-400 font-mono">
            app/proto/hero-lab/variants/ 에 &quot;use client&quot; 컴포넌트 추가 → 위에 &lt;HeroStage&gt;로 감싸기
          </p>
        </div>
      </main>
    </div>
  );
}
