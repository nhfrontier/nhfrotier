/* global React, Icon */
// 증권 랜딩 — Section 3: 계좌 개설 혜택. Light grey, 2-col benefit cards.

const BENEFITS = [
  { icon: "Smartphone", bg: "linear-gradient(135deg,#36abe2,#0094d9)", title: "앱에서 5분이면 끝나는\n간편 계좌 개설" },
  { icon: "ShieldCheck", bg: "linear-gradient(135deg,#2bbd72,#00a04e)", title: "예탁금 최대 1억 원까지\n예금자 보호" },
  { icon: "CalendarClock", bg: "linear-gradient(135deg,#5d6a8e,#3f4a68)", title: "매일 쌓이는 예탁금 이자\n자동 수령" },
  { icon: "Percent", bg: "linear-gradient(135deg,#36abe2,#007ec0)", title: "잔액에 따라 더 높아지는\n이자율" },
];

function BenefitCard({ b, idx }) {
  return (
    <div className={"reveal reveal-d" + ((idx % 2) + 1)} style={{ display: "flex", alignItems: "center", gap: 22, background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "26px 30px", boxShadow: "var(--shadow-sm)" }}>
      <span style={{ width: 64, height: 64, flex: "none", borderRadius: 18, background: b.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(16,36,64,0.18)" }}>
        <Icon name={b.icon} size={30} color="#fff" strokeWidth={1.8} />
      </span>
      <span style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1.45, letterSpacing: "-0.02em", whiteSpace: "pre-line" }}>{b.title}</span>
    </div>
  );
}

function AccountBenefits() {
  return (
    <section style={{ background: "var(--grey-50)", padding: "104px 0" }}>
      <div className="sec-container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="reveal" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-strong)", letterSpacing: "-0.03em" }}>손쉽게 계좌 개설하기</h2>
          <p className="reveal reveal-d1" style={{ fontSize: 17, color: "var(--text-muted)", marginTop: 14 }}>모바일 앱에서 별도 방문 없이, 익숙한 인증 수단으로 바로 시작하세요.</p>
        </div>
        <div className="benefit-grid">
          {BENEFITS.map((b, i) => <BenefitCard key={i} b={b} idx={i} />)}
        </div>
      </div>
    </section>
  );
}

window.SecAccountBenefits = AccountBenefits;
