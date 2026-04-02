import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";

import styles from "./chatPage.module.css";
import CorrectableInput from "../../components/CorrectableInput";
import LoadingPage from "../LoadingPage";
import CustomButton from "../../components/customButton/CustomButton";

import type { ChatPackage } from "../../shared/ServerResponse";
import { Status } from "../../shared/Status";
import type { FullChat } from "../../shared/types";
import type ServerResponse from "../../shared/ServerResponse";
import { callAPI } from "../../utils/apiClient";
import { ChatSchema } from "../../shared/schemas";
import { formatSmartDate } from "../../utils/dateParser";
import {
  decryptHybrid,
  encryptHybrid,
  deriveKeyFromPassword,
  base64ToArrayBuffer,
} from "../../utils/cryptoUtils";
import Input from "../../components/input/Input";
import VerticalSpace from "../../components/VerticalSpace";
import PageContainer from "../../components/pageContainer/pageContainer";
import SinglePageContainer from "../../components/singlePageContainer/singlePageContainer";
import ErrorBox from "../../components/errorBox/errorBox";
import Footer from "../../components/footer/footer";

const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: false,
});

function ChatPage() {
  const { chatID } = useParams<{ chatID: string }>();

  const [chat, setChat] = useState<FullChat | null>(null);
  const [rawChatData, setRawChatData] = useState<FullChat | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [chatMessage, setChatMessage] = useState("");

  // Security States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [secretPassword, setSecretPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [privateKeyJwk, setPrivateKeyJwk] = useState<any>(null);

  const [showAllErrors, setShowAllErrors] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, isSuccess, isLoading, isError } = useQuery<
    ServerResponse<ChatPackage>
  >({
    queryKey: ["page-chats", chatID],
    queryFn: () => callAPI("/chat/" + chatID, { method: "GET" }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  //Lesebestätigung senden
  useEffect(() => {
    if (isUnlocked && !!chat) {
      socket.emit("sendReadMessage", {
        chat_id: chatID,
        last_message_id:
          chat.messages.length > 0
            ? chat.messages.reduce((prev, current) =>
                prev.id! > current.id! ? prev : current,
              ).id
            : -1,
      });
    }
  }, [isLoading, isUnlocked, chat]);

  // 1. Chat-Historie von API laden
  useEffect(() => {
    if (isSuccess && data) {
      if (data.status.code === Status.OK.code) {
        setCurrentUsername(data.content.username);
        setRawChatData(data.content.fullChat);
      } else {
        navigate("/");
      }
    }
  }, [data, isSuccess, navigate]);

  // 2. Historie entschlüsseln (sobald entsperrt)
  useEffect(() => {
    if (isUnlocked && rawChatData && privateKeyJwk && currentUsername) {
      const processHistory = async () => {
        const decryptedMessages = await Promise.all(
          rawChatData.messages.map(async (msg: any) => {
            const myKeyObj = msg.keys?.find(
              (k: any) => k.username === currentUsername,
            );
            if (!myKeyObj) return msg;

            try {
              const text = await decryptHybrid(
                msg.content,
                msg.iv,
                myKeyObj.encryptedKey,
                privateKeyJwk,
              );
              return { ...msg, content: text };
            } catch (e) {
              return { ...msg, content: "[Verschlüsselt]" };
            }
          }),
        );
        setChat({ ...rawChatData, messages: decryptedMessages });
      };
      processHistory();
    }
  }, [isUnlocked, rawChatData, privateKeyJwk, currentUsername]);

  // 3. Socket Event Handling (Live-Nachrichten)
  useEffect(() => {
    if (!isUnlocked || !privateKeyJwk || !currentUsername) return;

    if (!socket.connected) socket.connect();
    socket.emit("join", { chatID });

    const handleMessage = async (data: any) => {
      const msg = data.message;
      try {
        const myKeyObj = msg.keys.find(
          (k: any) => k.username === currentUsername,
        );
        if (!myKeyObj) return;

        const decryptedText = await decryptHybrid(
          msg.content,
          msg.iv,
          myKeyObj.encryptedKey,
          privateKeyJwk,
        );
        const decryptedMessage = { ...msg, content: decryptedText };

        setChat((prev) => {
          if (!prev) return prev;
          return { ...prev, messages: [...prev.messages, decryptedMessage] };
        });
      } catch (error) {
        console.error("Socket Entschlüsselung fehlgeschlagen:", error);
      }
    };

    socket.on("receiveMessage", handleMessage);
    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [chatID, isUnlocked, privateKeyJwk, currentUsername]);

  // --- DER ENTSPERR-VORGANG (Zieht die Daten jetzt vom Server!) ---
  const handleUnlock = async () => {
    if (!secretPassword) return;
    setUnlockError("");
    setUnlocking(true);

    try {
      // Hole den verschlüsselten Private Key aus der Datenbank
      const keysRes: any = await callAPI("/user/keys", { method: "GET" });

      if (keysRes.status.code !== 100) {
        setUnlockError("Konnte Schlüssel nicht vom Server abrufen.");
        setUnlocking(false);
        return;
      }

      const encPrivBase64 = keysRes.content.encrypted_private_key;
      const ivBase64 = keysRes.content.iv_private_key;

      // AES Key aus dem eingegebenen Passwort berechnen
      const aesKey = await deriveKeyFromPassword(
        secretPassword,
        currentUsername,
      );

      // Entschlüsseln
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(base64ToArrayBuffer(ivBase64)) },
        aesKey,
        base64ToArrayBuffer(encPrivBase64),
      );

      // JSON in nutzbares Format parsen
      const rawKey = JSON.parse(new TextDecoder().decode(decryptedBuffer));
      setPrivateKeyJwk(rawKey);
      setIsUnlocked(true); // Chat öffnet sich
    } catch (err) {
      console.error(err);
      setUnlockError("Falsches Secret Password! Zugriff verweigert.");
    } finally {
      setUnlocking(false);
    }
  };

  if (isLoading || !rawChatData) return <LoadingPage />;
  if (isError)
    return <div className={styles.errorState}>Fehler beim Laden.</div>;

  // --- UI: ENTSPERR SCREEN ---
  if (!isUnlocked) {
    return (
      <PageContainer>
        <SinglePageContainer style={{ maxWidth: "400px" }}>
          <header className={styles.header}>
            <h1 className={styles.title}>Chat gesperrt</h1>
            <p className={styles.subtitle}>
              Bitte gib dein Secret Password ein, um deine Schlüssel vom Server
              zu laden und den Chat zu entsperren.
            </p>
          </header>
          <div className={styles.inputGroup}>
            <Input
              type="password"
              placeholder="Secret Password"
              value={secretPassword}
              onChange={(e) => setSecretPassword(e.target.value)}
              onEnter={handleUnlock}
            />
          </div>

          <ErrorBox>{unlockError}</ErrorBox>

          <CustomButton
            text={unlocking ? "Entschlüsseln..." : "Entsperren"}
            onClick={handleUnlock}
          />
          <Footer>
            <p className={styles.signupText}>
              <Link to="/chats" className={styles.signupLink}>
                Back to chats.
              </Link>
            </p>
          </Footer>
        </SinglePageContainer>
      </PageContainer>
    );
  }

  // --- UI: CHAT (Wie vorher) ---
  async function submitChat() {
    const result = ChatSchema.safeParse({ chatMessage });
    if (!result.success) {
      setShowAllErrors(true);
      return;
    }

    const keysRes: ServerResponse<any> = await callAPI(`/chat/${chatID}/keys`, {
      method: "GET",
    });
    const participantKeys = keysRes.content.keys;

    const payload = await encryptHybrid(chatMessage, participantKeys);

    socket.emit("sendMessage", {
      chatID: chatID,
      encryptedContent: payload.encryptedContent,
      iv: payload.iv,
      keys: payload.keys,
    });

    setMessageCount((prev) => prev + 1);
    setChatMessage("");
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.chatApp}>
        <header className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.avatarGroup}>
              {chat?.participants
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
                {chat?.participants
                  .filter((p) => p !== currentUsername)
                  .join(", ") || "Chat"}
              </h1>
              <span className={styles.chatIdLabel}>ID: {chat?.chat_id}</span>
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

        <div className={styles.chatWindow}>
          <div className={styles.messageSpacer}></div>
          {chat?.messages.map((m, i) => {
            const isOwn = m.sender_username === currentUsername;
            const is2 = i === 2;
            return (
              <div
                key={i}
                className={`${styles.messageWrapper} ${isOwn ? styles.messageOwn : styles.messageOther}`}
              >
                {is2 && <span>--------</span>}
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
          <div ref={messagesEndRef} />
        </div>

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
              onEnter={submitChat}
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
