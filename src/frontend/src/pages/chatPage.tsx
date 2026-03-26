import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import styles from "../styles/chatPage.module.css";
import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";
import CorrectableInput from "../components/CorrectableInput";

import { useCallAPI } from "../hooks/useCallAPI";
import type { ChatPackage } from "../shared/ServerResponse";
import LoadingPage from "./LoadingPage";
import { Status } from "../shared/Status";
import type { FullChat } from "../shared/types";

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

function ChatPage() {
  const { chatID } = useParams<{ chatID: string }>();

  const [userInputMsg, setUserInputMsg] = useState("");
  const [chat, setChat] = useState<FullChat | null>(null);

  const navigate = useNavigate();

  const { response, loading, error } = useCallAPI<ChatPackage>(
    `api/chat/${chatID}`,
    {
      credentials: "include",
      method: "GET",
    },
  );

  useEffect(() => {
    if (!response) return;
    switch (response?.status.code) {
      case Status.OK.code:
        setChat(response.content.fullChat);
        break;
      case Status.USER_NOT_LOGGED_IN.code:
        navigate("/");
        break;
      default:
        console.log(response);
        navigate("/");
    }
  }, [response]);

  useEffect(() => {
    socket.emit("join", { chatID });

    const handleMessage = (data: any) => {
      setChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, data.message],
        };
      });
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [chatID]);

  if (loading) return <LoadingPage />;
  if (error) return <div>Fehler: {error}</div>;
  if (!chat) return <div>Kein Chat geladen</div>;

  return (
    <>
      <CenteredVertically
        content={
          <>
            <VerticalSpace height={"50px"} />
            <h1 style={{ display: "flex", flexFlow: "row" }}>
              Chat: <pre id="chatID"> {chat.chat_id}</pre>
            </h1>

            <div className={styles.chatBox} id="chat-box">
              {chat.messages.map((m, i) => (
                <div key={i} className={styles.message}>
                  <div>
                    <strong>{m.sender_username}:</strong> {m.content}
                  </div>

                  <div style={{ fontSize: "0.7em", color: "gray" }}>
                    {m.timestamp}
                  </div>
                </div>
              ))}
            </div>

            <VerticalSpace height={"20px"} />

            <CorrectableInput
              placeholder="Chatte hier..."
              type="text"
              value={userInputMsg}
              onChange={(e) => setUserInputMsg(e.target.value)}
              msg="text"
              displayMsg={false}
            />
            <VerticalSpace height={"20px"} />
            <button onClick={submitChat}>Chat</button>

            <VerticalSpace height={"20px"} />
            <Link to="/chats">Zurück zur Übersicht</Link>
          </>
        }
      />
    </>
  );

  function submitChat() {
    if (!userInputMsg.trim()) return;

    const messageData = { chatID, msg: userInputMsg };
    socket.emit("sendMessage", messageData);
    setUserInputMsg("");
  }
}

export default ChatPage;
