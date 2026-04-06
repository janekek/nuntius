import styles from "./newMessagesHR.module.css";

export default function NewMessagesHR() {
  return (
    <div className={styles.dividerContainer}>
      <div className={styles.line}></div>
      <span className={styles.text}>New messages</span>
      <div className={styles.line}></div>
    </div>
  );
}
