/* global React */
// 금융상품 > 예금 상품 목록 — filter panel, sort, product cards, pagination.
const NS = window.NHDesignSystem_5d992c || {};
const PB = NS.Button || (() => null);

const PRODUCTS = [
  { tags: ["법인"], name: "NH기업e정기예금(The Quicker)", type: "예금 상품", hi: "3.63", lo: "3.63", term: "12개월", cta: "가입하기" },
  { tags: ["법인"], name: "NH기업e정기예금", type: "예금 상품", hi: "3.35", lo: "3.35", term: "12개월", cta: "가입하기" },
  { tags: ["개인", "법인"], name: "큰만족실세예금", type: "예금 상품", hi: "2.15", lo: "2.15", term: "12개월", cta: "가입하기" },
  { tags: ["법인"], name: "NH더퍼스트기업통장", type: "입출금 자유 상품", cta: "가입하기" },
  { tags: ["법인"], name: "기업자유예금", type: "입출금 자유 상품", cta: "가입하기" },
  { tags: ["개인사업자"], name: "사업잘되는NH통장", type: "입출금 자유 상품", cta: "스마트폰가입", disabled: true },
  { tags: ["개인", "법인"], name: "정기적금", type: "적금 상품", hi: "1.95", lo: "1.95", term: "12개월", cta: "가입하기" },
  { tags: ["개인사업자", "법인"], name: "알짜배기기업예금(MMDA)", type: "입출금 자유 상품", cta: "영업점가입", disabled: true },
];

const TAG_COLOR = {
  "법인": { fg: "var(--nh-blue-600)", bd: "var(--nh-blue-300)" },
  "개인": { fg: "#d6478b", bd: "#f0b8d3" },
  "개인사업자": { fg: "var(--nh-green-600)", bd: "#a9dcc0" },
};

function PillGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 110, flex: "none", color: "var(--text-body)", fontWeight: 600, fontSize: 14 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--grey-200)", display: "inline-block" }} />
        {label}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {options.map((o) => {
          const on = o === value;
          return (
            <button key={o} onClick={() => onChange(o)} style={{
              cursor: "pointer", height: 40, padding: "0 22px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap",
              fontSize: 14, fontWeight: on ? 700 : 500,
              color: on ? "#fff" : "var(--text-muted)",
              background: on ? "var(--surface-action)" : "var(--white)",
              border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)",
            }}>{o}</button>
          );
        })}
      </div>
    </div>
  );
}

function ProductRow({ p }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "30px 32px", borderBottom: "1px solid var(--grey-150)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {p.tags.map((t) => (
            <span key={t} style={{
              height: 24, padding: "0 10px", display: "inline-flex", alignItems: "center",
              borderRadius: "var(--radius-pill)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              color: TAG_COLOR[t].fg,
              border: `1px solid ${TAG_COLOR[t].bd}`,
            }}>{t}</span>
          ))}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-strong)", letterSpacing: "-0.02em" }}>{p.name}</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>{p.type}</div>
      </div>
      {p.hi && (
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>최고 연</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: "var(--status-negative)" }}>{p.hi}<span style={{ fontSize: 16 }}>%</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>최저 연</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: "var(--status-negative)" }}>{p.lo}<span style={{ fontSize: 16 }}>%</span></span>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>({p.term})</div>
        </div>
      )}
      <div style={{ width: 150, flex: "none", display: "flex", justifyContent: "flex-end" }}>
        {p.disabled
          ? <button disabled style={{ height: 44, padding: "0 26px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--grey-100)", color: "var(--text-disabled)", fontSize: 15, fontWeight: 600, cursor: "not-allowed" }}>{p.cta}</button>
          : <PB variant="slate" style={{ borderRadius: "var(--radius-pill)", height: 44, padding: "0 30px" }}>{p.cta}</PB>}
      </div>
    </div>
  );
}

function ProductListScreen() {
  const [target, setTarget] = React.useState("전체");
  const [channel, setChannel] = React.useState("전체");
  const [sort, setSort] = React.useState("추천순");
  const tabs = ["전체", "입출금 자유", "예금", "적금", "지수연동예금(ELD)"];
  const [tab, setTab] = React.useState("전체");

  return (
    <div style={{ background: "var(--surface-page)", paddingBottom: 60 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* breadcrumb */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", padding: "20px 0 8px" }}>
          <span>금융상품</span><span>›</span><span>예금</span><span>›</span><span style={{ color: "var(--text-body)", fontWeight: 600 }}>예금 상품</span>
        </div>

        {/* filter tabs */}
        <div style={{ display: "flex", gap: 44, borderBottom: "1px solid var(--border-subtle)", marginBottom: 24 }}>
          {tabs.map((t) => {
            const on = t === tab;
            return (
              <button key={t} onClick={() => setTab(t)} style={{ border: "none", background: "none", cursor: "pointer", padding: "0 0 16px", position: "relative", whiteSpace: "nowrap", fontSize: 17, fontWeight: on ? 700 : 500, color: on ? "var(--color-primary)" : "var(--text-muted)" }}>
                {t}
                {on && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, background: "var(--color-primary)" }} />}
              </button>
            );
          })}
        </div>

        {/* filter panel */}
        <div style={{ background: "var(--grey-50)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "26px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          <PillGroup label="가입대상" options={["전체", "개인", "개인사업자", "법인", "기타"]} value={target} onChange={setTarget} />
          <PillGroup label="가입채널" options={["전체", "인터넷", "스마트폰", "영업점"]} value={channel} onChange={setChannel} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", margin: "26px 0 10px" }}>
          <PB variant="slate" size="lg" style={{ borderRadius: "var(--radius-pill)", width: 130 }}>조회</PB>
        </div>

        {/* sort row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 4 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["추천순", "금리순", "출시순"].map((s) => {
              const on = s === sort;
              return (
                <button key={s} onClick={() => setSort(s)} style={{ cursor: "pointer", height: 32, padding: "0 16px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap", fontSize: 13, fontWeight: on ? 700 : 500, color: on ? "#fff" : "var(--text-muted)", background: on ? "var(--surface-action)" : "transparent", border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)" }}>{s}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>2026.06.27 기준</div>
        </div>

        {/* product list */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", borderTop: "2px solid var(--grey-700)", overflow: "hidden" }}>
          {PRODUCTS.map((p, i) => <ProductRow key={i} p={p} />)}
        </div>

        {/* pagination */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18, marginTop: 28, fontSize: 15 }}>
          <span style={{ fontWeight: 700, color: "var(--color-primary)", textDecoration: "underline" }}>1</span>
          <span style={{ color: "var(--text-muted)", cursor: "pointer" }}>2</span>
          <span style={{ color: "var(--text-muted)" }}>›</span>
        </div>
      </div>
    </div>
  );
}

window.ProductListScreen = ProductListScreen;
