import React from "react";

/**
 * NH기업뱅킹 Tabs — underline tab bar used to switch panels within a card
 * or page section. Active tab carries an NH-blue underline + bold label.
 */
export function Tabs({
  items = [],
  value,
  onChange,
  variant = "underline", // "underline" | "pill"
  style = {},
}) {
  const [internal, setInternal] = React.useState(items[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = (v) => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };

  if (variant === "pill") {
    return (
      <div
        role="tablist"
        style={{
          display: "inline-flex",
          gap: "4px",
          padding: "4px",
          background: "var(--surface-sunken)",
          borderRadius: "var(--radius-pill)",
          ...style,
        }}
      >
        {items.map((it) => {
          const on = it.value === active;
          return (
            <button
              key={it.value}
              role="tab"
              aria-selected={on}
              onClick={() => select(it.value)}
              style={{
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
                transition: "all var(--dur-fast) var(--ease-standard)",
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "28px",
        borderBottom: "1px solid var(--border-subtle)",
        ...style,
      }}
    >
      {items.map((it) => {
        const on = it.value === active;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={on}
            onClick={() => select(it.value)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "0 0 12px",
              position: "relative",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body-lg)",
              fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)",
              color: on ? "var(--text-strong)" : "var(--text-muted)",
              transition: "color var(--dur-fast)",
            }}
          >
            {it.label}
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -1,
                height: 3,
                borderRadius: "3px 3px 0 0",
                background: on ? "var(--color-primary)" : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
