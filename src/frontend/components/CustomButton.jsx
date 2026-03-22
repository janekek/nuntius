import React from "react";
import styles from "./CustomButton.module.css";

export default function CustomButton({ text, onClick }) {
  return (
    <button
      className={styles.input}
      onClick={onClick}
    >{text}</button>
  );
}