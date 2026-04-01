import React from "react";
import styles from "./errorBox.module.css"; // Pfad zu deinen Styles

interface ErrorBoxProps {
  children: React.ReactNode;
  variant?: "error" | "warning" | "info";
}

const ErrorBox: React.FC<ErrorBoxProps> = ({ children, variant = "error" }) => {
  // Nur rendern, wenn children vorhanden sind (nicht null, undefined oder leerer String)
  if (!children) return null;

  return (
    <div className={styles.errorBox}>
      <div className={styles.errorText}>{children}</div>
    </div>
  );
};

export default ErrorBox;
