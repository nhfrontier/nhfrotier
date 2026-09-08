import * as React from "react";

export interface TabItem {
  label: string;
  value: string;
}

export interface TabsProps {
  items: TabItem[];
  /** Controlled active value. Omit for uncontrolled. */
  value?: string;
  onChange?: (value: string) => void;
  /** @default "underline" */
  variant?: "underline" | "pill";
  style?: React.CSSProperties;
}

/** Tab bar for switching panels — underline (page) or pill (in-card). */
export function Tabs(props: TabsProps): JSX.Element;
