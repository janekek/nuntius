import { useEffect, useState } from "react";
import CenteredVertically from "../components/CenteredVertically";
import CorrectableInput from "../components/CorrectableInput";
import CustomButton from "../components/CustomButton";
import VerticalSpace from "../components/VerticalSpace";

import styles from "../styles/signUpPage.module.css";
import type { LoginPackage } from "../shared/ServerResponse";
import { useCallAPI } from "../hooks/useCallAPI";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [sendUsernameError, setSendUsernameError] = useState(false);
  const [sendPasswordError, setSendPasswordError] = useState(false);
  const [sendPassword2Error, setSendPassword2Error] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const { response, loading, execute } = useCallAPI<LoginPackage>();

  function signUp() {
    const usernameError = username.trim() === "";
    const passwordError = password.trim() === "";
    const password2Error = password2.trim() === "";

    setSendUsernameError(usernameError);
    setSendPasswordError(passwordError);
    setSendPassword2Error(password2Error);

    if (usernameError || passwordError || password2Error) {
      return;
    }

    execute("api/signup", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, password2 }),
    });
  }

  useEffect(() => {
    console.log(response);
    if (!response) return;
    if (response?.status.code !== 100) {
      setErrorMsg(response?.status.msg + "");
      setPassword("");
      setPassword2("");
    } else {
      navigate("/");
    }
    console.log(response);
  }, [response]);

  return (
    <>
      <CenteredVertically
        content={
          <>
            <div className={styles.mainContainer}>
              <CenteredVertically
                content={
                  <>
                    <VerticalSpace height={"80px"} />
                    <h1> Welcome new user!</h1>
                    <VerticalSpace height="30px" />
                    <p className={styles.text}>
                      This messenger is designed with a different philosophy:
                      your privacy is entirely in your own hands.
                      <br />
                      <br />
                      To get started, choose a unique username and a password
                      for logging in, sending, and receiving messages. In
                      addition, you will set a second, secret password. This
                      password is transmitted to the server only once and is
                      used to encrypt your messages. Only you can decrypt your
                      messages- by entering this secret password locally on your
                      device each time you log in. Without it, your messages
                      remain unreadable. There is no way to reset this password.
                      If it is lost, your messages are permanently inaccessible.
                      <br />
                      <br />
                      This means that the security of your communication depends
                      directly on you, especially on the strength and safe
                      storage of your password. If you prefer, this encryption
                      feature can be disabled for selected chats.
                    </p>
                    <VerticalSpace height="40px" />
                    <CorrectableInput
                      displayMsg={sendUsernameError}
                      msg="Enter a username"
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMsg("");
                        if (e.target.value.trim() !== "") {
                          setSendUsernameError(false);
                        }
                      }}
                      placeholder="Your username"
                      type="text"
                      value={username}
                    />
                    <VerticalSpace height="10px" />
                    <CorrectableInput
                      displayMsg={sendPasswordError}
                      msg="Enter a log in password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg("");
                        if (e.target.value.trim() !== "") {
                          setSendPasswordError(false);
                        }
                      }}
                      placeholder="Your password to log in"
                      type="text"
                      value={password}
                    />
                    <VerticalSpace height="10px" />
                    <CorrectableInput
                      displayMsg={sendPassword2Error}
                      msg="Enter a private password"
                      onChange={(e) => {
                        setPassword2(e.target.value);
                        setErrorMsg("");
                        if (e.target.value.trim() !== "") {
                          setSendPassword2Error(false);
                        }
                      }}
                      placeholder="Your secret password"
                      type="text"
                      value={password2}
                    />
                    {errorMsg && (
                      <>
                        <VerticalSpace height={"10px"} />
                        <p className={styles.warning}>{errorMsg}</p>
                      </>
                    )}

                    <VerticalSpace height={"30px"} />
                    <CustomButton text="Sign up" onClick={signUp} />
                    <VerticalSpace height="30px" />
                    <a href="/">Log in here.</a>
                  </>
                }
              />
            </div>
          </>
        }
      />
    </>
  );
}
