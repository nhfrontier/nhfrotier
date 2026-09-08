import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  /** Semantic tone. @default "neutral" */
  tone?: "neutral" | "primary" | "green" | "navy" | "positive" | "negative" | "warning";
  /** Pale filled style vs solid. @default true */
  soft?: boolean;
}

/** Compact status / category label chip. */
export function Badge(props: BadgeProps): JSX.Element;
