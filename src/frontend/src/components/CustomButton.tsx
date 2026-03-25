import React from "react";
import styles from "./CustomButton.module.css";

export default function CustomButton({
  text,
  onClick,
}: {
  text: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button className={styles.input} onClick={onClick}>
      {text}
    </button>
  );
}
