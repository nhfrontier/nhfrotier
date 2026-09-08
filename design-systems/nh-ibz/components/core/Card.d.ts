import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Adds hover lift + pointer cursor. @default false */
  interactive?: boolean;
  /** Show the top-right ↗ navigation affordance. @default false */
  arrow?: boolean;
  /** Top accent bar tint. @default null */
  accent?: "blue" | "green" | "navy" | null;
  /** Inner padding (CSS value). @default var(--space-6) */
  padding?: string;
}

/**
 * Foundational white card container.
 * @startingPoint section="Core" subtitle="Card container — borders, accent bar, ↗ affordance" viewport="700x220"
 */
export function Card(props: CardProps): JSX.Element;
