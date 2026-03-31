import React from "react";
import styles from "./Input.module.css";

type CustomInputProps = {
  type: string;
  placeholder: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: React.ChangeEventHandler<HTMLInputElement>;
};

export default function Input({
  type,
  placeholder,
  value,
  onChange,
  onKeyDown,
  onBlur,
}: CustomInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onKeyDown?.(e);
    }
  }

  return (
    <input
      className={styles.input}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
    />
  );
}
