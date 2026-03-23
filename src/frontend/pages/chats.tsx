import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";

import styles from "../styles/chats.module.css";
import type { Chat } from "../types/chat";

export default function () {
  const [username, setUsername] = useState(null);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/checkSession", {
      credentials: "include",
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          navigate("/");
        } else {
          setUsername(data.username);
        }
      })
      .catch((err) => console.error(err));

    fetch("http://localhost:5000/api/chats", {
      credentials: "include",
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => setChats(data.chats))
      .catch((err) => console.error(err));
  }, [navigate]);

  if (!username) return <div>Loading...</div>;
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
