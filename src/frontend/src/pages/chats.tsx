import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CenteredVertically from "../components/CenteredVertically";
import VerticalSpace from "../components/VerticalSpace";

import styles from "../styles/chats.module.css";
import type { ChatsPackage } from "../shared/ServerResponse";
import Input from "../components/Input";
import type { FullChat } from "../shared/types";
import { callAPI } from "../utils/apiClient";
import { useQuery } from "@tanstack/react-query";
import type ServerResponse from "../shared/ServerResponse";

export default function () {
  const [username, setUsername] = useState<string>("");
  const [chats, setChats] = useState<FullChat[]>([]);
  const navigate = useNavigate();

  const [searchUsernameText, setSearchUsernameText] = useState<string>("");
  const [sendSearchUsernameText, setSendSearchUsernameText] =
    useState<boolean>(false);

  const { data, isSuccess } = useQuery<ServerResponse<ChatsPackage>>({
    queryKey: ["page-chats", username],
    queryFn: () =>
      callAPI("/chats", {
        method: "GET",
      }),
  });

  useEffect(() => {
    if (isSuccess && data) {
      if (data?.status.code === 201) {
        navigate("/");
      } else if (data?.status.code === 100) {
        setChats(data.content.chats);
        setUsername(data.content.username);
      }
    }
  }, [isSuccess, data]);

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
              {chats.map((chat: FullChat) => (
                <li key={chat.chat_id} className={styles.li}>
                  <p className={styles.chatID}>Chat ID: {chat.chat_id}</p>
                  Teilnehmer: {chat.participants.join(", ")}
                  <br />
                  <a className={styles.link} href={`/chats/${chat.chat_id}`}>
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
                    <p>ff</p>
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
