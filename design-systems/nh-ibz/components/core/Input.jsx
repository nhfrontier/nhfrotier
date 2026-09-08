import React from "react";

/**
 * NH기업뱅킹 Input — labeled text field. Clean rectangular field with a
 * 1px border that turns NH-blue on focus. Supports prefix/suffix and an
 * error message.
 */
export function Input({
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
  const borderColor = error
    ? "var(--status-negative)"
    : focused
    ? "var(--border-focus)"
    : "var(--border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-medium)",
            color: "var(--text-body)",
          }}
        >
          {label}
          {required && <span style={{ color: "var(--status-negative)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          height: 46,
          padding: "0 14px",
          background: disabled ? "var(--surface-sunken)" : "var(--white)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius-sm)",
          boxShadow: focused ? "var(--shadow-focus)" : "none",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
        }}
      >
        {prefix && <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>{prefix}</span>}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            color: "var(--text-strong)",
            letterSpacing: "var(--ls-normal)",
          }}
          {...rest}
        />
        {suffix && <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{suffix}</span>}
      </div>
      {error && (
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--status-negative)" }}>{error}</span>
      )}
    </div>
  );
}
