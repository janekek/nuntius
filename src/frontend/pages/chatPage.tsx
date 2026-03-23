import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import styles from "../styles/chatPage.module.css";
import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";
import CorrectableInput from "../components/CorrectableInput";

import type { Chat } from "../types/chat";

import { useCallAPI } from "../hooks/useCallAPI";
import type { ChatPackage } from "../types/ServerResponse";
import LoadingPage from "./LoadingPage";

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

function ChatPage() {
  const { chatID } = useParams<{ chatID: string }>();
  const [userInputMsg, setUserInputMsg] = useState("");

  const { response, loading, error } = useCallAPI<ChatPackage>(
    `http://localhost:5000/api/chats/${chatID}`,
    {
      credentials: "include",
    },
  );

  const [chat, setChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (response?.content.chat) {
      setChat(response.content.chat);
    }
  }, [response?.content.chat]);

  useEffect(() => {
    socket.emit("join", { chatID });

    const handleMessage = (data: any) => {
      setChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, data],
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
              Chat: <pre id="chatID"> {chat.chatID}</pre>
            </h1>

            <div className={styles.chatBox} id="chat-box">
              {chat.messages.map((m, i) => (
                <div key={i} className={styles.message}>
                  <div>
                    <strong>{m.sender}:</strong> {m.text}
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
