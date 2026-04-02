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

// --- Krypto-Imports (stelle sicher, dass du arrayBufferToBase64 etc. in cryptoUtils.ts hast) ---
import {
  generateKeyPairFromPassword,
  deriveKeyFromPassword,
  arrayBufferToBase64,
} from "../../utils/cryptoUtils";
import PageContainer from "../../components/pageContainer/pageContainer";
import Footer from "../../components/footer/footer";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");

  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (payload: any): Promise<ServerResponse<String>> =>
      callAPI("/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (response: ServerResponse<String>) => {
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
      setServerErrorMsg("Ein unerwarteter Fehler ist aufgetreten.");
    },
  });

  const handleSignUp = async () => {
    setServerErrorMsg("");
    const result = SignupSchema.safeParse({ username, password, password2 });
    if (!result.success) {
      setShowAllErrors(true);
      return;
    }

    try {
      // RSA Public/Private Key Pair generieren
      const { publicKey, privateKey } = await generateKeyPairFromPassword(
        password2,
        username,
      );
      const publicKeyStr = JSON.stringify(publicKey);

      // 2. Private Key mit dem Secret Password (AES) verschlüsseln
      const aesKey = await deriveKeyFromPassword(password2, username);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encPrivBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        new TextEncoder().encode(JSON.stringify(privateKey)),
      );

      mutation.mutate({
        username,
        password,
        password2,
        public_key: publicKeyStr,
        encrypted_private_key: arrayBufferToBase64(encPrivBuffer),
        iv_private_key: arrayBufferToBase64(iv.buffer),
      });
    } catch (err) {
      console.error("Fehler bei der Schlüsselgenerierung:", err);
      setServerErrorMsg("Verschlüsselungs-Setup fehlgeschlagen.");
    }
  };

  return (
    <PageContainer>
      <div className={styles.signUpCard}>
        <header className="text-center">
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
            There is no way to reset your encryption password. If it is lost,
            your messages are permanently inaccessible.
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

          <ErrorBox>{serverErrorMsg}</ErrorBox>

          <div className={styles.actionArea}>
            <CustomButton text="Sign up" onClick={handleSignUp} />
          </div>
        </div>

        <Footer>
          <p className={styles.loginText}>
            Already have an account?{" "}
            <Link to="/" className={styles.loginLink}>
              Log in here.
            </Link>
          </p>
        </Footer>
      </div>
    </PageContainer>
  );
}
