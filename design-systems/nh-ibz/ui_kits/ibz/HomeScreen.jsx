/* global React, Icon */
// NH기업뱅킹 메인 (홈) — notice bar, promo + login hero, recommend services,
// smart-banking app banner, help cards.
const HNS = window.NHDesignSystem_5d992c || {};
const HB = HNS.Button || (() => null);

/* ---------- notice bar ---------- */
function NoticeBar() {
  return (
    <div style={{ background: "var(--nh-blue-50)", borderBottom: "1px solid var(--nh-blue-100)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", gap: 22 }}>
        <img src="../../assets/illustrations/security.svg" alt="" style={{ width: 56, height: 56 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)" }}>
            기업뱅킹 모바일OTP 업데이트 <span style={{ fontWeight: 500, color: "var(--text-body)" }}>예정 안내</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>2026.4.23.(목) 이후부터 모바일OTP 버전 업데이트로 인하여 모바일OTP 간편/재발급 대상 및 방법 안내드립니다.</div>
          <div style={{ fontSize: 13, color: "var(--text-body)", marginTop: 8 }}>
            <b style={{ color: "var(--color-primary)" }}>[대상]</b> 개인사업자 단독 모바일 OTP 사용 고객님 중 Android OS 사용자
          </div>
        </div>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--white)", fontSize: 13, fontWeight: 600, color: "var(--text-body)", cursor: "pointer" }}>자세히 보기 <Icon name="ChevronRight" size={14} /></button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
          <span style={{ width: 16, height: 16, border: "1px solid var(--border-default)", borderRadius: 3, display: "inline-block" }} /> 오늘 그만 보기
        </label>
        <Icon name="X" size={18} color="var(--text-muted)" />
      </div>
    </div>
  );
}

/* ---------- promo cards ---------- */
function PromoCard({ children, foot = true }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "20px 22px" }}>{children}</div>
      {foot && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--nh-blue-deep)", color: "#fff", padding: "9px 16px", fontSize: 12.5 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", opacity: 0.95, whiteSpace: "nowrap" }}>
            <span style={{ width: 14, height: 14, border: "1px solid rgba(255,255,255,0.7)", borderRadius: 2, display: "inline-block" }} /> 오늘 하루 창 열지 않기
          </label>
          <span style={{ opacity: 0.9 }}>닫기</span>
        </div>
      )}
    </div>
  );
}

function DetailLink({ children = "자세히보기" }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600, color: "var(--color-primary)", cursor: "pointer" }}>{children} <Icon name="ChevronRight" size={13} /></span>;
}

/* ---------- login panel ---------- */
function QuickAction({ icon, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <Icon name={icon} size={26} color="var(--nh-blue-600)" strokeWidth={1.6} />
      <span style={{ fontSize: 12.5, color: "var(--text-body)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function LoginPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ flex: 1, height: 78, borderRadius: "var(--radius-md)", border: "none", background: "var(--nh-navy-800)", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 18px", gap: 18 }}>
          <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17, fontWeight: 700 }}>로그인 <Icon name="ChevronRight" size={16} /></span>
          <Icon name="User" size={22} color="rgba(255,255,255,0.85)" />
        </button>
        <button style={{ flex: 1, height: 78, borderRadius: "var(--radius-md)", border: "none", background: "var(--color-primary)", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 18px", gap: 18 }}>
          <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17, fontWeight: 700 }}>인증센터 <Icon name="ChevronRight" size={16} /></span>
          <Icon name="ShieldCheck" size={22} color="rgba(255,255,255,0.9)" />
        </button>
      </div>
      {[["로그인 없이 빠른조회", "Zap"], ["법인 비대면 ONE STOP 가입", "Send"]].map(([t, ic]) => (
        <button key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--white)", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "var(--text-strong)" }}>
          {t} <Icon name={ic} size={18} color="var(--color-primary)" />
        </button>
      ))}
      <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "20px 10px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 20 }}>
        {[["ScrollText", "계좌조회"], ["ArrowRightLeft", "즉시이체"], ["ReceiptText", "거래내역"], ["MonitorCheck", "결제/승인"], ["FileBadge", "증명서발급"], ["GraduationCap", "대학등록금"]].map(([ic, l]) => <QuickAction key={l} icon={ic} label={l} />)}
      </div>
    </div>
  );
}

/* ---------- service tiles ---------- */
function ServiceTile({ illo, icon, label, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0, height: 110, background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", cursor: "pointer" }}>
      <span style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap" }}>{label}</span>
      {illo
        ? <img src={illo} alt="" style={{ width: 46, height: 46 }} />
        : <span style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={24} color="#fff" /></span>}
    </div>
  );
}

/* ---------- recommend section ---------- */
function FeatureCard({ title, sub, illo, icon, green, neww }) {
  return (
    <div style={{ position: "relative", background: green ? "var(--nh-green-500)" : "var(--white)", border: green ? "none" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "26px 28px", minHeight: 190, boxShadow: green ? "var(--shadow-md)" : "var(--shadow-sm)", overflow: "hidden", cursor: "pointer" }}>
      <Icon name="ArrowUpRight" size={22} color={green ? "rgba(255,255,255,0.9)" : "var(--text-muted)"} style={{ position: "absolute", top: 22, right: 22 }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: green ? "#fff" : "var(--text-strong)", letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: green ? "rgba(255,255,255,0.92)" : "var(--text-muted)", marginTop: 10, maxWidth: 200 }}>{sub}</div>
      {neww && <span style={{ position: "absolute", left: 28, bottom: 30, background: "var(--color-primary)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: "var(--radius-pill)", padding: "3px 10px" }}>NEW</span>}
      {green
        ? <span style={{ position: "absolute", right: 24, bottom: 20, width: 64, height: 64, borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="Package" size={34} color="#fff" /></span>
        : <img src={illo} alt="" style={{ position: "absolute", right: 22, bottom: 18, width: 74, height: 74 }} />}
    </div>
  );
}

function RecommendSection() {
  const hashes = ["모두가 주목하는\nNH농협은행 금융추천상품", "비대면으로 더 편리한\n금융업무서비스", "NH농협은행만의\n특별한 금융업무서비스", "기업을 위한 맞춤형\n부가서비스"];
  return (
    <div style={{ background: "var(--grey-50)", borderTop: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 20px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>테마별로 가장 추천하는 서비스를 모아왔어요</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>NH기업 추천서비스</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, fontWeight: 700 }}>
            <span style={{ color: "var(--color-primary)", borderTop: "3px solid var(--color-primary)", paddingTop: 4 }}>NH 농협은행</span>
            <span style={{ color: "var(--text-body)" }}>농 · 축협</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 36 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.5 }}># 기업금융, 더 간편하게<br /><span style={{ borderBottom: "3px solid var(--color-primary)" }}>The Quicker</span></div>
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 22 }}>
              {hashes.map((h, i) => (
                <div key={i} style={{ fontSize: 15, fontWeight: 600, color: "var(--text-body)", whiteSpace: "pre-line", lineHeight: 1.5 }}># {h}</div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <FeatureCard green title="NH BOX" sub="기업에서 필요한 각종 서류를 발급·보관하고, 영업점으로 제출가능한 서비스" />
            <FeatureCard title="THE QUICKER" sub="새로워진 NH 기업금융의 비대면 서비스" illo="../../assets/illustrations/building.svg" />
            <FeatureCard title="ONE STOP 신규가입" sub="계좌 개설부터 기업뱅킹까지 법인도 이제 비대면으로 한 번에 !" illo="../../assets/illustrations/card.svg" />
            <FeatureCard neww title="NH기업e정기예금 (The Quicker)" sub="복잡한 우대조건 없이 기업 여유자금을 운용할 수 있는 특판 상품" illo="../../assets/illustrations/coins.svg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- app banner ---------- */
function AppBanner() {
  return (
    <div style={{ maxWidth: 1200, margin: "44px auto 0", padding: "0 20px" }}>
      <div style={{ background: "var(--nh-navy-900)", borderRadius: "var(--radius-lg)", padding: "30px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Icon name="Smartphone" size={52} color="rgba(255,255,255,0.85)" />
          <div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>언제 어디서나 편하게 이용하는 나만의 스마트 금융 파트너</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>NH기업스마트뱅킹</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["Google Play", "App Store"].map((s) => (
            <div key={s} style={{ textAlign: "center" }}>
              <div style={{ width: 84, height: 84, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="QrCode" size={64} color="#111" /></div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 6 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- help cards ---------- */
function HelpSection() {
  const cards = [["Headset", "고객센터"], ["FileText", "자주하는 질문"], ["MessageSquare", "1:1문의"], ["MonitorSmartphone", "화면공유상담"]];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 20px 50px" }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>도움이 필요하신가요?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        {cards.map(([ic, l]) => (
          <div key={l} style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "26px 24px", background: "var(--white)", cursor: "pointer" }}>
            <Icon name={ic} size={28} color="var(--color-primary)" strokeWidth={1.6} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-strong)", marginTop: 18 }}>{l}</div>
            <div style={{ marginTop: 10 }}><DetailLink>자세히보기</DetailLink></div>
          </div>
        ))}
      </div>
      {/* 새소식 ticker */}
      <div style={{ marginTop: 24, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 24 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="Volume2" size={18} color="var(--color-primary)" /> 새소식</span>
        <span style={{ flex: 1, fontSize: 14, color: "var(--text-body)" }}>경영재제 개인전산 시스템 중단 및 접속지연 안정 안내</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)" }}>
          <Icon name="ChevronUp" size={16} /><Icon name="ChevronDown" size={16} /><Icon name="Pause" size={16} />
        </div>
      </div>
    </div>
  );
}

/* ---------- hero ---------- */
function Popup({ top, left, children }) {
  return (
    <div style={{ position: "absolute", top, left, width: 380, zIndex: 30, borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)" }}>
      {children}
    </div>
  );
}

function Hero() {
  return (
    <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "26px 20px 40px", minHeight: 640 }}>
      {/* faint hero background illustration */}
      <img src="../../assets/illustrations/building.svg" alt="" style={{ position: "absolute", left: "40%", top: 70, width: 240, opacity: 0.25, pointerEvents: "none", zIndex: 0 }} />

      {/* in-flow hero: service tiles (left) + login (right) sit underneath the popups */}
      <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 360px", gap: 18, minHeight: 520, alignItems: "end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
            <HB variant="accent" style={{ borderRadius: "var(--radius-pill)", height: 46 }} iconRight={<Icon name="ChevronRight" size={16} />}>체험PLAY 바로가기</HB>
            <HB variant="primary" style={{ borderRadius: "var(--radius-pill)", height: 46 }} iconRight={<Icon name="ChevronRight" size={16} />}>가상체험관 바로가기</HB>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <ServiceTile label="NH BOX" icon="Package" color="var(--nh-green-500)" />
            <ServiceTile label="이체" illo="../../assets/illustrations/transfer.svg" />
            <ServiceTile label="전자어음" illo="../../assets/illustrations/document.svg" />
            <ServiceTile label="금융인증서" icon="ShieldCheck" color="var(--color-primary)" />
            <ServiceTile label="계좌관리" illo="../../assets/illustrations/card.svg" />
          </div>
        </div>
        <LoginPanel />
      </div>

      {/* floating promo popups */}
      <Popup top={26} left={20}>
        <PromoCard>
          <div style={{ fontSize: 14, color: "var(--text-body)" }}>복잡한 우대조건 없이 여유자금을 운용할 수 있는</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: "var(--text-strong)", marginTop: 4 }}>NH기업e정기예금<br />(The Quicker)</div>
          <div style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600, marginTop: 10 }}>#빠르고 간편 &nbsp;#특판상품</div>
          <div style={{ background: "var(--grey-50)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginTop: 14, fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.9 }}>
            <div><b style={{ color: "var(--text-strong)" }}>가입대상</b> &nbsp; 중소기업 (개인사업자 제외)</div>
            <div><b style={{ color: "var(--text-strong)" }}>가입기간</b> &nbsp; 12개월</div>
          </div>
          <div style={{ marginTop: 16 }}><DetailLink /></div>
        </PromoCard>
      </Popup>

      <Popup top={26} left={412}>
        <PromoCard>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)" }}>NH임베디드플랫폼 신규가입 EVENT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-strong)", marginTop: 6 }}>선착순 300명에게 선물드려요!</div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
            <span style={{ background: "var(--nh-blue-50)", color: "var(--color-primary)", fontSize: 12, fontWeight: 700, borderRadius: 4, padding: "4px 10px" }}>이벤트 방법</span>
            <span style={{ fontSize: 13, color: "var(--text-body)" }}>제휴 플랫폼 연동 시 상품권 5만원 지급!</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
            <span style={{ background: "var(--nh-blue-50)", color: "var(--color-primary)", fontSize: 12, fontWeight: 700, borderRadius: 4, padding: "4px 10px" }}>이벤트 기간</span>
            <span style={{ fontSize: 13, color: "var(--text-body)" }}>5.08(금) ~ 7.31(금)</span>
          </div>
          <div style={{ marginTop: 18 }}><DetailLink /></div>
        </PromoCard>
      </Popup>

      <Popup top={368} left={20}>
        <PromoCard>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)" }}>NH원클릭 세무 OPEN 이벤트</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", marginTop: 10 }}>환급 받기 어려우시다면?<br />환급+α, 한번 더 챙기세요!</div>
          <div style={{ fontSize: 13, color: "var(--text-body)", marginTop: 12, lineHeight: 1.9 }}>
            혜택1. NH포인트 100만Point (5명)<br />혜택2. 교통비 지원 3만원 (100명)<br />혜택3. 프리미엄 자산관리 서비스 (1명)
          </div>
          <div style={{ marginTop: 14 }}><DetailLink /></div>
        </PromoCard>
      </Popup>
    </div>
  );
}

function HomeScreen() {
  return (
    <div style={{ background: "var(--white)" }}>
      <NoticeBar />
      <Hero />
      <div style={{ height: 40 }} />
      <RecommendSection />
      <AppBanner />
      <HelpSection />
    </div>
  );
}

window.HomeScreen = HomeScreen;
