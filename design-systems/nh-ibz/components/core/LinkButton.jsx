import React from "react";

/**
 * NH기업뱅킹 LinkButton — the signature "자세히보기 >" text link.
 * A quiet, inline call-to-action used across cards and section footers.
 */
export function LinkButton({
  children = "자세히보기",
  href,
  arrow = "chevron", // "chevron" | "diagonal" | "none"
  tone = "default", // "default" | "primary" | "muted"
  style = {},
  ...rest
}) {
  const tones = {
    default: "var(--text-body)",
    primary: "var(--color-primary)",
    muted: "var(--text-muted)",
  };
  const glyph = arrow === "diagonal" ? "↗" : arrow === "none" ? "" : "›";
  const Tag = href ? "a" : "button";

  return (
    <Tag
      href={href}
      type={href ? undefined : "button"}
      className="nh-linkbtn"
      style={{
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
        ...style,
      }}
      {...rest}
    >
      <span>{children}</span>
      {glyph && (
        <span aria-hidden="true" style={{ fontSize: "1.05em", color: "var(--text-muted)", lineHeight: 1 }}>
          {glyph}
        </span>
      )}
    </Tag>
  );
}
