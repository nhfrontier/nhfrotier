/* @ds-bundle: {"format":4,"namespace":"NHDesignSystem_5d992c","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"LinkButton","sourcePath":"components/core/LinkButton.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"d4e642af9f4d","components/core/Button.jsx":"228a3b9ad425","components/core/Card.jsx":"aea9c08a2014","components/core/Input.jsx":"6527a955bec8","components/core/LinkButton.jsx":"5ca31565acd6","components/core/Tabs.jsx":"58c3176b5c63","ui_kits/ibz/B2BScreen.jsx":"1a7cbd3ccc89","ui_kits/ibz/Footer.jsx":"e46d30337402","ui_kits/ibz/Header.jsx":"4ad7eea9881e","ui_kits/ibz/HomeScreen.jsx":"20e551e95fd2","ui_kits/ibz/Icon.jsx":"6d0ec23d4b99","ui_kits/ibz/ProductListScreen.jsx":"61eb89e99854","ui_kits/ibz/ProductRecommendScreen.jsx":"51ca7e9fee29","ui_kits/securities/AccountBenefits.jsx":"3a7ccb017db9","ui_kits/securities/Disclaimer.jsx":"e139f2dd1713","ui_kits/securities/Features.jsx":"896e5ae3f43c","ui_kits/securities/Hero.jsx":"4a324fa3240c","ui_kits/securities/Mission.jsx":"9de3b0f38a15"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.NHDesignSystem_5d992c = window.NHDesignSystem_5d992c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NH기업뱅킹 Badge — compact status / category label.
 * Tones map to the brand semantic colors. Use `soft` for filled-pale chips.
 */
function Badge({
  children,
  tone = "neutral",
  // neutral | primary | green | navy | positive | negative | warning
  soft = true,
  style = {},
  ...rest
}) {
  const map = {
    neutral: {
      solid: "var(--grey-600)",
      soft: "var(--grey-100)",
      softText: "var(--grey-700)"
    },
    primary: {
      solid: "var(--color-primary)",
      soft: "var(--nh-blue-50)",
      softText: "var(--nh-blue-700)"
    },
    green: {
      solid: "var(--nh-green-500)",
      soft: "var(--nh-green-50)",
      softText: "var(--nh-green-700)"
    },
    navy: {
      solid: "var(--surface-navy)",
      soft: "var(--nh-blue-50)",
      softText: "var(--nh-navy-800)"
    },
    positive: {
      solid: "var(--status-positive)",
      soft: "var(--nh-green-50)",
      softText: "var(--nh-green-700)"
    },
    negative: {
      solid: "var(--status-negative)",
      soft: "#fdeceb",
      softText: "#b3261e"
    },
    warning: {
      solid: "var(--status-warning)",
      soft: "#fff5e6",
      softText: "#9a6400"
    }
  };
  const c = map[tone] || map.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "nh-badge",
    style: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 9px",
      borderRadius: "var(--radius-xs)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-xs)",
      fontWeight: "var(--fw-semibold)",
      lineHeight: 1,
      letterSpacing: "var(--ls-normal)",
      background: soft ? c.soft : c.solid,
      color: soft ? c.softText : "var(--text-on-fill)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NH기업뱅킹 Button — primary action control.
 * Variants follow the brand: solid NH-blue primary, navy for login/secure
 * actions, outline & ghost for secondary, plus the green accent.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      height: 36,
      padding: "0 14px",
      font: "var(--fs-sm)",
      radius: "var(--radius-sm)"
    },
    md: {
      height: 44,
      padding: "0 20px",
      font: "var(--fs-body)",
      radius: "var(--radius-sm)"
    },
    lg: {
      height: 52,
      padding: "0 28px",
      font: "var(--fs-body-lg)",
      radius: "var(--radius-md)"
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: "var(--color-primary)",
      color: "var(--text-on-fill)",
      border: "1px solid var(--color-primary)"
    },
    slate: {
      background: "var(--surface-action)",
      color: "var(--text-on-fill)",
      border: "1px solid var(--surface-action)"
    },
    navy: {
      background: "var(--surface-navy)",
      color: "var(--text-on-fill)",
      border: "1px solid var(--surface-navy)"
    },
    accent: {
      background: "var(--color-accent)",
      color: "var(--text-on-fill)",
      border: "1px solid var(--color-accent)"
    },
    outline: {
      background: "var(--white)",
      color: "var(--color-primary)",
      border: "1px solid var(--color-primary)"
    },
    secondary: {
      background: "var(--white)",
      color: "var(--text-body)",
      border: "1px solid var(--border-default)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-body)",
      border: "1px solid transparent"
    }
  };
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    className: "nh-btn",
    "data-variant": variant,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: block ? "100%" : "auto",
      height: s.height,
      padding: s.padding,
      fontFamily: "var(--font-sans)",
      fontSize: s.font,
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "var(--ls-normal)",
      lineHeight: 1,
      borderRadius: s.radius,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transition: "filter var(--dur-fast) var(--ease-standard), transform var(--dur-fast)",
      whiteSpace: "nowrap",
      ...v,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NH기업뱅킹 Card — the foundational container. White surface, light
 * border, subtle radius. Optional top-right ↗ affordance marks the whole
 * card as a navigation target.
 */
function Card({
  children,
  interactive = false,
  arrow = false,
  // show top-right ↗
  accent = null,
  // null | "blue" | "green" | "navy" — left/topbar tint
  padding = "var(--space-6)",
  style = {},
  ...rest
}) {
  const accentColors = {
    blue: "var(--color-primary)",
    green: "var(--color-accent)",
    navy: "var(--surface-navy)"
  };
  const accentBar = accent ? {
    borderTop: `3px solid ${accentColors[accent] || accentColors.blue}`
  } : {};
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "nh-card",
    "data-interactive": interactive ? "true" : undefined,
    style: {
      position: "relative",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding,
      boxShadow: "var(--shadow-sm)",
      transition: "box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-base), border-color var(--dur-base)",
      cursor: interactive ? "pointer" : "default",
      ...accentBar,
      ...style
    }
  }, rest), arrow && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      top: "var(--space-5)",
      right: "var(--space-5)",
      width: 28,
      height: 28,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-pill)",
      background: "var(--surface-sunken)",
      color: "var(--text-muted)",
      fontSize: 15,
      lineHeight: 1
    }
  }, "\u2197"), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NH기업뱅킹 Input — labeled text field. Clean rectangular field with a
 * 1px border that turns NH-blue on focus. Supports prefix/suffix and an
 * error message.
 */
function Input({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  prefix = null,
  suffix = null,
  error = null,
  disabled = false,
  required = false,
  id,
  style = {},
  ...rest
}) {
  const inputId = id || (label ? `nh-input-${label}` : undefined);
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? "var(--status-negative)" : focused ? "var(--border-focus)" : "var(--border-default)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-body)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--status-negative)",
      marginLeft: 3
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      height: 46,
      padding: "0 14px",
      background: disabled ? "var(--surface-sunken)" : "var(--white)",
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--radius-sm)",
      boxShadow: focused ? "var(--shadow-focus)" : "none",
      transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)"
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--fs-body)"
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-body)",
      color: "var(--text-strong)",
      letterSpacing: "var(--ls-normal)"
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--fs-sm)"
    }
  }, suffix)), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-xs)",
      color: "var(--status-negative)"
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/LinkButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NH기업뱅킹 LinkButton — the signature "자세히보기 >" text link.
 * A quiet, inline call-to-action used across cards and section footers.
 */
function LinkButton({
  children = "자세히보기",
  href,
  arrow = "chevron",
  // "chevron" | "diagonal" | "none"
  tone = "default",
  // "default" | "primary" | "muted"
  style = {},
  ...rest
}) {
  const tones = {
    default: "var(--text-body)",
    primary: "var(--color-primary)",
    muted: "var(--text-muted)"
  };
  const glyph = arrow === "diagonal" ? "↗" : arrow === "none" ? "" : "›";
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    type: href ? undefined : "button",
    className: "nh-linkbtn",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-medium)",
      color: tones[tone] || tones.default,
      letterSpacing: "var(--ls-normal)",
      textDecoration: "none",
      transition: "color var(--dur-fast) var(--ease-standard)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", null, children), glyph && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: "1.05em",
      color: "var(--text-muted)",
      lineHeight: 1
    }
  }, glyph));
}
Object.assign(__ds_scope, { LinkButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/LinkButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tabs.jsx
try { (() => {
/**
 * NH기업뱅킹 Tabs — underline tab bar used to switch panels within a card
 * or page section. Active tab carries an NH-blue underline + bold label.
 */
function Tabs({
  items = [],
  value,
  onChange,
  variant = "underline",
  // "underline" | "pill"
  style = {}
}) {
  const [internal, setInternal] = React.useState(items[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  if (variant === "pill") {
    return /*#__PURE__*/React.createElement("div", {
      role: "tablist",
      style: {
        display: "inline-flex",
        gap: "4px",
        padding: "4px",
        background: "var(--surface-sunken)",
        borderRadius: "var(--radius-pill)",
        ...style
      }
    }, items.map(it => {
      const on = it.value === active;
      return /*#__PURE__*/React.createElement("button", {
        key: it.value,
        role: "tab",
        "aria-selected": on,
        onClick: () => select(it.value),
        style: {
          border: "none",
          cursor: "pointer",
          height: 34,
          padding: "0 18px",
          borderRadius: "var(--radius-pill)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-sm)",
          fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
          color: on ? "var(--white)" : "var(--text-muted)",
          background: on ? "var(--color-primary)" : "transparent",
          transition: "all var(--dur-fast) var(--ease-standard)"
        }
      }, it.label);
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "flex",
      gap: "28px",
      borderBottom: "1px solid var(--border-subtle)",
      ...style
    }
  }, items.map(it => {
    const on = it.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": on,
      onClick: () => select(it.value),
      style: {
        border: "none",
        background: "none",
        cursor: "pointer",
        padding: "0 0 12px",
        position: "relative",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-body-lg)",
        fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)",
        color: on ? "var(--text-strong)" : "var(--text-muted)",
        transition: "color var(--dur-fast)"
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 3,
        borderRadius: "3px 3px 0 0",
        background: on ? "var(--color-primary)" : "transparent"
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ibz/B2BScreen.jsx
try { (() => {
/* global React, Icon */
// B2B전자결제 service landing — hero, service icons, quick panels,
// service card grid, virtual-experience banner, customer center.

const SERVICE_ICONS = [{
  name: "FileText",
  label: "전자어음발행/배서"
}, {
  name: "Search",
  label: "전자어음수취내역"
}, {
  name: "Award",
  label: "전자외상매출채권"
}, {
  name: "Landmark",
  label: "하도급대금외담대출"
}, {
  name: "Users",
  label: "NH다같이성장론"
}];
const CARDS = [{
  title: "EZ구매론",
  sub: "복잡한 절차없이 구매자금대출도 손쉽게",
  items: ["서비스이용안내", "판매기업", "구매기업"]
}, {
  title: "전자외상매출채권",
  sub: "기업간 상거래대금도 전자결제로",
  items: ["서비스이용안내", "협력기업(판매기업)", "구매기업"]
}, {
  title: "전자채권",
  sub: "전자외상매출채권도 전자결제 시스템으로",
  items: ["서비스이용안내", "판매기업", "구매기업"]
}, {
  title: "B2B구매자금대출",
  sub: "인도/인수와 대금결제의 안전을 보장하는",
  items: ["서비스이용안내", "판매기업", "구매기업"]
}, {
  title: "전자어음",
  sub: "안전한 지급결제도 전자어음으로",
  items: ["서비스이용안내", "전자어음발행/배서", "전자어음수취", "전자어음보증", "전자어음기타"]
}, {
  title: "네트워크론",
  sub: "계약/납품 전 생산자금을 지원하는",
  items: ["서비스이용안내", "네트워크론"]
}];
function OutlineCta({
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      height: 46,
      padding: "0 26px",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border-default)",
      background: "var(--white)",
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-strong)",
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, children, " ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 16,
    color: "var(--text-muted)"
  }));
}
function ServiceCard({
  c
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)",
      margin: "6px 0 14px"
    }
  }, c.sub), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "18px 20px",
      minHeight: 150,
      background: "var(--white)"
    }
  }, c.items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it,
    style: {
      display: "flex",
      gap: 8,
      fontSize: 14,
      color: "var(--text-body)",
      padding: "5px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "\xB7"), it))));
}
function QuickRow({
  title,
  sub,
  chips
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      padding: "22px 0"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)",
      marginTop: 5
    }
  }, sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, chips.map(ch => /*#__PURE__*/React.createElement("button", {
    key: ch.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 52,
      padding: "0 22px",
      minWidth: 150,
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border-subtle)",
      background: "var(--white)",
      boxShadow: "var(--shadow-xs)",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text-body)",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ch.icon,
    size: 20,
    color: "var(--color-primary)"
  }), " ", ch.label))));
}
function B2BScreen() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      paddingBottom: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "44px 0 30px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 32,
      fontWeight: 700
    }
  }, "B2B\uC804\uC790\uACB0\uC81C"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      fontWeight: 600,
      color: "var(--text-body)",
      marginTop: 14
    }
  }, "\uD310\uB9E4\uAE30\uC5C5\uACFC \uAD6C\uB9E4\uAE30\uC5C5 \uBAA8\uB450\uB97C \uC704\uD55C \uC804\uC790\uC0C1\uAC70\uB798 \uC804\uC6A9 \uC804\uC790\uACB0\uC81C \uC11C\uBE44\uC2A4"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)",
      marginTop: 8
    }
  }, "\uC804\uC790\uACB0\uC81C \xB7 B2B\uAD6C\uB9E4\uC790\uAE08\uB300\uCD9C \xB7 \uC138\uAE08\uACC4\uC0B0\uC11C \xB7 \uC804\uC790\uC5B4\uC74C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      justifyContent: "center",
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(OutlineCta, null, "\uC11C\uBE44\uC2A4 \uC774\uC6A9\uC548\uB0B4"), /*#__PURE__*/React.createElement(OutlineCta, null, "B2B \uC804\uC790\uACB0\uC81C \uB370\uBAA8 \uCCB4\uD5D8"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 56,
      padding: "16px 0 36px"
    }
  }, SERVICE_ICONS.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      width: 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: "var(--radius-md)",
      background: "var(--nh-blue-50)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.name,
    size: 30,
    color: "var(--color-primary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-body)",
      textAlign: "center",
      letterSpacing: "-0.02em"
    }
  }, s.label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--grey-50)",
      borderTop: "1px solid var(--border-subtle)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "10px 20px"
    }
  }, /*#__PURE__*/React.createElement(QuickRow, {
    title: "\uACB0\uC81C\uC9C4\uD589\uC0C1\uD669 \uCD1D\uAD04\uC870\uD68C",
    sub: "B2B \uACB0\uC81C\uC9C4\uD589\uC0C1\uD669\uC744 \uD55C\uB208\uC5D0 \uC870\uD68C",
    chips: [{
      icon: "Building2",
      label: "판매기업"
    }, {
      icon: "Building2",
      label: "구매기업"
    }, {
      icon: "ClipboardCheck",
      label: "B2B약정내역조회"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border-subtle)"
    }
  }), /*#__PURE__*/React.createElement(QuickRow, {
    title: "\uAE30\uC5C5\uAD6C\uB9E4\uC790\uAE08\uB300\uCD9C",
    sub: "\uAE30\uC5C5\uC758 \uC7AC\uD654\uC640 \uC6A9\uC5ED \uB4F1\uC758 \uBB3C\uD488\uC744 \uACB0\uC81C",
    chips: [{
      icon: "Info",
      label: "서비스이용안내"
    }, {
      icon: "Building2",
      label: "판매기업"
    }, {
      icon: "Building2",
      label: "구매기업"
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "44px 20px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 28,
      rowGap: 40
    }
  }, CARDS.map(c => /*#__PURE__*/React.createElement(ServiceCard, {
    key: c.title,
    c: c
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "26px 28px",
      display: "flex",
      gap: 36,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, "\uC138\uAE08\uACC4\uC0B0\uC11C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)",
      marginTop: 6
    }
  }, "\uC138\uAE08\uACC4\uC0B0\uC11C\uC758 \uB4F1\uB85D \uBC0F \uC870\uD68C \uB4F1\uC758 \uC5C5\uBB34\uB97C \uD55C\uBC88\uC5D0")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2, auto)",
      gap: "8px 56px"
    }
  }, ["세금계산서등록", "세금계산서조회/변경/취소", "세금계산서 연결조회/취소", "세금계산서대량등록"].map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "flex",
      gap: 8,
      fontSize: 14,
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "\xB7"), t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "20px auto 0",
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--nh-navy-800)",
      borderRadius: "var(--radius-md)",
      padding: "34px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      opacity: 0.8,
      marginBottom: 6
    }
  }, "\uAE30\uC5C5\uC778\uD130\uB137\uBC45\uD0B9\uC774 \uCC98\uC74C\uC774\uB77C\uBA74"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700
    }
  }, "NH\uAE30\uC5C5\uBC45\uD0B9 \uAC00\uC0C1\uCCB4\uD5D8\uAD00\uC744 \uC774\uC6A9\uD574 \uBCF4\uC138\uC694.")), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      background: "none",
      border: "none",
      color: "#fff",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\uBC14\uB85C \uCCB4\uD5D8\uD558\uAE30 ", /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.16)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 16
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "54px 20px 60px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 30,
      fontWeight: 700
    }
  }, "\uC774\uC6A9\uC5D0 \uC5B4\uB824\uC6C0\uC774 \uC788\uC73C\uC2E0\uAC00\uC694?"), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-body)"
    }
  }, "\uACE0\uAC1D\uC13C\uD130 ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 15,
    color: "var(--text-muted)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)",
      marginTop: 10
    }
  }, "\uC6B4\uC601\uC2DC\uAC04 : 9\uC2DC ~ 18\uC2DC ( \uACF5\uD734\uC77C \uD734\uBB34 )"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 56,
      marginTop: 26,
      fontVariantNumeric: "tabular-nums"
    }
  }, [["농협은행", "1661-3000 (929)"], ["농축협", "1661-2100 (929)"], ["해외", "+82-2-3074-1004"]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: "var(--text-muted)"
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, v))))));
}
window.B2BScreen = B2BScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ibz/B2BScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ibz/Footer.jsx
try { (() => {
/* global React, Icon */
// NH기업뱅킹 global footer — quick links, policy row, contact numbers,
// affiliate dropdown, certification badges.

function Footer() {
  const quick = ["사고신고", "이용안내", "가상체험", "인터넷뱅킹오류해결", "서식약관 자료실", "영업점찾기"];
  const policy = ["보호금융상품등록부", "개인정보처리방침", "경영공시", "은행소개"];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--white)",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "20px",
      display: "flex",
      justifyContent: "space-around",
      gap: 16,
      flexWrap: "wrap"
    }
  }, quick.map(q => /*#__PURE__*/React.createElement("a", {
    key: q,
    href: "#",
    style: {
      color: "var(--text-body)",
      textDecoration: "none",
      fontSize: 14,
      fontWeight: 500
    }
  }, q)))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "22px 20px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 22,
      flexWrap: "wrap"
    }
  }, policy.map((p, i) => /*#__PURE__*/React.createElement("a", {
    key: p,
    href: "#",
    style: {
      color: i === 0 ? "var(--text-strong)" : "var(--text-muted)",
      textDecoration: "none",
      fontSize: 13,
      fontWeight: i === 0 ? 700 : 500
    }
  }, p))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Facebook",
    size: 20,
    color: "var(--grey-400)"
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "Instagram",
    size: 20,
    color: "var(--grey-400)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-sm)",
      padding: "7px 12px",
      fontSize: 13,
      color: "var(--text-body)"
    }
  }, "\uACC4\uC5F4\uC0AC/\uAD00\uB828\uC0AC\uC774\uD2B8 ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronDown",
    size: 14
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "10px 20px 28px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 24,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      lineHeight: 1.9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 28,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-body)"
    }
  }, "\uB18D\uD611\uC740\uD589 \uC804\uC6A9"), " 1661-3000(929) / 1522-3000"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-body)"
    }
  }, "\uD574\uC678"), " +82-2-3704-1004")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 28,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-body)"
    }
  }, "\uB18D\xB7\uCD95\uD611 \uC804\uC6A9"), " 1661-2100(929) / 1522-2100"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-body)"
    }
  }, "\uACF5\uC6A9"), " 1588-2100 / 1544-2100")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, "Copyright NH Bank. All Right Reserved.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, ["WA", "bsi", "ISMS-P", "★"].map(b => /*#__PURE__*/React.createElement("div", {
    key: b,
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      background: "var(--grey-100)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 700,
      color: "var(--grey-500)"
    }
  }, b)))));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ibz/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ibz/Header.jsx
try { (() => {
/* global React, Icon */
// NH기업뱅킹 global header (GNB) — utility bar, logo + login/cert, main nav,
// and an optional blue category sub-bar. Faithful to ibz.nonghyup.com.

const NAV = ["조회/이체", "뱅킹업무", "공공/기업특화", "B2B전자결제", "부가서비스", "경영지원", "뱅킹관리", "금융상품"];
function Header({
  active = "",
  subNav = null,
  onNav = () => {},
  extraNav = []
}) {
  const items = [...NAV, ...extraNav];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: "var(--white)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 14,
      height: 40,
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement(UtilLink, null, "\uAC1C\uC778"), /*#__PURE__*/React.createElement(Bar, null), /*#__PURE__*/React.createElement(UtilLink, null, "\uAE30\uC5C5"), /*#__PURE__*/React.createElement(Bar, null), /*#__PURE__*/React.createElement(UtilLink, null, "\uCE74\uB4DC"), /*#__PURE__*/React.createElement(Bar, null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3
    }
  }, "GLOBAL ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronDown",
    size: 13
  })), /*#__PURE__*/React.createElement(Icon, {
    name: "Star",
    size: 16,
    color: "var(--grey-400)"
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "Search",
    size: 16,
    color: "var(--grey-500)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo.svg",
    alt: "NH\uAE30\uC5C5\uBC45\uD0B9",
    height: "34",
    style: {
      height: 34
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(PillBtn, null, "\uB85C\uADF8\uC778"), /*#__PURE__*/React.createElement(PillBtn, null, "\uC778\uC99D\uC13C\uD130"))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 22,
      alignSelf: "flex-start",
      marginTop: 4,
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: hl
  }, "\uC678\uD658"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: hl
  }, "\uD1F4\uC9C1\uC5F0\uAE08"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: hl
  }, "\uBCF4\uC548\uC13C\uD130"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: hl
  }, "\uACE0\uAC1D\uC13C\uD130")))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "2px solid var(--nh-navy-800)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 56
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 40
    }
  }, items.map(n => {
    const on = n === active;
    return /*#__PURE__*/React.createElement("button", {
      key: n,
      onClick: () => onNav(n),
      style: {
        border: "none",
        background: "none",
        cursor: "pointer",
        padding: 0,
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: on ? "var(--color-primary)" : "var(--text-strong)"
      }
    }, n);
  })), /*#__PURE__*/React.createElement(Icon, {
    name: "Menu",
    size: 26,
    color: "var(--text-strong)",
    strokeWidth: 2.2
  }))), subNav && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--nh-blue-400)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      height: 52,
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      opacity: 0.95
    }
  }, subNav.root), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 16,
      background: "rgba(255,255,255,0.45)",
      margin: "0 26px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 44
    }
  }, subNav.items.map(it => {
    const on = it === subNav.active;
    return /*#__PURE__*/React.createElement("span", {
      key: it,
      style: {
        position: "relative",
        fontSize: 16,
        fontWeight: on ? 700 : 500,
        color: "#fff",
        opacity: on ? 1 : 0.85,
        cursor: "pointer"
      }
    }, it, on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: "50%",
        bottom: -17,
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "7px solid transparent",
        borderRight: "7px solid transparent",
        borderTop: "7px solid var(--white)"
      }
    }));
  })))));
}
const hl = {
  color: "inherit",
  textDecoration: "none"
};
const Bar = () => /*#__PURE__*/React.createElement("span", {
  style: {
    width: 1,
    height: 11,
    background: "var(--grey-300)"
  }
});
function UtilLink({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: "pointer"
    }
  }, children);
}
function PillBtn({
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    style: {
      border: "1px solid var(--border-default)",
      background: "var(--white)",
      cursor: "pointer",
      borderRadius: "var(--radius-sm)",
      padding: "6px 14px",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-body)",
      whiteSpace: "nowrap"
    }
  }, children);
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ibz/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ibz/HomeScreen.jsx
try { (() => {
/* global React, Icon */
// NH기업뱅킹 메인 (홈) — notice bar, promo + login hero, recommend services,
// smart-banking app banner, help cards.
const HNS = window.NHDesignSystem_5d992c || {};
const HB = HNS.Button || (() => null);

/* ---------- notice bar ---------- */
function NoticeBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--nh-blue-50)",
      borderBottom: "1px solid var(--nh-blue-100)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/security.svg",
    alt: "",
    style: {
      width: 56,
      height: 56
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, "\uAE30\uC5C5\uBC45\uD0B9 \uBAA8\uBC14\uC77COTP \uC5C5\uB370\uC774\uD2B8 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: "var(--text-body)"
    }
  }, "\uC608\uC815 \uC548\uB0B4")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, "2026.4.23.(\uBAA9) \uC774\uD6C4\uBD80\uD130 \uBAA8\uBC14\uC77COTP \uBC84\uC804 \uC5C5\uB370\uC774\uD2B8\uB85C \uC778\uD558\uC5EC \uBAA8\uBC14\uC77COTP \uAC04\uD3B8/\uC7AC\uBC1C\uAE09 \uB300\uC0C1 \uBC0F \uBC29\uBC95 \uC548\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-body)",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--color-primary)"
    }
  }, "[\uB300\uC0C1]"), " \uAC1C\uC778\uC0AC\uC5C5\uC790 \uB2E8\uB3C5 \uBAA8\uBC14\uC77C OTP \uC0AC\uC6A9 \uACE0\uAC1D\uB2D8 \uC911 Android OS \uC0AC\uC6A9\uC790")), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 38,
      padding: "0 16px",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border-default)",
      background: "var(--white)",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-body)",
      cursor: "pointer"
    }
  }, "\uC790\uC138\uD788 \uBCF4\uAE30 ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 14
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      color: "var(--text-muted)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      border: "1px solid var(--border-default)",
      borderRadius: 3,
      display: "inline-block"
    }
  }), " \uC624\uB298 \uADF8\uB9CC \uBCF4\uAE30"), /*#__PURE__*/React.createElement(Icon, {
    name: "X",
    size: 18,
    color: "var(--text-muted)"
  })));
}

/* ---------- promo cards ---------- */
function PromoCard({
  children,
  foot = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "20px 22px"
    }
  }, children), foot && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "var(--nh-blue-deep)",
      color: "#fff",
      padding: "9px 16px",
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      opacity: 0.95,
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      border: "1px solid rgba(255,255,255,0.7)",
      borderRadius: 2,
      display: "inline-block"
    }
  }), " \uC624\uB298 \uD558\uB8E8 \uCC3D \uC5F4\uC9C0 \uC54A\uAE30"), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.9
    }
  }, "\uB2EB\uAE30")));
}
function DetailLink({
  children = "자세히보기"
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontSize: 13,
      fontWeight: 600,
      color: "var(--color-primary)",
      cursor: "pointer"
    }
  }, children, " ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 13
  }));
}

/* ---------- login panel ---------- */
function QuickAction({
  icon,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 26,
    color: "var(--nh-blue-600)",
    strokeWidth: 1.6
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-body)",
      fontWeight: 500
    }
  }, label));
}
function LoginPanel() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      height: 78,
      borderRadius: "var(--radius-md)",
      border: "none",
      background: "var(--nh-navy-800)",
      color: "#fff",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 18px",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 17,
      fontWeight: 700
    }
  }, "\uB85C\uADF8\uC778 ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 16
  })), /*#__PURE__*/React.createElement(Icon, {
    name: "User",
    size: 22,
    color: "rgba(255,255,255,0.85)"
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      height: 78,
      borderRadius: "var(--radius-md)",
      border: "none",
      background: "var(--color-primary)",
      color: "#fff",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 18px",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 17,
      fontWeight: 700
    }
  }, "\uC778\uC99D\uC13C\uD130 ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 16
  })), /*#__PURE__*/React.createElement(Icon, {
    name: "ShieldCheck",
    size: 22,
    color: "rgba(255,255,255,0.9)"
  }))), [["로그인 없이 빠른조회", "Zap"], ["법인 비대면 ONE STOP 가입", "Send"]].map(([t, ic]) => /*#__PURE__*/React.createElement("button", {
    key: t,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 52,
      padding: "0 18px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-subtle)",
      background: "var(--white)",
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, t, " ", /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 18,
    color: "var(--color-primary)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "20px 10px",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      rowGap: 20
    }
  }, [["ScrollText", "계좌조회"], ["ArrowRightLeft", "즉시이체"], ["ReceiptText", "거래내역"], ["MonitorCheck", "결제/승인"], ["FileBadge", "증명서발급"], ["GraduationCap", "대학등록금"]].map(([ic, l]) => /*#__PURE__*/React.createElement(QuickAction, {
    key: l,
    icon: ic,
    label: l
  }))));
}

/* ---------- service tiles ---------- */
function ServiceTile({
  illo,
  icon,
  label,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      height: 110,
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 18px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16.5,
      fontWeight: 700,
      color: "var(--text-strong)",
      whiteSpace: "nowrap"
    }
  }, label), illo ? /*#__PURE__*/React.createElement("img", {
    src: illo,
    alt: "",
    style: {
      width: 46,
      height: 46
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "var(--radius-md)",
      background: color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 24,
    color: "#fff"
  })));
}

/* ---------- recommend section ---------- */
function FeatureCard({
  title,
  sub,
  illo,
  icon,
  green,
  neww
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: green ? "var(--nh-green-500)" : "var(--white)",
      border: green ? "none" : "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "26px 28px",
      minHeight: 190,
      boxShadow: green ? "var(--shadow-md)" : "var(--shadow-sm)",
      overflow: "hidden",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ArrowUpRight",
    size: 22,
    color: green ? "rgba(255,255,255,0.9)" : "var(--text-muted)",
    style: {
      position: "absolute",
      top: 22,
      right: 22
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: green ? "#fff" : "var(--text-strong)",
      letterSpacing: "-0.02em"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      lineHeight: 1.55,
      color: green ? "rgba(255,255,255,0.92)" : "var(--text-muted)",
      marginTop: 10,
      maxWidth: 200
    }
  }, sub), neww && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 28,
      bottom: 30,
      background: "var(--color-primary)",
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      borderRadius: "var(--radius-pill)",
      padding: "3px 10px"
    }
  }, "NEW"), green ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 24,
      bottom: 20,
      width: 64,
      height: 64,
      borderRadius: "var(--radius-md)",
      background: "rgba(255,255,255,0.16)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Package",
    size: 34,
    color: "#fff"
  })) : /*#__PURE__*/React.createElement("img", {
    src: illo,
    alt: "",
    style: {
      position: "absolute",
      right: 22,
      bottom: 18,
      width: 74,
      height: 74
    }
  }));
}
function RecommendSection() {
  const hashes = ["모두가 주목하는\nNH농협은행 금융추천상품", "비대면으로 더 편리한\n금융업무서비스", "NH농협은행만의\n특별한 금융업무서비스", "기업을 위한 맞춤형\n부가서비스"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--grey-50)",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "56px 20px 64px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)"
    }
  }, "\uD14C\uB9C8\uBCC4\uB85C \uAC00\uC7A5 \uCD94\uCC9C\uD558\uB294 \uC11C\uBE44\uC2A4\uB97C \uBAA8\uC544\uC654\uC5B4\uC694"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginTop: 8
    }
  }, "NH\uAE30\uC5C5 \uCD94\uCC9C\uC11C\uBE44\uC2A4")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 19,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-primary)",
      borderTop: "3px solid var(--color-primary)",
      paddingTop: 4
    }
  }, "NH \uB18D\uD611\uC740\uD589"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-body)"
    }
  }, "\uB18D \xB7 \uCD95\uD611"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gap: 36
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      lineHeight: 1.5
    }
  }, "# \uAE30\uC5C5\uAE08\uC735, \uB354 \uAC04\uD3B8\uD558\uAC8C", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      borderBottom: "3px solid var(--color-primary)"
    }
  }, "The Quicker")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      display: "flex",
      flexDirection: "column",
      gap: 22
    }
  }, hashes.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-body)",
      whiteSpace: "pre-line",
      lineHeight: 1.5
    }
  }, "# ", h)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(FeatureCard, {
    green: true,
    title: "NH BOX",
    sub: "\uAE30\uC5C5\uC5D0\uC11C \uD544\uC694\uD55C \uAC01\uC885 \uC11C\uB958\uB97C \uBC1C\uAE09\xB7\uBCF4\uAD00\uD558\uACE0, \uC601\uC5C5\uC810\uC73C\uB85C \uC81C\uCD9C\uAC00\uB2A5\uD55C \uC11C\uBE44\uC2A4"
  }), /*#__PURE__*/React.createElement(FeatureCard, {
    title: "THE QUICKER",
    sub: "\uC0C8\uB85C\uC6CC\uC9C4 NH \uAE30\uC5C5\uAE08\uC735\uC758 \uBE44\uB300\uBA74 \uC11C\uBE44\uC2A4",
    illo: "../../assets/illustrations/building.svg"
  }), /*#__PURE__*/React.createElement(FeatureCard, {
    title: "ONE STOP \uC2E0\uADDC\uAC00\uC785",
    sub: "\uACC4\uC88C \uAC1C\uC124\uBD80\uD130 \uAE30\uC5C5\uBC45\uD0B9\uAE4C\uC9C0 \uBC95\uC778\uB3C4 \uC774\uC81C \uBE44\uB300\uBA74\uC73C\uB85C \uD55C \uBC88\uC5D0 !",
    illo: "../../assets/illustrations/card.svg"
  }), /*#__PURE__*/React.createElement(FeatureCard, {
    neww: true,
    title: "NH\uAE30\uC5C5e\uC815\uAE30\uC608\uAE08 (The Quicker)",
    sub: "\uBCF5\uC7A1\uD55C \uC6B0\uB300\uC870\uAC74 \uC5C6\uC774 \uAE30\uC5C5 \uC5EC\uC720\uC790\uAE08\uC744 \uC6B4\uC6A9\uD560 \uC218 \uC788\uB294 \uD2B9\uD310 \uC0C1\uD488",
    illo: "../../assets/illustrations/coins.svg"
  })))));
}

/* ---------- app banner ---------- */
function AppBanner() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "44px auto 0",
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--nh-navy-900)",
      borderRadius: "var(--radius-lg)",
      padding: "30px 44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 30
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Smartphone",
    size: 52,
    color: "rgba(255,255,255,0.85)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      opacity: 0.8
    }
  }, "\uC5B8\uC81C \uC5B4\uB514\uC11C\uB098 \uD3B8\uD558\uAC8C \uC774\uC6A9\uD558\uB294 \uB098\uB9CC\uC758 \uC2A4\uB9C8\uD2B8 \uAE08\uC735 \uD30C\uD2B8\uB108"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      marginTop: 6
    }
  }, "NH\uAE30\uC5C5\uC2A4\uB9C8\uD2B8\uBC45\uD0B9"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14
    }
  }, ["Google Play", "App Store"].map(s => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 84,
      height: 84,
      background: "#fff",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "QrCode",
    size: 64,
    color: "#111"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      opacity: 0.8,
      marginTop: 6
    }
  }, s))))));
}

/* ---------- help cards ---------- */
function HelpSection() {
  const cards = [["Headset", "고객센터"], ["FileText", "자주하는 질문"], ["MessageSquare", "1:1문의"], ["MonitorSmartphone", "화면공유상담"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "56px 20px 50px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      marginBottom: 24
    }
  }, "\uB3C4\uC6C0\uC774 \uD544\uC694\uD558\uC2E0\uAC00\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 18
    }
  }, cards.map(([ic, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "26px 24px",
      background: "var(--white)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 28,
    color: "var(--color-primary)",
    strokeWidth: 1.6
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-strong)",
      marginTop: 18
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(DetailLink, null, "\uC790\uC138\uD788\uBCF4\uAE30"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-strong)",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Volume2",
    size: 18,
    color: "var(--color-primary)"
  }), " \uC0C8\uC18C\uC2DD"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14,
      color: "var(--text-body)"
    }
  }, "\uACBD\uC601\uC7AC\uC81C \uAC1C\uC778\uC804\uC0B0 \uC2DC\uC2A4\uD15C \uC911\uB2E8 \uBC0F \uC811\uC18D\uC9C0\uC5F0 \uC548\uC815 \uC548\uB0B4"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronUp",
    size: 16
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronDown",
    size: 16
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "Pause",
    size: 16
  }))));
}

/* ---------- hero ---------- */
function Popup({
  top,
  left,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top,
      left,
      width: 380,
      zIndex: 30,
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)"
    }
  }, children);
}
function Hero() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      maxWidth: 1200,
      margin: "0 auto",
      padding: "26px 20px 40px",
      minHeight: 640
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/building.svg",
    alt: "",
    style: {
      position: "absolute",
      left: "40%",
      top: 70,
      width: 240,
      opacity: 0.25,
      pointerEvents: "none",
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1,
      display: "grid",
      gridTemplateColumns: "1fr 360px",
      gap: 18,
      minHeight: 520,
      alignItems: "end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(HB, {
    variant: "accent",
    style: {
      borderRadius: "var(--radius-pill)",
      height: 46
    },
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "ChevronRight",
      size: 16
    })
  }, "\uCCB4\uD5D8PLAY \uBC14\uB85C\uAC00\uAE30"), /*#__PURE__*/React.createElement(HB, {
    variant: "primary",
    style: {
      borderRadius: "var(--radius-pill)",
      height: 46
    },
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "ChevronRight",
      size: 16
    })
  }, "\uAC00\uC0C1\uCCB4\uD5D8\uAD00 \uBC14\uB85C\uAC00\uAE30")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(ServiceTile, {
    label: "NH BOX",
    icon: "Package",
    color: "var(--nh-green-500)"
  }), /*#__PURE__*/React.createElement(ServiceTile, {
    label: "\uC774\uCCB4",
    illo: "../../assets/illustrations/transfer.svg"
  }), /*#__PURE__*/React.createElement(ServiceTile, {
    label: "\uC804\uC790\uC5B4\uC74C",
    illo: "../../assets/illustrations/document.svg"
  }), /*#__PURE__*/React.createElement(ServiceTile, {
    label: "\uAE08\uC735\uC778\uC99D\uC11C",
    icon: "ShieldCheck",
    color: "var(--color-primary)"
  }), /*#__PURE__*/React.createElement(ServiceTile, {
    label: "\uACC4\uC88C\uAD00\uB9AC",
    illo: "../../assets/illustrations/card.svg"
  }))), /*#__PURE__*/React.createElement(LoginPanel, null)), /*#__PURE__*/React.createElement(Popup, {
    top: 26,
    left: 20
  }, /*#__PURE__*/React.createElement(PromoCard, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-body)"
    }
  }, "\uBCF5\uC7A1\uD55C \uC6B0\uB300\uC870\uAC74 \uC5C6\uC774 \uC5EC\uC720\uC790\uAE08\uC744 \uC6B4\uC6A9\uD560 \uC218 \uC788\uB294"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      color: "var(--text-strong)",
      marginTop: 4
    }
  }, "NH\uAE30\uC5C5e\uC815\uAE30\uC608\uAE08", /*#__PURE__*/React.createElement("br", null), "(The Quicker)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-primary)",
      fontWeight: 600,
      marginTop: 10
    }
  }, "#\uBE60\uB974\uACE0 \uAC04\uD3B8 \xA0#\uD2B9\uD310\uC0C1\uD488"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--grey-50)",
      borderRadius: "var(--radius-sm)",
      padding: "12px 14px",
      marginTop: 14,
      fontSize: 13.5,
      color: "var(--text-body)",
      lineHeight: 1.9
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-strong)"
    }
  }, "\uAC00\uC785\uB300\uC0C1"), " \xA0 \uC911\uC18C\uAE30\uC5C5 (\uAC1C\uC778\uC0AC\uC5C5\uC790 \uC81C\uC678)"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-strong)"
    }
  }, "\uAC00\uC785\uAE30\uAC04"), " \xA0 12\uAC1C\uC6D4")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(DetailLink, null)))), /*#__PURE__*/React.createElement(Popup, {
    top: 26,
    left: 412
  }, /*#__PURE__*/React.createElement(PromoCard, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--color-primary)"
    }
  }, "NH\uC784\uBCA0\uB514\uB4DC\uD50C\uB7AB\uD3FC \uC2E0\uADDC\uAC00\uC785 EVENT"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: "var(--text-strong)",
      marginTop: 6
    }
  }, "\uC120\uCC29\uC21C 300\uBA85\uC5D0\uAC8C \uC120\uBB3C\uB4DC\uB824\uC694!"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 16,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--nh-blue-50)",
      color: "var(--color-primary)",
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 4,
      padding: "4px 10px"
    }
  }, "\uC774\uBCA4\uD2B8 \uBC29\uBC95"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-body)"
    }
  }, "\uC81C\uD734 \uD50C\uB7AB\uD3FC \uC5F0\uB3D9 \uC2DC \uC0C1\uD488\uAD8C 5\uB9CC\uC6D0 \uC9C0\uAE09!")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--nh-blue-50)",
      color: "var(--color-primary)",
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 4,
      padding: "4px 10px"
    }
  }, "\uC774\uBCA4\uD2B8 \uAE30\uAC04"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-body)"
    }
  }, "5.08(\uAE08) ~ 7.31(\uAE08)")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(DetailLink, null)))), /*#__PURE__*/React.createElement(Popup, {
    top: 368,
    left: 20
  }, /*#__PURE__*/React.createElement(PromoCard, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: "var(--color-primary)"
    }
  }, "NH\uC6D0\uD074\uB9AD \uC138\uBB34 OPEN \uC774\uBCA4\uD2B8"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--text-strong)",
      marginTop: 10
    }
  }, "\uD658\uAE09 \uBC1B\uAE30 \uC5B4\uB824\uC6B0\uC2DC\uB2E4\uBA74?", /*#__PURE__*/React.createElement("br", null), "\uD658\uAE09+\u03B1, \uD55C\uBC88 \uB354 \uCC59\uAE30\uC138\uC694!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-body)",
      marginTop: 12,
      lineHeight: 1.9
    }
  }, "\uD61C\uD0DD1. NH\uD3EC\uC778\uD2B8 100\uB9CCPoint (5\uBA85)", /*#__PURE__*/React.createElement("br", null), "\uD61C\uD0DD2. \uAD50\uD1B5\uBE44 \uC9C0\uC6D0 3\uB9CC\uC6D0 (100\uBA85)", /*#__PURE__*/React.createElement("br", null), "\uD61C\uD0DD3. \uD504\uB9AC\uBBF8\uC5C4 \uC790\uC0B0\uAD00\uB9AC \uC11C\uBE44\uC2A4 (1\uBA85)"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(DetailLink, null)))));
}
function HomeScreen() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement(NoticeBar, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40
    }
  }), /*#__PURE__*/React.createElement(RecommendSection, null), /*#__PURE__*/React.createElement(AppBanner, null), /*#__PURE__*/React.createElement(HelpSection, null));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ibz/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ibz/Icon.jsx
try { (() => {
/* global React, lucide */
// Thin React wrapper over Lucide UMD icons (substitute for NH's proprietary
// icon set — see README). Usage: <Icon name="Search" size={18} />
function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.8,
  style = {}
}) {
  const lib = typeof lucide !== "undefined" && lucide || window.lucide || {};
  const map = lib.icons || lib;
  let node = map[name];
  // lucide icon node = [ [tag, attrs], ... ]  (sometimes wrapped)
  if (node && node.length && typeof node[0] === "string") node = node[2]; // [tag, attrs, children]
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      flex: "none",
      ...style
    }
  }, Array.isArray(node) && node.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
window.Icon = Icon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ibz/Icon.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ibz/ProductListScreen.jsx
try { (() => {
/* global React */
// 금융상품 > 예금 상품 목록 — filter panel, sort, product cards, pagination.
const NS = window.NHDesignSystem_5d992c || {};
const PB = NS.Button || (() => null);
const PRODUCTS = [{
  tags: ["법인"],
  name: "NH기업e정기예금(The Quicker)",
  type: "예금 상품",
  hi: "3.63",
  lo: "3.63",
  term: "12개월",
  cta: "가입하기"
}, {
  tags: ["법인"],
  name: "NH기업e정기예금",
  type: "예금 상품",
  hi: "3.35",
  lo: "3.35",
  term: "12개월",
  cta: "가입하기"
}, {
  tags: ["개인", "법인"],
  name: "큰만족실세예금",
  type: "예금 상품",
  hi: "2.15",
  lo: "2.15",
  term: "12개월",
  cta: "가입하기"
}, {
  tags: ["법인"],
  name: "NH더퍼스트기업통장",
  type: "입출금 자유 상품",
  cta: "가입하기"
}, {
  tags: ["법인"],
  name: "기업자유예금",
  type: "입출금 자유 상품",
  cta: "가입하기"
}, {
  tags: ["개인사업자"],
  name: "사업잘되는NH통장",
  type: "입출금 자유 상품",
  cta: "스마트폰가입",
  disabled: true
}, {
  tags: ["개인", "법인"],
  name: "정기적금",
  type: "적금 상품",
  hi: "1.95",
  lo: "1.95",
  term: "12개월",
  cta: "가입하기"
}, {
  tags: ["개인사업자", "법인"],
  name: "알짜배기기업예금(MMDA)",
  type: "입출금 자유 상품",
  cta: "영업점가입",
  disabled: true
}];
const TAG_COLOR = {
  "법인": {
    fg: "var(--nh-blue-600)",
    bd: "var(--nh-blue-300)"
  },
  "개인": {
    fg: "#d6478b",
    bd: "#f0b8d3"
  },
  "개인사업자": {
    fg: "var(--nh-green-600)",
    bd: "#a9dcc0"
  }
};
function PillGroup({
  label,
  options,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: 110,
      flex: "none",
      color: "var(--text-body)",
      fontWeight: 600,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "var(--grey-200)",
      display: "inline-block"
    }
  }), label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, options.map(o => {
    const on = o === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o,
      onClick: () => onChange(o),
      style: {
        cursor: "pointer",
        height: 40,
        padding: "0 22px",
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        fontSize: 14,
        fontWeight: on ? 700 : 500,
        color: on ? "#fff" : "var(--text-muted)",
        background: on ? "var(--surface-action)" : "var(--white)",
        border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)"
      }
    }, o);
  })));
}
function ProductRow({
  p
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "30px 32px",
      borderBottom: "1px solid var(--grey-150)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 12
    }
  }, p.tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      height: 24,
      padding: "0 10px",
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "var(--radius-pill)",
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: "nowrap",
      color: TAG_COLOR[t].fg,
      border: `1px solid ${TAG_COLOR[t].bd}`
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text-strong)",
      letterSpacing: "-0.02em"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)",
      marginTop: 6
    }
  }, p.type)), p.hi && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontVariantNumeric: "tabular-nums"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "\uCD5C\uACE0 \uC5F0"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: "var(--status-negative)"
    }
  }, p.hi, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "\uCD5C\uC800 \uC5F0"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: "var(--status-negative)"
    }
  }, p.lo, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, "(", p.term, ")")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 150,
      flex: "none",
      display: "flex",
      justifyContent: "flex-end"
    }
  }, p.disabled ? /*#__PURE__*/React.createElement("button", {
    disabled: true,
    style: {
      height: 44,
      padding: "0 26px",
      borderRadius: "var(--radius-pill)",
      border: "1px solid var(--border-default)",
      background: "var(--grey-100)",
      color: "var(--text-disabled)",
      fontSize: 15,
      fontWeight: 600,
      cursor: "not-allowed"
    }
  }, p.cta) : /*#__PURE__*/React.createElement(PB, {
    variant: "slate",
    style: {
      borderRadius: "var(--radius-pill)",
      height: 44,
      padding: "0 30px"
    }
  }, p.cta)));
}
function ProductListScreen() {
  const [target, setTarget] = React.useState("전체");
  const [channel, setChannel] = React.useState("전체");
  const [sort, setSort] = React.useState("추천순");
  const tabs = ["전체", "입출금 자유", "예금", "적금", "지수연동예금(ELD)"];
  const [tab, setTab] = React.useState("전체");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-page)",
      paddingBottom: 60
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      color: "var(--text-muted)",
      padding: "20px 0 8px"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uAE08\uC735\uC0C1\uD488"), /*#__PURE__*/React.createElement("span", null, "\u203A"), /*#__PURE__*/React.createElement("span", null, "\uC608\uAE08"), /*#__PURE__*/React.createElement("span", null, "\u203A"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-body)",
      fontWeight: 600
    }
  }, "\uC608\uAE08 \uC0C1\uD488")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 44,
      borderBottom: "1px solid var(--border-subtle)",
      marginBottom: 24
    }
  }, tabs.map(t => {
    const on = t === tab;
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => setTab(t),
      style: {
        border: "none",
        background: "none",
        cursor: "pointer",
        padding: "0 0 16px",
        position: "relative",
        whiteSpace: "nowrap",
        fontSize: 17,
        fontWeight: on ? 700 : 500,
        color: on ? "var(--color-primary)" : "var(--text-muted)"
      }
    }, t, on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 3,
        background: "var(--color-primary)"
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--grey-50)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "26px 32px",
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(PillGroup, {
    label: "\uAC00\uC785\uB300\uC0C1",
    options: ["전체", "개인", "개인사업자", "법인", "기타"],
    value: target,
    onChange: setTarget
  }), /*#__PURE__*/React.createElement(PillGroup, {
    label: "\uAC00\uC785\uCC44\uB110",
    options: ["전체", "인터넷", "스마트폰", "영업점"],
    value: channel,
    onChange: setChannel
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      margin: "26px 0 10px"
    }
  }, /*#__PURE__*/React.createElement(PB, {
    variant: "slate",
    size: "lg",
    style: {
      borderRadius: "var(--radius-pill)",
      width: 130
    }
  }, "\uC870\uD68C")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 18,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, ["추천순", "금리순", "출시순"].map(s => {
    const on = s === sort;
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => setSort(s),
      style: {
        cursor: "pointer",
        height: 32,
        padding: "0 16px",
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        fontSize: 13,
        fontWeight: on ? 700 : 500,
        color: on ? "#fff" : "var(--text-muted)",
        background: on ? "var(--surface-action)" : "transparent",
        border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)"
      }
    }, s);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, "2026.06.27 \uAE30\uC900")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      borderTop: "2px solid var(--grey-700)",
      overflow: "hidden"
    }
  }, PRODUCTS.map((p, i) => /*#__PURE__*/React.createElement(ProductRow, {
    key: i,
    p: p
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 18,
      marginTop: 28,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--color-primary)",
      textDecoration: "underline"
    }
  }, "1"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      cursor: "pointer"
    }
  }, "2"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "\u203A"))));
}
window.ProductListScreen = ProductListScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ibz/ProductListScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ibz/ProductRecommendScreen.jsx
try { (() => {
/* global React, Icon */
// 금융상품 > 맞춤 상품 추천 — 기업 정보 진단(스텝) → 매칭 점수 기반 추천 결과.
const RNS = window.NHDesignSystem_5d992c || {};
const RB = RNS.Button || (() => null);
const STEPS = [{
  key: "purpose",
  label: "자금 목적",
  hint: "가장 가까운 목적을 하나 선택해 주세요.",
  options: ["여유자금 운용", "운전자금 조달", "시설투자", "결제·정산 관리", "환리스크 관리"]
}, {
  key: "size",
  label: "기업 규모",
  hint: "연 매출 기준으로 선택해 주세요.",
  options: ["10억 미만", "10~50억", "50~300억", "300억 이상"]
}, {
  key: "term",
  label: "운용 기간",
  hint: "자금을 묶어둘 수 있는 기간입니다.",
  options: ["3개월 이내", "6개월", "12개월", "24개월 이상"]
}, {
  key: "type",
  label: "사업자 형태",
  hint: "가입대상 판별에 사용됩니다.",
  options: ["법인", "개인사업자"]
}];

// 각 상품이 선호하는 답변 — 일치할수록 매칭 점수가 올라갑니다.
const CATALOG = [{
  name: "NH기업e정기예금(The Quicker)",
  type: "예금 상품",
  rate: "3.63",
  term: "12개월",
  tags: ["법인"],
  badge: "특판",
  why: ["복잡한 우대조건 없이 최고금리 적용", "인터넷·스마트폰 비대면 즉시 가입", "12개월 여유자금 운용에 최적"],
  pref: {
    purpose: "여유자금 운용",
    size: "50~300억",
    term: "12개월",
    type: "법인"
  }
}, {
  name: "NH기업e정기예금",
  type: "예금 상품",
  rate: "3.35",
  term: "12개월",
  tags: ["법인"],
  why: ["예치 기간을 자유롭게 설정", "만기 자동 재예치 지원"],
  pref: {
    purpose: "여유자금 운용",
    size: "10~50억",
    term: "6개월",
    type: "법인"
  }
}, {
  name: "알짜배기기업예금(MMDA)",
  type: "입출금 자유 상품",
  rate: "2.05",
  term: "수시",
  tags: ["법인", "개인사업자"],
  why: ["입출금 자유로우면서 잔액별 금리 적용", "단기 결제성 자금에 적합"],
  pref: {
    purpose: "결제·정산 관리",
    size: "10~50억",
    term: "3개월 이내",
    type: "법인"
  }
}, {
  name: "NH더퍼스트기업통장",
  type: "입출금 자유 상품",
  tags: ["법인"],
  why: ["이체·증명서 수수료 우대", "기업뱅킹 이용실적으로 등급 상향"],
  pref: {
    purpose: "결제·정산 관리",
    size: "50~300억",
    term: "3개월 이내",
    type: "법인"
  }
}, {
  name: "사업잘되는NH통장",
  type: "입출금 자유 상품",
  tags: ["개인사업자"],
  why: ["개인사업자 전용 수수료 면제 혜택", "카드 매출대금 입금 우대"],
  pref: {
    purpose: "결제·정산 관리",
    size: "10억 미만",
    term: "3개월 이내",
    type: "개인사업자"
  }
}, {
  name: "NH기업운전자금대출",
  type: "대출 상품",
  rate: "4.82",
  term: "1년(연장)",
  tags: ["법인", "개인사업자"],
  why: ["매출채권 기반 한도 산정", "비대면 한도조회 후 영업점 방문 1회"],
  pref: {
    purpose: "운전자금 조달",
    size: "10~50억",
    term: "12개월",
    type: "법인"
  }
}, {
  name: "NH시설자금대출",
  type: "대출 상품",
  rate: "4.35",
  term: "최장 10년",
  tags: ["법인"],
  why: ["설비·부동산 취득자금 장기 분할상환", "정책자금 연계 가능"],
  pref: {
    purpose: "시설투자",
    size: "300억 이상",
    term: "24개월 이상",
    type: "법인"
  }
}, {
  name: "기업 외화정기예금",
  type: "외화예금 상품",
  rate: "3.10",
  term: "6개월",
  tags: ["법인"],
  why: ["USD·EUR 등 8개 통화 운용", "선물환 연계로 환리스크 축소"],
  pref: {
    purpose: "환리스크 관리",
    size: "50~300억",
    term: "6개월",
    type: "법인"
  }
}];
const WEIGHT = {
  purpose: 46,
  size: 20,
  term: 22,
  type: 12
};
function score(p, ans) {
  let s = 26;
  STEPS.forEach(({
    key
  }) => {
    if (ans[key] && ans[key] === p.pref[key]) s += WEIGHT[key];
  });
  if (ans.type && !p.tags.includes(ans.type)) s -= 30;
  return Math.max(12, Math.min(98, s));
}
function Chip({
  on,
  children,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      cursor: "pointer",
      height: 46,
      padding: "0 24px",
      borderRadius: "var(--radius-pill)",
      whiteSpace: "nowrap",
      fontSize: 15,
      fontWeight: on ? 700 : 500,
      color: on ? "#fff" : "var(--text-body)",
      background: on ? "var(--surface-action)" : "var(--white)",
      border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)",
      transition: "background 140ms ease, color 140ms ease"
    }
  }, children);
}
function StepBlock({
  step,
  index,
  value,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "220px 1fr",
      gap: 24,
      alignItems: "start",
      padding: "26px 0",
      borderTop: index === 0 ? "none" : "1px solid var(--grey-150)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: "50%",
      flex: "none",
      background: value ? "var(--color-primary)" : "var(--grey-200)",
      color: value ? "#fff" : "var(--text-muted)",
      fontSize: 12.5,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, index + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-strong)",
      letterSpacing: "-0.02em"
    }
  }, step.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 8,
      paddingLeft: 34
    }
  }, step.hint)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, step.options.map(o => /*#__PURE__*/React.createElement(Chip, {
    key: o,
    on: value === o,
    onClick: () => onPick(o)
  }, o))));
}
function MatchRing({
  value,
  size = 96,
  dark
}) {
  const track = dark ? "rgba(255,255,255,0.22)" : "var(--grey-150)";
  const fill = dark ? "#fff" : "var(--color-primary)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flex: "none",
      background: `conic-gradient(${fill} ${value * 3.6}deg, ${track} 0deg)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: size - 16,
      height: size - 16,
      borderRadius: "50%",
      background: dark ? "var(--nh-navy-900)" : "var(--white)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size / 3.6,
      fontWeight: 800,
      color: dark ? "#fff" : "var(--color-primary)",
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "-0.03em"
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: dark ? "rgba(255,255,255,0.7)" : "var(--text-muted)"
    }
  }, "\uB9E4\uCE6D")));
}
function TagPills({
  tags
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      height: 24,
      padding: "0 10px",
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "var(--radius-pill)",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--nh-blue-600)",
      border: "1px solid var(--nh-blue-300)"
    }
  }, t)));
}
function TopPick({
  p,
  value,
  saved,
  onSave
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--nh-navy-900)",
      borderRadius: "var(--radius-lg)",
      padding: "34px 38px",
      color: "#fff",
      display: "flex",
      gap: 34,
      alignItems: "center",
      boxShadow: "var(--shadow-md)"
    }
  }, /*#__PURE__*/React.createElement(MatchRing, {
    value: value,
    size: 116,
    dark: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--color-primary)",
      borderRadius: "var(--radius-pill)",
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 700
    }
  }, "1\uC21C\uC704 \uCD94\uCC9C"), p.badge && /*#__PURE__*/React.createElement("span", {
    style: {
      border: "1px solid rgba(255,255,255,0.5)",
      borderRadius: "var(--radius-pill)",
      padding: "3px 11px",
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.9
    }
  }, p.badge)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontWeight: 800,
      marginTop: 14,
      letterSpacing: "-0.025em"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      opacity: 0.72,
      marginTop: 6
    }
  }, p.type, " \xB7 \uAC00\uC785\uB300\uC0C1 ", p.tags.join("/"), p.term ? ` · ${p.term}` : ""), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: "18px 0 0",
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, p.why.map(w => /*#__PURE__*/React.createElement("li", {
    key: w,
    style: {
      display: "flex",
      gap: 9,
      alignItems: "flex-start",
      fontSize: 14.5,
      color: "rgba(255,255,255,0.9)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Check",
    size: 16,
    color: "var(--nh-green-400, #34c47c)",
    strokeWidth: 2.6,
    style: {
      marginTop: 2,
      flex: "none"
    }
  }), " ", w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 190,
      flex: "none",
      textAlign: "right"
    }
  }, p.rate && /*#__PURE__*/React.createElement("div", {
    style: {
      fontVariantNumeric: "tabular-nums"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      opacity: 0.75
    }
  }, "\uCD5C\uACE0 \uC5F0"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 1.1
    }
  }, p.rate, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(RB, {
    variant: "primary",
    size: "lg",
    style: {
      borderRadius: "var(--radius-pill)",
      width: "100%"
    }
  }, "\uAC00\uC785\uD558\uAE30"), /*#__PURE__*/React.createElement("button", {
    onClick: onSave,
    style: {
      height: 42,
      borderRadius: "var(--radius-pill)",
      border: "1px solid rgba(255,255,255,0.45)",
      background: saved ? "rgba(255,255,255,0.16)" : "transparent",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, saved ? "비교함에 담김" : "비교함에 담기"))));
}
function ResultRow({
  p,
  value,
  rank,
  saved,
  onSave
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "24px 28px",
      borderBottom: "1px solid var(--grey-150)",
      background: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      flex: "none",
      fontSize: 15,
      fontWeight: 700,
      color: "var(--text-muted)",
      fontVariantNumeric: "tabular-nums"
    }
  }, rank), /*#__PURE__*/React.createElement(MatchRing, {
    value: value,
    size: 72
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(TagPills, {
    tags: p.tags
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text-strong)",
      letterSpacing: "-0.02em",
      marginTop: 10
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)",
      marginTop: 5
    }
  }, p.type, p.term ? ` · ${p.term}` : "", " \u2014 ", p.why[0])), p.rate && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)"
    }
  }, "\uCD5C\uACE0 \uC5F0"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: "var(--status-negative)"
    }
  }, p.rate, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 218,
      flex: "none",
      display: "flex",
      justifyContent: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSave,
    style: {
      height: 42,
      padding: "0 16px",
      borderRadius: "var(--radius-pill)",
      border: `1px solid ${saved ? "var(--color-primary)" : "var(--border-default)"}`,
      background: saved ? "var(--nh-blue-50)" : "var(--white)",
      color: saved ? "var(--color-primary)" : "var(--text-body)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, saved ? "담김" : "비교"), /*#__PURE__*/React.createElement(RB, {
    variant: "slate",
    style: {
      borderRadius: "var(--radius-pill)",
      height: 42,
      padding: "0 24px"
    }
  }, "\uAC00\uC785\uD558\uAE30")));
}
function CompareBar({
  items,
  onClear
}) {
  if (!items.length) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      bottom: 0,
      zIndex: 20,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--nh-navy-800)",
      borderRadius: "var(--radius-lg)",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      gap: 18,
      color: "#fff",
      boxShadow: "var(--shadow-md)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, "\uBE44\uAD50\uD568 ", items.length), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, items.map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      background: "rgba(255,255,255,0.14)",
      borderRadius: "var(--radius-pill)",
      padding: "6px 14px",
      fontSize: 13
    }
  }, n))), /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    style: {
      background: "none",
      border: "none",
      color: "rgba(255,255,255,0.75)",
      fontSize: 13,
      cursor: "pointer"
    }
  }, "\uBE44\uC6B0\uAE30"), /*#__PURE__*/React.createElement(RB, {
    variant: "primary",
    style: {
      borderRadius: "var(--radius-pill)",
      height: 42,
      padding: "0 26px"
    }
  }, "\uC0C1\uD488 \uBE44\uAD50\uD558\uAE30")));
}
function ProductRecommendScreen() {
  const [ans, setAns] = React.useState({
    purpose: "여유자금 운용",
    size: "50~300억",
    term: "12개월",
    type: "법인"
  });
  const [saved, setSaved] = React.useState([]);
  const answered = STEPS.filter(s => ans[s.key]).length;
  const ranked = React.useMemo(() => CATALOG.map(p => ({
    p,
    v: score(p, ans)
  })).sort((a, b) => b.v - a.v), [ans]);
  const toggle = name => setSaved(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);
  const pick = (key, v) => setAns(a => ({
    ...a,
    [key]: a[key] === v ? null : v
  }));
  const top = ranked[0];
  const rest = ranked.slice(1, 6);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-page)",
      paddingBottom: 70
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      color: "var(--text-muted)",
      padding: "20px 0 8px"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uAE08\uC735\uC0C1\uD488"), /*#__PURE__*/React.createElement("span", null, "\u203A"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-body)",
      fontWeight: 600
    }
  }, "\uB9DE\uCDA4 \uC0C1\uD488 \uCD94\uCC9C")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      padding: "18px 0 26px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)"
    }
  }, "\uB124 \uAC00\uC9C0\uB9CC \uC54C\uB824\uC8FC\uC2DC\uBA74 \uC6B0\uB9AC \uAE30\uC5C5\uC5D0 \uB9DE\uB294 \uC0C1\uD488\uC744 \uCC3E\uC544\uB4DC\uB9BD\uB2C8\uB2E4"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 32,
      fontWeight: 800,
      letterSpacing: "-0.03em",
      marginTop: 10
    }
  }, "\uAE30\uC5C5 \uB9DE\uCDA4 \uC0C1\uD488 \uCD94\uCC9C")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)"
    }
  }, "2026.06.27 \uAE30\uC900 \xB7 \uCD1D ", CATALOG.length, "\uAC1C \uC0C1\uD488 \uB300\uC0C1")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      borderTop: "2px solid var(--grey-700)",
      padding: "8px 32px 26px"
    }
  }, STEPS.map((s, i) => /*#__PURE__*/React.createElement(StepBlock, {
    key: s.key,
    step: s,
    index: i,
    value: ans[s.key],
    onPick: v => pick(s.key, v)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderTop: "1px solid var(--grey-150)",
      paddingTop: 22,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      height: 6,
      borderRadius: 3,
      background: "var(--grey-150)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${answered / STEPS.length * 100}%`,
      height: "100%",
      background: "var(--color-primary)",
      transition: "width 180ms ease"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)"
    }
  }, answered, "/", STEPS.length, " \uD56D\uBAA9 \uC120\uD0DD\uB428")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAns({}),
    style: {
      height: 46,
      padding: "0 22px",
      borderRadius: "var(--radius-pill)",
      border: "1px solid var(--border-default)",
      background: "var(--white)",
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-body)",
      cursor: "pointer"
    }
  }, "\uB2E4\uC2DC \uC120\uD0DD"), /*#__PURE__*/React.createElement(RB, {
    variant: "slate",
    size: "lg",
    style: {
      borderRadius: "var(--radius-pill)",
      width: 150
    }
  }, "\uCD94\uCC9C\uBC1B\uAE30")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      margin: "44px 0 18px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: "-0.02em"
    }
  }, "\uACE0\uAC1D\uB2D8\uAED8 \uCD94\uCC9C\uD558\uB294 \uC0C1\uD488"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)"
    }
  }, "\uC120\uD0DD\uD558\uC2E0 \uC870\uAC74\uACFC\uC758 \uC801\uD569\uB3C4 \uC21C\uC73C\uB85C \uC815\uB82C\uB429\uB2C8\uB2E4")), /*#__PURE__*/React.createElement(TopPick, {
    p: top.p,
    value: top.v,
    saved: saved.includes(top.p.name),
    onSave: () => toggle(top.p.name)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden"
    }
  }, rest.map((r, i) => /*#__PURE__*/React.createElement(ResultRow, {
    key: r.p.name,
    p: r.p,
    value: r.v,
    rank: i + 2,
    saved: saved.includes(r.p.name),
    onSave: () => toggle(r.p.name)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 44
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.02em"
    }
  }, "\uBE44\uC2B7\uD55C \uAE30\uC5C5\uC774 \uB9CE\uC774 \uAC00\uC785\uD55C \uC0C1\uD488"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)",
      marginTop: 8
    }
  }, "\uB3D9\uC77C \uC5C5\uC885\xB7\uB9E4\uCD9C \uAD6C\uAC04 \uAE30\uC5C5\uC758 \uCD5C\uADFC 3\uAC1C\uC6D4 \uAC00\uC785 \uB370\uC774\uD130\uB97C \uAE30\uC900\uC73C\uB85C \uC548\uB0B4\uB4DC\uB9BD\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 18,
      marginTop: 20
    }
  }, [{
    n: "NH기업e정기예금(The Quicker)",
    s: "가입 상위 1위",
    d: "동일 구간 기업의 38%가 선택",
    ill: "coins"
  }, {
    n: "NH더퍼스트기업통장",
    s: "가입 상위 2위",
    d: "결제성 자금 관리 목적 가입 다수",
    ill: "card"
  }, {
    n: "NH기업운전자금대출",
    s: "가입 상위 3위",
    d: "매출채권 기반 한도 조회 후 실행",
    ill: "building"
  }].map(c => /*#__PURE__*/React.createElement("div", {
    key: c.n,
    style: {
      position: "relative",
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
      padding: "24px 26px",
      minHeight: 168,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ArrowUpRight",
    size: 20,
    color: "var(--text-muted)",
    style: {
      position: "absolute",
      top: 20,
      right: 20
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--color-primary)"
    }
  }, c.s), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "var(--text-strong)",
      marginTop: 10,
      letterSpacing: "-0.02em",
      maxWidth: 210
    }
  }, c.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 8,
      maxWidth: 200,
      lineHeight: 1.55
    }
  }, c.d), /*#__PURE__*/React.createElement("img", {
    src: `../../assets/illustrations/${c.ill}.svg`,
    alt: "",
    style: {
      position: "absolute",
      right: 20,
      bottom: 18,
      width: 56,
      height: 56
    }
  }))))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: "var(--text-muted)",
      lineHeight: 1.8,
      marginTop: 34
    }
  }, "\xB7 \uBCF8 \uCD94\uCC9C \uACB0\uACFC\uB294 \uACE0\uAC1D\uB2D8\uC774 \uC120\uD0DD\uD558\uC2E0 \uC815\uBCF4\uB97C \uAE30\uC900\uC73C\uB85C \uC0B0\uCD9C\uB41C \uCC38\uACE0\uC6A9 \uC548\uB0B4\uC774\uBA70, \uC2E4\uC81C \uAC00\uC785 \uAC00\uB2A5 \uC5EC\uBD80\uC640 \uC801\uC6A9 \uAE08\uB9AC\uB294 \uC2EC\uC0AC \uACB0\uACFC\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", /*#__PURE__*/React.createElement("br", null), "\xB7 \uC608\uAE08 \uC0C1\uD488\uC740 \uC608\uAE08\uC790\uBCF4\uD638\uBC95\uC5D0 \uB530\uB77C \uBCF4\uD638\uB429\uB2C8\uB2E4. \uB300\uCD9C \uC0C1\uD488\uC740 \uC2E0\uC6A9\uB3C4\uC5D0 \uB530\uB77C \uD55C\uB3C4\xB7\uAE08\uB9AC\uAC00 \uCC28\uB4F1 \uC801\uC6A9\uB429\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(CompareBar, {
    items: saved,
    onClear: () => setSaved([])
  })));
}
window.ProductRecommendScreen = ProductRecommendScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ibz/ProductRecommendScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/securities/AccountBenefits.jsx
try { (() => {
/* global React, Icon */
// 증권 랜딩 — Section 3: 계좌 개설 혜택. Light grey, 2-col benefit cards.

const BENEFITS = [{
  icon: "Smartphone",
  bg: "linear-gradient(135deg,#36abe2,#0094d9)",
  title: "앱에서 5분이면 끝나는\n간편 계좌 개설"
}, {
  icon: "ShieldCheck",
  bg: "linear-gradient(135deg,#2bbd72,#00a04e)",
  title: "예탁금 최대 1억 원까지\n예금자 보호"
}, {
  icon: "CalendarClock",
  bg: "linear-gradient(135deg,#5d6a8e,#3f4a68)",
  title: "매일 쌓이는 예탁금 이자\n자동 수령"
}, {
  icon: "Percent",
  bg: "linear-gradient(135deg,#36abe2,#007ec0)",
  title: "잔액에 따라 더 높아지는\n이자율"
}];
function BenefitCard({
  b,
  idx
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "reveal reveal-d" + (idx % 2 + 1),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 22,
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "26px 30px",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 64,
      flex: "none",
      borderRadius: 18,
      background: b.bg,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 8px 18px rgba(16,36,64,0.18)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: b.icon,
    size: 30,
    color: "#fff",
    strokeWidth: 1.8
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text-strong)",
      lineHeight: 1.45,
      letterSpacing: "-0.02em",
      whiteSpace: "pre-line"
    }
  }, b.title));
}
function AccountBenefits() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--grey-50)",
      padding: "104px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-container"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "reveal",
    style: {
      fontSize: 36,
      fontWeight: 800,
      color: "var(--text-strong)",
      letterSpacing: "-0.03em"
    }
  }, "\uC190\uC27D\uAC8C \uACC4\uC88C \uAC1C\uC124\uD558\uAE30"), /*#__PURE__*/React.createElement("p", {
    className: "reveal reveal-d1",
    style: {
      fontSize: 17,
      color: "var(--text-muted)",
      marginTop: 14
    }
  }, "\uBAA8\uBC14\uC77C \uC571\uC5D0\uC11C \uBCC4\uB3C4 \uBC29\uBB38 \uC5C6\uC774, \uC775\uC219\uD55C \uC778\uC99D \uC218\uB2E8\uC73C\uB85C \uBC14\uB85C \uC2DC\uC791\uD558\uC138\uC694.")), /*#__PURE__*/React.createElement("div", {
    className: "benefit-grid"
  }, BENEFITS.map((b, i) => /*#__PURE__*/React.createElement(BenefitCard, {
    key: i,
    b: b,
    idx: i
  })))));
}
window.SecAccountBenefits = AccountBenefits;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/securities/AccountBenefits.jsx", error: String((e && e.message) || e) }); }

// ui_kits/securities/Disclaimer.jsx
try { (() => {
/* global React, Icon */
// 증권 랜딩 — Section 5: 법적 고지(Disclaimer) + dark legal Footer.

const DISCLAIMER = ["투자자는 금융투자상품에 대하여 충분한 설명을 받을 권리가 있으며, 투자 전 상품설명서 및 약관을 반드시 확인하시기 바랍니다.", "금융투자상품은 예금자보호법에 따라 보호되지 않습니다.", "금융투자상품은 투자원금의 손실이 발생할 수 있으며, 그 손실은 투자자에게 귀속됩니다.", "준법감시인 심사필 제2026-0627호 (유효기간: 2026.06.27 ~ 2027.06.26)"];
function Disclaimer() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--grey-100)",
      padding: "40px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-container"
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, DISCLAIMER.map((d, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      fontSize: 12.5,
      lineHeight: 1.6,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: "var(--grey-400)"
    }
  }, "\xB7"), d)))));
}
const LEGAL = ["이용약관", "보호금융상품등록부", "개인정보처리방침", "고객권리안내문", "신용정보 활용체제", "주문 장애시 대처방법/보상기준"];
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--nh-navy-900)",
      color: "rgba(255,255,255,0.7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: "1px solid rgba(255,255,255,0.12)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-container",
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px 28px",
      padding: "22px 24px"
    }
  }, LEGAL.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontSize: 13.5,
      textDecoration: "none",
      color: l === "개인정보처리방침" ? "#fff" : "rgba(255,255,255,0.7)",
      fontWeight: l === "개인정보처리방침" ? 700 : 500
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    className: "sec-container",
    style: {
      padding: "32px 24px 44px",
      display: "flex",
      justifyContent: "space-between",
      gap: 32,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-white.svg",
    alt: "NH\uAE30\uC5C5\uBC45\uD0B9",
    style: {
      height: 30,
      marginBottom: 20
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 2,
      color: "rgba(255,255,255,0.62)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.45)"
    }
  }, "\uBCF8\uC0AC"), " \xA0 \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC911\uAD6C \uC0C8\uBB38\uC548\uB85C 16 NH\uAE08\uC735\uD0C0\uC6CC"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.45)"
    }
  }, "\uC601\uC5C5\uBD80"), " \xA0 \uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC601\uB4F1\uD3EC\uAD6C \uC758\uC0AC\uB2F9\uB300\uB85C 8 NH\uC99D\uAD8C\uBE4C\uB529 3\uCE35"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      flexWrap: "wrap",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.45)"
    }
  }, "\uACE0\uAC1D\uC13C\uD130"), " \xA0 ", /*#__PURE__*/React.createElement("a", {
    href: "tel:1588-2100",
    style: {
      color: "#fff",
      fontWeight: 700,
      textDecoration: "none"
    }
  }, "1588-2100")), /*#__PURE__*/React.createElement("span", null, "\uB300\uD45C\uC774\uC0AC \uAE40\uB18D\uD611"), /*#__PURE__*/React.createElement("span", null, "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638 116-81-00000"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(255,255,255,0.4)",
      marginTop: 18
    }
  }, "\xA9 2026 NH. All rights reserved.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "\uD398\uC774\uC2A4\uBD81",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Facebook",
    size: 18
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "\uC778\uC2A4\uD0C0\uADF8\uB7A8",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Instagram",
    size: 18
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "\uC720\uD29C\uBE0C",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Youtube",
    size: 18
  })))));
}
window.SecDisclaimer = Disclaimer;
window.SecFooter = SiteFooter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/securities/Disclaimer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/securities/Features.jsx
try { (() => {
/* global React, Icon */
// 증권 랜딩 — Section 4: 서비스 기능 소개. Left visual card swaps with the
// selected category; right shows category tabs + that category's feature list.

const CATEGORIES = [{
  title: "누구나 쉽게 이용할 수 있도록",
  illo: "../../assets/illustrations/document.svg",
  bg: "linear-gradient(150deg,#36abe2,#0072bc)",
  features: [{
    name: "MTS",
    desc: "거래에 필요한 정보와 기능을 한 화면에 담았습니다."
  }, {
    name: "투자소식",
    desc: "투자 정보를 누구나 쉽게 이해할 수 있도록 제공합니다."
  }]
}, {
  title: "자유롭고 함께하고",
  illo: "../../assets/illustrations/card.svg",
  bg: "linear-gradient(150deg,#2bbd72,#00854a)",
  features: [{
    name: "주식 모으기",
    desc: "매일·매주·매월 자동 적립식 투자를 설정할 수 있습니다."
  }, {
    name: "주식 선물하기",
    desc: "메신저 친구에게 주식을 선물로 보낼 수 있습니다."
  }, {
    name: "해외 주식 소수점 거래",
    desc: "천 원 단위 소액으로 해외 주식에 투자합니다."
  }]
}, {
  title: "똑똑한 투자도 놓치지 않아요",
  illo: "../../assets/illustrations/coins.svg",
  bg: "linear-gradient(150deg,#5d6a8e,#28324f)",
  features: [{
    name: "시세 감지 주문",
    desc: "목표 가격에 도달하면 자동으로 주문이 실행됩니다."
  }, {
    name: "종목별 토론방",
    desc: "급등·급락 종목과 인기 토론방을 실시간으로 확인합니다."
  }, {
    name: "펀드 상품",
    desc: "투자 성향별 다양한 펀드 상품을 선택할 수 있습니다."
  }]
}];
function Features() {
  const [active, setActive] = React.useState(0);
  const cat = CATEGORIES[active];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--white)",
      padding: "104px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-container"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "reveal",
    style: {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: "0.12em",
      color: "var(--color-primary)",
      marginBottom: 14
    }
  }, "SERVICE"), /*#__PURE__*/React.createElement("h2", {
    className: "reveal reveal-d1",
    style: {
      fontSize: 36,
      fontWeight: 800,
      color: "var(--text-strong)",
      letterSpacing: "-0.03em"
    }
  }, "\uD22C\uC790\uC5D0 \uD544\uC694\uD55C \uBAA8\uB4E0 \uAE30\uB2A5")), /*#__PURE__*/React.createElement("div", {
    className: "features-split reveal reveal-d1"
  }, /*#__PURE__*/React.createElement("div", {
    key: active,
    className: "fade-swap",
    style: {
      position: "relative",
      borderRadius: "var(--radius-xl)",
      background: cat.bg,
      minHeight: 360,
      padding: 34,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      color: "#fff",
      lineHeight: 1.4,
      letterSpacing: "-0.02em",
      maxWidth: 240
    }
  }, cat.title), /*#__PURE__*/React.createElement("img", {
    src: cat.illo,
    alt: "",
    style: {
      width: 150,
      height: 150,
      alignSelf: "flex-end",
      filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.25))"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: -40,
      right: -40,
      width: 180,
      height: 180,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 8
    }
  }, CATEGORIES.map((c, i) => {
    const on = i === active;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => setActive(i),
      style: {
        cursor: "pointer",
        padding: "10px 18px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        fontSize: 14.5,
        fontWeight: on ? 700 : 500,
        color: on ? "#fff" : "var(--text-muted)",
        background: on ? "var(--surface-action)" : "var(--white)",
        border: on ? "1px solid var(--surface-action)" : "1px solid var(--border-default)"
      }
    }, c.title);
  })), /*#__PURE__*/React.createElement("div", {
    key: active,
    className: "fade-swap",
    style: {
      marginTop: 18
    }
  }, cat.features.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: f.name,
    style: {
      display: "flex",
      gap: 18,
      alignItems: "flex-start",
      padding: "22px 6px",
      borderBottom: "1px solid var(--grey-150)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 38,
      height: 38,
      borderRadius: 12,
      background: "var(--nh-blue-50)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--color-primary)",
      fontWeight: 800,
      fontSize: 15
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text-strong)"
    }
  }, f.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-muted)",
      marginTop: 5,
      lineHeight: 1.6
    }
  }, f.desc)), /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 18,
    color: "var(--grey-300)",
    style: {
      marginLeft: "auto",
      marginTop: 4
    }
  }))))))));
}
window.SecFeatures = Features;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/securities/Features.jsx", error: String((e && e.message) || e) }); }

// ui_kits/securities/Hero.jsx
try { (() => {
/* global React, Icon */
// 증권 랜딩 — Section 1: Hero (Key Visual). Light NH-style key visual
// (white + soft pink, per ibz.nonghyup.com), compact height, isometric object.
const SNS = window.NHDesignSystem_5d992c || {};
const SButton = SNS.Button || (() => null);
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    className: "hero",
    id: "top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-container",
    style: {
      position: "relative",
      zIndex: 2,
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__grid",
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 420px",
      gap: 40,
      alignItems: "center",
      padding: "64px 0"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "reveal",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 16px",
      borderRadius: 999,
      background: "var(--nh-blue-50)",
      border: "1px solid var(--nh-blue-100)",
      color: "var(--nh-blue-700)",
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 24,
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "var(--nh-green-500)"
    }
  }), " \uC8FC\uC2DD\uD22C\uC790 \uC11C\uBE44\uC2A4"), /*#__PURE__*/React.createElement("h1", {
    className: "hero__title reveal reveal-d1"
  }, "\uD22C\uC790, \uB204\uAD6C\uC5D0\uAC8C\uB098", /*#__PURE__*/React.createElement("br", null), "\uC27D\uACE0 ", /*#__PURE__*/React.createElement("span", {
    className: "hero__capsule"
  }, "\uC815\uC9C1\uD558\uAC8C")), /*#__PURE__*/React.createElement("p", {
    className: "reveal reveal-d2",
    style: {
      fontSize: 18,
      lineHeight: 1.65,
      color: "var(--text-body)",
      marginTop: 22,
      fontWeight: 500
    }
  }, "\uBCF5\uC7A1\uD55C \uD22C\uC790\uB294 \uADF8\uB9CC. NH\uB18D\uD611\uC740\uD589\uACFC \uD568\uAED8\uB77C\uBA74 \uB204\uAD6C\uB098 \uC791\uAC8C \uC2DC\uC791\uD574", /*#__PURE__*/React.createElement("br", null), "\uAFB8\uC900\uD788 \uD0A4\uC6CC\uAC00\uB294 \uB611\uB611\uD55C \uC790\uC0B0\uAD00\uB9AC\uB97C \uACBD\uD5D8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    className: "reveal reveal-d3",
    style: {
      display: "flex",
      gap: 12,
      marginTop: 32,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(SButton, {
    variant: "slate",
    size: "lg",
    style: {
      borderRadius: "var(--radius-md)",
      padding: "0 30px"
    },
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "ArrowRight",
      size: 18
    })
  }, "\uACC4\uC88C \uAC1C\uC124\uD558\uAE30"), /*#__PURE__*/React.createElement(SButton, {
    variant: "outline",
    size: "lg",
    style: {
      borderRadius: "var(--radius-md)",
      padding: "0 26px"
    }
  }, "\uC11C\uBE44\uC2A4 \uB458\uB7EC\uBCF4\uAE30"))), /*#__PURE__*/React.createElement("div", {
    className: "hero__visual reveal reveal-d2",
    style: {
      position: "relative",
      height: 360,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: "50%",
      background: "radial-gradient(circle at 50% 45%, #fde3ea 0%, #fbeef1 70%, rgba(251,238,241,0) 100%)"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/building.svg",
    alt: "\uAE30\uC5C5 \uAE08\uC735 \uC77C\uB7EC\uC2A4\uD2B8",
    style: {
      position: "relative",
      width: 240,
      height: 240,
      filter: "drop-shadow(0 22px 36px rgba(16,36,64,0.16))"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/coins.svg",
    alt: "",
    style: {
      position: "absolute",
      width: 116,
      bottom: 8,
      left: 18,
      filter: "drop-shadow(0 14px 24px rgba(16,36,64,0.16))"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/card.svg",
    alt: "",
    style: {
      position: "absolute",
      width: 104,
      top: 6,
      right: 6,
      filter: "drop-shadow(0 14px 24px rgba(16,36,64,0.16))"
    }
  })))));
}
window.SecHero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/securities/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/securities/Mission.jsx
try { (() => {
/* global React */
// 증권 랜딩 — Section 2: 브랜드 미션. Dark, centered, continues from hero.

function Mission() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--nh-blue-50)",
      padding: "96px 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "reveal",
    style: {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: "0.14em",
      color: "var(--color-primary)",
      marginBottom: 22
    }
  }, "OUR MISSION"), /*#__PURE__*/React.createElement("h2", {
    className: "reveal reveal-d1",
    style: {
      fontSize: 42,
      lineHeight: 1.35,
      fontWeight: 800,
      color: "var(--text-strong)",
      letterSpacing: "-0.03em"
    }
  }, "\uC791\uAC8C \uC2DC\uC791\uD574\uB3C4, \uC81C\uB300\uB85C."), /*#__PURE__*/React.createElement("p", {
    className: "reveal reveal-d2",
    style: {
      fontSize: 19,
      lineHeight: 1.85,
      color: "var(--text-body)",
      maxWidth: 680,
      margin: "26px auto 0",
      fontWeight: 500
    }
  }, "\uC18C\uC561 \uD22C\uC790\uC790\uB3C4, \uD22C\uC790\uAC00 \uCC98\uC74C\uC778 \uBD84\uB3C4 \uC5B4\uB835\uC9C0 \uC54A\uAC8C. NH\uB294 \uB204\uAD6C\uB098 \uBD80\uB2F4 \uC5C6\uC774 \uC2DC\uC791\uD558\uACE0 \uAFB8\uC900\uD788 \uD0A4\uC6CC\uAC08 \uC218 \uC788\uB294 \uC0C8\uB85C\uC6B4 \uD22C\uC790 \uBB38\uD654\uB97C \uB9CC\uB4E4\uC5B4\uAC11\uB2C8\uB2E4.")));
}
window.SecMission = Mission;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/securities/Mission.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.LinkButton = __ds_scope.LinkButton;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
