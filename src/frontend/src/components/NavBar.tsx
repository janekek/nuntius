import CenteredVertically from "./CenteredVertically";
import styles from "./NavBar.module.css";
import VerticalSpace from "./VerticalSpace";

export default function NavBar() {
  return (
    <>
      <div className={styles.container}>
        <VerticalSpace height="15px" />
        <CenteredVertically
          content={
            <>
              <span className={styles.logo}>NunTIUS</span>
            </>
          }
        />
        <div></div>
        <VerticalSpace height="15px" />
      </div>
    </>
  );
}
