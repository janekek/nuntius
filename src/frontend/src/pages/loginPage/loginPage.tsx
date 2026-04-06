import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import CorrectableInput from "../../components/CorrectableInput";
import CustomButton from "../../components/customButton/CustomButton";
import { useMutation } from "@tanstack/react-query";
import type ServerResponse from "../../shared/ServerResponse";
import { callAPI } from "../../utils/apiClient";
import { LoginSchema } from "../../shared/schemas";
import styles from "./loginPage.module.css";
import ErrorBox from "../../components/errorBox/errorBox";
import PageContainer from "../../components/pageContainer/pageContainer";
import SinglePageContainer from "../../components/singlePageContainer/singlePageContainer";
import Footer from "../../components/footer/footer";
import { Status } from "../../shared/Status";
import type { SilentResponse } from "../../shared/ServerResponse";
import Toast from "../../components/toast/toast";
import SiteContainer from "../../components/siteContainer/siteContainer";
import MainMiddleComponent from "../../components/mainMiddleComponent/mainMiddleComponent";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(
    location.state?.successMessage || "",
  );

  // --- State löschen aus History, damit Toast beim Neuladen nicht nochmal kommt --->
  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- check auth and navigate to /chats if the user is loggedIn --->
  useEffect(() => {
    try {
      const response = callAPI<ServerResponse<any>>("/isLoggedIn", {
        method: "GET",
      });
      response.then((res) => {
        console.log(res);
        if (res.status.code === Status.OK.code) {
          navigate("/chats");
        }
        setIsCheckingAuth(false);
      });
    } catch {
      setIsCheckingAuth(false);
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (): Promise<ServerResponse<SilentResponse>> =>
      callAPI("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    onSuccess: (response: ServerResponse<SilentResponse>) => {
      if (response?.status.code === Status.OK.code) {
        navigate("/chats");
      } else if (
        response?.status.code ===
        Status.LOGIN_USERNAME_OR_PASSWORD_INCORRECT.code
      ) {
        setPassword("");
        setServerErrorMsg("Username oder Passwort falsch");
      }
    },
    onError: (error) => {
      setPassword("");
      setServerErrorMsg("Username oder Passwort falsch");
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
    loginMutation.mutate();
  };

  if (isCheckingAuth) {
    return <div>Überprüfe Login-Status...</div>;
  }

  return (
    <SiteContainer>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <MainMiddleComponent
        title="Welcome to Nuntius."
        subtitle="Enter your data to log in."
        maxWidth="400px"
        footer={
          <>
            Don't have an account yet?{" "}
            <Link to="/signup" className={styles.signupLink}>
              Sign up here.
            </Link>
          </>
        }
      >
        <div className={"flex flex-col gap-6"}>
          <div className={"flex flex-col gap-4"}>
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

          <div className="flex flex-col mt-2">
            <CustomButton text="Login" onClick={handleLogin} />
          </div>
        </div>
      </MainMiddleComponent>
    </SiteContainer>
  );
}
