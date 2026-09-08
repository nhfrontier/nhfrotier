import * as React from "react";

export interface LinkButtonProps {
  children?: React.ReactNode;
  /** Render as an anchor when provided, otherwise a button. */
  href?: string;
  /** Trailing glyph. @default "chevron" */
  arrow?: "chevron" | "diagonal" | "none";
  /** Text color. @default "default" */
  tone?: "default" | "primary" | "muted";
  onClick?: React.MouseEventHandler;
  style?: React.CSSProperties;
}

/** Signature inline "자세히보기 ›" text link. */
export function LinkButton(props: LinkButtonProps): JSX.Element;
