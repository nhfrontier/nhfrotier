/* global React, Icon */
// NH기업뱅킹 global footer — quick links, policy row, contact numbers,
// affiliate dropdown, certification badges.

function Footer() {
  const quick = ["사고신고", "이용안내", "가상체험", "인터넷뱅킹오류해결", "서식약관 자료실", "영업점찾기"];
  const policy = ["보호금융상품등록부", "개인정보처리방침", "경영공시", "은행소개"];
  return (
    <footer style={{ background: "var(--white)", borderTop: "1px solid var(--border-subtle)" }}>
      {/* quick links */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px", display: "flex", justifyContent: "space-around", gap: 16, flexWrap: "wrap" }}>
          {quick.map((q) => (
            <a key={q} href="#" style={{ color: "var(--text-body)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>{q}</a>
          ))}
        </div>
      </div>

      {/* policy + social + affiliate */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {policy.map((p, i) => (
            <a key={p} href="#" style={{ color: i === 0 ? "var(--text-strong)" : "var(--text-muted)", textDecoration: "none", fontSize: 13, fontWeight: i === 0 ? 700 : 500 }}>{p}</a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Icon name="Facebook" size={20} color="var(--grey-400)" />
          <Icon name="Instagram" size={20} color="var(--grey-400)" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "7px 12px", fontSize: 13, color: "var(--text-body)" }}>
            계열사/관련사이트 <Icon name="ChevronDown" size={14} />
          </div>
        </div>
      </div>

      {/* contact + copyright + cert */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.9 }}>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <span><b style={{ color: "var(--text-body)" }}>농협은행 전용</b> 1661-3000(929) / 1522-3000</span>
            <span><b style={{ color: "var(--text-body)" }}>해외</b> +82-2-3704-1004</span>
          </div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <span><b style={{ color: "var(--text-body)" }}>농·축협 전용</b> 1661-2100(929) / 1522-2100</span>
            <span><b style={{ color: "var(--text-body)" }}>공용</b> 1588-2100 / 1544-2100</span>
          </div>
          <div style={{ marginTop: 6 }}>Copyright NH Bank. All Right Reserved.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {["WA", "bsi", "ISMS-P", "★"].map((b) => (
            <div key={b} style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--grey-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--grey-500)" }}>{b}</div>
          ))}
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
