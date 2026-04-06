import styles from "./singlePageContainer.module.css";

export default function SinglePageContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <div className={styles.container} style={style}>
        {children}
      </div>
    </>
  );
}
