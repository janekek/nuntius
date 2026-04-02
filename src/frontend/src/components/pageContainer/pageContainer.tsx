import styles from "./pageContainer.module.css";

export default function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={styles.container}>{children}</div>
    </>
  );
}
