import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import CorrectableInput from "../../components/CorrectableInput";
import CustomButton from "../../components/customButton/CustomButton";
import { useMutation } from "@tanstack/react-query";
import type ServerResponse from "../../shared/ServerResponse";
import { callAPI } from "../../utils/apiClient";
import { LoginSchema } from "../../shared/schemas";

import styles from "./loginPage.module.css";
import ErrorBox from "../../components/errorBox/errorBox";
import Logo from "../../components/logo/logo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");

  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (): Promise<ServerResponse<String>> =>
      callAPI("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    onSuccess: (response: ServerResponse<String>) => {
      if (response?.status.code === 100) {
        navigate("/chats");
      } else if (response?.status.code === 301) {
        setPassword("");
        setServerErrorMsg("Username oder Passwort falsch");
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleLogin = () => {
    setServerErrorMsg("");
    const result = LoginSchema.safeParse({ username, password });

    if (!result.success) {
      setShowAllErrors(true);
      return;
    }
    mutation.mutate();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        <header className={styles.header}>
          <h1 className={styles.title}>Welcome to Nuntius.</h1>
          <p className={styles.subtitle}>Enter your data to log in.</p>
        </header>

        <div className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <CorrectableInput
              type="text"
              placeholder="Username"
              value={username}
              onChange={setUsername}
              schema={LoginSchema.shape.username}
              forceShowError={showAllErrors}
            />
            <CorrectableInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
              schema={LoginSchema.shape.password}
              forceShowError={showAllErrors}
              onEnter={handleLogin}
            />
          </div>

          <ErrorBox>{serverErrorMsg}</ErrorBox>

          <div className={styles.actionArea}>
            {/* Dein CustomButton bleibt bestehen! Passe ihn ggf. in seinem eigenen CSS an unsere neuen Farben an */}
            <CustomButton text="Login" onClick={handleLogin} />
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.signupText}>
            Don't have an account yet?{" "}
            <Link to="/signup" className={styles.signupLink}>
              Sign up here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
