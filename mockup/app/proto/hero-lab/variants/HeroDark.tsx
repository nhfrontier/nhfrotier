"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

// useLayoutEffect는 SSR 렌더에서 경고를 낸다. layout 타이밍은 브라우저에서만 쓴다.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const STEPS = [
  { n: "1", label: "기획안 → 화면 초안" },
  { n: "2", label: "의견 → AI 정리" },
  { n: "3", label: "결정 → 새 Version" },
];

export function HeroDark() {
  const root = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(SplitText);

    const ctx = gsap.context(() => {
      const el = root.current;
      if (!el) return;
      const pick = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel));

      const mm = gsap.matchMedia();

      // 두 조건을 다 등록해야 한다. reduce 하나만 넣으면 모션을 켠 환경에서 콜백이 아예 안 돈다.
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (self) => {
          if (self.conditions?.reduced) {
            gsap.set(pick("[data-anim]"), { opacity: 1, y: 0 });
            return;
          }

          // 폰트가 시스템 스택이라 swap으로 인한 재측정이 없다.
          // 폭이 크게 바뀌는 화면에 쓸 때는 autoSplit: true + onSplit(자기 안에서 트윈 생성)으로 바꿀 것.
          const split = SplitText.create(el.querySelector("[data-split]"), {
            type: "lines,words",
            mask: "lines",
          });

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          tl.from(pick("[data-anim='eyebrow']"), { opacity: 0, y: 8, duration: 0.4 })
            .from(split.words, { opacity: 0, yPercent: 110, duration: 0.62, stagger: 0.025 }, "-=0.2")
            .from(pick("[data-anim='sub']"), { opacity: 0, y: 8, duration: 0.5 }, "-=0.34")
            .from(pick("[data-anim='step']"), { opacity: 0, y: 8, duration: 0.4, stagger: 0.07 }, "-=0.28")
            .from(pick("[data-anim='cta']"), { opacity: 0, y: 8, duration: 0.4, stagger: 0.06 }, "-=0.26");

          // 3단계가 순서대로 밝아졌다 잦아드는 루프. 이 도구가 단계를 따라 돈다는 걸 움직임으로 보여준다.
          // repeat:-1 타임라인은 다른 타임라인 안에 넣으면 안 된다 — 부모가 유한한 duration을 요구해서 재생되지 않는다.
          // 진입 타임라인과 형제로 두고 delay로 이어 붙인다.
          const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: tl.duration() + 0.4 });
          pick("[data-step-badge]").forEach((badge, i) => {
            const at = i * 0.5;
            loop
              .to(badge, { backgroundColor: "#4f46e5", color: "#ffffff", scale: 1.12, duration: 0.28, ease: "power2.out" }, at)
              .to(badge, { backgroundColor: "#312e81", color: "#a5b4fc", scale: 1, duration: 0.46, ease: "power2.inOut" }, at + 0.5);
          });

          return () => {
            tl.kill();
            loop.kill();
            split.revert();
          };
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-slate-900 rounded-xl px-8 py-[30px]">
      <p data-anim="eyebrow" className="text-[11px] font-semibold tracking-[0.1em] text-indigo-300 mb-3">
        NH 위드캔버스
      </p>

      <h1
        data-split
        className="text-[26px] font-bold text-white tracking-[-0.02em] leading-[1.42] mb-3"
      >
        기획안을 넣으면 화면이 나오고,<br />
        의견을 달면 <span className="text-indigo-300">다음 버전</span>이 나옵니다
      </h1>

      <p data-anim="sub" className="text-[13px] text-slate-400 leading-[1.7] mb-6 max-w-[620px]">
        백지에서 시작하지 않습니다. NH가 이미 가진 디자인 자산 위에서 AI가 초안을 만들고, 팀이 남긴 의견이 그대로 다음 버전의 근거가 됩니다.
      </p>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3.5 flex-1">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-3.5">
              {i > 0 && (
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
              <div data-anim="step" className="flex items-center gap-2.5">
                <span
                  data-step-badge
                  className="w-5 h-5 rounded-full bg-indigo-900 text-indigo-300 text-[11px] font-bold flex items-center justify-center"
                >
                  {step.n}
                </span>
                <span className="text-[13px] font-medium text-slate-200">{step.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            data-anim="cta"
            href="/proto/template"
            className="group flex items-center gap-1.5 px-[18px] py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            화면 만들기
            <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            data-anim="cta"
            href="/proto/assets"
            className="px-[18px] py-2.5 border border-slate-700 text-slate-200 text-[13px] font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            디자인 자산 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
