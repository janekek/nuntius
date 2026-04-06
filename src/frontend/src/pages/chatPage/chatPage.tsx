import { useParams, Link, useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useMutation, useQuery } from "@tanstack/react-query";

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
import NewMessagesHR from "../../components/newMessagesHR/newMessagesHR";

import doubleTick from "../../img/double-tick-2.png";
import Toast from "../../components/toast/toast";
import LogoutBtn from "../../components/logoutBtn/logoutBtn";
import StickyFooter from "../../components/stickyFooter/stickyFooter";
import ChatPageSettings from "./chatPageSettings";
import ChatPageLocked from "./chatPageLocked";
import SiteContainer from "../../components/siteContainer/siteContainer";
import { UserColor } from "../../shared/colors";

const socket = io("https://api.janek-zeiger.com", {
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

  // --- Settings & UI States ---
  const [showSettings, setShowSettings] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const { data, isSuccess, isLoading, isError } = useQuery<
    ServerResponse<ChatPackage>
  >({
    queryKey: ["page-chats", chatID],
    queryFn: () => callAPI("/chat/" + chatID, { method: "GET" }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, showSettings]);

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

  // Chat-Historie von API laden
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

  //  Historie entschlüsseln (sobald entsperrt)
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

  const handleUnlock = async () => {
    if (!secretPassword) return;
    setUnlockError("");
    setUnlocking(true);

    try {
      // verschlüsselten Private Key aus DB holen
      const keysRes: any = await callAPI("/user/keys", { method: "GET" });

      if (keysRes.status.code !== 100) {
        setUnlockError("Unable to retrieve the key from the server.");
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

      const rawKey = JSON.parse(new TextDecoder().decode(decryptedBuffer));
      setPrivateKeyJwk(rawKey);
      setIsUnlocked(true);
    } catch (err) {
      console.error(err);
      setUnlockError("Incorrect password. Access denied.");
    } finally {
      setUnlocking(false);
    }
  };

  if (isLoading || !rawChatData) return <LoadingPage />;
  if (isError)
    return <div className={styles.errorState}>Error while loading.</div>;

  // --- UI: Unlockscreen -->
  if (!isUnlocked) {
    return (
      <ChatPageLocked
        handleUnlock={handleUnlock}
        unlockError={unlockError}
        unlocking={unlocking}
        secretPassword={secretPassword}
        setSecretPassword={setSecretPassword}
      />
    );
  }

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

  // --- UI: chat -->
  return (
    <SiteContainer>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <div className={styles.chatApp}>
        <header className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.avatarGroup}>
              {chat?.participants
                .filter((p) => p.username !== currentUsername)
                .slice(0, 2)
                .map((p, i) => (
                  <div
                    key={i}
                    className={styles.avatar}
                    style={{
                      background: UserColor.getColorById(p.color_id).rgb,
                    }}
                  >
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                ))}
            </div>
            <div>
              <h1 className={styles.chatTitle}>
                {chat?.participants
                  .filter((p) => p.username !== currentUsername)
                  .map((p) => p.username)
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
            Back
          </Link>
        </header>

        {showSettings ? (
          <ChatPageSettings
            chat_id={+chatID!}
            navigator={navigate}
            setToastMsg={setToastMsg}
            currentUsername={currentUsername}
            chat={chat!}
            privateKeyJwk={privateKeyJwk}
          />
        ) : (
          <>
            <div className={styles.chatWindow}>
              <div className={styles.messageSpacer}></div>
              {chat?.messages.map((m, i) => {
                const isOwn = m.sender_username === currentUsername;
                const last_read_message_id = chat.last_read_message_id;
                let displayHR = false;
                if (m.id > last_read_message_id) {
                  const hasSmallerUnreadMessage = chat.messages.some(
                    (otherMsg) =>
                      otherMsg.id > last_read_message_id && otherMsg.id < m.id,
                  );
                  if (!hasSmallerUnreadMessage) displayHR = true;
                }
                let show_is_read = false;
                if (isOwn) {
                  const otherParticipants = chat.participants.filter(
                    (p) => p.username !== currentUsername,
                  );
                  if (otherParticipants.length > 0) {
                    const isReadByAll = otherParticipants.every(
                      (p) => m.id <= p.last_read_message_id,
                    );
                    if (isReadByAll) {
                      show_is_read = true;
                    }
                  }
                }
                return (
                  <React.Fragment key={i}>
                    {displayHR && <NewMessagesHR></NewMessagesHR>}
                    <div
                      className={`${styles.messageWrapper} ${isOwn ? styles.messageOwn : styles.messageOther}`}
                    >
                      {!isOwn && (
                        <span className={styles.senderName}>
                          {m.sender_username}
                        </span>
                      )}
                      <div className={styles.messageBubble}>
                        <p
                          className={`${styles.messageContent} ${isOwn ? styles.alignRight : styles.alignLeft}`}
                        >
                          {m.content}
                        </p>
                        <div
                          className={`${styles.messageFooter} ${isOwn ? styles.flexEnd : " "}`}
                        >
                          <span className={`${styles.timestamp}`}>
                            {formatSmartDate(m.timestamp)}
                          </span>
                          {show_is_read && (
                            <>
                              <img
                                src={doubleTick}
                                alt="Read"
                                className={styles.logoImage}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <CorrectableInput
                  key={messageCount}
                  type="text"
                  placeholder="Message..."
                  value={chatMessage}
                  onChange={setChatMessage}
                  forceShowError={showAllErrors}
                  onEnter={submitChat}
                />
              </div>
              <button onClick={submitChat}>Send</button>
            </div>
          </>
        )}
      </div>
      <StickyFooter
        maxWidth="800px"
        navigator={navigate}
        setToastMsg={setToastMsg}
        settingsBtnActive={showSettings}
        settingsBtnOnClick={() => setShowSettings(!showSettings)}
      />
    </SiteContainer>
  );
}

export default ChatPage;
