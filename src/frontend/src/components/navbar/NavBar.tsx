import CenteredVertically from "../CenteredVertically";
import styles from "./NavBar.module.css";
import VerticalSpace from "../VerticalSpace";
import Clickable from "../clickable/clickable";

export default function NavBar() {
  return (
    <>
      <div className="w-full">
        <div className="flex flex-col items-center">
          <VerticalSpace height="25px" />
          <Clickable link="/">
            <span className={styles.logo}>NunTIUS</span>
          </Clickable>
          <VerticalSpace height="15px" />
        </div>
      </div>
    </>
  );
}
