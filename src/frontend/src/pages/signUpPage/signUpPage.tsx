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
import {
  generateKeyPairFromPassword,
  deriveKeyFromPassword,
  arrayBufferToBase64,
} from "../../utils/cryptoUtils";
import type { SilentResponse } from "../../shared/ServerResponse";
import { Status } from "../../shared/Status";
import SiteContainer from "../../components/siteContainer/siteContainer";
import MainMiddleComponent from "../../components/mainMiddleComponent/mainMiddleComponent";
import { UserColor } from "../../shared/colors";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");

  const navigate = useNavigate();

  const signUpMutation = useMutation({
    mutationFn: async (payload: any): Promise<ServerResponse<SilentResponse>> =>
      callAPI("/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (response: ServerResponse<SilentResponse>) => {
      if (response?.status.code === Status.OK.code) {
        navigate("/", {
          state: {
            successMessage: "Account created successfully! You can now log in.",
          },
        });
      } else if (response.status.code === Status.ERROR.code) {
        setServerErrorMsg(
          "An unexpected error has occurred. Try again or check the console for more details",
        );
        setPassword("");
        setPassword2("");
      } else {
        setServerErrorMsg(response?.status.msg + "");
        setPassword("");
        setPassword2("");
      }
    },
    onError: (error) => {
      setServerErrorMsg(
        "An unexpected error has occurred. Try again or check the console for more details",
      );
      console.error(error);
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

      // Private Key mit dem Secret Password (AES) verschlüsseln
      const aesKey = await deriveKeyFromPassword(password2, username);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encPrivBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        new TextEncoder().encode(JSON.stringify(privateKey)),
      );

      signUpMutation.mutate({
        username,
        password,
        password2,
        public_key: publicKeyStr,
        encrypted_private_key: arrayBufferToBase64(encPrivBuffer),
        iv_private_key: arrayBufferToBase64(iv.buffer),
        color_id: UserColor.getRandomColorId(),
      });
    } catch (err) {
      console.error("Error during key generation:", err);
      setServerErrorMsg("Encryption setup failed.");
    }
  };

  return (
    <SiteContainer>
      <MainMiddleComponent
        title="Join Nuntius"
        subtitle="Create your secure account."
        maxWidth="550px"
        footer={
          <>
            Already have an account?{" "}
            <Link to="/" className={styles.loginLink}>
              Log in here.
            </Link>
          </>
        }
      >
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
              schema={SignupSchema.shape.password2.refine(
                (val) => val !== password,
                "Passwords cannot be identical",
              )}
              forceShowError={showAllErrors}
              onEnter={handleSignUp}
            />
            <PasswordMeter password={password2} />
          </div>

          <ErrorBox>{serverErrorMsg}</ErrorBox>

          <div className={styles.actionArea}>
            <CustomButton text="Sign up" onClick={handleSignUp} />
          </div>
        </div>
      </MainMiddleComponent>
    </SiteContainer>
  );
}
