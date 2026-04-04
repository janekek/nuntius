import styles from "./siteContainer.module.css";

export default function SiteContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={styles.siteContainer}>{children}</div>
    </>
  );
}
