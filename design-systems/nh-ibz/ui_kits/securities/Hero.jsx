/* global React, Icon */
// 증권 랜딩 — Section 1: Hero (Key Visual). Light NH-style key visual
// (white + soft pink, per ibz.nonghyup.com), compact height, isometric object.
const SNS = window.NHDesignSystem_5d992c || {};
const SButton = SNS.Button || (() => null);

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="sec-container" style={{ position: "relative", zIndex: 2, width: "100%" }}>
        <div className="hero__grid" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 40, alignItems: "center", padding: "64px 0" }}>
          {/* left: copy */}
          <div>
            <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, background: "var(--nh-blue-50)", border: "1px solid var(--nh-blue-100)", color: "var(--nh-blue-700)", fontSize: 14, fontWeight: 700, marginBottom: 24, whiteSpace: "nowrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--nh-green-500)" }} /> 주식투자 서비스
            </div>
            <h1 className="hero__title reveal reveal-d1">
              투자, 누구에게나<br />쉽고 <span className="hero__capsule">정직하게</span>
            </h1>
            <p className="reveal reveal-d2" style={{ fontSize: 18, lineHeight: 1.65, color: "var(--text-body)", marginTop: 22, fontWeight: 500 }}>
              복잡한 투자는 그만. NH농협은행과 함께라면 누구나 작게 시작해<br />꾸준히 키워가는 똑똑한 자산관리를 경험할 수 있습니다.
            </p>
            <div className="reveal reveal-d3" style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
              <SButton variant="slate" size="lg" style={{ borderRadius: "var(--radius-md)", padding: "0 30px" }} iconRight={<Icon name="ArrowRight" size={18} />}>계좌 개설하기</SButton>
              <SButton variant="outline" size="lg" style={{ borderRadius: "var(--radius-md)", padding: "0 26px" }}>서비스 둘러보기</SButton>
            </div>
          </div>

          {/* right: isometric key object on soft-pink backdrop */}
          <div className="hero__visual reveal reveal-d2" style={{ position: "relative", height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle at 50% 45%, #fde3ea 0%, #fbeef1 70%, rgba(251,238,241,0) 100%)" }} />
            <img src="../../assets/illustrations/building.svg" alt="기업 금융 일러스트" style={{ position: "relative", width: 240, height: 240, filter: "drop-shadow(0 22px 36px rgba(16,36,64,0.16))" }} />
            <img src="../../assets/illustrations/coins.svg" alt="" style={{ position: "absolute", width: 116, bottom: 8, left: 18, filter: "drop-shadow(0 14px 24px rgba(16,36,64,0.16))" }} />
            <img src="../../assets/illustrations/card.svg" alt="" style={{ position: "absolute", width: 104, top: 6, right: 6, filter: "drop-shadow(0 14px 24px rgba(16,36,64,0.16))" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

window.SecHero = Hero;
