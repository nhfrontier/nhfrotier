"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const BRAND_NAME = "NH 위드캔버스";
const FLOW_STEPS = ["기획안 → 화면 초안", "의견 → AI 정리", "결정 → 새 Version"] as const;
const CURTAIN_SESSION_KEY = "nh-proto-hero-curtain-seen";

/** 히어로 시안 비교 화면(hero-lab)의 리셋 버튼이 세션 키를 지울 때 쓴다. */
export const CURTAIN_KEY = CURTAIN_SESSION_KEY;

const JS_BOOTSTRAP = `
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");
  try {
    if (sessionStorage.getItem("${CURTAIN_SESSION_KEY}") === "1") {
      document.documentElement.dataset.protoHeroSeen = "true";
    }
  } catch {}
`;

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-[3px] motion-reduce:transition-none"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function FlowArrow() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export default function HeroSection() {
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const arrowRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    let cancelled = false;
    const media = gsap.matchMedia();
    let context: ReturnType<typeof gsap.context> | undefined;

    void document.fonts.ready.then(() => {
      if (cancelled || !rootRef.current || !titleRef.current) return;

      context = gsap.context(() => {
        media.add(
          {
            reduce: "(prefers-reduced-motion: reduce)",
            animate: "(prefers-reduced-motion: no-preference)",
          },
          (mediaContext) => {
            const reduce = mediaContext.conditions?.reduce === true;
            const root = rootRef.current;
            const title = titleRef.current;
            const curtain = curtainRef.current;
            const eyebrow = eyebrowRef.current;
            const body = bodyRef.current;
            const flow = flowRef.current;
            const actions = actionsRef.current;
            const steps = stepRefs.current.filter(
              (element): element is HTMLSpanElement => element !== null,
            );
            const arrows = arrowRefs.current.filter(
              (element): element is HTMLSpanElement => element !== null,
            );

            if (!root || !title || !curtain || !eyebrow || !body || !flow || !actions) return;

            const revealTargets = [eyebrow, body, flow, actions];

            if (reduce) {
              try {
                sessionStorage.setItem(CURTAIN_SESSION_KEY, "1");
                document.documentElement.dataset.protoHeroSeen = "true";
              } catch {
                // Storage can be unavailable in privacy-restricted contexts.
              }

              gsap.set(curtain, { display: "none" });
              gsap.set([title, ...revealTargets, ...steps, ...arrows], {
                opacity: 1,
                transform: "none",
              });
              return;
            }

            let showCurtain = true;
            try {
              showCurtain = sessionStorage.getItem(CURTAIN_SESSION_KEY) !== "1";
              if (showCurtain) sessionStorage.setItem(CURTAIN_SESSION_KEY, "1");
            } catch {
              // If storage is blocked, preserve the entrance rather than hiding it.
            }

            gsap.set(revealTargets, { opacity: 0, y: 8 });
            gsap.set(steps, { opacity: 0.55, y: 0 });
            gsap.set(arrows, { opacity: 0.55, x: 0 });

            if (showCurtain) {
              gsap.set(curtain, {
                display: "block",
                clipPath: "inset(0 0 0 0)",
              });
            } else {
              gsap.set(curtain, { display: "none" });
            }

            const split = SplitText.create(title, {
              type: "lines,words",
              mask: "lines",
              linesClass: "proto-hero-line",
              wordsClass: "proto-hero-word",
            });

            gsap.set(title, { opacity: 1 });
            gsap.set(split.words, { yPercent: 115 });

            const flowLoop = gsap.timeline({ paused: true, repeat: -1 });

            steps.forEach((step, index) => {
              const start = index * 1.2;
              flowLoop
                .to(step, { duration: 0.25, opacity: 1, y: -2, ease: "power2.out" }, start)
                .to(step, { duration: 0.35, opacity: 0.55, y: 0, ease: "power2.inOut" }, start + 0.55);

              const arrow = arrows[index];
              if (arrow) {
                flowLoop
                  .to(arrow, { duration: 0.25, opacity: 1, x: 2, ease: "power2.out" }, start)
                  .to(arrow, { duration: 0.35, opacity: 0.55, x: 0, ease: "power2.inOut" }, start + 0.55);
              }
            });

            // The last highlight ends at 3.3s; this empty tween supplies the 1.2s rest.
            flowLoop.to({}, { duration: 1.2 });

            const entrance = gsap.timeline({
              onComplete: () => {
                split.revert();
                document.documentElement.dataset.protoHeroSeen = "true";
                flowLoop.play(0);
              },
            });

            if (showCurtain) {
              entrance.to(
                curtain,
                {
                  clipPath: "inset(0 0 100% 0)",
                  duration: 0.8,
                  ease: "power3.inOut",
                },
                0,
              );
            }

            entrance.addLabel("content", showCurtain ? 0.8 : 0);
            entrance
              .to(
                eyebrow,
                { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" },
                "content",
              )
              .to(
                split.words,
                { yPercent: 0, duration: 0.9, stagger: 0.018, ease: "expo.out" },
                "content+=0.12",
              )
              .to(
                body,
                { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" },
                "content+=0.42",
              )
              .to(
                flow,
                { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" },
                "content+=0.60",
              )
              .to(
                actions,
                { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" },
                "content+=0.78",
              );

            return () => {
              entrance.kill();
              flowLoop.kill();
              split.revert();
            };
          },
        );
      }, rootRef);
    });

    return () => {
      cancelled = true;
      media.revert();
      context?.revert();
    };
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JS_BOOTSTRAP }} />
      <section
        ref={rootRef}
        aria-labelledby="proto-hero-title"
        className="proto-hero relative isolate overflow-hidden border-b border-slate-200 bg-slate-50"
      >
        <div
          ref={curtainRef}
          aria-hidden="true"
          className="proto-hero__curtain pointer-events-none absolute inset-0 z-30 bg-slate-900"
        />

        <div className="mx-auto max-w-6xl px-8 py-12 lg:py-16">
          <p
            ref={eyebrowRef}
            data-hero-reveal
            className="mb-4 text-[11px] font-bold tracking-[0.14em] text-indigo-600"
          >
            {BRAND_NAME}
          </p>

          <h1
            ref={titleRef}
            id="proto-hero-title"
            className="proto-hero__title max-w-4xl break-keep text-[28px] leading-[1.34] font-bold tracking-[-0.025em] text-slate-900 sm:text-[32px]"
          >
            {/* 줄바꿈을 고정한다. 자연 줄바꿈에 맡기면 "나옵니다"만 둘째 줄에 남고,
                정적 미러(mockup-site/main.html)와 줄이 갈린다. SplitText가 <br>을 줄로 인식한다. */}
            기획안을 넣으면 화면이 나오고,<br />
            의견을 달면 <span className="text-indigo-600">다음 버전</span>이 나옵니다
          </h1>

          <p
            ref={bodyRef}
            data-hero-reveal
            className="mt-5 max-w-3xl break-keep text-[13px] leading-6 text-slate-500"
          >
            백지에서 시작하지 않습니다. NH가 이미 가진 디자인 자산 위에서 AI가 초안을 만들고,
            팀이 남긴 의견이 그대로 다음 버전의 근거가 됩니다.
          </p>

          <div
            ref={flowRef}
            data-hero-reveal
            aria-label="협업 흐름"
            className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-3"
          >
            {FLOW_STEPS.map((step, index) => (
              <span key={step} className="contents">
                <span
                  ref={(element) => {
                    stepRefs.current[index] = element;
                  }}
                  className="proto-hero__flow-step rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-indigo-600"
                >
                  {step}
                </span>
                {index < FLOW_STEPS.length - 1 ? (
                  <span
                    ref={(element) => {
                      arrowRefs.current[index] = element;
                    }}
                    className="proto-hero__flow-arrow text-slate-400"
                  >
                    <FlowArrow />
                  </span>
                ) : null}
              </span>
            ))}
          </div>

          <div ref={actionsRef} data-hero-reveal className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/proto/template"
              className="group inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              화면 만들기
              <ArrowIcon />
            </Link>
            <Link
              href="/proto/assets"
              className="group inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              디자인 자산 보기
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
