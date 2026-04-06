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
    <button onClick={onClick} className={styles.input}>
      {text}
    </button>
  );
}
