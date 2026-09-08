"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

// useLayoutEffect는 SSR 렌더에서 경고를 낸다. layout 타이밍은 브라우저에서만 쓴다.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const BRAND = "NH 위드캔버스";

const STEPS = [
  { from: "기획안", to: "화면 초안" },
  { from: "의견", to: "AI 정리" },
  { from: "결정", to: "새 Version" },
];

/** 프리로더 커튼을 세션당 한 번만 보여줍니다. */
export const CURTAIN_KEY = "proto-hero-curtain";

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export default function HeroSection() {
  const root = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* ---------- 모션 최소화: 애니메이션 없이 최종 상태로 ---------- */
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-anim]", { opacity: 1, y: 0 });
        gsap.set("[data-step], [data-arrow]", { opacity: 1, y: 0, x: 0 });
        gsap.set("[data-curtain]", { display: "none" });
      });

      /* ---------- 기본 모션 ---------- */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const heading = el.querySelector<HTMLElement>("[data-heading]");
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
        const arrows = gsap.utils.toArray<HTMLElement>("[data-arrow]");

        const showCurtain =
          typeof window !== "undefined" &&
          !window.sessionStorage.getItem(CURTAIN_KEY);

        if (!showCurtain) {
          gsap.set("[data-curtain]", { display: "none" });
        } else {
          window.sessionStorage.setItem(CURTAIN_KEY, "1");
        }

        let split: SplitText | null = null;
        let intro: gsap.core.Timeline | null = null;
        let loop: gsap.core.Timeline | null = null;
        let cancelled = false;

        const startLoop = () => {
          if (cancelled) return;
          // repeat:-1 타임라인은 다른 타임라인 안에 넣지 않는다. 부모가 유한한 duration을 요구한다.
          loop = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
          steps.forEach((step, i) => {
            const at = i * 1.2;
            loop!
              .to(step, { opacity: 1, y: -2, duration: 0.35, ease: "power2.out" }, at)
              .to(
                step,
                { opacity: 0.55, y: 0, duration: 0.5, ease: "power2.inOut" },
                at + 0.95
              );
            const arrow = arrows[i];
            if (arrow) {
              loop!
                .to(arrow, { opacity: 1, x: 2, duration: 0.3, ease: "power2.out" }, at + 0.6)
                .to(
                  arrow,
                  { opacity: 0.35, x: 0, duration: 0.45, ease: "power2.inOut" },
                  at + 1.4
                );
            }
          });
        };

        const build = () => {
          if (cancelled) return;

          if (heading) {
            split = new SplitText(heading, {
              type: "lines,words",
              linesClass: "hero-line",
            });
            gsap.set(split.words, { yPercent: 115 });
          }
          gsap.set("[data-anim]", { opacity: 0, y: 8 });
          gsap.set(steps, { opacity: 0.55, y: 0 });
          gsap.set(arrows, { opacity: 0.35, x: 0 });

          const tl = gsap.timeline({
            defaults: { ease: "expo.out" },
            onComplete: () => {
              // 마크업을 원래대로 되돌려 리사이즈 시 줄바꿈이 깨지지 않게 합니다.
              split?.revert();
              split = null;
              gsap.set(heading, { opacity: 1, y: 0 });
              startLoop();
            },
          });

          if (showCurtain) {
            tl.to("[data-curtain]", {
              clipPath: "inset(0% 0% 100% 0%)",
              duration: 0.8,
              ease: "power3.inOut",
            }).set("[data-curtain]", { display: "none" });
          }

          tl.to("[data-eyebrow]", { opacity: 1, y: 0, duration: 0.5 }, "<0.1")
            .set(heading, { opacity: 1 }, "<")
            .to(
              split ? split.words : [],
              { yPercent: 0, duration: 0.9, stagger: 0.018 },
              "<0.05"
            )
            .to("[data-body]", { opacity: 1, y: 0, duration: 0.5 }, "-=0.55")
            .to("[data-steps]", { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
            .to("[data-cta]", { opacity: 1, y: 0, duration: 0.5 }, "-=0.35");

          intro = tl;
          return tl;
        };

        // 시스템 폰트라 즉시 준비되지만, 폰트 로드 전 split을 막아둡니다.
        if (document.fonts?.status === "loaded") {
          build();
        } else if (document.fonts?.ready) {
          document.fonts.ready.then(build);
        } else {
          build();
        }

        // 루프와 intro는 gsap.context가 자동으로 걷어가지 못한다 —
        // onComplete·폰트 Promise 안에서 만들어져 context 함수 밖에서 생성되기 때문이다. 직접 정리한다.
        return () => {
          cancelled = true;
          loop?.kill();
          intro?.kill();
          split?.revert();
        };
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="hero-fx relative mx-auto max-w-6xl px-8 pt-12 pb-10"
    >
      <div
        data-curtain
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 z-20 bg-slate-900"
        style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      />

      <p
        data-anim
        data-eyebrow
        className="text-[11px] font-semibold text-slate-400"
      >
        {BRAND}
      </p>

      <h1
        data-heading
        className="mt-3 max-w-[54rem] break-keep text-[32px] font-bold leading-[1.35] tracking-tight text-slate-900"
      >
        {/* 줄바꿈을 고정한다. 정적 미러(mockup-site/main.html)와 줄이 갈리면 안 되고,
            자연 줄바꿈에 맡기면 "나옵니다"만 둘째 줄에 남는다. SplitText가 <br>을 줄로 인식한다. */}
        기획안을 넣으면 화면이 나오고,<br />
        의견을 달면 <span className="text-indigo-600">다음 버전</span>이 나옵니다
      </h1>

      <p
        data-anim
        data-body
        className="mt-4 max-w-[42rem] break-keep text-[13px] leading-relaxed text-slate-500"
      >
        백지에서 시작하지 않습니다. NH가 이미 가진 디자인 자산 위에서 AI가 초안을
        만들고, 팀이 남긴 의견이 그대로 다음 버전의 근거가 됩니다.
      </p>

      <div
        data-anim
        data-steps
        className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        {STEPS.map((step, i) => (
          <div key={step.to} className="flex items-center gap-x-4">
            {i > 0 && (
              <span data-arrow className="text-slate-300" aria-hidden="true">
                <ArrowRight />
              </span>
            )}
            <div data-step className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                aria-hidden="true"
              />
              <span className="text-[13px] text-slate-400">{step.from}</span>
              <span className="text-slate-300" aria-hidden="true">
                <ArrowRight />
              </span>
              <span className="text-[13px] font-semibold text-slate-900">
                {step.to}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        data-anim
        data-cta
        className="mt-8 flex flex-wrap items-center gap-2.5"
      >
        <Link
          href="/proto/template"
          className="group flex items-center gap-1.5 rounded-lg bg-indigo-600 px-[18px] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          화면 만들기
          <span className="transition-transform duration-150 group-hover:translate-x-0.5">
            <ArrowRight />
          </span>
        </Link>
        <Link
          href="/proto/assets"
          className="rounded-lg border border-slate-200 bg-white px-[18px] py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          디자인 자산 보기
        </Link>
      </div>
    </section>
  );
}
