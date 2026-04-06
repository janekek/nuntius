import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import CenteredVertically from "../../components/CenteredVertically";
import VerticalSpace from "../../components/VerticalSpace";
import Input from "../../components/input/Input";
import styles from "./chatsPage.module.css";
import {
  type ChatsPackage,
  type SearchMatch,
} from "../../shared/ServerResponse";
import type { FullChat } from "../../shared/types";
import { callAPI } from "../../utils/apiClient";
import type ServerResponse from "../../shared/ServerResponse";
import { UserColor } from "../../shared/colors";
import { Status } from "../../shared/Status";
import Toast from "../../components/toast/toast";
import StickyFooter from "../../components/stickyFooter/stickyFooter";
import SiteContainer from "../../components/siteContainer/siteContainer";
import SearchUserComponent from "../../components/searchUserComponent/searchUserComponent";

export default function Chats() {
  const [username, setUsername] = useState<string>("");
  const [chats, setChats] = useState<FullChat[]>([]);
  const navigate = useNavigate();
  const [searchUser, setSearchUser] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [toastMsg, setToastMsg] = useState("");

  const { data, isSuccess } = useQuery<ServerResponse<ChatsPackage>>({
    queryKey: ["page-chats", username],
    queryFn: () =>
      callAPI("/chats", {
        method: "GET",
      }),
  });

  const mutation = useMutation({
    mutationFn: async (): Promise<ServerResponse<{ result: SearchMatch[] }>> =>
      callAPI("/searchUser", {
        method: "POST",
        body: JSON.stringify({ searchUser, username }),
      }),
    onSuccess: (response: ServerResponse<{ result: SearchMatch[] }>) => {
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

  const createChatMutation = useMutation({
    mutationFn: async (
      chat_username: string,
    ): Promise<ServerResponse<{ chat_id: string }>> =>
      callAPI("/createChat", {
        method: "POST",
        body: JSON.stringify({
          chat_name: "",
          participants: [username, chat_username],
        }),
      }),
    onSuccess: (res) => {
      switch (res.status.code) {
        case Status.OK.code:
          const chat_id = res.content.chat_id;
          navigate(`/chats/${chat_id}`);
          return;
        case Status.CHAT_ALREADY_EXISTS.code:
          console.log("big cock");
          setToastMsg(res.status.msg);
          return;
        default:
          setToastMsg(res.status.msg);
      }
    },
    onError: (error) => {
      console.error("Fehler beim Erstellen des Chats:", error);
    },
  });

  function startChatWith(username: string) {
    JSON.stringify({
      chat_name: "",
      participants: [username, "test"],
    });

    createChatMutation.mutate(username);
  }

  return (
    <SiteContainer>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
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

              <VerticalSpace height="40px" />

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
                        {chat.unread_count > 0 && (
                          <span className={styles.buttonBadge}>
                            {chat.unread_count}
                          </span>
                        )}

                        <div className={styles.chatInfo}>
                          <div className={styles.avatarGroup}>
                            {chat.participants.slice(0, 2).map((p, i) => (
                              <div
                                key={i}
                                className={styles.avatar}
                                style={{
                                  background: UserColor.getColorById(p.color_id)
                                    .rgb,
                                }}
                              >
                                {p.username.charAt(0).toUpperCase()}
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
                              {chat.participants
                                .map((p) => p.username)
                                .join(", ")}
                            </span>
                            <span className={styles.chatIdLabel}>
                              ID: {chat.chat_id}
                            </span>
                            <span className={styles.chatIdLabel}> </span>
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

                <SearchUserComponent
                  username={username}
                  onClick={(match) => startChatWith(match.username)}
                />
              </div>
            </>
          }
        />
      </div>
      <StickyFooter
        navigator={navigate}
        setToastMsg={setToastMsg}
        settingsBtnActive={false}
        settingsBtnOnClick={() => navigate("/settings")}
        maxWidth="600px"
      />
    </SiteContainer>
  );
}
