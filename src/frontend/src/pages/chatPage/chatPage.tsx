import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";

import styles from "./chatPage.module.css";
import CorrectableInput from "../../components/CorrectableInput";
import LoadingPage from "../LoadingPage";

import type { ChatPackage } from "../../shared/ServerResponse";
import { Status } from "../../shared/Status";
import type { FullChat } from "../../shared/types";
import type ServerResponse from "../../shared/ServerResponse";
import { callAPI } from "../../utils/apiClient";
import { ChatSchema } from "../../shared/schemas";
import { formatSmartDate } from "../../utils/dateParser";

const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: false,
});

function ChatPage() {
  const { chatID } = useParams<{ chatID: string }>();

  const [chat, setChat] = useState<FullChat | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>(""); // WICHTIG: Zum Abgleich von eigenen/fremden Nachrichten
  const [chatMessage, setChatMessage] = useState("");
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");
  const [messageCount, setMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Auto-Scroll nach unten, wenn sich die Nachrichten ändern
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (isSuccess && data) {
      switch (data?.status.code) {
        case Status.OK.code:
          setChat(data.content.fullChat);
          setCurrentUsername(data.content.username);
          // HINWEIS: Hier den eigenen Usernamen aus der API setzen, falls vorhanden.
          // Bsp: setCurrentUsername(data.content.username);
          break;
        case Status.USER_NOT_LOGGED_IN.code:
          navigate("/");
          break;
        default:
          console.log(data);
          navigate("/");
      }
    }
  }, [data, isSuccess, navigate]);

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
  if (isError)
    return <div className={styles.errorState}>Fehler: {isError}</div>;
  if (!chat) return <div className={styles.errorState}>Kein Chat geladen</div>;

  function submitChat() {
    setServerErrorMsg("");
    const result = ChatSchema.safeParse({ chatMessage });

    if (!result.success) {
      setShowAllErrors(true);
      return;
    }

    const messageData = { chatID, msg: chatMessage };
    socket.emit("sendMessage", messageData);
    setMessageCount((prev) => prev + 1);
    setChatMessage("");
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.chatApp}>
        {/* HEADER */}
        <header className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.avatarGroup}>
              {chat.participants
                .filter((p) => p !== currentUsername)
                .slice(0, 2)
                .map((p, i) => (
                  <div key={i} className={styles.avatar}>
                    {p.charAt(0).toUpperCase()}
                  </div>
                ))}
            </div>
            <div>
              <h1 className={styles.chatTitle}>
                {chat.participants
                  .filter((p) => p !== currentUsername)
                  .join(", ") || "Chat"}
              </h1>
              <span className={styles.chatIdLabel}>ID: {chat.chat_id}</span>
            </div>
          </div>
          <Link to="/chats" className={styles.backLink}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Zurück
          </Link>
        </header>

        {/* CHAT WINDOW */}
        <div className={styles.chatWindow}>
          <div className={styles.messageSpacer}></div>{" "}
          {/* Drückt wenige Nachrichten nach unten */}
          {chat.messages.map((m, i) => {
            const isOwn = m.sender_username === currentUsername;
            return (
              <div
                key={i}
                className={`${styles.messageWrapper} ${isOwn ? styles.messageOwn : styles.messageOther}`}
              >
                {!isOwn && (
                  <span className={styles.senderName}>{m.sender_username}</span>
                )}
                <div className={styles.messageBubble}>
                  <p className={styles.messageContent}>{m.content}</p>
                  <span className={styles.timestamp}>
                    {formatSmartDate(m.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} /> {/* Ziel für den Auto-Scroll */}
        </div>

        {/* INPUT AREA */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <CorrectableInput
              key={messageCount}
              type="text"
              placeholder="Schreibe eine Nachricht..."
              value={chatMessage}
              onChange={setChatMessage}
              schema={ChatSchema.shape.chatMessage}
              forceShowError={showAllErrors}
              // Falls dein CorrectableInput eine className Prop nimmt, übergib hier eine:
              // className={styles.textInput}
            />
          </div>
          <button className={styles.sendButton} onClick={submitChat}>
            Senden
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
