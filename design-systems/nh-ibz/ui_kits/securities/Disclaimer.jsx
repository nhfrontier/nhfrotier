/* global React, Icon */
// 증권 랜딩 — Section 5: 법적 고지(Disclaimer) + dark legal Footer.

const DISCLAIMER = [
  "투자자는 금융투자상품에 대하여 충분한 설명을 받을 권리가 있으며, 투자 전 상품설명서 및 약관을 반드시 확인하시기 바랍니다.",
  "금융투자상품은 예금자보호법에 따라 보호되지 않습니다.",
  "금융투자상품은 투자원금의 손실이 발생할 수 있으며, 그 손실은 투자자에게 귀속됩니다.",
  "준법감시인 심사필 제2026-0627호 (유효기간: 2026.06.27 ~ 2027.06.26)",
];

function Disclaimer() {
  return (
    <section style={{ background: "var(--grey-100)", padding: "40px 0" }}>
      <div className="sec-container">
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {DISCLAIMER.map((d, i) => (
            <li key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--text-muted)" }}>
              <span aria-hidden="true" style={{ color: "var(--grey-400)" }}>·</span>{d}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const LEGAL = ["이용약관", "보호금융상품등록부", "개인정보처리방침", "고객권리안내문", "신용정보 활용체제", "주문 장애시 대처방법/보상기준"];

function SiteFooter() {
  return (
    <footer style={{ background: "var(--nh-navy-900)", color: "rgba(255,255,255,0.7)" }}>
      {/* legal links */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="sec-container" style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", padding: "22px 24px" }}>
          {LEGAL.map((l) => (
            <a key={l} href="#" style={{ fontSize: 13.5, textDecoration: "none", color: l === "개인정보처리방침" ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: l === "개인정보처리방침" ? 700 : 500 }}>{l}</a>
          ))}
        </div>
      </div>

      {/* company info */}
      <div className="sec-container" style={{ padding: "32px 24px 44px", display: "flex", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 720 }}>
          <img src="../../assets/logo-white.svg" alt="NH기업뱅킹" style={{ height: 30, marginBottom: 20 }} />
          <div style={{ fontSize: 13, lineHeight: 2, color: "rgba(255,255,255,0.62)" }}>
            <div><span style={{ color: "rgba(255,255,255,0.45)" }}>본사</span> &nbsp; 서울특별시 중구 새문안로 16 NH금융타워</div>
            <div><span style={{ color: "rgba(255,255,255,0.45)" }}>영업부</span> &nbsp; 서울특별시 영등포구 의사당대로 8 NH증권빌딩 3층</div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 4 }}>
              <span><span style={{ color: "rgba(255,255,255,0.45)" }}>고객센터</span> &nbsp; <a href="tel:1588-2100" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>1588-2100</a></span>
              <span>대표이사 김농협</span>
              <span>사업자등록번호 116-81-00000</span>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginTop: 18 }}>© 2026 NH. All rights reserved.</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <a href="#" aria-label="페이스북" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="Facebook" size={18} /></a>
          <a href="#" aria-label="인스타그램" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="Instagram" size={18} /></a>
          <a href="#" aria-label="유튜브" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="Youtube" size={18} /></a>
        </div>
      </div>
    </footer>
  );
}

window.SecDisclaimer = Disclaimer;
window.SecFooter = SiteFooter;
