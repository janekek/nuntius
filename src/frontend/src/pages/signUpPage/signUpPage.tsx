import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import CorrectableInput from "../../components/CorrectableInput";
import CustomButton from "../../components/customButton/CustomButton";

import styles from "./signUpPage.module.css";
import { callAPI } from "../../utils/apiClient";
import type ServerResponse from "../../shared/ServerResponse";
import { SignupSchema } from "../../shared/schemas";
import ErrorBox from "../../components/errorBox/errorBox";
import PasswordMeter from "../../components/passwordMeter/passwordMeter";

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
    <div className={styles.pageContainer}>
      <div className={styles.signUpCard}>
        <header className={styles.header}>
          <h1 className={styles.title}>Join Nuntius</h1>
          <p className={styles.subtitle}>Create your secure account.</p>
        </header>

        <div className={styles.infoBox}>
          <p className={styles.infoLead}>
            Nuntius is built on a simple philosophy:{" "}
            <strong>your privacy belongs to you.</strong>
          </p>
          <ul className={styles.infoList}>
            <li>
              <strong>Account:</strong> Choose a unique username and a primary
              login password.
            </li>
            <li>
              <strong>Encryption:</strong> Set a second, secret password to
              locally encrypt your messages.
            </li>
          </ul>

          <ErrorBox>
            <div className="flex items-center gap-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.warningIcon}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <p className={styles.warningText}>
                There is no way to reset your encryption password. If it is
                lost, your messages are permanently inaccessible.
              </p>
            </div>
          </ErrorBox>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <CorrectableInput
              type="text"
              placeholder="Username"
              value={username}
              onChange={setUsername}
              schema={SignupSchema.shape.username}
              forceShowError={showAllErrors}
            />
            <CorrectableInput
              type="password"
              placeholder="Login Password"
              value={password}
              onChange={setPassword}
              schema={SignupSchema.shape.password}
              forceShowError={showAllErrors}
            />
            <PasswordMeter password={password} />
            <CorrectableInput
              type="password"
              placeholder="Secret Encryption Password"
              value={password2}
              onChange={setPassword2}
              schema={SignupSchema.shape.password2}
              forceShowError={showAllErrors}
            />
            <PasswordMeter password={password2} />
          </div>

          {serverErrorMsg && (
            <div className={styles.serverErrorBox}>
              <p className={styles.serverErrorText}>{serverErrorMsg}</p>
            </div>
          )}

          <div className={styles.actionArea}>
            <CustomButton text="Sign up" onClick={handleSignUp} />
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.loginText}>
            Already have an account?{" "}
            <Link to="/" className={styles.loginLink}>
              Log in here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
