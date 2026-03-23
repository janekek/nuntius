import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";

import styles from "../styles/chats.module.css";
import type { Chat } from "../types/chat";
import { useCallAPI } from "../hooks/useCallAPI";
import type { ChatsPackage } from "../types/ServerResponse";

export default function () {
  const [username, setUsername] = useState(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const navigate = useNavigate();

  const { response, error, loading } = useCallAPI<ChatsPackage>(
    "http://localhost:5000/api/chats",
    {
      credentials: "include",
    },
  );

  useEffect(() => {
    console.log(response);
    if (response?.status === 201) {
      navigate("/");
    } else if (response?.status === 100) {
      setChats(response.content.chats);
    }
  }, [response]);

  return (
    <>
      <CenteredVertically
        content={
          <>
            <VerticalSpace height="100px" />
            <h1>Welcome {username}!</h1>
            <VerticalSpace height="20px" />
            <p>These are your chats.</p>
            <VerticalSpace height="20px" />

            <ul className={styles.ul}>
              {chats.map((chat: Chat) => (
                <li key={chat.chatID} className={styles.li}>
                  <p className={styles.chatID}>Chat ID: {chat.chatID}</p>
                  Teilnehmer: {chat.usernames.join(", ")}
                  <br />
                  <a className={styles.link} href={`/chats/${chat.chatID}`}>
                    Chat öffnen
                  </a>
                </li>
              ))}
            </ul>
          </>
        }
      />
    </>
  );
}
