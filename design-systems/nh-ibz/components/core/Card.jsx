import React from "react";

/**
 * NH기업뱅킹 Card — the foundational container. White surface, light
 * border, subtle radius. Optional top-right ↗ affordance marks the whole
 * card as a navigation target.
 */
export function Card({
  children,
  interactive = false,
  arrow = false, // show top-right ↗
  accent = null, // null | "blue" | "green" | "navy" — left/topbar tint
  padding = "var(--space-6)",
  style = {},
  ...rest
}) {
  const accentColors = {
    blue: "var(--color-primary)",
    green: "var(--color-accent)",
    navy: "var(--surface-navy)",
  };
  const accentBar = accent
    ? { borderTop: `3px solid ${accentColors[accent] || accentColors.blue}` }
    : {};

  return (
    <div
      className="nh-card"
      data-interactive={interactive ? "true" : undefined}
      style={{
        position: "relative",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding,
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-base), border-color var(--dur-base)",
        cursor: interactive ? "pointer" : "default",
        ...accentBar,
        ...style,
      }}
      {...rest}
    >
      {arrow && (
        <span
          aria-hidden="true"
          style={{
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
            lineHeight: 1,
          }}
        >
          ↗
        </span>
      )}
      {children}
    </div>
  );
}
