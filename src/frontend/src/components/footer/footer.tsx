import styles from "./footer.module.css";

export default function Footer({
  margin_top,
  children,
}: {
  margin_top?: string;
  children: React.ReactNode;
}) {
  if (margin_top) {
    return (
      <>
        <div className={`text-center mt-[${margin_top}] pt-6 ${styles.footer}`}>
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`text-center mt-4 pt-6 ${styles.footer}`}>{children}</div>
    </>
  );
}
