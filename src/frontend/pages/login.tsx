import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CorrectableInput from "../components/CorrectableInput";
import CustomButton from "../components/CustomButton";
import VerticalSpace from "../components/VerticalSpace";
import CenteredVertically from "../components/CenteredVertically";

export default function () {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sendUsernameError, setSendUsernameError] = useState(false);
  const [sendPasswordError, setSendPasswordError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  function sendRequest() {
    const usernameError = username.trim() === "";
    const passwordError = password.trim() === "";

    setSendUsernameError(usernameError);
    setSendPasswordError(passwordError);

    if (usernameError || passwordError) {
      return;
    }
    fetch("http://localhost:5000/api/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        const response = data.status;
        if (response === 100) {
          navigate("/chats");
        } else if (response === 301) {
          setErrorMsg("Username oder password falsch");
        } else {
          console.log("An error occurred.");
        }
      })
      .catch((error) => console.error(error));
  }

  return (
    <>
      <CenteredVertically
        content={
          <>
            <VerticalSpace height={"150px"} />
            <h1>Welcome to Nuntius</h1>
            <VerticalSpace height={"20px"} />
            <p>Enter your data to login.</p>
            <VerticalSpace height={"20px"} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <CorrectableInput
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMsg("");
                  if (e.target.value.trim() !== "") {
                    setSendUsernameError(false);
                  }
                }}
                msg={"Enter a username"}
                displayMsg={sendUsernameError}
              />
              <CorrectableInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                  if (e.target.value.trim() !== "") {
                    setSendPasswordError(false);
                  }
                }}
                msg={"Enter a password"}
                displayMsg={sendPasswordError}
              />
            </div>
            {errorMsg && (
              <>
                <VerticalSpace height={"10px"} />
                <p>{errorMsg}</p>
              </>
            )}
            <VerticalSpace height={"30px"} />
            <CustomButton text="Login" onClick={sendRequest}></CustomButton>
          </>
        }
      />
    </>
  );
}
