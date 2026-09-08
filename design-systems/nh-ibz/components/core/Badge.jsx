import React from "react";

/**
 * NH기업뱅킹 Badge — compact status / category label.
 * Tones map to the brand semantic colors. Use `soft` for filled-pale chips.
 */
export function Badge({
  children,
  tone = "neutral", // neutral | primary | green | navy | positive | negative | warning
  soft = true,
  style = {},
  ...rest
}) {
  const map = {
    neutral: { solid: "var(--grey-600)", soft: "var(--grey-100)", softText: "var(--grey-700)" },
    primary: { solid: "var(--color-primary)", soft: "var(--nh-blue-50)", softText: "var(--nh-blue-700)" },
    green: { solid: "var(--nh-green-500)", soft: "var(--nh-green-50)", softText: "var(--nh-green-700)" },
    navy: { solid: "var(--surface-navy)", soft: "var(--nh-blue-50)", softText: "var(--nh-navy-800)" },
    positive: { solid: "var(--status-positive)", soft: "var(--nh-green-50)", softText: "var(--nh-green-700)" },
    negative: { solid: "var(--status-negative)", soft: "#fdeceb", softText: "#b3261e" },
    warning: { solid: "var(--status-warning)", soft: "#fff5e6", softText: "#9a6400" },
  };
  const c = map[tone] || map.neutral;

  return (
    <span
      className="nh-badge"
      style={{
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
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
