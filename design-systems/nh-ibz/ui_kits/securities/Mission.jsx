/* global React */
// 증권 랜딩 — Section 2: 브랜드 미션. Dark, centered, continues from hero.

function Mission() {
  return (
    <section style={{ background: "var(--nh-blue-50)", padding: "96px 0", textAlign: "center" }}>
      <div className="sec-container">
        <div className="reveal" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-primary)", marginBottom: 22 }}>OUR MISSION</div>
        <h2 className="reveal reveal-d1" style={{ fontSize: 42, lineHeight: 1.35, fontWeight: 800, color: "var(--text-strong)", letterSpacing: "-0.03em" }}>
          작게 시작해도, 제대로.
        </h2>
        <p className="reveal reveal-d2" style={{ fontSize: 19, lineHeight: 1.85, color: "var(--text-body)", maxWidth: 680, margin: "26px auto 0", fontWeight: 500 }}>
          소액 투자자도, 투자가 처음인 분도 어렵지 않게.
          NH는 누구나 부담 없이 시작하고 꾸준히 키워갈 수 있는
          새로운 투자 문화를 만들어갑니다.
        </p>
      </div>
    </section>
  );
}

window.SecMission = Mission;
