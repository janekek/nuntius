import styles from "./singlePageContainer.module.css";

export default function SinglePageContainer({
  children,
  style, // 1. Prop hinzufügen
}: {
  children: React.ReactNode;
  style?: React.CSSProperties; // 2. Typisierung für React-Styles (optional durch das '?')
}) {
  return (
    <>
      {/* 3. Style-Prop an das umschließende div weitergeben */}
      <div className={styles.container} style={style}>
        {children}
      </div>
    </>
  );
}
