import CenteredVertically from "../CenteredVertically";
import styles from "./NavBar.module.css";
import VerticalSpace from "../VerticalSpace";
import Clickable from "../clickable/clickable";

export default function NavBar() {
  return (
    <>
      <div className={styles.container}>
        <VerticalSpace height="15px" />
        <CenteredVertically
          content={
            <>
              <Clickable link="/">
                <span className={styles.logo}>NunTIUS</span>
              </Clickable>
            </>
          }
        />
        <div></div>
        <VerticalSpace height="15px" />
      </div>
    </>
  );
}
