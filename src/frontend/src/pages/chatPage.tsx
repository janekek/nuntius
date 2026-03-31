import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import styles from "../styles/chatPage.module.css";
import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";
import CorrectableInput from "../components/CorrectableInput";

import type { ChatPackage } from "../shared/ServerResponse";
import LoadingPage from "./LoadingPage";
import { Status } from "../shared/Status";
import type { FullChat } from "../shared/types";
import { useQuery } from "@tanstack/react-query";
import type ServerResponse from "../shared/ServerResponse";
import { callAPI } from "../utils/apiClient";
import { ChatSchema } from "../shared/schemas";

const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: false,
});

function ChatPage() {
  const { chatID } = useParams<{ chatID: string }>();

  const [chat, setChat] = useState<FullChat | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");

  const [messageCount, setMessageCount] = useState(0);

  const navigate = useNavigate();

  const { data, isSuccess, isLoading, isError } = useQuery<
    ServerResponse<ChatPackage>
  >({
    queryKey: ["page-chats", chatID],
    queryFn: () =>
      callAPI("/chat/" + chatID, {
        method: "GET",
      }),
  });

  useEffect(() => {
    if (isSuccess && data) {
      switch (data?.status.code) {
        case Status.OK.code:
          setChat(data.content.fullChat);
          break;
        case Status.USER_NOT_LOGGED_IN.code:
          navigate("/");
          break;
        default:
          console.log(data);
          navigate("/");
      }
    }
  }, [data, isSuccess]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join", { chatID });

    const handleMessage = (data: any) => {
      setChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, data.message],
        };
      });
      setShowAllErrors(false);
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [chatID]);

  if (isLoading) return <LoadingPage />;
  if (isError) return <div>Fehler: {isError}</div>;
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
              key={messageCount}
              type="text"
              placeholder="Message"
              value={chatMessage}
              onChange={setChatMessage}
              schema={ChatSchema.shape.chatMessage}
              forceShowError={showAllErrors}
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
    setServerErrorMsg("");
    const result = ChatSchema.safeParse({ chatMessage });

    console.log(result);
    if (!result.success) {
      setShowAllErrors(true);
      return;
    }

    const messageData = { chatID, msg: chatMessage };
    socket.emit("sendMessage", messageData);
    setMessageCount((prev) => prev + 1);
    setChatMessage("");
  }
}

export default ChatPage;
