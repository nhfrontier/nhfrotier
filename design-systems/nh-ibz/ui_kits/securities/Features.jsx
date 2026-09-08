/* global React, Icon */
// 증권 랜딩 — Section 4: 서비스 기능 소개. Left visual card swaps with the
// selected category; right shows category tabs + that category's feature list.

const CATEGORIES = [
  {
    title: "누구나 쉽게 이용할 수 있도록",
    illo: "../../assets/illustrations/document.svg",
    bg: "linear-gradient(150deg,#36abe2,#0072bc)",
    features: [
      { name: "MTS", desc: "거래에 필요한 정보와 기능을 한 화면에 담았습니다." },
      { name: "투자소식", desc: "투자 정보를 누구나 쉽게 이해할 수 있도록 제공합니다." },
    ],
  },
  {
    title: "자유롭고 함께하고",
    illo: "../../assets/illustrations/card.svg",
    bg: "linear-gradient(150deg,#2bbd72,#00854a)",
    features: [
      { name: "주식 모으기", desc: "매일·매주·매월 자동 적립식 투자를 설정할 수 있습니다." },
      { name: "주식 선물하기", desc: "메신저 친구에게 주식을 선물로 보낼 수 있습니다." },
      { name: "해외 주식 소수점 거래", desc: "천 원 단위 소액으로 해외 주식에 투자합니다." },
    ],
  },
  {
    title: "똑똑한 투자도 놓치지 않아요",
    illo: "../../assets/illustrations/coins.svg",
    bg: "linear-gradient(150deg,#5d6a8e,#28324f)",
    features: [
      { name: "시세 감지 주문", desc: "목표 가격에 도달하면 자동으로 주문이 실행됩니다." },
      { name: "종목별 토론방", desc: "급등·급락 종목과 인기 토론방을 실시간으로 확인합니다." },
      { name: "펀드 상품", desc: "투자 성향별 다양한 펀드 상품을 선택할 수 있습니다." },
    ],
  },
];

function Features() {
  const [active, setActive] = React.useState(0);
  const cat = CATEGORIES[active];
  return (
    <section style={{ background: "var(--white)", padding: "104px 0" }}>
      <div className="sec-container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="reveal" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", color: "var(--color-primary)", marginBottom: 14 }}>SERVICE</div>
          <h2 className="reveal reveal-d1" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-strong)", letterSpacing: "-0.03em" }}>투자에 필요한 모든 기능</h2>
        </div>

        <div className="features-split reveal reveal-d1">
          {/* left visual */}
          <div key={active} className="fade-swap" style={{ position: "relative", borderRadius: "var(--radius-xl)", background: cat.bg, minHeight: 360, padding: 34, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.4, letterSpacing: "-0.02em", maxWidth: 240 }}>{cat.title}</div>
            <img src={cat.illo} alt="" style={{ width: 150, height: 150, alignSelf: "flex-end", filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.25))" }} />
            <span style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* right: tabs + list */}
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              {CATEGORIES.map((c, i) => {
                const on = i === active;
                return (
                  <button key={i} onClick={() => setActive(i)} style={{
                    cursor: "pointer", padding: "10px 18px", borderRadius: 999, whiteSpace: "nowrap",
                    fontSize: 14.5, fontWeight: on ? 700 : 500,
                    color: on ? "#fff" : "var(--text-muted)",
                    background: on ? "var(--surface-action)" : "var(--white)",
                    border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)",
                  }}>{c.title}</button>
                );
              })}
            </div>
            <div key={active} className="fade-swap" style={{ marginTop: 18 }}>
              {cat.features.map((f, i) => (
                <div key={f.name} style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "22px 6px", borderBottom: "1px solid var(--grey-150)" }}>
                  <span style={{ flex: "none", width: 38, height: 38, borderRadius: 12, background: "var(--nh-blue-50)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontWeight: 800, fontSize: 15 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)" }}>{f.name}</div>
                    <div style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 5, lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                  <Icon name="ChevronRight" size={18} color="var(--grey-300)" style={{ marginLeft: "auto", marginTop: 4 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.SecFeatures = Features;
