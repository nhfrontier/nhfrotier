/* @ds-bundle: {"format":4,"namespace":"NHDesignSystem_dafb17","components":[{"name":"Artboard","sourcePath":"components/canvas/Artboard.jsx"},{"name":"ArtboardStage","sourcePath":"components/canvas/Artboard.jsx"},{"name":"DiffSlider","sourcePath":"components/canvas/DiffSlider.jsx"},{"name":"AICard","sourcePath":"components/collab/AICard.jsx"},{"name":"ChangeItem","sourcePath":"components/collab/ChangeItem.jsx"},{"name":"CommentCard","sourcePath":"components/collab/CommentCard.jsx"},{"name":"Pin","sourcePath":"components/collab/Pin.jsx"},{"name":"ProjectRow","sourcePath":"components/collab/ProjectRow.jsx"},{"name":"TaskBanner","sourcePath":"components/collab/TaskBanner.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"ChoiceCard","sourcePath":"components/core/ChoiceCard.jsx"},{"name":"Field","sourcePath":"components/core/Field.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Filmstrip","sourcePath":"components/navigation/Filmstrip.jsx"},{"name":"ModeToggle","sourcePath":"components/navigation/ModeToggle.jsx"},{"name":"StepTrail","sourcePath":"components/navigation/StepTrail.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"}],"sourceHashes":{"components/canvas/Artboard.jsx":"383f2f425da1","components/canvas/DiffSlider.jsx":"66da10cb8a3f","components/collab/AICard.jsx":"babf9c0998bf","components/collab/ChangeItem.jsx":"de1dbdced22f","components/collab/CommentCard.jsx":"73b5d12bd732","components/collab/Pin.jsx":"97390de15855","components/collab/ProjectRow.jsx":"7ddc24eb3e3c","components/collab/TaskBanner.jsx":"3c47bac9894f","components/core/Avatar.jsx":"dac300d13ec6","components/core/Badge.jsx":"63c810e673c7","components/core/Button.jsx":"3c5155c61d24","components/core/Card.jsx":"b71ae45dd6fa","components/core/Chip.jsx":"dcda8f420f99","components/core/ChoiceCard.jsx":"9d5f8ae2efd0","components/core/Field.jsx":"72616a693474","components/core/Icon.jsx":"86cb1f88de2c","components/navigation/Filmstrip.jsx":"23644f3ee5bb","components/navigation/ModeToggle.jsx":"a18844454cbc","components/navigation/StepTrail.jsx":"7d944db2270a","components/navigation/TopBar.jsx":"e14d39928d1d","ui_kits/withcanvas/ChangesScreen.jsx":"a40a8b720e0b","ui_kits/withcanvas/ComplianceScreen.jsx":"942cf7161b2b","ui_kits/withcanvas/DecideScreen.jsx":"b6ba7a5b38a4","ui_kits/withcanvas/FilesScreen.jsx":"d8e51bc97991","ui_kits/withcanvas/InviteScreen.jsx":"49f9edcdbfdc","ui_kits/withcanvas/NewProjectScreen.jsx":"f499b5517ce3","ui_kits/withcanvas/NewTaskScreen.jsx":"c3d0dd86141b","ui_kits/withcanvas/ProjectListScreen.jsx":"81d80e4ae9f8","ui_kits/withcanvas/ReviewerScreen.jsx":"a26dea1307f4","ui_kits/withcanvas/Shared.jsx":"200ca2044e7c","ui_kits/withcanvas/WorkspaceScreen.jsx":"12b61be2f9ec"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.NHDesignSystem_dafb17 = window.NHDesignSystem_dafb17 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/canvas/Artboard.jsx
try { (() => {
/**
 * 시안이 놓이는 판. 캔버스에서 유일하게 하얗고 그림자가 있는 것 — 시안이 주인공이다.
 * 실제 제품에서는 children 자리에 샌드박스 iframe이 들어간다
 * (sandbox에 allow-same-origin과 allow-scripts를 동시에 주지 않는다).
 */
function Artboard({
  kind = "mobile",
  width,
  height,
  title,
  picking = false,
  children,
  style
}) {
  const size = kind === "mobile" ? {
    width: width || 300,
    height: height || 620,
    radius: 24
  } : kind === "web" ? {
    width: width || 860,
    height: height || 540,
    radius: 10
  } : {
    width: width || 360,
    height: height || 228,
    radius: 10
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size.width,
      background: "var(--white)",
      borderRadius: size.radius,
      boxShadow: "var(--sh-artboard)",
      overflow: "hidden",
      outline: picking ? "var(--bw-emphasis) solid var(--pick-outline)" : "none",
      outlineOffset: 4,
      display: "flex",
      flexDirection: "column",
      ...style
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px var(--sp-4)",
      background: "var(--nh-blue)",
      color: "#fff",
      font: "var(--type-card-title)"
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: size.height,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }
  }, children));
}

/** 시안이 놓이는 바닥. 캔버스 무대는 앱 배경보다 살짝 어둡다. */
function ArtboardStage({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "var(--surface-sunken)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--sp-8)",
      overflow: "auto",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Artboard, ArtboardStage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/canvas/Artboard.jsx", error: String((e && e.message) || e) }); }

// components/canvas/DiffSlider.jsx
try { (() => {
/**
 * 두 판을 겹쳐 놓고 손잡이를 끌어 비교한다. 바뀐 곳에만 형광펜이 칠해진다.
 * 세로로 두 장을 나란히 놓지 않는다 — 같은 자리에서 겹쳐야 무엇이 바뀌었는지 보인다.
 */
function DiffSlider({
  before,
  after,
  value = 50,
  onChange,
  hint = "손잡이를 좌우로 끌어보세요. 바뀐 곳에만 형광펜이 칠해집니다.",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "var(--sp-4)",
      ...style
    }
  }, hint ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, hint) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, before), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      clipPath: `inset(0 0 0 ${value}%)`
    }
  }, after), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: `${value}%`,
      width: 2,
      background: "var(--nh-blue)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      width: 22,
      height: 22,
      borderRadius: "var(--r-pill)",
      background: "var(--white)",
      border: "2px solid var(--nh-blue)",
      boxShadow: "var(--sh-card)"
    }
  })), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "100",
    value: value,
    onChange: e => onChange && onChange(Number(e.target.value)),
    "aria-label": "\uD310 \uBE44\uAD50 \uC190\uC7A1\uC774",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity: 0,
      cursor: "ew-resize"
    }
  })));
}
Object.assign(__ds_scope, { DiffSlider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/canvas/DiffSlider.jsx", error: String((e && e.message) || e) }); }

// components/collab/Pin.jsx
try { (() => {
/**
 * 캔버스 위 요소를 짚은 표식. 번호 핀 + 짚은 영역 테두리.
 * children으로 감싼 영역이 짚은 대상이 된다.
 */
function Pin({
  number,
  state = "open",
  children,
  label,
  style
}) {
  const outline = state === "decided" ? "var(--nh-yellow)" : state === "ai" ? "var(--nh-blue)" : state === "unresolved" ? "var(--unresolved-outline)" : "var(--pick-outline)";
  const dashed = state === "ai" || state === "unresolved";
  if (state === "none") return /*#__PURE__*/React.createElement("div", {
    style: style
  }, children);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: `${dashed ? "1.5px dashed" : "var(--bw-emphasis) solid"} ${outline}`,
      borderRadius: "var(--r-sm)",
      background: state === "decided" ? "var(--diff-bg)" : state === "pick" ? "var(--pick-fill)" : "transparent"
    }
  }, children), number != null ? /*#__PURE__*/React.createElement("span", {
    title: label,
    style: {
      position: "absolute",
      top: -11,
      left: -11,
      width: 22,
      height: 22,
      borderRadius: "var(--r-pill)",
      background: state === "decided" ? "var(--nh-yellow)" : "var(--pin-bg)",
      color: state === "decided" ? "#4A3600" : "var(--pin-fg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "var(--type-caption)",
      fontWeight: "var(--fw-heavy)",
      boxShadow: "var(--sh-card)"
    }
  }, number) : null);
}
Object.assign(__ds_scope, { Pin });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/collab/Pin.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const HUES = ["var(--nh-blue)", "var(--nh-green)", "var(--blue-700)", "var(--ink-600)", "#7A5A00"];

/** 사람 표식. 성(姓) 한 글자를 쓴다. AI에는 쓰지 않는다 — AI는 Badge tone="ai". */
function Avatar({
  name = "",
  size = 28,
  index,
  style,
  ...rest
}) {
  const key = index ?? (name.length ? name.charCodeAt(0) : 0);
  return /*#__PURE__*/React.createElement("span", _extends({
    title: name,
    style: {
      width: size,
      height: size,
      borderRadius: "var(--r-pill)",
      background: HUES[key % HUES.length],
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: Math.round(size * 0.42),
      fontWeight: "var(--fw-bold)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, rest), name.slice(0, 1));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONE = {
  neutral: {
    background: "var(--ink-50)",
    color: "var(--ink-600)",
    border: "1px solid var(--border-hairline)"
  },
  info: {
    background: "var(--info-bg)",
    color: "var(--info-fg)",
    border: "1px solid var(--info-border)"
  },
  ok: {
    background: "var(--ok-bg)",
    color: "var(--ok-fg)",
    border: "1px solid var(--ok-border)"
  },
  warn: {
    background: "var(--warn-bg)",
    color: "var(--warn-fg)",
    border: "1px solid var(--warn-border)"
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--danger-fg)",
    border: "1px solid var(--danger-border)"
  },
  ai: {
    background: "var(--surface-ai-strong)",
    color: "var(--nh-blue)",
    border: "1px solid var(--border-ai)"
  },
  decided: {
    background: "var(--surface-decided)",
    color: "var(--action-compliance-fg)",
    border: "1px solid var(--border-decided)"
  }
};

/** 상태·분류 배지. 영문 코드가 아니라 사람 말로 쓴다. */
function Badge({
  tone = "neutral",
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 9px",
      borderRadius: "var(--r-pill)",
      font: "var(--type-caption)",
      fontWeight: "var(--fw-bold)",
      whiteSpace: "nowrap",
      ...(TONE[tone] || TONE.neutral),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/collab/ChangeItem.jsx
try { (() => {
/** 이번 판에서 바뀐 것 한 줄. 무엇이 · 누구 의견으로 · 어떤 결정으로 바뀌었는지를 한 카드에 붙인다. */
function ChangeItem({
  index,
  what,
  who,
  byAI = false,
  decision = "반영함",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-card)",
      padding: "var(--sp-4)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--action-compliance-fg)",
      background: "var(--surface-decided)",
      padding: "2px 7px",
      borderRadius: "var(--r-xs)",
      whiteSpace: "nowrap"
    }
  }, "\uBC14\uB01C ", index), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, what)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, byAI ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "ai"
  }, "AI") : /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: who,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, byAI ? `${who} 지적 ·` : `${who}님 의견 ·`), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      fontWeight: "var(--fw-bold)",
      color: "var(--ok-fg)"
    }
  }, decision)));
}
Object.assign(__ds_scope, { ChangeItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/collab/ChangeItem.jsx", error: String((e && e.message) || e) }); }

// components/collab/CommentCard.jsx
try { (() => {
/** 사람이 남긴 의견 한 건. 핀 번호는 사람 의견만 세어 매긴다. */
function CommentCard({
  author,
  pin,
  where,
  body,
  time,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-card)",
      padding: "var(--sp-4)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: author,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, author), pin != null ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "info"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: "var(--fw-heavy)"
    }
  }, pin), where) : null, time ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, time) : null), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-body)"
    }
  }, body));
}
Object.assign(__ds_scope, { CommentCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/collab/CommentCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONE = {
  primary: {
    background: "var(--action-primary)",
    color: "var(--text-on-accent)",
    border: "1px solid var(--action-primary)"
  },
  quiet: {
    background: "var(--action-quiet-bg)",
    color: "var(--ink-800)",
    border: "1px solid var(--border-default)"
  },
  ghost: {
    background: "transparent",
    color: "var(--ink-700)",
    border: "1px solid transparent"
  },
  compliance: {
    background: "var(--surface-decided)",
    color: "var(--action-compliance-fg)",
    border: "1px solid var(--action-compliance)"
  },
  danger: {
    background: "var(--white)",
    color: "var(--danger-fg)",
    border: "1px solid var(--danger-border)"
  }
};
const SIZE = {
  sm: {
    minHeight: 32,
    padding: "0 12px",
    fontSize: "var(--fs-label)",
    borderRadius: "var(--r-control)"
  },
  md: {
    minHeight: 40,
    padding: "0 16px",
    fontSize: "var(--fs-body-sm)",
    borderRadius: "var(--r-control)"
  },
  lg: {
    minHeight: 48,
    padding: "0 22px",
    fontSize: "var(--fs-body)",
    borderRadius: "var(--r-control)"
  }
};

/** 액션 버튼. 한 화면에 primary는 하나뿐이다. */
function Button({
  tone = "quiet",
  size = "md",
  disabled = false,
  fullWidth = false,
  shortcut,
  children,
  style,
  ...rest
}) {
  const s = {
    ...(TONE[tone] || TONE.quiet),
    ...(SIZE[size] || SIZE.md),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--font-sans)",
    fontWeight: "var(--fw-bold)",
    letterSpacing: "var(--tracking-normal)",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "var(--transition-control)",
    width: fullWidth ? "100%" : "auto",
    whiteSpace: "nowrap",
    ...(disabled ? {
      background: "var(--action-disabled-bg)",
      color: "var(--action-disabled-fg)",
      border: "1px solid var(--action-disabled-bg)"
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    style: s
  }, rest), children, shortcut ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 18,
      height: 18,
      borderRadius: 4,
      fontSize: 11,
      fontWeight: "var(--fw-bold)",
      background: tone === "primary" ? "rgba(255,255,255,.22)" : "var(--ink-100)",
      color: tone === "primary" ? "#fff" : "var(--ink-600)"
    }
  }, shortcut) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/collab/AICard.jsx
try { (() => {
/**
 * AI가 짚은 것 한 건. [근거 인용 → 왜 짚었나 → 이렇게 하자는 제안] 순서를 바꾸지 않는다.
 * 배경 톤(--surface-ai)과 좌측 보더로 사람 카드와 구분한다.
 */
function AICard({
  kind = "책임성 검토",
  axis,
  where,
  quote,
  reason,
  suggestion,
  decision,
  onDecide,
  compliance = false,
  undoNote = "되돌리기는 언제든 됩니다",
  style
}) {
  const decided = Boolean(decision);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: decided ? "var(--surface-decided)" : "var(--surface-ai)",
      border: `1px solid ${decided ? "var(--border-decided)" : "var(--border-ai)"}`,
      borderLeft: `var(--bw-accent-edge) solid ${decided ? "var(--nh-yellow)" : "var(--nh-blue)"}`,
      borderRadius: "var(--r-card)",
      padding: "var(--pad-card)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-4)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "ai"
  }, "AI"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, kind), axis ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "info"
  }, axis) : null, where ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, where) : null), quote ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 6
    }
  }, "\uD654\uBA74\uC5D0 \uC788\uB294 \uB9D0"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm, var(--type-body))",
      fontSize: "var(--fs-body-sm)",
      color: "var(--ink-700)",
      borderLeft: "2px solid var(--border-strong)",
      paddingLeft: 12
    }
  }, quote)) : null, reason ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 4
    }
  }, "\uC65C \uC9DA\uC5C8\uB098"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      fontWeight: "var(--fw-bold)",
      color: "var(--text-title)"
    }
  }, reason)) : null, suggestion ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-sm)",
      padding: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 4
    }
  }, "\uC774\uB807\uAC8C \uD558\uC790\uB294 \uC81C\uC548"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      color: "var(--text-body)"
    }
  }, suggestion)) : null, decided ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "decided"
  }, decision), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uACB0\uC815\uC774 \uAE30\uB85D\uC5D0 \uB0A8\uC558\uC2B5\uB2C8\uB2E4")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    tone: "primary",
    shortcut: 1,
    onClick: () => onDecide && onDecide("반영")
  }, "\uBC18\uC601"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    tone: "quiet",
    shortcut: 2,
    onClick: () => onDecide && onDecide("보류")
  }, "\uBCF4\uB958"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    tone: "quiet",
    shortcut: 3,
    onClick: () => onDecide && onDecide("반려")
  }, "\uBC18\uB824"), compliance ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    tone: "compliance",
    shortcut: 4,
    onClick: () => onDecide && onDecide("준법 검토 요청")
  }, "\uC900\uBC95\uC5D0 \uB118\uAE30\uAE30") : null), undoNote && !decided ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, "\u21A9 ", undoNote) : null);
}
Object.assign(__ds_scope, { AICard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/collab/AICard.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SURFACE = {
  plain: {
    background: "var(--surface-card)",
    border: "1px solid var(--border-hairline)"
  },
  ai: {
    background: "var(--surface-ai)",
    border: "1px solid var(--border-ai)",
    borderLeft: "var(--bw-accent-edge) solid var(--nh-blue)"
  },
  decided: {
    background: "var(--surface-decided)",
    border: "1px solid var(--border-decided)"
  },
  quiet: {
    background: "var(--ink-50)",
    border: "1px solid var(--border-hairline)"
  }
};

/** 컨테이너. AI가 말하는 자리는 surface="ai"로 배경 톤을 바꿔 사람 카드와 구분한다. */
function Card({
  surface = "plain",
  interactive = false,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: "var(--r-card)",
      padding: "var(--pad-card)",
      boxShadow: interactive ? "var(--sh-card)" : "var(--sh-flat)",
      transition: "var(--transition-control)",
      cursor: interactive ? "pointer" : "default",
      ...(SURFACE[surface] || SURFACE.plain),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 고르는 칩. 비디자이너가 문장 대신 고를 수 있게 만든 입력 수단. */
function Chip({
  selected = false,
  children,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-pressed": selected,
    style: {
      minHeight: 38,
      padding: "0 16px",
      borderRadius: "var(--r-chip)",
      cursor: "pointer",
      font: "var(--type-label)",
      letterSpacing: "var(--tracking-normal)",
      background: "var(--white)",
      color: selected ? "var(--nh-blue)" : "var(--ink-600)",
      border: selected ? "var(--bw-emphasis) solid var(--nh-blue)" : "1px solid var(--border-default)",
      transition: "var(--transition-control)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/ChoiceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 두세 개 중 하나를 고르는 큰 카드. 라벨 + 한 줄 예시로 구성한다. */
function ChoiceCard({
  label,
  hint,
  icon,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-pressed": selected,
    style: {
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: "var(--sp-4)",
      minWidth: 150,
      cursor: "pointer",
      background: selected ? "var(--blue-50)" : "var(--white)",
      border: selected ? "var(--bw-emphasis) solid var(--nh-blue)" : "1px solid var(--border-default)",
      borderRadius: "var(--r-card)",
      transition: "var(--transition-control)",
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: selected ? "var(--nh-blue)" : "var(--ink-400)",
      display: "flex"
    }
  }, icon) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-card-title)",
      color: selected ? "var(--nh-blue)" : "var(--text-title)"
    }
  }, label), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { ChoiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ChoiceCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 입력칸. 라벨은 업무 언어로 묻고, placeholder에 실제 예시 문장을 넣는다. */
function Field({
  label,
  hint,
  multiline = false,
  rows = 3,
  assist,
  style,
  ...rest
}) {
  const control = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: "var(--r-control)",
    border: "1px solid var(--border-default)",
    background: "var(--white)",
    font: "var(--type-body)",
    color: "var(--text-body)",
    resize: "vertical",
    outline: "none"
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, label, hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      fontWeight: "var(--fw-regular)",
      marginLeft: 8
    }
  }, hint) : null) : null, multiline ? /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    style: control
  }, rest)) : /*#__PURE__*/React.createElement("input", _extends({
    style: control
  }, rest)), assist ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, assist) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Field.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Lucide 아이콘 래퍼. CDN 스크립트가 <i data-lucide>를 SVG로 바꾼다. */
function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  color = "currentColor",
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) window.lucide.createIcons({
      nameAttr: "data-lucide",
      root: ref.current
    });
  });
  return /*#__PURE__*/React.createElement("i", _extends({
    ref: ref,
    "data-lucide": name,
    style: {
      display: "inline-flex",
      width: size,
      height: size,
      color,
      strokeWidth,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/collab/ProjectRow.jsx
try { (() => {
/** 프로젝트 한 건. 목록에서는 이름·상태·지금 할 일·사람만 보여준다. */
function ProjectRow({
  name,
  status,
  statusTone = "info",
  next,
  people = [],
  when,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-card)",
      padding: "var(--sp-5)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)",
      cursor: onClick ? "pointer" : "default",
      boxShadow: "var(--sh-card)",
      transition: "var(--transition-control)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-card-title)",
      color: "var(--text-title)"
    }
  }, name), status ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: statusTone
  }, status) : null), next ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-body)"
    }
  }, next) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      flexShrink: 0
    }
  }, people.map((p, i) => /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    key: p,
    name: p,
    size: 24,
    index: i,
    style: {
      marginLeft: i ? -6 : 0,
      boxShadow: "0 0 0 2px var(--white)"
    }
  }))), when ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      flexShrink: 0,
      minWidth: 72,
      textAlign: "right"
    }
  }, when) : null, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 18,
    color: "var(--ink-300)"
  }));
}
Object.assign(__ds_scope, { ProjectRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/collab/ProjectRow.jsx", error: String((e && e.message) || e) }); }

// components/collab/TaskBanner.jsx
try { (() => {
/**
 * "지금 할 일" 띠. 화면에 들어온 사람이 다음에 무엇을 눌러야 하는지 한 줄로 알려준다.
 * 대시보드 대신 이것을 둔다 — 카드 여러 장으로 나누지 않는다.
 */
function TaskBanner({
  eyebrow = "지금 할 일",
  headline,
  detail,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  icon = "zap",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-lg)",
      padding: "var(--sp-6)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-5)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "var(--r-md)",
      background: "var(--blue-50)",
      color: "var(--nh-blue)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      fontWeight: "var(--fw-bold)",
      color: "var(--nh-blue)",
      marginBottom: 4
    }
  }, eyebrow), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-section)",
      color: "var(--text-title)"
    }
  }, headline), detail ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, detail) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexShrink: 0
    }
  }, secondaryLabel ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    tone: "quiet",
    size: "lg",
    onClick: onSecondary
  }, secondaryLabel) : null, primaryLabel ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    tone: "primary",
    size: "lg",
    onClick: onPrimary
  }, primaryLabel) : null));
}
Object.assign(__ds_scope, { TaskBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/collab/TaskBanner.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Filmstrip.jsx
try { (() => {
const STATE = {
  done: {
    border: "1px solid var(--border-default)",
    background: "var(--white)"
  },
  current: {
    border: "var(--bw-emphasis) solid var(--nh-blue)",
    background: "var(--white)"
  },
  waiting: {
    border: "1px dashed var(--border-strong)",
    background: "var(--ink-50)"
  },
  failed: {
    border: "1px solid var(--danger-border)",
    background: "var(--danger-bg)"
  }
};

/** 화면 필름스트립. 한 판이 화면 여러 장을 가질 때 아래에 깔린다. */
function Filmstrip({
  label = "화면",
  items = [],
  current = 0,
  onSelect,
  right,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "var(--rail-h)",
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)",
      padding: "0 var(--sp-6)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      flexShrink: 0
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--sp-2)",
      overflowX: "auto",
      flex: 1
    }
  }, items.map((it, i) => {
    const st = i === current ? "current" : it.state || "done";
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      onClick: () => onSelect && onSelect(i),
      title: it.title,
      style: {
        width: 44,
        height: 64,
        borderRadius: "var(--r-xs)",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0,
        position: "relative",
        transition: "var(--transition-control)",
        ...STATE[st]
      }
    }, i === current ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        bottom: -7,
        left: "50%",
        transform: "translateX(-50%)",
        width: 4,
        height: 4,
        borderRadius: "var(--r-pill)",
        background: "var(--nh-blue)"
      }
    }) : null);
  })), right ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexShrink: 0
    }
  }, right) : null);
}
Object.assign(__ds_scope, { Filmstrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Filmstrip.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ModeToggle.jsx
try { (() => {
/** 두세 개 모드 전환. 이 제품에서 모드는 "보기"와 "짚기" 둘뿐이다. */
function ModeToggle({
  options = [],
  value,
  onChange,
  note,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--sp-3)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      background: "var(--white)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--r-control)",
      padding: 3,
      gap: 2,
      flexShrink: 0
    }
  }, options.map(o => {
    const on = o.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      type: "button",
      onClick: () => onChange && onChange(o.value),
      "aria-pressed": on,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 32,
        padding: "0 14px",
        border: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        borderRadius: "var(--r-xs)",
        font: "var(--type-label)",
        transition: "var(--transition-control)",
        background: on ? "var(--nh-blue)" : "transparent",
        color: on ? "#fff" : "var(--ink-600)"
      }
    }, o.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: o.icon,
      size: 15
    }) : null, o.label);
  })), note ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, note) : null);
}
Object.assign(__ds_scope, { ModeToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ModeToggle.jsx", error: String((e && e.message) || e) }); }

// components/navigation/StepTrail.jsx
try { (() => {
/**
 * 단계 띠. DRAFT·ACTIVE·REVIEW 같은 상태 코드 대신 "지금 무슨 단계인지" 말로 쓴다.
 */
function StepTrail({
  steps = [],
  current = 0,
  note,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-3)",
      padding: "var(--sp-4) var(--sp-6)",
      background: "var(--surface-card)",
      borderBottom: "1px solid var(--border-hairline)",
      ...style
    }
  }, steps.map((label, i) => {
    const done = i < current,
      active = i === current;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: label
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: "var(--r-pill)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: "var(--type-caption)",
        fontWeight: "var(--fw-heavy)",
        background: active ? "var(--nh-blue)" : done ? "var(--ok-bg)" : "var(--ink-100)",
        color: active ? "#fff" : done ? "var(--ok-fg)" : "var(--ink-400)"
      }
    }, done ? "✓" : i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-label)",
        color: active ? "var(--text-title)" : done ? "var(--ok-fg)" : "var(--text-faint)"
      }
    }, label)), i < steps.length - 1 ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 36,
        height: 1,
        background: "var(--border-default)"
      }
    }) : null);
  }), note ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, note) : null);
}
Object.assign(__ds_scope, { StepTrail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/StepTrail.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
/**
 * 상단바. 이 제품은 전역 메뉴를 두지 않는다 — 지금 보고 있는 것의 이름과,
 * 지금 화면에서 할 수 있는 것만 놓는다.
 */
function TopBar({
  title,
  crumb,
  status,
  statusTone = "info",
  right,
  user,
  note,
  logoSrc,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: "var(--bar-h)",
      background: "var(--surface-bar)",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)",
      padding: "0 var(--sp-6)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "var(--r-sm)",
      background: "var(--white)",
      border: "1px solid var(--border-default)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden"
    }
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "NH",
    style: {
      width: 20,
      height: 20,
      objectFit: "contain"
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      fontWeight: "var(--fw-heavy)",
      color: "var(--nh-blue)"
    }
  }, "NH")), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-card-title)",
      color: "var(--text-title)",
      whiteSpace: "nowrap"
    }
  }, title), crumb ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-sm, var(--type-body))",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-muted)"
    }
  }, "\uFF0F ", crumb) : null, status ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: statusTone
  }, status) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-3)"
    }
  }, note ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, note) : null, right, user ? /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: user
  }) : null));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/ChangesScreen.jsx
try { (() => {
const {
  TopBar,
  Button,
  Artboard,
  ArtboardStage,
  DiffSlider,
  ChangeItem,
  Card
} = window.NHDesignSystem_dafb17;

/** 무엇이 바뀌었나 — Version 비교를 "판"과 "바뀜"이라는 말로 바꿔 보여준다. */
function ChangesScreen({
  go
}) {
  const [v, setV] = React.useState(52);
  const board = fixed => /*#__PURE__*/React.createElement(Artboard, {
    kind: "mobile",
    width: 300,
    height: 560,
    title: "\uBE44\uB300\uBA74 \uACC4\uC88C \uC2E0\uCCAD"
  }, /*#__PURE__*/React.createElement(AccountMock, {
    fixed: fixed,
    pins: false
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uACE0\uAC1D \uD3EC\uD138 \uB9AC\uB274\uC5BC",
    crumb: "\uBB34\uC5C7\uC774 \uBC14\uB00C\uC5C8\uB098",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    note: "Version \xB7 History \xB7 Export \uB77C\uB294 \uB9D0\uC744 \uC4F0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("workspace")
    }, "\uAE30\uB85D"), /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "\uB0B4\uB824\uBC1B\uAE30"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--sp-4) var(--sp-6)",
      background: "var(--surface-card)",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-faint)"
    }
  }, "3\uBC88\uC9F8 \uD310"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-300)"
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--nh-blue)"
    }
  }, "4\uBC88\uC9F8 \uD310 (\uC9C0\uAE08)")), /*#__PURE__*/React.createElement(ArtboardStage, null, /*#__PURE__*/React.createElement(DiffSlider, {
    value: v,
    onChange: setV,
    before: board(false),
    after: board(true)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      padding: "var(--sp-4) var(--sp-6)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, "\uD310 \uACE0\uB974\uAE30"), [["1번째 판", "9/2 첫 초안"], ["2번째 판", "9/4 문구 수정"], ["3번째 판", "9/6 비교 대상"], ["4번째 판", "9/8 지금 보는 것"]].map(([t, s], i) => /*#__PURE__*/React.createElement("button", {
    key: t,
    type: "button",
    style: {
      textAlign: "left",
      padding: "8px 12px",
      borderRadius: "var(--r-control)",
      cursor: "pointer",
      background: "var(--white)",
      border: i === 3 ? "var(--bw-emphasis) solid var(--nh-blue)" : "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-label)",
      color: i === 3 ? "var(--nh-blue)" : "var(--text-title)"
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, s))))), /*#__PURE__*/React.createElement(Panel, {
    title: "\uC774\uBC88\uC5D0 \uBC14\uB010 \uAC83 3\uAC00\uC9C0"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uBB34\uC5C7\uC774 \xB7 \uB204\uAD6C \uC758\uACAC\uC73C\uB85C \xB7 \uC5B4\uB5A4 \uACB0\uC815\uC73C\uB85C \uBC14\uB00C\uC5C8\uB294\uC9C0 \uD55C \uC904\uB85C \uBD99\uC5EC\uB461\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(ChangeItem, {
    index: 1,
    what: "\uC57D\uAD00\uC5D0 \uD544\uC218\xB7\uC120\uD0DD \uD45C\uC2DC\uAC00 \uBD99\uC5C8\uC2B5\uB2C8\uB2E4",
    who: "\uBC15\uC120\uC601"
  }), /*#__PURE__*/React.createElement(ChangeItem, {
    index: 2,
    what: "\uC218\uC218\uB8CC \uC548\uB0B4\uC5D0 \uC22B\uC790\uB97C \uB123\uC5C8\uC2B5\uB2C8\uB2E4",
    who: "\uAE08\uC735\uC18C\uBE44\uC790\uBCF4\uD638",
    byAI: true
  }), /*#__PURE__*/React.createElement(ChangeItem, {
    index: 3,
    what: '버튼 문구를 "신청하기"로 바꿨습니다',
    who: "\uC774\uC900\uD638"
  }), /*#__PURE__*/React.createElement(Card, {
    surface: "quiet"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: 4
    }
  }, "\uBC18\uC601\uD558\uC9C0 \uC54A\uC740 \uC758\uACAC 2\uAC74"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uBCF4\uB958\uD55C \uC774\uC720\uAC00 \uAC19\uC774 \uB0A8\uC544 \uC788\uC5B4, \uB2E4\uC74C\uC5D0 \uC65C \uC548 \uD588\uB294\uC9C0 \uB2E4\uC2DC \uBB3B\uC9C0 \uC54A\uAC8C \uB429\uB2C8\uB2E4.")))));
}
Object.assign(window, {
  ChangesScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/ChangesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/ComplianceScreen.jsx
try { (() => {
const {
  TopBar,
  Button,
  Card,
  Badge,
  Avatar,
  Field,
  Chip,
  Icon
} = window.NHDesignSystem_dafb17;
const HANDOVER = [{
  id: 1,
  project: "비대면 계좌 신청 개선",
  where: "화면 3 · 수수료 안내",
  axis: "금융소비자보호",
  quote: "중도해지 시 약정 금리가 적용되지 않을 수 있으며 관련 수수료가 발생할 수 있습니다.",
  reason: '불리한 조건을 "있을 수 있습니다"로만 적어, 고객이 실제로 무엇을 얼마나 손해 보는지 알 수 없습니다.',
  from: "김민준",
  note: "금리 숫자는 상품부 확인이 필요해 저희가 판단하기 어렵습니다.",
  when: "2시간 전"
}, {
  id: 2,
  project: "NH 청년 우대 체크카드",
  where: "시안 2 · 혜택 표기",
  axis: "표현",
  quote: "최대 5만원 캐시백",
  reason: '"최대"의 조건(전월 실적 30만원 이상)이 같은 화면에 없어 과장 표현이 될 수 있습니다.',
  from: "박준혁",
  note: "홍보물 문구 규정을 어디까지 적용해야 하는지 확인 부탁드립니다.",
  when: "어제"
}];

/** 준법 담당자 화면 — 넘겨받은 지적만 보인다. 화면을 만들거나 판을 바꾸는 버튼이 없다. */
function ComplianceScreen({
  go
}) {
  const [i, setI] = React.useState(0);
  const [verdict, setVerdict] = React.useState(null);
  const [basis, setBasis] = React.useState("");
  const item = HANDOVER[i];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uC900\uBC95 \uAC80\uD1A0",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uCD5C\uC9C0\uC6B0",
    status: `넘겨받은 건 ${HANDOVER.length}`,
    statusTone: "warn",
    note: "\uD654\uBA74\uC744 \uACE0\uCE58\uB294 \uAD8C\uD55C\uC740 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uD310\uB2E8\uB9CC \uB0A8\uAE41\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("list")
    }, "\uB098\uAC00\uAE30")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 300,
      flexShrink: 0,
      background: "var(--surface-card)",
      borderRight: "1px solid var(--border-hairline)",
      padding: "var(--sp-5)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-2)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: "var(--sp-2)"
    }
  }, "\uB118\uACA8\uBC1B\uC740 \uC9C0\uC801"), HANDOVER.map((h, j) => /*#__PURE__*/React.createElement("button", {
    key: h.id,
    type: "button",
    onClick: () => {
      setI(j);
      setVerdict(null);
    },
    style: {
      textAlign: "left",
      padding: "var(--sp-4)",
      borderRadius: "var(--r-card)",
      cursor: "pointer",
      transition: "var(--transition-control)",
      background: i === j ? "var(--blue-50)" : "var(--white)",
      border: i === j ? "var(--bw-emphasis) solid var(--nh-blue)" : "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "warn"
  }, h.axis), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, h.when)), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, h.project), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginTop: 3
    }
  }, h.where))), /*#__PURE__*/React.createElement(Card, {
    surface: "quiet",
    style: {
      marginTop: "auto"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      lineHeight: 1.7
    }
  }, "\uB2F4\uB2F9\uC790\uAC00 \uC2A4\uC2A4\uB85C \uD310\uB2E8\uD558\uC9C0 \uC54A\uACE0 \uB118\uAE34 \uAC83\uB9CC \uC5EC\uAE30 \uC635\uB2C8\uB2E4. AI\uAC00 \uC790\uB3D9\uC73C\uB85C \uB118\uAE30\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--sp-10)",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 640,
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      marginBottom: 6
    }
  }, item.project), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)"
    }
  }, item.where, " \xB7 ", item.from, "\uB2D8\uC774 \uB118\uAE40")), /*#__PURE__*/React.createElement(Card, {
    surface: "ai",
    style: {
      borderLeft: "var(--bw-accent-edge) solid var(--nh-blue)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "ai"
  }, "AI"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, "\uCC45\uC784\uC131 \uAC80\uD1A0"), /*#__PURE__*/React.createElement(Badge, {
    tone: "info"
  }, item.axis)), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 6
    }
  }, "\uD654\uBA74\uC5D0 \uC788\uB294 \uB9D0"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-body-sm)",
      color: "var(--ink-700)",
      borderLeft: "2px solid var(--border-strong)",
      paddingLeft: 12,
      marginBottom: "var(--sp-4)"
    }
  }, item.quote), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 4
    }
  }, "\uC65C \uC9DA\uC5C8\uB098"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      fontWeight: 700,
      color: "var(--text-title)"
    }
  }, item.reason)), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: item.from,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, item.from, "\uB2D8\uC774 \uB0A8\uAE34 \uB9D0")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-body)"
    }
  }, item.note)), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: "var(--sp-3)"
    }
  }, "\uC900\uBC95 \uD310\uB2E8"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      marginBottom: "var(--sp-5)",
      flexWrap: "wrap"
    }
  }, [["적합", "ok"], ["조건부 적합", "warn"], ["부적합", "danger"]].map(([label, tone]) => /*#__PURE__*/React.createElement(Chip, {
    key: label,
    selected: verdict === label,
    onClick: () => setVerdict(label)
  }, label))), /*#__PURE__*/React.createElement(Field, {
    multiline: true,
    rows: 3,
    label: "\uADFC\uAC70 \uADDC\uC815\uACFC \uD310\uB2E8 \uC774\uC720",
    value: basis,
    onChange: e => setBasis(e.target.value),
    placeholder: "\uC608: \uAE08\uC735\uC18C\uBE44\uC790\uBCF4\uD638\uBC95 \uC81C19\uC870 \uC124\uBA85\uC758\uBB34 \u2014 \uBD88\uB9AC\uD55C \uC870\uAC74\uC740 \uAD6C\uCCB4\uC801 \uC218\uCE58\uB85C \uD45C\uC2DC\uD574\uC57C \uD569\uB2C8\uB2E4",
    assist: "\uC5EC\uAE30 \uC801\uC740 \uB0B4\uC6A9\uC774 \uADF8\uB300\uB85C \uB2F4\uB2F9\uC790\uC5D0\uAC8C \uB3CC\uC544\uAC00\uACE0, \uAE30\uB85D\uC5D0 \uB0A8\uC2B5\uB2C8\uB2E4"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-3)",
      marginTop: "var(--sp-5)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, verdict ? `"${verdict}"으로 ${item.from}님에게 돌아갑니다` : "판단을 고르면 담당자에게 돌아갑니다"), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "lg",
    disabled: !verdict,
    style: {
      marginLeft: "auto"
    },
    onClick: () => {
      setVerdict(null);
      setBasis("");
      setI((i + 1) % HANDOVER.length);
    }
  }, "\uB2F4\uB2F9\uC790\uC5D0\uAC8C \uB3CC\uB824\uBCF4\uB0B4\uAE30")))))));
}
Object.assign(window, {
  ComplianceScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/ComplianceScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/DecideScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  TopBar,
  Button,
  AICard,
  CommentCard,
  Badge
} = window.NHDesignSystem_dafb17;
const QUEUE = [{
  type: "ai",
  kind: "책임성 검토",
  axis: "금융소비자보호",
  where: "화면 3 · 수수료 안내",
  compliance: true,
  quote: "중도해지 시 약정 금리가 적용되지 않을 수 있으며 관련 수수료가 발생할 수 있습니다.",
  reason: '불리한 조건을 "있을 수 있습니다"로만 적어, 고객이 실제로 무엇을 얼마나 손해 보는지 알 수 없습니다.',
  suggestion: "중도해지 금리를 숫자로 적고, 수수료가 없으면 없다고 명시합니다."
}, {
  type: "human",
  author: "박선영",
  pin: 1,
  where: "약관 동의",
  body: "필수인지 선택인지 구분이 안 돼요. 다 눌러야 하는 건지 모르겠습니다."
}, {
  type: "ai",
  kind: "UX 리스크 검토",
  axis: "다크패턴",
  where: "화면 3 · 다음 버튼",
  compliance: false,
  quote: "다음",
  reason: "약관을 다 읽지 않아도 다음으로 넘어가지는데, 무엇에 동의한 것인지 확인하는 자리가 없습니다.",
  suggestion: '버튼 문구를 "신청하기"로 바꾸고 동의 항목 수를 버튼 위에 표시합니다.'
}];

/** 한 장씩 결정하기 — 한 화면에 한 장만 둔다. 목록으로 늘어놓으면 무엇을 처리했는지 놓친다. */
function DecideScreen({
  go
}) {
  const [i, setI] = React.useState(0);
  const [done, setDone] = React.useState([]);
  const total = 11;
  const item = QUEUE[i % QUEUE.length];
  const decide = d => {
    setDone([...done, d]);
    setI(i + 1);
  };
  React.useEffect(() => {
    const onKey = e => {
      if (["1", "2", "3", "4"].includes(e.key)) decide(["반영", "보류", "반려", "준법 검토 요청"][Number(e.key) - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const progress = Math.min(done.length / total, 1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uD55C \uC7A5\uC529 \uACB0\uC815\uD558\uAE30",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    status: `${total}개 중 ${Math.min(done.length + 1, total)}번째`,
    statusTone: "info",
    note: "\uB098\uAC00\uB3C4 \uC5EC\uAE30\uAE4C\uC9C0 \uC800\uC7A5\uB429\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("workspace")
    }, "\uB098\uC911\uC5D0")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      background: "var(--ink-100)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${progress * 100}%`,
      background: "var(--nh-blue)",
      transition: "width var(--dur-calm) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--sp-10)",
      position: "relative"
    }
  }, done.length >= total ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      maxWidth: 460
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      marginBottom: 8
    }
  }, "11\uAC1C \uB2E4 \uACB0\uC815\uD588\uC2B5\uB2C8\uB2E4"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)",
      marginBottom: "var(--sp-6)"
    }
  }, "\uBC18\uC601\uD55C \uC758\uACAC\uC73C\uB85C 5\uBC88\uC9F8 \uD310\uC744 \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBCF4\uB958\uD55C \uAC83\uC740 \uC774\uC720\uAC00 \uD568\uAED8 \uB0A8\uC544 \uC788\uC5B4, \uB2E4\uC74C\uC5D0 \uC65C \uC548 \uD588\uB294\uC9C0 \uB2E4\uC2DC \uBB3B\uC9C0 \uC54A\uAC8C \uB429\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "lg",
    onClick: () => go("changes")
  }, "\uBC18\uC601\uD574\uC11C \uC0C8 \uD310 \uB9CC\uB4E4\uAE30")) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 660,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -8,
      left: 14,
      right: 14,
      height: 20,
      background: "var(--white)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-card)",
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1,
      boxShadow: "var(--sh-raised)",
      borderRadius: "var(--r-card)"
    }
  }, item.type === "ai" ? /*#__PURE__*/React.createElement(AICard, _extends({}, item, {
    onDecide: decide
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-card)",
      padding: "var(--pad-card)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement(CommentCard, {
    author: item.author,
    pin: item.pin,
    where: item.where,
    body: item.body,
    style: {
      border: "none",
      padding: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    shortcut: 1,
    onClick: () => decide("반영")
  }, "\uBC18\uC601"), /*#__PURE__*/React.createElement(Button, {
    shortcut: 2,
    onClick: () => decide("보류")
  }, "\uBCF4\uB958"), /*#__PURE__*/React.createElement(Button, {
    shortcut: 3,
    onClick: () => decide("반려")
  }, "\uBC18\uB824")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, "\u21A9 \uB418\uB3CC\uB9AC\uAE30\uB294 \uC5B8\uC81C\uB4E0 \uB429\uB2C8\uB2E4"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      padding: "var(--sp-5) var(--pad-page)",
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uD55C \uD654\uBA74\uC5D0 \uD55C \uC7A5\uB9CC \uB461\uB2C8\uB2E4. \uBAA9\uB85D\uC73C\uB85C \uB298\uC5B4\uB193\uC73C\uBA74 \uC5B4\uB290 \uAC83\uC744 \uCC98\uB9AC\uD588\uB294\uC9C0 \uB193\uCE69\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, [1, 2, 3].map(n => /*#__PURE__*/React.createElement(Badge, {
    key: n,
    tone: "neutral"
  }, n)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, "\uD0A4\uB85C\uB3C4 \uB429\uB2C8\uB2E4"))));
}
Object.assign(window, {
  DecideScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/DecideScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/FilesScreen.jsx
try { (() => {
const {
  TopBar,
  StepTrail,
  Button,
  Card,
  Badge,
  Icon
} = window.NHDesignSystem_dafb17;
const FILES = [{
  name: "비대면계좌_기획서_v3.docx",
  size: "1.2MB",
  who: "김민준",
  when: "방금",
  read: true,
  note: "AI가 화면 요건을 여기서 읽습니다"
}, {
  name: "화면정의서_계좌개설.xlsx",
  size: "480KB",
  who: "김민준",
  when: "방금",
  read: true,
  note: "화면 목록과 항목명을 여기서 읽습니다"
}, {
  name: "계좌개설_API명세_v2.md",
  size: "64KB",
  who: "이준호",
  when: "12분 전",
  read: true,
  note: "개발 담당자가 올림 · 응답 항목을 화면과 맞춥니다"
}, {
  name: "약관_전문_2026.pdf",
  size: "3.4MB",
  who: "최지우",
  when: "1시간 전",
  read: false,
  note: "분량이 커서 읽기에서 빼두었습니다"
}];

/** 참고자료 업로드 — AI가 무엇을 읽고 만드는지 사용자가 통제하는 자리. */
function FilesScreen({
  go
}) {
  const [files, setFiles] = React.useState(FILES);
  const [over, setOver] = React.useState(false);
  const toggle = i => setFiles(files.map((f, j) => j === i ? {
    ...f,
    read: !f.read
  } : f));
  const reading = files.filter(f => f.read).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--surface-canvas)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uBE44\uB300\uBA74 \uACC4\uC88C \uC2E0\uCCAD \uAC1C\uC120",
    crumb: "\uCC38\uACE0\uC790\uB8CC",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    note: "\uC62C\uB9B0 \uC790\uB8CC\uB294 \uC774 \uC791\uC5C5 \uC548\uC5D0\uB9CC \uC788\uC2B5\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("invite")
    }, "\uAC80\uD1A0\uC790 \uCD08\uB300")
  }), /*#__PURE__*/React.createElement(StepTrail, {
    steps: ["자료 준비", "초안 만들기", "의견 모으기", "반영해서 새 판", "마무리"],
    current: 0,
    note: `AI가 읽을 자료 ${reading}개`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: "var(--content-max)",
      width: "100%",
      margin: "0 auto",
      padding: "var(--sp-10) var(--pad-page)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-6)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      marginBottom: 6
    }
  }, "\uBB34\uC5C7\uC744 \uBCF4\uACE0 \uB9CC\uB4E4\uAE4C\uC694"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)"
    }
  }, "\uAE30\uD68D\uC11C\xB7\uD654\uBA74\uC815\uC758\uC11C\xB7API \uBA85\uC138\uB97C \uC62C\uB9AC\uBA74 AI\uAC00 \uADF8\uAC83\uBD80\uD130 \uC77D\uC2B5\uB2C8\uB2E4. \uC62C\uB9AC\uC9C0 \uC54A\uC544\uB3C4 \uB9CC\uB4E4 \uC218\uB294 \uC788\uC9C0\uB9CC, \uADF8\uB7EC\uBA74 \uC774 \uC5C5\uBB34\uC758 \uB9E5\uB77D \uC5C6\uC774 \uC77C\uBC18\uC801\uC778 \uD654\uBA74\uC774 \uB098\uC635\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", {
    onDragOver: e => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: e => {
      e.preventDefault();
      setOver(false);
    },
    style: {
      border: `1.5px dashed ${over ? "var(--nh-blue)" : "var(--border-strong)"}`,
      borderRadius: "var(--r-lg)",
      background: over ? "var(--pick-fill)" : "var(--white)",
      padding: "var(--sp-10)",
      textAlign: "center",
      transition: "var(--transition-control)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    size: 22,
    color: "var(--ink-400)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-card-title)",
      color: "var(--text-title)",
      margin: "var(--sp-3) 0 4px"
    }
  }, "\uC5EC\uAE30\uB85C \uB04C\uC5B4\uB2E4 \uB193\uC73C\uC138\uC694"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, "hwp \xB7 docx \xB7 xlsx \xB7 pdf \xB7 md \xB7 png \xB7 \uD55C \uAC1C 50MB\uAE4C\uC9C0"), /*#__PURE__*/React.createElement(Button, {
    style: {
      marginTop: "var(--sp-4)"
    }
  }, "\uD30C\uC77C \uACE0\uB974\uAE30")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginBottom: "var(--sp-3)"
    }
  }, /*#__PURE__*/React.createElement("h2", null, "\uC62C\uB9B0 \uC790\uB8CC ", files.length, "\uAC1C"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, "\uC624\uB978\uCABD \uC2A4\uC704\uCE58\uB97C \uB044\uBA74 \uADF8 \uC790\uB8CC\uB294 AI\uAC00 \uC77D\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-2)"
    }
  }, files.map((f, i) => /*#__PURE__*/React.createElement(Card, {
    key: f.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)",
      padding: "var(--sp-4) var(--sp-5)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 18,
    color: "var(--ink-400)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, f.name), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      marginTop: 2
    }
  }, f.size, " \xB7 ", f.who, "\uB2D8\uC774 ", f.when, " \uC62C\uB9BC \xB7 ", f.note)), /*#__PURE__*/React.createElement(Badge, {
    tone: f.read ? "ok" : "neutral"
  }, f.read ? "AI가 읽습니다" : "읽지 않습니다"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => toggle(i),
    "aria-pressed": f.read,
    style: {
      width: 40,
      height: 24,
      borderRadius: "var(--r-pill)",
      border: "none",
      cursor: "pointer",
      position: "relative",
      background: f.read ? "var(--nh-blue)" : "var(--ink-200)",
      transition: "var(--transition-control)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: f.read ? 19 : 3,
      width: 18,
      height: 18,
      borderRadius: "var(--r-pill)",
      background: "#fff",
      transition: `left var(--dur-instant) var(--ease-out)`
    }
  })))))), /*#__PURE__*/React.createElement(Card, {
    surface: "quiet",
    style: {
      display: "flex",
      gap: "var(--sp-4)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 18,
    color: "var(--ink-400)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uC62C\uB9B0 \uC790\uB8CC\uB294 \uC774 \uC791\uC5C5\uC5D0 \uCD08\uB300\uB41C \uC0AC\uB78C\uB9CC \uBCFC \uC218 \uC788\uACE0, \uC678\uBD80\uB85C \uB098\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uACE0\uAC1D \uC2E4\uBA85\xB7\uACC4\uC88C\uBC88\uD638\uAC00 \uB4E4\uC5B4\uAC04 \uD30C\uC77C\uC740 \uC62C\uB9AC\uC9C0 \uB9C8\uC138\uC694."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      padding: "var(--sp-5) var(--pad-page)",
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uC790\uB8CC ", reading, "\uAC1C\uB97C \uC77D\uACE0 \uD654\uBA74 \uCD08\uC548\uC744 \uB9CC\uB4ED\uB2C8\uB2E4. \uB9CC\uB4E0 \uB4A4\uC5D0\uB3C4 \uC790\uB8CC\uB97C \uB354 \uC62C\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: "var(--gap-inline)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => go("new")
  }, "\uC774\uC804"), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "lg",
    onClick: () => go("newtask")
  }, "\uC774 \uC790\uB8CC\uB85C \uCD08\uC548 \uB9CC\uB4E4\uAE30"))));
}
Object.assign(window, {
  FilesScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/FilesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/InviteScreen.jsx
try { (() => {
const {
  TopBar,
  Button,
  Card,
  Badge,
  Avatar,
  Field,
  Chip,
  Icon
} = window.NHDesignSystem_dafb17;
const CANDIDATES = [{
  name: "이준호",
  dept: "채널개발팀",
  role: "개발 담당자",
  ask: "구현할 수 있는지, 빠진 상태가 없는지"
}, {
  name: "박선영",
  dept: "수신상품부",
  role: "현업 담당자",
  ask: "고객이 이해할 수 있는지"
}, {
  name: "최지우",
  dept: "준법감시부",
  role: "준법 담당자",
  ask: "넘겨받은 지적만 봅니다"
}, {
  name: "정하윤",
  dept: "디지털기획팀",
  role: "기획 담당자",
  ask: "함께 만들고 결정까지"
}];

/** 검토자 초대·알림 — 누구에게 무엇을 물어보는지 문장으로 확인시키는 화면. */
function InviteScreen({
  go
}) {
  const [picked, setPicked] = React.useState(["이준호", "박선영"]);
  const [scope, setScope] = React.useState("화면 8개 전부");
  const [due, setDue] = React.useState("9월 12일");
  const toggle = n => setPicked(picked.includes(n) ? picked.filter(x => x !== n) : [...picked, n]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--surface-canvas)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uBE44\uB300\uBA74 \uACC4\uC88C \uC2E0\uCCAD \uAC1C\uC120",
    crumb: "\uAC80\uD1A0\uC790 \uCD08\uB300",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    note: "\uCD08\uB300\uB294 \uB098\uC911\uC5D0 \uB298\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("workspace")
    }, "\uAC74\uB108\uB6F0\uAE30")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      minHeight: 0,
      maxWidth: "var(--content-max)",
      width: "100%",
      margin: "0 auto",
      gap: "var(--sp-8)",
      padding: "var(--sp-10) var(--pad-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-6)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      marginBottom: 6
    }
  }, "\uB204\uAD6C\uC5D0\uAC8C \uBB3C\uC5B4\uBCFC\uAE4C\uC694"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)"
    }
  }, "\uC0AC\uB78C\uB9C8\uB2E4 \uBB3C\uC5B4\uBCF4\uB294 \uAC83\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uAC1C\uBC1C \uB2F4\uB2F9\uC790\uC5D0\uAC8C\uB294 \"\uAD6C\uD604\uD560 \uC218 \uC788\uB294\uC9C0\", \uD604\uC5C5 \uB2F4\uB2F9\uC790\uC5D0\uAC8C\uB294 \"\uACE0\uAC1D\uC774 \uC774\uD574\uD558\uB294\uC9C0\"\uB97C \uBB3B\uC2B5\uB2C8\uB2E4. \uC54C\uB9BC \uBB38\uAD6C\uC5D0 \uADF8 \uB9D0\uC774 \uADF8\uB300\uB85C \uB4E4\uC5B4\uAC11\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement(Field, {
    label: "\uC774\uB984\uC774\uB098 \uBD80\uC11C\uB85C \uCC3E\uAE30",
    placeholder: "\uC608: \uCC44\uB110\uAC1C\uBC1C\uD300"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-2)"
    }
  }, CANDIDATES.map((c, i) => {
    const on = picked.includes(c.name);
    return /*#__PURE__*/React.createElement("button", {
      key: c.name,
      type: "button",
      onClick: () => toggle(c.name),
      style: {
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-3)",
        padding: "var(--sp-4)",
        cursor: "pointer",
        textAlign: "left",
        borderRadius: "var(--r-card)",
        transition: "var(--transition-control)",
        background: on ? "var(--blue-50)" : "var(--white)",
        border: on ? "var(--bw-emphasis) solid var(--nh-blue)" : "1px solid var(--border-default)"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: c.name,
      index: i
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-label)",
        color: "var(--text-title)"
      }
    }, c.name), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-caption)",
        color: "var(--text-faint)"
      }
    }, c.dept), /*#__PURE__*/React.createElement(Badge, {
      tone: on ? "info" : "neutral"
    }, c.role)), /*#__PURE__*/React.createElement("p", {
      style: {
        font: "var(--type-caption)",
        color: "var(--text-muted)",
        marginTop: 3
      }
    }, "\uBB3C\uC5B4\uBCFC \uAC83 \u2014 ", c.ask)), on ? /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 16,
      color: "var(--nh-blue)"
    }) : /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 16,
      color: "var(--ink-300)"
    }));
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: "var(--sp-3)"
    }
  }, "\uC5B4\uB514\uAE4C\uC9C0 \uBCF4\uC5EC\uC904\uAE4C\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexWrap: "wrap",
      marginBottom: "var(--sp-5)"
    }
  }, ["화면 8개 전부", "약관·수수료 화면만", "지금 보고 있는 화면만"].map(s => /*#__PURE__*/React.createElement(Chip, {
    key: s,
    selected: scope === s,
    onClick: () => setScope(s)
  }, s))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: "var(--sp-3)"
    }
  }, "\uC5B8\uC81C\uAE4C\uC9C0"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexWrap: "wrap"
    }
  }, ["9월 12일", "9월 19일", "정하지 않음"].map(d => /*#__PURE__*/React.createElement(Chip, {
    key: d,
    selected: due === d,
    onClick: () => setDue(d)
  }, d))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 340,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: "var(--sp-3)"
    }
  }, "\uC774\uB807\uAC8C \uC54C\uB9BC\uC774 \uAC11\uB2C8\uB2E4"), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: "var(--sp-3)",
      paddingBottom: "var(--sp-3)",
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: "var(--r-xs)",
      background: "var(--white)",
      border: "1px solid var(--border-default)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "var(--type-caption)",
      fontWeight: 800,
      color: "var(--nh-blue)"
    }
  }, "NH"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, "\uC704\uB4DC\uCE94\uBC84\uC2A4 \xB7 \uC0AC\uB0B4 \uBA54\uC2E0\uC800")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-body)",
      lineHeight: 1.7
    }
  }, "\uAE40\uBBFC\uC900\uB2D8\uC774 ", /*#__PURE__*/React.createElement("b", null, "\uBE44\uB300\uBA74 \uACC4\uC88C \uC2E0\uCCAD \uAC1C\uC120"), " \uAC80\uD1A0\uB97C \uBD80\uD0C1\uD588\uC2B5\uB2C8\uB2E4.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "\uBCFC \uAC83\uC740 ", scope, "\uC785\uB2C8\uB2E4. ", /*#__PURE__*/React.createElement("b", null, "\uAD6C\uD604\uD560 \uC218 \uC788\uB294\uC9C0, \uBE60\uC9C4 \uC0C1\uD0DC\uAC00 \uC5C6\uB294\uC9C0"), " \uC5B4\uC0C9\uD55C \uACF3\uC744 \uB20C\uB7EC \uD55C \uC904 \uB0A8\uACA8\uC8FC\uC2DC\uBA74 \uB429\uB2C8\uB2E4. \uB514\uC790\uC778 \uC6A9\uC5B4\uB294 \uBAB0\uB77C\uB3C4 \uB429\uB2C8\uB2E4.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, due, "\uAE4C\uC9C0 \xB7 \uC57D 10\uBD84 \uAC78\uB9BD\uB2C8\uB2E4")), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    fullWidth: true,
    style: {
      marginTop: "var(--sp-4)"
    },
    onClick: () => go("reviewer")
  }, "\uC5F4\uC5B4\uBCF4\uAE30"))), /*#__PURE__*/React.createElement(Card, {
    surface: "quiet"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      lineHeight: 1.7
    }
  }, "\uB9C8\uAC10 \uD558\uB8E8 \uC804\uC5D0 \uC544\uC9C1 \uC5F4\uC5B4\uBCF4\uC9C0 \uC54A\uC740 \uC0AC\uB78C\uC5D0\uAC8C\uB9CC \uD55C \uBC88 \uB354 \uAC11\uB2C8\uB2E4. \uC804\uCCB4\uC5D0\uAC8C \uBC18\uBCF5\uD574\uC11C \uBCF4\uB0B4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      padding: "var(--sp-5) var(--pad-page)",
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, picked.length, "\uBA85\uC5D0\uAC8C \uBCF4\uB0C5\uB2C8\uB2E4 \xB7 ", scope, " \xB7 ", due, "\uAE4C\uC9C0"), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "lg",
    style: {
      marginLeft: "auto"
    },
    onClick: () => go("workspace")
  }, "\uCD08\uB300 \uBCF4\uB0B4\uAE30")));
}
Object.assign(window, {
  InviteScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/InviteScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/NewProjectScreen.jsx
try { (() => {
const {
  TopBar,
  Button,
  Card,
  Field,
  Chip,
  Badge,
  Avatar,
  Icon
} = window.NHDesignSystem_dafb17;
const GROUPS = [{
  group: "화면 만들기",
  items: [{
    label: "앱 화면",
    icon: "smartphone",
    hint: "올원뱅크 같은 모바일"
  }, {
    label: "웹 화면",
    icon: "monitor",
    hint: "기업뱅킹 같은 PC"
  }, {
    label: "업무화면",
    icon: "layout-dashboard",
    hint: "행내 단말 화면"
  }]
}, {
  group: "자료 만들기",
  items: [{
    label: "카드·홍보물",
    icon: "credit-card",
    hint: "실물 시안, 포스터"
  }, {
    label: "보고서",
    icon: "file-text",
    hint: "문서, 발표자료"
  }]
}, {
  group: "함께 보기",
  items: [{
    label: "기존 화면 검토",
    icon: "hand",
    hint: "이미 있는 화면에 의견 받기"
  }, {
    label: "문구만 검토",
    icon: "message-square",
    hint: "안내 문구·약관 표현"
  }]
}];
const MEMBERS = [{
  name: "김민준",
  role: "기획 담당자",
  note: "화면을 만들고 반영을 결정합니다"
}, {
  name: "이준호",
  role: "개발 담당자",
  note: "구현할 수 있는지 짚어줍니다"
}, {
  name: "박선영",
  role: "현업 담당자",
  note: "고객이 이해하는지 짚어줍니다"
}, {
  name: "최지우",
  role: "준법 담당자",
  note: "넘겨받은 지적만 봅니다"
}];
const EXAMPLES = ["비대면 계좌 신청 화면을 더 쉽게 고치고 싶어요", "청년 우대 체크카드 홍보물 시안이 필요합니다", "약관 동의 화면 문구를 검토받고 싶어요"];

/** 새 프로젝트 — 무엇부터 눌러야 할지 고민하지 않게, 한 줄 적거나 타일 하나 고르는 것으로 시작한다. */
function NewProjectScreen({
  go
}) {
  const [phase, setPhase] = React.useState("start");
  const [text, setText] = React.useState("");
  const [kind, setKind] = React.useState(null);
  const [picked, setPicked] = React.useState(["김민준", "이준호", "박선영"]);
  const [due, setDue] = React.useState("9월 12일");
  const toggle = n => setPicked(picked.includes(n) ? picked.filter(x => x !== n) : [...picked, n]);
  const begin = k => {
    if (k) setKind(k);
    setPhase("detail");
  };
  const ready = text.trim() || kind;
  if (phase === "start") return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--surface-canvas)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uC704\uB4DC\uCE94\uBC84\uC2A4",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    note: "\uC5B8\uC81C\uB4E0 \uADF8\uB9CC\uB450\uACE0 \uB098\uC911\uC5D0 \uC774\uC5B4\uC11C \uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("list")
    }, "\uB0B4\uAC00 \uB9E1\uC740 \uC77C")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--sp-12) var(--pad-page)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--nh-blue)",
      marginBottom: "var(--sp-3)"
    }
  }, "\uC0C8 \uD504\uB85C\uC81D\uD2B8"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: "var(--fs-display)",
      lineHeight: "var(--lh-display)",
      textAlign: "center",
      marginBottom: "var(--sp-3)"
    }
  }, "\uBB34\uC5C7\uC744 \uD568\uAED8 \uB9CC\uB4E4\uAE4C\uC694"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)",
      textAlign: "center",
      maxWidth: 600,
      marginBottom: "var(--sp-8)"
    }
  }, "\uD55C \uC904\uB85C \uC801\uC5B4\uB3C4 \uB418\uACE0, \uC544\uB798\uC5D0\uC11C \uD558\uB098 \uACE0\uB974\uC154\uB3C4 \uB429\uB2C8\uB2E4. \uBB34\uC5C7\uC744 \uC801\uC744\uC9C0 \uBAA8\uB974\uACA0\uC73C\uBA74 \uC608\uC2DC\uB97C \uB20C\uB7EC\uBCF4\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 760,
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--r-xl)",
      boxShadow: "var(--sh-card)",
      padding: "var(--sp-5)"
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: text,
    onChange: e => setText(e.target.value),
    rows: 2,
    placeholder: "\uD558\uACE0 \uC2F6\uC740 \uC77C\uC744 \uADF8\uB300\uB85C \uC801\uC5B4\uC8FC\uC138\uC694. \uC5C5\uBB34\uC5D0\uC11C \uC4F0\uB294 \uB9D0\uC774\uBA74 \uB429\uB2C8\uB2E4",
    style: {
      width: "100%",
      border: "none",
      outline: "none",
      resize: "none",
      font: "var(--type-body)",
      fontSize: "17px",
      lineHeight: 1.6,
      color: "var(--text-body)",
      background: "transparent"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--gap-inline)",
      marginTop: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => go("files")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "paperclip",
    size: 15
  }), "\uC790\uB8CC \uBD99\uC774\uAE30"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mic",
    size: 15
  }), "\uB9D0\uB85C \uD558\uAE30"), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "md",
    disabled: !ready,
    style: {
      marginLeft: "auto"
    },
    onClick: () => begin(null)
  }, "\uC2DC\uC791\uD558\uAE30", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 15
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: "var(--sp-4)",
      maxWidth: 760
    }
  }, EXAMPLES.map(e => /*#__PURE__*/React.createElement("button", {
    key: e,
    type: "button",
    onClick: () => setText(e),
    style: {
      padding: "7px 13px",
      borderRadius: "var(--r-pill)",
      cursor: "pointer",
      background: "transparent",
      border: "1px solid var(--border-default)",
      font: "var(--type-caption)",
      color: "var(--text-body)",
      transition: "var(--transition-control)"
    }
  }, e)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      padding: "var(--sp-6) var(--pad-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--content-max)",
      margin: "0 auto",
      display: "flex",
      gap: "var(--sp-8)",
      flexWrap: "wrap",
      justifyContent: "center"
    }
  }, GROUPS.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.group,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-3)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      textAlign: "center"
    }
  }, g.group), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--sp-2)"
    }
  }, g.items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.label,
    type: "button",
    title: it.hint,
    onClick: () => begin(it.label),
    style: {
      width: 112,
      padding: "var(--sp-4) var(--sp-2)",
      cursor: "pointer",
      textAlign: "center",
      background: "transparent",
      border: "1px solid transparent",
      borderRadius: "var(--r-card)",
      transition: "var(--transition-control)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      justifyContent: "center",
      color: "var(--nh-blue)",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, it.label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginTop: 3
    }
  }, it.hint)))))))));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--surface-canvas)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uC0C8 \uD504\uB85C\uC81D\uD2B8",
    crumb: "\uD568\uAED8 \uBCFC \uC0AC\uB78C\uACFC \uAE30\uD55C",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    note: "\uC5EC\uAE30\uAE4C\uC9C0 \uC800\uC7A5\uB429\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => setPhase("start")
    }, "\uC774\uC804")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 820,
      width: "100%",
      margin: "0 auto",
      padding: "var(--sp-12) var(--pad-page)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    surface: "ai",
    style: {
      display: "flex",
      gap: "var(--sp-4)",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "ai"
  }, "AI"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      marginBottom: 4
    }
  }, "\uC774\uB807\uAC8C \uC54C\uC544\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      fontWeight: 700,
      color: "var(--text-title)"
    }
  }, kind ? `${kind} 작업입니다.` : "화면 작업입니다.", " ", text.trim() ? `"${text.trim()}"` : "자세한 내용은 다음 단계에서 물어봅니다."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Field, {
    label: "\uC774 \uC77C\uC744 \uBB50\uB77C\uACE0 \uBD80\uB97C\uAE4C\uC694",
    defaultValue: kind ? `${kind} 개선` : "비대면 계좌 신청 개선",
    assist: "\uB098\uC911\uC5D0 \uAC80\uC0C9\uD560 \uB54C \uC4F0\uB294 \uC774\uB984\uC785\uB2C8\uB2E4. \uC0AC\uB0B4\uC5D0\uC11C \uBD80\uB974\uB294 \uB9D0 \uADF8\uB300\uB85C \uC801\uC73C\uC138\uC694"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: 4
    }
  }, "\uB204\uAC00 \uD568\uAED8 \uBD05\uB2C8\uAE4C"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      marginBottom: "var(--sp-4)"
    }
  }, "\uC5ED\uD560\uC774 \uD654\uBA74\uC744 \uB098\uB215\uB2C8\uB2E4. \uAC1C\uBC1C \uB2F4\uB2F9\uC790\uC5D0\uAC8C\uB294 \uACB0\uC815 \uBC84\uD2BC\uC774 \uBCF4\uC774\uC9C0 \uC54A\uACE0, \uC900\uBC95 \uB2F4\uB2F9\uC790\uC5D0\uAC8C\uB294 \uB118\uACA8\uBC1B\uC740 \uC9C0\uC801\uB9CC \uBCF4\uC785\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-2)"
    }
  }, MEMBERS.map((m, i) => {
    const on = picked.includes(m.name);
    return /*#__PURE__*/React.createElement("button", {
      key: m.name,
      type: "button",
      onClick: () => toggle(m.name),
      style: {
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-3)",
        padding: "var(--sp-3) var(--sp-4)",
        cursor: "pointer",
        textAlign: "left",
        borderRadius: "var(--r-control)",
        transition: "var(--transition-control)",
        background: on ? "var(--blue-50)" : "var(--white)",
        border: on ? "var(--bw-emphasis) solid var(--nh-blue)" : "1px solid var(--border-default)"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: m.name,
      index: i
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-label)",
        color: "var(--text-title)",
        width: 70
      }
    }, m.name), /*#__PURE__*/React.createElement(Badge, {
      tone: on ? "info" : "neutral"
    }, m.role), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-caption)",
        color: "var(--text-faint)"
      }
    }, m.note), on ? /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 16,
      color: "var(--nh-blue)",
      style: {
        marginLeft: "auto"
      }
    }) : null);
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)",
      marginBottom: "var(--sp-3)"
    }
  }, "\uC5B8\uC81C\uAE4C\uC9C0 \uC758\uACAC\uC744 \uBC1B\uC744\uAE4C\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexWrap: "wrap"
    }
  }, ["9월 12일", "9월 19일", "9월 26일", "정하지 않음"].map(d => /*#__PURE__*/React.createElement(Chip, {
    key: d,
    selected: due === d,
    onClick: () => setDue(d)
  }, d))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      padding: "var(--sp-5) var(--pad-page)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      maxWidth: 560
    }
  }, "\uD568\uAED8 \uBCF4\uB294 \uC0AC\uB78C ", picked.length, "\uBA85 \xB7 ", due, "\uAE4C\uC9C0. \uB2E4\uC74C \uB2E8\uACC4\uC5D0\uC11C \uCC38\uACE0\uC790\uB8CC\uB97C \uC62C\uB9AC\uBA74 AI\uAC00 \uADF8\uAC83\uBD80\uD130 \uC77D\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "lg",
    style: {
      marginLeft: "auto"
    },
    onClick: () => go("files")
  }, "\uB9CC\uB4E4\uACE0 \uC790\uB8CC \uC62C\uB9AC\uAE30")));
}
Object.assign(window, {
  NewProjectScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/NewProjectScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/NewTaskScreen.jsx
try { (() => {
const {
  TopBar,
  Button,
  Card,
  Chip,
  ChoiceCard,
  Badge,
  Icon
} = window.NHDesignSystem_dafb17;
const KINDS = [["앱 화면", "올원뱅크 같은 모바일", "smartphone"], ["웹 화면", "기업뱅킹 같은 PC", "monitor"], ["카드·홍보물", "실물 시안, 포스터", "credit-card"], ["보고서", "문서, 발표자료", "file-text"]];
const WHO = ["40~60대 개인 고객", "20~30대 개인 고객", "법인·기업 담당자", "영업점 직원", "경영진 보고"];
const FEEL = ["쉽고 친절하게", "믿음직하게", "군더더기 없이", "활기차게", "차분하게"];

/** 새 작업 = 세 가지만 묻는다. 빈 프롬프트 칸을 주지 않는다. */
function NewTaskScreen({
  go
}) {
  const [kind, setKind] = React.useState("앱 화면");
  const [who, setWho] = React.useState("40~60대 개인 고객");
  const [feel, setFeel] = React.useState("쉽고 친절하게");
  const step = (n, label, extra) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      fontWeight: 800,
      color: "var(--nh-blue)"
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-card-title)",
      color: "var(--text-title)"
    }
  }, label), extra ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, extra) : null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--surface-canvas)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uC0C8 \uC791\uC5C5",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    note: "\uC5B8\uC81C\uB4E0 \uADF8\uB9CC\uB450\uACE0 \uB098\uC911\uC5D0 \uC774\uC5B4\uC11C \uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("list")
    }, "\uB098\uC911\uC5D0")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 820,
      width: "100%",
      margin: "0 auto",
      padding: "var(--sp-12) var(--pad-page)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("h1", null, "\uC138 \uAC00\uC9C0\uB9CC \uBB3C\uC5B4\uBCFC\uAC8C\uC694"), /*#__PURE__*/React.createElement(Badge, {
    tone: "ok"
  }, "\uC57D 40\uCD08")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)",
      marginBottom: "var(--sp-8)"
    }
  }, "\uBB34\uC5C7\uC744 \uC4F8\uC9C0 \uBAB0\uB77C \uBE48 \uCE78\uC744 \uB9C8\uC8FC\uD558\uC9C0 \uC54A\uB3C4\uB85D, \uACE0\uB974\uAE30\uB9CC \uD558\uBA74 \uB418\uAC8C \uD588\uC2B5\uB2C8\uB2E4. \uD504\uB86C\uD504\uD2B8\uB97C \uC4F0\uC9C0 \uC54A\uC544\uB3C4 \uB429\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement(Card, null, step("01", "무엇을 만드시나요?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: "var(--sp-3)"
    }
  }, KINDS.map(([l, h, ic]) => /*#__PURE__*/React.createElement(ChoiceCard, {
    key: l,
    label: l,
    hint: h,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 18
    }),
    selected: kind === l,
    onClick: () => setKind(l)
  })))), /*#__PURE__*/React.createElement(Card, null, step("02", "누가 보게 되나요?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexWrap: "wrap"
    }
  }, WHO.map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    selected: who === t,
    onClick: () => setWho(t)
  }, t)))), /*#__PURE__*/React.createElement(Card, null, step("03", "어떤 느낌이면 좋을까요?", "디자인 용어는 쓰지 않습니다"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      flexWrap: "wrap"
    }
  }, FEEL.map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    selected: feel === t,
    onClick: () => setFeel(t)
  }, t)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-hairline)",
      padding: "var(--sp-5) var(--pad-page)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "ai"
  }, "AI"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uC774\uB807\uAC8C \uC54C\uC544\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body)",
      fontWeight: 700,
      color: "var(--text-title)"
    }
  }, who, "\uC774 \uBCF4\uB294 ", kind, "\uC744, ", feel.replace("하게", "한"), " \uB9D0\uD22C\uB85C \uB9CC\uB4ED\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      marginTop: 4
    }
  }, "\uCC38\uACE0\uC790\uB8CC\xB7\uBE0C\uB79C\uB4DC \uC790\uC0B0\uC740 \uC54C\uC544\uC11C \uACE0\uB985\uB2C8\uB2E4. ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault()
  }, "\uC9C1\uC811 \uACE0\uB974\uAE30"))), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "lg",
    style: {
      marginLeft: "auto"
    },
    onClick: () => go("workspace")
  }, "\uD654\uBA74 \uB9CC\uB4E4\uAE30")));
}
Object.assign(window, {
  NewTaskScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/NewTaskScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/ProjectListScreen.jsx
try { (() => {
const {
  TopBar,
  TaskBanner,
  ProjectRow,
  Button,
  Card,
  Icon
} = window.NHDesignSystem_dafb17;

/** 홈 = 프로젝트 목록. 대시보드 카드 여섯 장 대신 "지금 할 일" 한 줄 + 목록 하나. */
function ProjectListScreen({
  go,
  role,
  onRole
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uC704\uB4DC\uCE94\uBC84\uC2A4",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    note: role === "maker" ? "만드는 사람으로 보고 있습니다" : "의견 주는 사람으로 보고 있습니다",
    right: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: onRole
    }, role === "maker" ? "참여자 화면 보기" : "담당자 화면 보기")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--content-max)",
      margin: "0 auto",
      padding: "var(--sp-10) var(--pad-page) var(--sp-16)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-section)"
    }
  }, /*#__PURE__*/React.createElement(TaskBanner, {
    headline: "\uAC80\uD1A0\uC790 3\uBA85 \uC911 2\uBA85\uC774 \uC758\uACAC\uC744 \uB0A8\uACBC\uC2B5\uB2C8\uB2E4. \uACB0\uC815\uD558\uC9C0 \uC54A\uC740 \uC758\uACAC\uC774 11\uAC1C \uC788\uC2B5\uB2C8\uB2E4.",
    detail: "\uACE0\uAC1D \uD3EC\uD138 \uB9AC\uB274\uC5BC \xB7 \uC774\uC900\uD638\uB2D8\uC740 \uC544\uC9C1 \uC5F4\uC5B4\uBCF4\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4 \xB7 \uB9C8\uAC10\uAE4C\uC9C0 4\uC77C",
    secondaryLabel: "\uC774\uC900\uD638\uB2D8\uAED8 \uB2E4\uC2DC \uC54C\uB9AC\uAE30",
    primaryLabel: "\uC758\uACAC 11\uAC1C \uD55C \uC7A5\uC529 \uACB0\uC815\uD558\uAE30",
    onPrimary: () => go("decide")
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginBottom: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("h2", null, "\uB0B4\uAC00 \uB9E1\uC740 \uC77C"), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    style: {
      marginLeft: "auto"
    },
    onClick: () => go("new")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16
  }), "\uC0C8 \uD504\uB85C\uC81D\uD2B8")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-stack)"
    }
  }, /*#__PURE__*/React.createElement(ProjectRow, {
    name: "\uACE0\uAC1D \uD3EC\uD138 \uB9AC\uB274\uC5BC",
    status: "\uC758\uACAC \uBAA8\uC73C\uB294 \uC911",
    statusTone: "info",
    next: "\uACB0\uC815\uD558\uC9C0 \uC54A\uC740 \uC758\uACAC 11\uAC1C \xB7 \uAC80\uD1A0\uC790 3\uBA85 \uC911 2\uBA85 \uC751\uB2F5",
    people: ["김민준", "박선영", "이준호"],
    when: "10\uBD84 \uC804",
    onClick: () => go("workspace")
  }), /*#__PURE__*/React.createElement(ProjectRow, {
    name: "\uBAA8\uBC14\uC77C\uBC45\uD0B9 \uC628\uBCF4\uB529",
    status: "\uBC18\uC601\uD574\uC11C \uC0C8 \uD310",
    statusTone: "warn",
    next: "\uBC18\uC601\uD55C \uC758\uACAC 3\uAC1C\uB85C 5\uBC88\uC9F8 \uD310\uC744 \uB9CC\uB4DC\uB294 \uC911\uC785\uB2C8\uB2E4",
    people: ["이서연", "김민준"],
    when: "1\uC2DC\uAC04 \uC804",
    onClick: () => go("workspace")
  }), /*#__PURE__*/React.createElement(ProjectRow, {
    name: "NH \uCCAD\uB144 \uC6B0\uB300 \uCCB4\uD06C\uCE74\uB4DC",
    status: "\uBC29\uD5A5 \uACE0\uB974\uB294 \uC911",
    statusTone: "info",
    next: "\uC2DC\uC548 3\uC548\uC774 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uD55C \uBC29\uD5A5\uC744 \uACE0\uB974\uBA74 \uCCAB \uD310\uC774 \uB9CC\uB4E4\uC5B4\uC9D1\uB2C8\uB2E4",
    people: ["김민준", "박준혁"],
    when: "\uBC29\uAE08",
    onClick: () => go("workspace")
  }), /*#__PURE__*/React.createElement(ProjectRow, {
    name: "\uC9C0\uC810 \uC548\uB0B4 \uB9AC\uD50C\uB81B",
    status: "\uCD08\uC548 \uC2E4\uD328",
    statusTone: "danger",
    next: "AI \uC751\uB2F5\uC774 \uB2A6\uC5B4 \uCD08\uC548\uC774 \uB9CC\uB4E4\uC5B4\uC9C0\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC785\uB825\uD55C \uB0B4\uC6A9\uC740 \uADF8\uB300\uB85C \uC788\uC2B5\uB2C8\uB2E4",
    people: ["박준혁"],
    when: "2\uC2DC\uAC04 \uC804",
    onClick: () => go("newtask")
  }))), /*#__PURE__*/React.createElement(Card, {
    surface: "quiet",
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 18,
    color: "var(--ink-400)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uB05D\uB09C \uC791\uC5C5 12\uAC1C\uB294 \uBAA9\uB85D\uC5D0\uC11C \uB0B4\uB824\uB450\uC5C8\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD560 \uB54C \uAC80\uC0C9\uC73C\uB85C \uCC3E\uC2B5\uB2C8\uB2E4 \u2014 \uD648\uC5D0\uB294 \uC9C0\uAE08 \uC190\uC774 \uD544\uC694\uD55C \uAC83\uB9CC \uB461\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    style: {
      marginLeft: "auto",
      flexShrink: 0
    },
    onClick: () => go("compliance")
  }, "\uC900\uBC95 \uAC80\uD1A0 \uD654\uBA74"))));
}
Object.assign(window, {
  ProjectListScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/ProjectListScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/ReviewerScreen.jsx
try { (() => {
const {
  TopBar,
  Button,
  Badge,
  Field,
  Artboard,
  ArtboardStage,
  ModeToggle,
  Filmstrip,
  CommentCard,
  Icon,
  Card,
  Chip
} = window.NHDesignSystem_dafb17;
const TAGS = ["구현 가능", "상태 정의 필요", "API 응답 확인", "예외 처리 필요", "기간 협의 필요"];

/**
 * 개발 담당자(IT)의 화면. 기획자 화면과 다른 점:
 * 판을 만들거나 반영을 결정하는 버튼이 없다. 짚고, 구현 관점을 태그와 함께 남긴다.
 */
function ReviewerScreen({
  go
}) {
  const [mode, setMode] = React.useState("pick");
  const [screen, setScreen] = React.useState(2);
  const [text, setText] = React.useState("");
  const [tag, setTag] = React.useState("상태 정의 필요");
  const [sent, setSent] = React.useState([]);
  const send = () => {
    if (text.trim()) {
      setSent([{
        body: text.trim(),
        tag
      }, ...sent]);
      setText("");
    }
  };
  const seen = 3 + sent.length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uBE44\uB300\uBA74 \uACC4\uC88C \uC2E0\uCCAD \uAC1C\uC120",
    status: "\uC758\uACAC \uBAA8\uC73C\uB294 \uC911",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uC774\uC900\uD638",
    note: "9\uC6D4 12\uC77C\uAE4C\uC9C0 \xB7 \uAC1C\uBC1C \uB2F4\uB2F9\uC790\uB85C \uBCF4\uACE0 \uC788\uC2B5\uB2C8\uB2E4",
    right: /*#__PURE__*/React.createElement(Button, {
      tone: "primary",
      size: "sm",
      onClick: () => go("list")
    }, "\uAC80\uD1A0 \uB9C8\uCE58\uAE30")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--info-bg)",
      borderBottom: "1px solid var(--info-border)",
      padding: "var(--sp-3) var(--sp-6)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 16,
    color: "var(--nh-blue)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "var(--fs-body-sm)",
      color: "var(--info-fg)"
    }
  }, "\uAE40\uBBFC\uC900\uB2D8\uC774 \uBB3C\uC5B4\uBCF8 \uAC83 \u2014 ", /*#__PURE__*/React.createElement("b", null, "\uAD6C\uD604\uD560 \uC218 \uC788\uB294\uC9C0, \uBE60\uC9C4 \uC0C1\uD0DC\uAC00 \uC5C6\uB294\uC9C0."), " \uD654\uBA74 8\uAC1C\uB97C \uB118\uACA8\uBCF4\uBA70 \uAC78\uB9AC\uB294 \uACF3\uC744 \uB20C\uB7EC \uD55C \uC904 \uB0A8\uACA8\uC8FC\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--info-fg)"
    }
  }, Math.min(seen, 8), " / 8 \uD655\uC778"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 110,
      height: 5,
      borderRadius: 99,
      background: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.min(seen, 8) / 8 * 100}%`,
      height: "100%",
      borderRadius: 99,
      background: "var(--nh-blue)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--sp-4) var(--sp-6)",
      background: "var(--surface-card)",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(ModeToggle, {
    value: mode,
    onChange: setMode,
    note: "\uBAA8\uB4DC\uB294 \uC774 \uB450 \uAC1C\uBFD0\uC785\uB2C8\uB2E4",
    options: [{
      value: "view",
      label: "보기",
      icon: "eye"
    }, {
      value: "pick",
      label: "짚기",
      icon: "hand"
    }]
  })), /*#__PURE__*/React.createElement(ArtboardStage, null, /*#__PURE__*/React.createElement(Artboard, {
    kind: "mobile",
    width: 300,
    height: 560,
    title: "\uBE44\uB300\uBA74 \uACC4\uC88C \uC2E0\uCCAD",
    picking: mode === "pick"
  }, /*#__PURE__*/React.createElement(AccountMock, null))), /*#__PURE__*/React.createElement(Filmstrip, {
    current: screen,
    onSelect: setScreen,
    items: [{}, {}, {}, {}, {}, {}, {}, {}],
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => setScreen(Math.max(0, screen - 1))
    }, "\uC774\uC804 \uD654\uBA74"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => setScreen(Math.min(7, screen + 1))
    }, "\uB2E4\uC74C \uD654\uBA74"))
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "\uB0A8\uAE34 \uC758\uACAC",
    count: 2 + sent.length
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--ink-50)",
      borderRadius: "var(--r-sm)",
      padding: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: "var(--sp-3)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "hand",
    size: 14,
    color: "var(--nh-blue)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uC9DA\uC740 \uACF3"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, "\uC57D\uAD00 \uB3D9\uC758 \uC601\uC5ED")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--r-xs)",
      padding: "var(--sp-3)",
      marginBottom: "var(--sp-3)"
    }
  }, [["요소", "체크박스 3개 · 목록"], ["연결 화면", "없음 (다음 → 화면 4)"], ["기획서 근거", "화면정의서 3-2 약관동의"]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      gap: 8,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      width: 60,
      flexShrink: 0
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      fontWeight: 700,
      color: "var(--ink-700)"
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: "var(--sp-3)"
    }
  }, TAGS.map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    selected: tag === t,
    onClick: () => setTag(t),
    style: {
      minHeight: 30,
      padding: "0 11px",
      fontSize: 12
    }
  }, t))), /*#__PURE__*/React.createElement(Field, {
    multiline: true,
    rows: 2,
    value: text,
    onChange: e => setText(e.target.value),
    placeholder: "\uC608: \uD544\uC218\xB7\uC120\uD0DD \uAD6C\uBD84\uC774 \uD544\uC694\uD55C\uB370 \uC5B4\uB290 \uD56D\uBAA9\uC774 \uD544\uC218\uC778\uC9C0 \uAE30\uD68D\uC11C\uC5D0\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--gap-inline)",
      marginTop: "var(--sp-3)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mic",
    size: 14
  }), "\uB9D0\uB85C \uD558\uAE30"), /*#__PURE__*/React.createElement(Button, {
    tone: "primary",
    size: "sm",
    style: {
      marginLeft: "auto"
    },
    onClick: send
  }, "\uB0A8\uAE30\uAE30")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      marginTop: 8
    }
  }, "\uB514\uC790\uC778 \uC6A9\uC5B4\uB294 \uBAB0\uB77C\uB3C4 \uB429\uB2C8\uB2E4. \uBC18\uC601 \uC5EC\uBD80\uB294 \uAE30\uD68D \uB2F4\uB2F9\uC790\uAC00 \uACB0\uC815\uD569\uB2C8\uB2E4")), sent.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement(CommentCard, {
    author: "\uC774\uC900\uD638",
    pin: 3 + i,
    where: s.tag,
    body: s.body,
    time: "\uBC29\uAE08"
  }))), /*#__PURE__*/React.createElement(CommentCard, {
    author: "\uC774\uC900\uD638",
    pin: 1,
    where: "\uC0C1\uD0DC \uC815\uC758 \uD544\uC694",
    body: "\uC57D\uAD00 3\uAC1C \uC911 \uC5B4\uB290 \uAC83\uC774 \uD544\uC218\uC778\uC9C0 \uAE30\uD68D\uC11C\uC5D0 \uC5C6\uC2B5\uB2C8\uB2E4. \uD544\uC218 \uBBF8\uB3D9\uC758 \uC0C1\uD0DC\uC5D0\uC11C \uB2E4\uC74C\uC744 \uB204\uB974\uBA74 \uC5B4\uB5BB\uAC8C \uB418\uB294\uC9C0\uB3C4 \uC815\uC758\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.",
    time: "12\uBD84 \uC804"
  }), /*#__PURE__*/React.createElement(CommentCard, {
    author: "\uBC15\uC120\uC601",
    pin: 2,
    where: "\uBB38\uAD6C",
    body: '"발생할 수 있습니다"만 있고 얼마인지가 없어서 고객이 다시 물어볼 것 같습니다.',
    time: "28\uBD84 \uC804"
  }), /*#__PURE__*/React.createElement(Card, {
    surface: "ai",
    style: {
      padding: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "ai"
  }, "AI"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, "\uC774\uB807\uAC8C \uC815\uB9AC\uD574\uC11C \uB2F4\uC744\uAC8C\uC694")), [["대상", "약관 동의 목록 3개 항목"], ["유형", "상태 정의 누락 — 필수·선택 구분 없음"], ["개발 영향", "미동의 시 분기 처리 1건 추가"], ["제안", "항목 앞에 [필수]·[선택] 표기 + 미동의 안내"]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      gap: 10,
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      width: 56,
      flexShrink: 0
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: 700,
      color: "var(--text-title)"
    }
  }, v))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-faint)",
      marginTop: 10
    }
  }, "\uB2F4\uAE30\uBA74 \uAE30\uD68D \uB2F4\uB2F9\uC790\uAC00 \uBC18\uC601\xB7\uBCF4\uB958\xB7\uBC18\uB824\uB97C \uACB0\uC815\uD569\uB2C8\uB2E4. \uAC80\uD1A0\uC790\uB294 \uACB0\uC815\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")))));
}
Object.assign(window, {
  ReviewerScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/ReviewerScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/Shared.jsx
try { (() => {
const {
  Artboard,
  ArtboardStage,
  Pin,
  Badge
} = window.NHDesignSystem_dafb17;
const cell = {
  padding: "12px 14px",
  fontSize: "var(--fs-body-sm)",
  color: "var(--ink-700)"
};

/** 목업 안에 들어가는 가짜 앱 화면 — 비대면 계좌 신청. 실제 제품에서는 샌드박스 iframe. */
function AccountMock({
  fixed = false,
  pins = true,
  mode = "pick"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      background: "var(--white)",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-hairline)",
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cell,
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-faint)"
    }
  }, "\uC2E0\uCCAD \uC0C1\uD488"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--ink-900)",
      fontSize: 16
    }
  }, "NH \uC8FC\uAC70\uB798\uC6B0\uB300 \uD1B5\uC7A5")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cell,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uAE30\uBCF8 \uAE08\uB9AC"), /*#__PURE__*/React.createElement("b", null, "\uC5F0 2.1%"))), /*#__PURE__*/React.createElement(Pin, {
    number: pins ? 1 : null,
    state: pins ? "open" : "none",
    label: "\uC57D\uAD00 \uB3D9\uC758 \uC601\uC5ED"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      font: "var(--type-label)",
      color: "var(--ink-900)"
    }
  }, "\uC57D\uAD00 \uB3D9\uC758"), [["예금거래기본약관", fixed && "필수"], ["개인정보 수집·이용 동의", fixed && "필수"], ["전자금융거래 이용약관", fixed && "선택"]].map(([t, tag]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginTop: 9,
      fontSize: 13,
      color: "var(--ink-700)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 15,
      height: 15,
      border: "1.5px solid var(--border-strong)",
      borderRadius: 3,
      flexShrink: 0
    }
  }), tag ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      fontWeight: 800,
      color: tag === "필수" ? "var(--nh-blue)" : "var(--ink-500)"
    }
  }, "[", tag, "]") : null, t)))), /*#__PURE__*/React.createElement(Pin, {
    number: pins ? 2 : null,
    state: fixed ? "decided" : pins ? "unresolved" : "none",
    label: "\uC218\uC218\uB8CC \uC548\uB0B4"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      padding: 12,
      fontSize: 12.5,
      color: "var(--ink-600)",
      lineHeight: 1.6
    }
  }, fixed ? "중도해지 시 중도해지 금리(연 0.5%)가 적용되며, 별도 수수료는 없습니다." : "중도해지 시 약정 금리가 적용되지 않을 수 있으며 관련 수수료가 발생할 수 있습니다.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto"
    }
  }, /*#__PURE__*/React.createElement(Pin, {
    number: pins ? 3 : null,
    state: fixed ? "decided" : pins ? "open" : "none",
    label: "\uB2E4\uC74C \uBC84\uD2BC"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: 2,
      padding: "14px 0",
      borderRadius: 8,
      background: "var(--nh-blue)",
      color: "#fff",
      textAlign: "center",
      font: "var(--type-card-title)"
    }
  }, fixed ? "신청하기" : "다음"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      borderTop: "1px solid var(--border-hairline)",
      paddingTop: 9,
      marginTop: 2
    }
  }, ["홈", "조회", "상품", "혜택", "전체"].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      flex: 1,
      textAlign: "center",
      fontSize: 10.5,
      color: i === 2 ? "var(--nh-blue)" : "var(--ink-400)",
      fontWeight: i === 2 ? 800 : 400
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 15,
      height: 15,
      margin: "0 auto 4px",
      borderRadius: 4,
      background: i === 2 ? "var(--nh-blue)" : "var(--ink-200)"
    }
  }), t))));
}

/** 우측 패널 껍데기 */
function Panel({
  title,
  count,
  children,
  footer
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: "var(--panel-w)",
      flexShrink: 0,
      background: "var(--surface-card)",
      borderLeft: "1px solid var(--border-hairline)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--sp-5) var(--pad-panel)",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-card-title)",
      color: "var(--text-title)"
    }
  }, title), count != null ? /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, count) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "var(--pad-panel)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-stack)"
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--sp-4) var(--pad-panel)",
      borderTop: "1px solid var(--border-hairline)"
    }
  }, footer) : null);
}
Object.assign(window, {
  AccountMock,
  Panel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/Shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/withcanvas/WorkspaceScreen.jsx
try { (() => {
const {
  TopBar,
  StepTrail,
  ModeToggle,
  Filmstrip,
  Button,
  Badge,
  Field,
  Artboard,
  ArtboardStage,
  AICard,
  CommentCard,
  Icon
} = window.NHDesignSystem_dafb17;

/** 워크스페이스 = 캔버스 하나 + 협업 패널 하나. 탭을 다섯 개 만들지 않는다. */
function WorkspaceScreen({
  go
}) {
  const [mode, setMode] = React.useState("pick");
  const [screen, setScreen] = React.useState(2);
  const [aiDecision, setAiDecision] = React.useState(null);
  const [asked, setAsked] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-canvas)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "\uACE0\uAC1D \uD3EC\uD138 \uB9AC\uB274\uC5BC",
    status: "\uC758\uACAC \uBAA8\uC73C\uB294 \uC911",
    logoSrc: "../../assets/nh-symbol-bank.jpg",
    user: "\uAE40\uBBFC\uC900",
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => go("changes")
    }, "4\uBC88\uC9F8 \uD310"), /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "\uAE30\uB85D"), /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "\uB0B4\uB824\uBC1B\uAE30"))
  }), /*#__PURE__*/React.createElement(StepTrail, {
    steps: ["자료 준비", "초안 만들기", "의견 모으기", "반영해서 새 판", "마무리"],
    current: 2,
    note: "\uACB0\uC815\uD558\uC9C0 \uC54A\uC740 \uC758\uACAC 11\uAC1C"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--sp-4) var(--sp-6)",
      background: "var(--surface-card)",
      borderBottom: "1px solid var(--border-hairline)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement(ModeToggle, {
    value: mode,
    onChange: setMode,
    note: "\uBAA8\uB4DC\uB294 \uC774 \uB450 \uAC1C\uBFD0\uC785\uB2C8\uB2E4",
    options: [{
      value: "view",
      label: "보기",
      icon: "eye"
    }, {
      value: "pick",
      label: "짚기",
      icon: "hand"
    }]
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--type-caption)",
      color: "var(--text-faint)"
    }
  }, mode === "pick" ? "화면에서 어색한 곳을 손가락으로 짚듯 눌러주세요" : "목업 안 버튼을 누르면 다음 화면으로 넘어갑니다")), /*#__PURE__*/React.createElement(ArtboardStage, null, /*#__PURE__*/React.createElement(Artboard, {
    kind: "mobile",
    width: 300,
    height: 560,
    title: "\uBE44\uB300\uBA74 \uACC4\uC88C \uC2E0\uCCAD",
    picking: mode === "pick"
  }, /*#__PURE__*/React.createElement(AccountMock, null))), /*#__PURE__*/React.createElement(Filmstrip, {
    current: screen,
    onSelect: setScreen,
    items: [{}, {}, {}, {}, {}, {
      state: "waiting"
    }, {
      state: "failed"
    }, {}],
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => setScreen(Math.max(0, screen - 1))
    }, "\uC774\uC804 \uD654\uBA74"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => setScreen(Math.min(7, screen + 1))
    }, "\uB2E4\uC74C \uD654\uBA74"))
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "\uB0A8\uAE34 \uC758\uACAC",
    count: 3,
    footer: /*#__PURE__*/React.createElement(Button, {
      tone: "primary",
      fullWidth: true,
      size: "lg",
      onClick: () => go("decide")
    }, "\uC758\uACAC 11\uAC1C \uD55C \uC7A5\uC529 \uACB0\uC815\uD558\uAE30")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--ink-50)",
      borderRadius: "var(--r-sm)",
      padding: "var(--sp-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "hand",
    size: 14,
    color: "var(--nh-blue)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\uC9DA\uC740 \uACF3"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      color: "var(--text-title)"
    }
  }, "\uC57D\uAD00 \uB3D9\uC758 \uC601\uC5ED")), /*#__PURE__*/React.createElement(Field, {
    multiline: true,
    rows: 2,
    placeholder: "\uBB34\uC5C7\uC774 \uC774\uD574\uB418\uC9C0 \uC54A\uC558\uB294\uC9C0 \uADF8\uB300\uB85C \uC801\uC5B4\uC8FC\uC138\uC694",
    assist: "\uB514\uC790\uC778 \uC6A9\uC5B4\uB294 \uBAB0\uB77C\uB3C4 \uB429\uB2C8\uB2E4"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-inline)",
      marginTop: "var(--sp-3)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mic",
    size: 14
  }), "\uB9D0\uB85C \uD558\uAE30"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image-plus",
    size: 14
  }), "\uC0AC\uC9C4 \uBD99\uC774\uAE30"))), /*#__PURE__*/React.createElement(CommentCard, {
    author: "\uBC15\uC120\uC601",
    pin: 1,
    where: "\uC57D\uAD00 \uB3D9\uC758",
    body: "\uD544\uC218\uC778\uC9C0 \uC120\uD0DD\uC778\uC9C0 \uAD6C\uBD84\uC774 \uC548 \uB3FC\uC694. \uB2E4 \uB20C\uB7EC\uC57C \uD558\uB294 \uAC74\uC9C0 \uBAA8\uB974\uACA0\uC2B5\uB2C8\uB2E4.",
    time: "41\uBD84 \uC804"
  }), /*#__PURE__*/React.createElement(CommentCard, {
    author: "\uC774\uC900\uD638",
    pin: 2,
    where: "\uC218\uC218\uB8CC \uC548\uB0B4",
    body: '"발생할 수 있습니다"만 있고 얼마인지가 없어서 고객이 다시 물어볼 것 같습니다.',
    time: "28\uBD84 \uC804"
  }), asked ? /*#__PURE__*/React.createElement(AICard, {
    kind: "\uB204\uC801 \uC810\uAC80",
    where: "\uC774 \uD654\uBA74",
    decision: aiDecision,
    onDecide: setAiDecision,
    reason: "\uC758\uACAC \uB450 \uAC1C\uB97C \uB2E4 \uBC18\uC601\uD558\uBA74 \uC774 \uD654\uBA74\uC5D0 \uC548\uB0B4 \uBB38\uAD6C\uAC00 3\uAC1C\uAC00 \uB429\uB2C8\uB2E4. \uB2E4\uC74C \uBC84\uD2BC\uC774 \uC811\uD798 \uC544\uB798\uB85C \uB0B4\uB824\uAC11\uB2C8\uB2E4.",
    suggestion: "\uC218\uC218\uB8CC \uC548\uB0B4\uB97C \uC811\uC5C8\uB2E4 \uD3B4\uB294 \uD615\uD0DC\uB85C \uBC14\uAFB8\uACE0, \uB2E4\uC74C \uBC84\uD2BC\uC744 \uD654\uBA74\uC5D0 \uACE0\uC815\uD569\uB2C8\uB2E4."
  }) : /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: () => setAsked(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 15
  }), "AI\uC5D0\uAC8C \uAC80\uD1A0 \uC694\uCCAD"))));
}
Object.assign(window, {
  WorkspaceScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/withcanvas/WorkspaceScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Artboard = __ds_scope.Artboard;

__ds_ns.ArtboardStage = __ds_scope.ArtboardStage;

__ds_ns.DiffSlider = __ds_scope.DiffSlider;

__ds_ns.AICard = __ds_scope.AICard;

__ds_ns.ChangeItem = __ds_scope.ChangeItem;

__ds_ns.CommentCard = __ds_scope.CommentCard;

__ds_ns.Pin = __ds_scope.Pin;

__ds_ns.ProjectRow = __ds_scope.ProjectRow;

__ds_ns.TaskBanner = __ds_scope.TaskBanner;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.ChoiceCard = __ds_scope.ChoiceCard;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Filmstrip = __ds_scope.Filmstrip;

__ds_ns.ModeToggle = __ds_scope.ModeToggle;

__ds_ns.StepTrail = __ds_scope.StepTrail;

__ds_ns.TopBar = __ds_scope.TopBar;

})();
