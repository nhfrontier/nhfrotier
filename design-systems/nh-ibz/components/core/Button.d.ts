import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: "primary" | "slate" | "navy" | "accent" | "outline" | "secondary" | "ghost";
  /** Control height. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Stretch to container width. @default false */
  block?: boolean;
  disabled?: boolean;
  /** Icon element rendered before the label. */
  iconLeft?: React.ReactNode;
  /** Icon element rendered after the label. */
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Primary action button for NH기업뱅킹 surfaces.
 * @startingPoint section="Core" subtitle="Brand buttons — primary, navy, outline, ghost" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
