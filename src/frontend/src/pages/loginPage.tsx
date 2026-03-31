import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CorrectableInput from "../components/CorrectableInput";
import CustomButton from "../components/CustomButton";
import VerticalSpace from "../components/VerticalSpace";
import CenteredVertically from "../components/CenteredVertically";
import { useMutation } from "@tanstack/react-query";
import type ServerResponse from "../shared/ServerResponse";
import { callAPI } from "../utils/apiClient";
import { LoginSchema } from "../shared/schemas";

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
    <CenteredVertically
      content={
        <>
          <VerticalSpace height={"150px"} />
          <h1>Welcome to Nuntius</h1>
          <VerticalSpace height={"20px"} />
          <p>Enter your data to log in.</p>
          <VerticalSpace height={"20px"} />

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
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
            />
          </div>

          {serverErrorMsg && (
            <>
              <VerticalSpace height={"10px"} />
              <p style={{ color: "red" }}>{serverErrorMsg}</p>
            </>
          )}

          <VerticalSpace height={"30px"} />
          <CustomButton text="Login" onClick={handleLogin}></CustomButton>
          <VerticalSpace height="30px" />
          <a href="signup">Sign up here.</a>
        </>
      }
    />
  );
}
