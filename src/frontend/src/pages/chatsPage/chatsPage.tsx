import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import CenteredVertically from "../../components/CenteredVertically";
import VerticalSpace from "../../components/VerticalSpace";
import Input from "../../components/input/Input";

import styles from "./chatsPage.module.css";
import type { ChatsPackage } from "../../shared/ServerResponse";
import type { FullChat } from "../../shared/types";
import { callAPI } from "../../utils/apiClient";
import type ServerResponse from "../../shared/ServerResponse";
import NavBar from "../../components/navbar/NavBar";

export default function Chats() {
  const [username, setUsername] = useState<string>("");
  const [chats, setChats] = useState<FullChat[]>([]);
  const navigate = useNavigate();

  const [searchUser, setSearchUser] = useState("");
  const [matches, setMatches] = useState<string[]>([]);
  const [sendSearchUsernameText, setSendSearchUsernameText] =
    useState<boolean>(false);

  const { data, isSuccess } = useQuery<ServerResponse<ChatsPackage>>({
    queryKey: ["page-chats", username],
    queryFn: () =>
      callAPI("/chats", {
        method: "GET",
      }),
  });

  const mutation = useMutation({
    mutationFn: async (): Promise<ServerResponse<String>> =>
      callAPI("/searchUser", {
        method: "POST",
        body: JSON.stringify({ searchUser, username }),
      }),
    onSuccess: (response: ServerResponse<any>) => {
      if (response?.status.code === 100) {
        if (response.content.result) {
          setMatches(response.content.result);
        }
      }
    },
    onError: (error) => {
      console.error(error);
    },
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
  }, [isSuccess, data, navigate]);

  useEffect(() => {
    if (searchUser.length >= 3) {
      mutation.mutate();
    } else {
      setMatches([]); // Clear matches if input is too short
    }
  }, [searchUser]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.dashboard}>
        <CenteredVertically
          content={
            <>
              <header className={styles.header}>
                <h1>
                  Welcome, <span className={styles.highlight}>{username}</span>!
                </h1>
                <p className={styles.subtitle}>These are your chats.</p>
              </header>

              <VerticalSpace height="30px" />

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Your chats</h2>
                <div className={styles.chatList}>
                  {chats.length === 0 ? (
                    <p className={styles.emptyState}>
                      Noch keine Chats vorhanden.
                    </p>
                  ) : (
                    chats.map((chat: FullChat) => (
                      <Link
                        to={`/chats/${chat.chat_id}`}
                        key={chat.chat_id}
                        className={styles.chatCard}
                      >
                        <div className={styles.chatInfo}>
                          <div className={styles.avatarGroup}>
                            {chat.participants.slice(0, 2).map((p, i) => (
                              <div key={i} className={styles.avatar}>
                                {p.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {chat.participants.length > 2 && (
                              <div className={styles.avatar}>
                                +{chat.participants.length - 2}
                              </div>
                            )}
                          </div>
                          <div className={styles.chatDetails}>
                            <span className={styles.participantsName}>
                              {chat.participants.join(", ")}
                            </span>
                            <span className={styles.chatIdLabel}>
                              ID: {chat.chat_id}
                            </span>
                          </div>
                        </div>
                        <div className={styles.chatAction}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <VerticalSpace height="40px" />

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Start new chat</h2>
                <div className={styles.searchContainer}>
                  <Input
                    type="text"
                    placeholder="Benutzername suchen..."
                    value={searchUser}
                    onChange={(e) => {
                      setSearchUser(e.target.value);
                      if (e.target.value.trim() !== "") {
                        setSendSearchUsernameText(false);
                      }
                    }}
                    // className={styles.searchInput} // Falls deine Input-Komponente das unterstützt
                  />
                </div>

                {searchUser.length >= 3 && (
                  <div className={styles.searchResults}>
                    <p className={styles.resultMeta}>
                      {matches.length} {matches.length === 1 ? "user" : "users"}{" "}
                      found
                    </p>
                    <div className={styles.matchList}>
                      {matches.map((match: string) => (
                        <div key={match} className={styles.matchCard}>
                          <div className={styles.matchInfo}>
                            <div className={styles.avatar}>
                              {match.charAt(0).toUpperCase()}
                            </div>
                            <span>{match}</span>
                          </div>
                          <button
                            className={styles.actionButton}
                            onClick={() =>
                              console.log("Chat mit", match, "starten")
                            }
                          >
                            Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
