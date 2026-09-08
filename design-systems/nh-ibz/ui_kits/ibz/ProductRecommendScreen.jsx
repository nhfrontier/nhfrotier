/* global React, Icon */
// 금융상품 > 맞춤 상품 추천 — 기업 정보 진단(스텝) → 매칭 점수 기반 추천 결과.
const RNS = window.NHDesignSystem_5d992c || {};
const RB = RNS.Button || (() => null);

const STEPS = [
  { key: "purpose", label: "자금 목적", hint: "가장 가까운 목적을 하나 선택해 주세요.", options: ["여유자금 운용", "운전자금 조달", "시설투자", "결제·정산 관리", "환리스크 관리"] },
  { key: "size", label: "기업 규모", hint: "연 매출 기준으로 선택해 주세요.", options: ["10억 미만", "10~50억", "50~300억", "300억 이상"] },
  { key: "term", label: "운용 기간", hint: "자금을 묶어둘 수 있는 기간입니다.", options: ["3개월 이내", "6개월", "12개월", "24개월 이상"] },
  { key: "type", label: "사업자 형태", hint: "가입대상 판별에 사용됩니다.", options: ["법인", "개인사업자"] },
];

// 각 상품이 선호하는 답변 — 일치할수록 매칭 점수가 올라갑니다.
const CATALOG = [
  { name: "NH기업e정기예금(The Quicker)", type: "예금 상품", rate: "3.63", term: "12개월", tags: ["법인"], badge: "특판",
    why: ["복잡한 우대조건 없이 최고금리 적용", "인터넷·스마트폰 비대면 즉시 가입", "12개월 여유자금 운용에 최적"],
    pref: { purpose: "여유자금 운용", size: "50~300억", term: "12개월", type: "법인" } },
  { name: "NH기업e정기예금", type: "예금 상품", rate: "3.35", term: "12개월", tags: ["법인"],
    why: ["예치 기간을 자유롭게 설정", "만기 자동 재예치 지원"],
    pref: { purpose: "여유자금 운용", size: "10~50억", term: "6개월", type: "법인" } },
  { name: "알짜배기기업예금(MMDA)", type: "입출금 자유 상품", rate: "2.05", term: "수시", tags: ["법인", "개인사업자"],
    why: ["입출금 자유로우면서 잔액별 금리 적용", "단기 결제성 자금에 적합"],
    pref: { purpose: "결제·정산 관리", size: "10~50억", term: "3개월 이내", type: "법인" } },
  { name: "NH더퍼스트기업통장", type: "입출금 자유 상품", tags: ["법인"],
    why: ["이체·증명서 수수료 우대", "기업뱅킹 이용실적으로 등급 상향"],
    pref: { purpose: "결제·정산 관리", size: "50~300억", term: "3개월 이내", type: "법인" } },
  { name: "사업잘되는NH통장", type: "입출금 자유 상품", tags: ["개인사업자"],
    why: ["개인사업자 전용 수수료 면제 혜택", "카드 매출대금 입금 우대"],
    pref: { purpose: "결제·정산 관리", size: "10억 미만", term: "3개월 이내", type: "개인사업자" } },
  { name: "NH기업운전자금대출", type: "대출 상품", rate: "4.82", term: "1년(연장)", tags: ["법인", "개인사업자"],
    why: ["매출채권 기반 한도 산정", "비대면 한도조회 후 영업점 방문 1회"],
    pref: { purpose: "운전자금 조달", size: "10~50억", term: "12개월", type: "법인" } },
  { name: "NH시설자금대출", type: "대출 상품", rate: "4.35", term: "최장 10년", tags: ["법인"],
    why: ["설비·부동산 취득자금 장기 분할상환", "정책자금 연계 가능"],
    pref: { purpose: "시설투자", size: "300억 이상", term: "24개월 이상", type: "법인" } },
  { name: "기업 외화정기예금", type: "외화예금 상품", rate: "3.10", term: "6개월", tags: ["법인"],
    why: ["USD·EUR 등 8개 통화 운용", "선물환 연계로 환리스크 축소"],
    pref: { purpose: "환리스크 관리", size: "50~300억", term: "6개월", type: "법인" } },
];

const WEIGHT = { purpose: 46, size: 20, term: 22, type: 12 };

function score(p, ans) {
  let s = 26;
  STEPS.forEach(({ key }) => { if (ans[key] && ans[key] === p.pref[key]) s += WEIGHT[key]; });
  if (ans.type && !p.tags.includes(ans.type)) s -= 30;
  return Math.max(12, Math.min(98, s));
}

function Chip({ on, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      cursor: "pointer", height: 46, padding: "0 24px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap",
      fontSize: 15, fontWeight: on ? 700 : 500,
      color: on ? "#fff" : "var(--text-body)",
      background: on ? "var(--surface-action)" : "var(--white)",
      border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)",
      transition: "background 140ms ease, color 140ms ease",
    }}>{children}</button>
  );
}

function StepBlock({ step, index, value, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start", padding: "26px 0", borderTop: index === 0 ? "none" : "1px solid var(--grey-150)" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", flex: "none", background: value ? "var(--color-primary)" : "var(--grey-200)", color: value ? "#fff" : "var(--text-muted)", fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{index + 1}</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-strong)", letterSpacing: "-0.02em" }}>{step.label}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, paddingLeft: 34 }}>{step.hint}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {step.options.map((o) => <Chip key={o} on={value === o} onClick={() => onPick(o)}>{o}</Chip>)}
      </div>
    </div>
  );
}

function MatchRing({ value, size = 96, dark }) {
  const track = dark ? "rgba(255,255,255,0.22)" : "var(--grey-150)";
  const fill = dark ? "#fff" : "var(--color-primary)";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flex: "none", background: `conic-gradient(${fill} ${value * 3.6}deg, ${track} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: size - 16, height: size - 16, borderRadius: "50%", background: dark ? "var(--nh-navy-900)" : "var(--white)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <span style={{ fontSize: size / 3.6, fontWeight: 800, color: dark ? "#fff" : "var(--color-primary)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{value}</span>
        <span style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>매칭</span>
      </div>
    </div>
  );
}

function TagPills({ tags }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {tags.map((t) => (
        <span key={t} style={{ height: 24, padding: "0 10px", display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", fontSize: 12, fontWeight: 600, color: "var(--nh-blue-600)", border: "1px solid var(--nh-blue-300)" }}>{t}</span>
      ))}
    </div>
  );
}

function TopPick({ p, value, saved, onSave }) {
  return (
    <div style={{ background: "var(--nh-navy-900)", borderRadius: "var(--radius-lg)", padding: "34px 38px", color: "#fff", display: "flex", gap: 34, alignItems: "center", boxShadow: "var(--shadow-md)" }}>
      <MatchRing value={value} size={116} dark />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "var(--color-primary)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>1순위 추천</span>
          {p.badge && <span style={{ border: "1px solid rgba(255,255,255,0.5)", borderRadius: "var(--radius-pill)", padding: "3px 11px", fontSize: 12, fontWeight: 600, opacity: 0.9 }}>{p.badge}</span>}
        </div>
        <div style={{ fontSize: 27, fontWeight: 800, marginTop: 14, letterSpacing: "-0.025em" }}>{p.name}</div>
        <div style={{ fontSize: 14, opacity: 0.72, marginTop: 6 }}>{p.type} · 가입대상 {p.tags.join("/")}{p.term ? ` · ${p.term}` : ""}</div>
        <ul style={{ margin: "18px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
          {p.why.map((w) => (
            <li key={w} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 14.5, color: "rgba(255,255,255,0.9)" }}>
              <Icon name="Check" size={16} color="var(--nh-green-400, #34c47c)" strokeWidth={2.6} style={{ marginTop: 2, flex: "none" }} /> {w}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ width: 190, flex: "none", textAlign: "right" }}>
        {p.rate && (
          <div style={{ fontVariantNumeric: "tabular-nums" }}>
            <div style={{ fontSize: 13, opacity: 0.75 }}>최고 연</div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{p.rate}<span style={{ fontSize: 22 }}>%</span></div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
          <RB variant="primary" size="lg" style={{ borderRadius: "var(--radius-pill)", width: "100%" }}>가입하기</RB>
          <button onClick={onSave} style={{ height: 42, borderRadius: "var(--radius-pill)", border: "1px solid rgba(255,255,255,0.45)", background: saved ? "rgba(255,255,255,0.16)" : "transparent", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{saved ? "비교함에 담김" : "비교함에 담기"}</button>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ p, value, rank, saved, onSave }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "24px 28px", borderBottom: "1px solid var(--grey-150)", background: "var(--white)" }}>
      <span style={{ width: 26, flex: "none", fontSize: 15, fontWeight: 700, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{rank}</span>
      <MatchRing value={value} size={72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <TagPills tags={p.tags} />
        <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)", letterSpacing: "-0.02em", marginTop: 10 }}>{p.name}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 5 }}>{p.type}{p.term ? ` · ${p.term}` : ""} — {p.why[0]}</div>
      </div>
      {p.rate && (
        <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", flex: "none" }}>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>최고 연</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--status-negative)" }}>{p.rate}<span style={{ fontSize: 15 }}>%</span></div>
        </div>
      )}
      <div style={{ width: 218, flex: "none", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onSave} style={{ height: 42, padding: "0 16px", borderRadius: "var(--radius-pill)", border: `1px solid ${saved ? "var(--color-primary)" : "var(--border-default)"}`, background: saved ? "var(--nh-blue-50)" : "var(--white)", color: saved ? "var(--color-primary)" : "var(--text-body)", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{saved ? "담김" : "비교"}</button>
        <RB variant="slate" style={{ borderRadius: "var(--radius-pill)", height: 42, padding: "0 24px" }}>가입하기</RB>
      </div>
    </div>
  );
}

function CompareBar({ items, onClear }) {
  if (!items.length) return null;
  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 20, marginTop: 28 }}>
      <div style={{ background: "var(--nh-navy-800)", borderRadius: "var(--radius-lg)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 18, color: "#fff", boxShadow: "var(--shadow-md)" }}>
        <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>비교함 {items.length}</span>
        <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {items.map((n) => (
            <span key={n} style={{ background: "rgba(255,255,255,0.14)", borderRadius: "var(--radius-pill)", padding: "6px 14px", fontSize: 13 }}>{n}</span>
          ))}
        </div>
        <button onClick={onClear} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", fontSize: 13, cursor: "pointer" }}>비우기</button>
        <RB variant="primary" style={{ borderRadius: "var(--radius-pill)", height: 42, padding: "0 26px" }}>상품 비교하기</RB>
      </div>
    </div>
  );
}

function ProductRecommendScreen() {
  const [ans, setAns] = React.useState({ purpose: "여유자금 운용", size: "50~300억", term: "12개월", type: "법인" });
  const [saved, setSaved] = React.useState([]);
  const answered = STEPS.filter((s) => ans[s.key]).length;

  const ranked = React.useMemo(() => (
    CATALOG.map((p) => ({ p, v: score(p, ans) })).sort((a, b) => b.v - a.v)
  ), [ans]);

  const toggle = (name) => setSaved((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  const pick = (key, v) => setAns((a) => ({ ...a, [key]: a[key] === v ? null : v }));

  const top = ranked[0];
  const rest = ranked.slice(1, 6);

  return (
    <div style={{ background: "var(--surface-page)", paddingBottom: 70 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", padding: "20px 0 8px" }}>
          <span>금융상품</span><span>›</span><span style={{ color: "var(--text-body)", fontWeight: 600 }}>맞춤 상품 추천</span>
        </div>

        {/* page head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "18px 0 26px" }}>
          <div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>네 가지만 알려주시면 우리 기업에 맞는 상품을 찾아드립니다</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 10 }}>기업 맞춤 상품 추천</h1>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>2026.06.27 기준 · 총 {CATALOG.length}개 상품 대상</div>
        </div>

        {/* diagnosis panel */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", borderTop: "2px solid var(--grey-700)", padding: "8px 32px 26px" }}>
          {STEPS.map((s, i) => (
            <StepBlock key={s.key} step={s} index={i} value={ans[s.key]} onPick={(v) => pick(s.key, v)} />
          ))}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--grey-150)", paddingTop: 22, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 220, height: 6, borderRadius: 3, background: "var(--grey-150)", overflow: "hidden" }}>
                <div style={{ width: `${(answered / STEPS.length) * 100}%`, height: "100%", background: "var(--color-primary)", transition: "width 180ms ease" }} />
              </div>
              <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{answered}/{STEPS.length} 항목 선택됨</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setAns({})} style={{ height: 46, padding: "0 22px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--white)", fontSize: 15, fontWeight: 600, color: "var(--text-body)", cursor: "pointer" }}>다시 선택</button>
              <RB variant="slate" size="lg" style={{ borderRadius: "var(--radius-pill)", width: 150 }}>추천받기</RB>
            </div>
          </div>
        </div>

        {/* result head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "44px 0 18px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>고객님께 추천하는 상품</h2>
          <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>선택하신 조건과의 적합도 순으로 정렬됩니다</span>
        </div>

        <TopPick p={top.p} value={top.v} saved={saved.includes(top.p.name)} onSave={() => toggle(top.p.name)} />

        <div style={{ marginTop: 20, background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {rest.map((r, i) => (
            <ResultRow key={r.p.name} p={r.p} value={r.v} rank={i + 2} saved={saved.includes(r.p.name)} onSave={() => toggle(r.p.name)} />
          ))}
        </div>

        {/* peer section */}
        <div style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>비슷한 기업이 많이 가입한 상품</h2>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 8 }}>동일 업종·매출 구간 기업의 최근 3개월 가입 데이터를 기준으로 안내드립니다.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 20 }}>
            {[
              { n: "NH기업e정기예금(The Quicker)", s: "가입 상위 1위", d: "동일 구간 기업의 38%가 선택", ill: "coins" },
              { n: "NH더퍼스트기업통장", s: "가입 상위 2위", d: "결제성 자금 관리 목적 가입 다수", ill: "card" },
              { n: "NH기업운전자금대출", s: "가입 상위 3위", d: "매출채권 기반 한도 조회 후 실행", ill: "building" },
            ].map((c) => (
              <div key={c.n} style={{ position: "relative", background: "var(--white)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: "24px 26px", minHeight: 168, cursor: "pointer" }}>
                <Icon name="ArrowUpRight" size={20} color="var(--text-muted)" style={{ position: "absolute", top: 20, right: 20 }} />
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-primary)" }}>{c.s}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)", marginTop: 10, letterSpacing: "-0.02em", maxWidth: 210 }}>{c.n}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, maxWidth: 200, lineHeight: 1.55 }}>{c.d}</div>
                <img src={`../../assets/illustrations/${c.ill}.svg`} alt="" style={{ position: "absolute", right: 20, bottom: 18, width: 56, height: 56 }} />
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.8, marginTop: 34 }}>
          · 본 추천 결과는 고객님이 선택하신 정보를 기준으로 산출된 참고용 안내이며, 실제 가입 가능 여부와 적용 금리는 심사 결과에 따라 달라질 수 있습니다.<br />
          · 예금 상품은 예금자보호법에 따라 보호됩니다. 대출 상품은 신용도에 따라 한도·금리가 차등 적용됩니다.
        </p>

        <CompareBar items={saved} onClear={() => setSaved([])} />
      </div>
    </div>
  );
}

window.ProductRecommendScreen = ProductRecommendScreen;
