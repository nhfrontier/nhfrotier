/* global React, Icon */
// NH기업뱅킹 global header (GNB) — utility bar, logo + login/cert, main nav,
// and an optional blue category sub-bar. Faithful to ibz.nonghyup.com.

const NAV = [
  "조회/이체", "뱅킹업무", "공공/기업특화", "B2B전자결제",
  "부가서비스", "경영지원", "뱅킹관리", "금융상품",
];

function Header({ active = "", subNav = null, onNav = () => {}, extraNav = [] }) {
  const items = [...NAV, ...extraNav];
  return (
    <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* utility bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, height: 40, fontSize: 12.5, color: "var(--text-muted)" }}>
          <UtilLink>개인</UtilLink><Bar />
          <UtilLink>기업</UtilLink><Bar />
          <UtilLink>카드</UtilLink><Bar />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>GLOBAL <Icon name="ChevronDown" size={13} /></span>
          <Icon name="Star" size={16} color="var(--grey-400)" />
          <Icon name="Search" size={16} color="var(--grey-500)" />
        </div>

        {/* logo row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <img src="../../assets/logo.svg" alt="NH기업뱅킹" height="34" style={{ height: 34 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <PillBtn>로그인</PillBtn>
              <PillBtn>인증센터</PillBtn>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 22, alignSelf: "flex-start", marginTop: 4, fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>
            <a href="#" style={hl}>외환</a>
            <a href="#" style={hl}>퇴직연금</a>
            <a href="#" style={hl}>보안센터</a>
            <a href="#" style={hl}>고객센터</a>
          </nav>
        </div>
      </div>

      {/* main nav bar */}
      <div style={{ borderTop: "2px solid var(--nh-navy-800)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <nav style={{ display: "flex", gap: 40 }}>
            {items.map((n) => {
              const on = n === active;
              return (
                <button key={n} onClick={() => onNav(n)} style={{
                  border: "none", background: "none", cursor: "pointer", padding: 0,
                  fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em",
                  color: on ? "var(--color-primary)" : "var(--text-strong)",
                }}>{n}</button>
              );
            })}
          </nav>
          <Icon name="Menu" size={26} color="var(--text-strong)" strokeWidth={2.2} />
        </div>
      </div>

      {/* optional blue category sub-bar */}
      {subNav && (
        <div style={{ background: "var(--nh-blue-400)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", height: 52, color: "#fff" }}>
            <span style={{ fontSize: 15, fontWeight: 700, opacity: 0.95 }}>{subNav.root}</span>
            <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.45)", margin: "0 26px" }} />
            <div style={{ display: "flex", gap: 44 }}>
              {subNav.items.map((it) => {
                const on = it === subNav.active;
                return (
                  <span key={it} style={{ position: "relative", fontSize: 16, fontWeight: on ? 700 : 500, color: "#fff", opacity: on ? 1 : 0.85, cursor: "pointer" }}>
                    {it}
                    {on && <span style={{ position: "absolute", left: "50%", bottom: -17, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid var(--white)" }} />}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const hl = { color: "inherit", textDecoration: "none" };
const Bar = () => <span style={{ width: 1, height: 11, background: "var(--grey-300)" }} />;
function UtilLink({ children }) { return <span style={{ cursor: "pointer" }}>{children}</span>; }
function PillBtn({ children }) {
  return (
    <button style={{
      border: "1px solid var(--border-default)", background: "var(--white)", cursor: "pointer",
      borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: 13, fontWeight: 600,
      color: "var(--text-body)", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

window.Header = Header;
