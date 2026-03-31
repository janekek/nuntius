import { useState } from "react";
import CenteredVertically from "../components/CenteredVertically";
import CorrectableInput from "../components/CorrectableInput";
import CustomButton from "../components/CustomButton";
import VerticalSpace from "../components/VerticalSpace";

import styles from "../styles/signUpPage.module.css";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { callAPI } from "../utils/apiClient";
import type ServerResponse from "../shared/ServerResponse";
import { SignupSchema } from "../shared/schemas";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");

  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (): Promise<ServerResponse<String>> =>
      callAPI("/signup", {
        method: "POST",
        body: JSON.stringify({ username, password, password2 }),
      }),

    onSuccess: (response: ServerResponse<String>) => {
      console.log(response);
      if (response?.status.code !== 100) {
        setServerErrorMsg(response?.status.msg + "");
        setPassword("");
        setPassword2("");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleSignUp = () => {
    setServerErrorMsg("");
    const result = SignupSchema.safeParse({ username, password, password2 });
    if (!result.success) {
      setShowAllErrors(true);
      return;
    }
    mutation.mutate();
  };

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
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={setUsername}
                      schema={SignupSchema.shape.username}
                      forceShowError={showAllErrors}
                    />

                    <VerticalSpace height="10px" />

                    <CorrectableInput
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={setPassword}
                      schema={SignupSchema.shape.password}
                      forceShowError={showAllErrors}
                    />

                    <VerticalSpace height="10px" />

                    <CorrectableInput
                      type="password"
                      placeholder="Password2"
                      value={password2}
                      onChange={setPassword2}
                      schema={SignupSchema.shape.password2}
                      forceShowError={showAllErrors}
                    />

                    {serverErrorMsg && (
                      <>
                        <VerticalSpace height={"10px"} />
                        <p className={styles.warning}>{serverErrorMsg}</p>
                      </>
                    )}

                    <VerticalSpace height={"30px"} />
                    <CustomButton text="Sign up" onClick={handleSignUp} />
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
