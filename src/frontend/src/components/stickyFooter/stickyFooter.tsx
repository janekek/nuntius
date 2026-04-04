import type { NavigateFunction } from "react-router-dom";
import LogoutBtn from "../logoutBtn/logoutBtn";
import styles from "./stickyFooter.module.css";
import SettingsBtn from "../settingsBtn/settingsBtn";

export default function StickyFooter({
  navigator,
  setToastMsg,
  settingsBtnActive,
  settingsBtnOnClick,
  maxWidth,
}: {
  navigator: NavigateFunction;
  setToastMsg: React.Dispatch<React.SetStateAction<string>>;
  settingsBtnActive: boolean;
  settingsBtnOnClick: React.MouseEventHandler<HTMLButtonElement>;
  maxWidth: string;
}) {
  return (
    <>
      <footer className={styles.footer} style={{ maxWidth: maxWidth }}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>Nuntius Messenger</p>
          <div className={styles.footerActions}>
            <SettingsBtn
              btnActive={settingsBtnActive}
              onClick={settingsBtnOnClick}
            />
            <LogoutBtn navigator={navigator} setToastMsg={setToastMsg} />
          </div>
        </div>
      </footer>
    </>
  );
}
