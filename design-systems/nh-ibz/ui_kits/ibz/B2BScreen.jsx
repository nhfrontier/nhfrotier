/* global React, Icon */
// B2B전자결제 service landing — hero, service icons, quick panels,
// service card grid, virtual-experience banner, customer center.

const SERVICE_ICONS = [
  { name: "FileText", label: "전자어음발행/배서" },
  { name: "Search", label: "전자어음수취내역" },
  { name: "Award", label: "전자외상매출채권" },
  { name: "Landmark", label: "하도급대금외담대출" },
  { name: "Users", label: "NH다같이성장론" },
];

const CARDS = [
  { title: "EZ구매론", sub: "복잡한 절차없이 구매자금대출도 손쉽게", items: ["서비스이용안내", "판매기업", "구매기업"] },
  { title: "전자외상매출채권", sub: "기업간 상거래대금도 전자결제로", items: ["서비스이용안내", "협력기업(판매기업)", "구매기업"] },
  { title: "전자채권", sub: "전자외상매출채권도 전자결제 시스템으로", items: ["서비스이용안내", "판매기업", "구매기업"] },
  { title: "B2B구매자금대출", sub: "인도/인수와 대금결제의 안전을 보장하는", items: ["서비스이용안내", "판매기업", "구매기업"] },
  { title: "전자어음", sub: "안전한 지급결제도 전자어음으로", items: ["서비스이용안내", "전자어음발행/배서", "전자어음수취", "전자어음보증", "전자어음기타"] },
  { title: "네트워크론", sub: "계약/납품 전 생산자금을 지원하는", items: ["서비스이용안내", "네트워크론"] },
];

function OutlineCta({ children }) {
  return (
    <button style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 46, padding: "0 26px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "var(--white)", fontSize: 15, fontWeight: 600, color: "var(--text-strong)", cursor: "pointer", whiteSpace: "nowrap" }}>
      {children} <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
    </button>
  );
}

function ServiceCard({ c }) {
  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)" }}>{c.title}</div>
      <div style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "6px 0 14px" }}>{c.sub}</div>
      <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "18px 20px", minHeight: 150, background: "var(--white)" }}>
        {c.items.map((it) => (
          <div key={it} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-body)", padding: "5px 0" }}>
            <span style={{ color: "var(--text-muted)" }}>·</span>{it}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickRow({ title, sub, chips }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "22px 0" }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)" }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 5 }}>{sub}</div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {chips.map((ch) => (
          <button key={ch.label} style={{ display: "flex", alignItems: "center", gap: 8, height: 52, padding: "0 22px", minWidth: 150, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "var(--white)", boxShadow: "var(--shadow-xs)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--text-body)", whiteSpace: "nowrap" }}>
            <Icon name={ch.icon} size={20} color="var(--color-primary)" /> {ch.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function B2BScreen() {
  return (
    <div style={{ background: "var(--white)", paddingBottom: 0 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* hero */}
        <div style={{ textAlign: "center", padding: "44px 0 30px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>B2B전자결제</h1>
          <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-body)", marginTop: 14 }}>판매기업과 구매기업 모두를 위한 전자상거래 전용 전자결제 서비스</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>전자결제 · B2B구매자금대출 · 세금계산서 · 전자어음</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22 }}>
            <OutlineCta>서비스 이용안내</OutlineCta>
            <OutlineCta>B2B 전자결제 데모 체험</OutlineCta>
          </div>
        </div>

        {/* service icons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 56, padding: "16px 0 36px" }}>
          {SERVICE_ICONS.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 120 }}>
              <div style={{ width: 64, height: 64, borderRadius: "var(--radius-md)", background: "var(--nh-blue-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.name} size={30} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-body)", textAlign: "center", letterSpacing: "-0.02em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* gray quick panels */}
      <div style={{ background: "var(--grey-50)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 20px" }}>
          <QuickRow title="결제진행상황 총괄조회" sub="B2B 결제진행상황을 한눈에 조회" chips={[
            { icon: "Building2", label: "판매기업" }, { icon: "Building2", label: "구매기업" }, { icon: "ClipboardCheck", label: "B2B약정내역조회" },
          ]} />
          <div style={{ borderTop: "1px solid var(--border-subtle)" }} />
          <QuickRow title="기업구매자금대출" sub="기업의 재화와 용역 등의 물품을 결제" chips={[
            { icon: "Info", label: "서비스이용안내" }, { icon: "Building2", label: "판매기업" }, { icon: "Building2", label: "구매기업" },
          ]} />
        </div>
      </div>

      {/* card grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 20px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, rowGap: 40 }}>
          {CARDS.map((c) => <ServiceCard key={c.title} c={c} />)}
        </div>

        {/* tax invoice wide card */}
        <div style={{ marginTop: 40, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "26px 28px", display: "flex", gap: 36, alignItems: "center" }}>
          <div style={{ width: 220, flex: "none" }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)" }}>세금계산서</div>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 6 }}>세금계산서의 등록 및 조회 등의 업무를 한번에</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: "8px 56px" }}>
            {["세금계산서등록", "세금계산서조회/변경/취소", "세금계산서 연결조회/취소", "세금계산서대량등록"].map((t) => (
              <div key={t} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-body)" }}><span style={{ color: "var(--text-muted)" }}>·</span>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* navy virtual-experience banner */}
      <div style={{ maxWidth: 1200, margin: "20px auto 0", padding: "0 20px" }}>
        <div style={{ background: "var(--nh-navy-800)", borderRadius: "var(--radius-md)", padding: "34px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
          <div>
            <div style={{ fontSize: 15, opacity: 0.8, marginBottom: 6 }}>기업인터넷뱅킹이 처음이라면</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>NH기업뱅킹 가상체험관을 이용해 보세요.</div>
          </div>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            바로 체험하기 <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="ChevronRight" size={16} /></span>
          </button>
        </div>
      </div>

      {/* customer center */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "54px 20px 60px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <h2 style={{ fontSize: 30, fontWeight: 700 }}>이용에 어려움이 있으신가요?</h2>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "var(--text-body)" }}>고객센터 <Icon name="ChevronRight" size={15} color="var(--text-muted)" /></button>
        </div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 10 }}>운영시간 : 9시 ~ 18시 ( 공휴일 휴무 )</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 56, marginTop: 26, fontVariantNumeric: "tabular-nums" }}>
          {[["농협은행", "1661-3000 (929)"], ["농축협", "1661-2100 (929)"], ["해외", "+82-2-3074-1004"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 15, color: "var(--text-muted)" }}>{k}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: "var(--text-strong)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.B2BScreen = B2BScreen;
