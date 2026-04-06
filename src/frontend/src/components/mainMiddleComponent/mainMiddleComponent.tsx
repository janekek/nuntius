import Footer from "../footer/footer";
import styles from "./mainMiddleComponent.module.css";

export default function MainMiddleComponent({
  title,
  subtitle,
  footer,
  children,
  maxWidth,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <>
      <div
        className={styles.container}
        style={{ width: "100%", maxWidth: maxWidth }}
      >
        <header className="text-center">
          <h1 className="m-0 text-[1.8rem] font-bold text-[var(--text-main)] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="m-0 mt-2 text-[var(--text-muted)] text-[0.95rem]">
            {subtitle}
          </p>
        </header>

        {children}

        <Footer>
          <p className="m-0 text-[var(--text-muted)] text-[0.9rem]">{footer}</p>
        </Footer>
      </div>
    </>
  );
}
