import { useEffect, useState } from "react";
import styles from "./toast.module.css";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 4.7 Sek: Rausrutsch-Animation
    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 4700);

    // 5 Sek.. komplett entfernt
    const unmountTimer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(unmountTimer);
    };
  }, [onClose]);

  return (
    <div
      className={`${styles.toastWrapper} ${isLeaving ? styles.slideOut : styles.slideIn}`}
    >
      <div className={styles.toastContent}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.icon}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}
