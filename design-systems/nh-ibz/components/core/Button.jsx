import React from "react";

/**
 * NH기업뱅킹 Button — primary action control.
 * Variants follow the brand: solid NH-blue primary, navy for login/secure
 * actions, outline & ghost for secondary, plus the green accent.
 */
export function Button({
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
    sm: { height: 36, padding: "0 14px", font: "var(--fs-sm)", radius: "var(--radius-sm)" },
    md: { height: 44, padding: "0 20px", font: "var(--fs-body)", radius: "var(--radius-sm)" },
    lg: { height: 52, padding: "0 28px", font: "var(--fs-body-lg)", radius: "var(--radius-md)" },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: { background: "var(--color-primary)", color: "var(--text-on-fill)", border: "1px solid var(--color-primary)" },
    slate: { background: "var(--surface-action)", color: "var(--text-on-fill)", border: "1px solid var(--surface-action)" },
    navy: { background: "var(--surface-navy)", color: "var(--text-on-fill)", border: "1px solid var(--surface-navy)" },
    accent: { background: "var(--color-accent)", color: "var(--text-on-fill)", border: "1px solid var(--color-accent)" },
    outline: { background: "var(--white)", color: "var(--color-primary)", border: "1px solid var(--color-primary)" },
    secondary: { background: "var(--white)", color: "var(--text-body)", border: "1px solid var(--border-default)" },
    ghost: { background: "transparent", color: "var(--text-body)", border: "1px solid transparent" },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      type="button"
      disabled={disabled}
      className="nh-btn"
      data-variant={variant}
      style={{
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
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
