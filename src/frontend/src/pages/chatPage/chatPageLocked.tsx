import { Link } from "react-router-dom";
import CustomButton from "../../components/customButton/CustomButton";
import ErrorBox from "../../components/errorBox/errorBox";
import Footer from "../../components/footer/footer";
import Input from "../../components/input/Input";
import SinglePageContainer from "../../components/singlePageContainer/singlePageContainer";
import styles from "./chatPageLocked.module.css";
import SiteContainer from "../../components/siteContainer/siteContainer";
import MainMiddleComponent from "../../components/mainMiddleComponent/mainMiddleComponent";

export default function ChatPageLocked({
  handleUnlock,
  unlockError,
  unlocking,
  secretPassword,
  setSecretPassword,
}: {
  handleUnlock: any;
  unlockError: string;
  unlocking: boolean;
  secretPassword: string;
  setSecretPassword: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <SiteContainer>
      <MainMiddleComponent
        title="Chat locked"
        subtitle="Please enter your secret password to download your keys from the
            server and unlock the chat."
        maxWidth="400px"
        footer={
          <>
            <Link to="/chats">Back to chats.</Link>
          </>
        }
      >
        <div className={styles.inputGroup}>
          <Input
            type="password"
            placeholder="Secret Password"
            value={secretPassword}
            onChange={(e) => setSecretPassword(e.target.value)}
            onEnter={handleUnlock}
          />
        </div>

        <ErrorBox>{unlockError}</ErrorBox>

        <CustomButton
          text={unlocking ? "Unlocking..." : "Unlock"}
          onClick={handleUnlock}
        />
      </MainMiddleComponent>
    </SiteContainer>
  );
}
