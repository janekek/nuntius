import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import styles from "../styles/chatPage.module.css";
import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";
import CorrectableInput from "../components/CorrectableInput";

import type { Chat } from "../types/chat";

import { useCallAPI } from "../hooks/useCallAPI";

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

function ChatPage() {
  const { chatID } = useParams<{ chatID: string }>();
  const [msg, setMsg] = useState("");

  const {
    data: chatData,
    loading,
    error,
  } = useCallAPI<{ chat: Chat }>(`http://localhost:5000/api/chats/${chatID}`, {
    credentials: "include",
  });

  const [chat, setChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (chatData?.chat) setChat(chatData.chat);
  }, [chatData]);

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

  if (loading) return <div>Lädt...</div>;
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
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
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
    if (!msg.trim()) return;

    const messageData = { chatID, msg };
    socket.emit("sendMessage", messageData);
    setMsg("");
  }
}

export default ChatPage;
