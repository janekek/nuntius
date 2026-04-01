import React from "react";
import styles from "./Input.module.css";

type CustomInputProps = {
  type: string;
  placeholder: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onEnter?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: React.ChangeEventHandler<HTMLInputElement>;
};

export default function Input({
  type,
  placeholder,
  value,
  onChange,
  onEnter,
  onBlur,
}: CustomInputProps) {
  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onEnter?.(e);
    }
  }

  return (
    <input
      className={styles.input}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={handleEnter}
      onBlur={onBlur}
    />
  );
}
