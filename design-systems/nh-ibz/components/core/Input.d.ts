import * as React from "react";

export interface InputProps {
  label?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: string;
  /** Element rendered inside the field, before the input. */
  prefix?: React.ReactNode;
  /** Element rendered inside the field, after the input. */
  suffix?: React.ReactNode;
  /** Error message; turns the border red when present. */
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  style?: React.CSSProperties;
}

/** Labeled text field with focus ring, prefix/suffix and error state. */
export function Input(props: InputProps): JSX.Element;
