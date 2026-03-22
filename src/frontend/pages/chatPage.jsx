import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import styles from "../styles/chatPage.module.css";
import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";
import CorrectableInput from "../components/CorrectableInput";

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

function ChatPage() {
  const { chatID } = useParams();
  const [chat, setChat] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/chats/${chatID}`, {
      credentials: "include",
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        setChat(data.chat);
      });
    socket.emit("join", { chatID });
    socket.on("receiveMessage", (data) => {
      console.log(chat);
      setChat((prev) => {
        const newState = {
          ...prev,
          messages: [...(prev?.messages || []), data],
        };
        console.log("neu", newState);
        return newState;
      });
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [chatID]);

  function submitChat() {
    if (!msg.trim()) return;

    const messageData = { chatID, msg };
    socket.emit("sendMessage", messageData);
    setMsg("");
  }

  if (!chat) return <div>Lädt...</div>;

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
              id="msg"
              placeholder="Chatte hier..."
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
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
}

export default ChatPage;
