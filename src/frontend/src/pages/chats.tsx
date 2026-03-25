import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";

import styles from "../styles/chats.module.css";
import type { Chat } from "../types/chat";
import { useCallAPI } from "../hooks/useCallAPI";
import type { ChatsPackage } from "../shared/ServerResponse";
import CorrectableInput from "../components/CorrectableInput";
import Input from "../components/Input";

export default function () {
  const [username, setUsername] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const navigate = useNavigate();

  const [searchUsernameText, setSearchUsernameText] = useState<string>("");
  const [sendSearchUsernameText, setSendSearchUsernameText] =
    useState<boolean>(false);

  const { response, error, loading } = useCallAPI<ChatsPackage>("api/chats", {
    credentials: "include",
    method: "GET",
  });

  useEffect(() => {
    console.log(response);
    if (response?.status.code === 201) {
      navigate("/");
    } else if (response?.status.code === 100) {
      setChats(response.content.chats);
      setUsername(response.content.username);
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

            <VerticalSpace height="30px" />
            <p>New chat</p>
            <VerticalSpace height="10px" />
            <Input
              type="text"
              placeholder="Search user"
              value={searchUsernameText}
              onChange={(e) => {
                setSearchUsernameText(e.target.value);
                if (e.target.value.trim() !== "") {
                  setSendSearchUsernameText(false);
                }
              }}
            />
            <VerticalSpace height="10px" />
            <p>Search result</p>
            <VerticalSpace height="10px" />
            <div className={[styles.searchResultList].join(" ")}>
              <CenteredVertically
                gap={5}
                content={
                  <>
                    <p>Frank</p>
                    <p>Klaus</p>
                  </>
                }
              />
            </div>
          </>
        }
      />
    </>
  );
}
