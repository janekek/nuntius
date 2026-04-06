import { useEffect, useState } from "react";
import styles from "./searchUserComponent.module.css";
import type { SearchMatch } from "../../shared/ServerResponse";
import { UserColor } from "../../shared/colors";
import { callAPI } from "../../utils/apiClient";
import type ServerResponse from "../../shared/ServerResponse";
import { useMutation } from "@tanstack/react-query";
import Input from "../input/Input";

export default function SearchUserComponent({
  onClick,
  username,
}: {
  onClick: (match: SearchMatch) => any;
  username: string;
}) {
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [searchUser, setSearchUser] = useState("");

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
    if (searchUser.length >= 3) {
      mutation.mutate();
    } else {
      setMatches([]); // Clear matches if input is too short
    }
  }, [searchUser]);

  return (
    <>
      <div className={styles.searchContainer}>
        <Input
          type="text"
          placeholder="Search user ..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
        />
      </div>

      {searchUser.length >= 3 && (
        <div className={styles.searchResults}>
          <p className={styles.resultMeta}>
            {matches.length} {matches.length === 1 ? "user" : "users"} found
          </p>
          <div className={styles.matchList}>
            {matches.map((match: SearchMatch) => (
              <div key={match.username} className={styles.matchCard}>
                <div className={styles.matchInfo}>
                  <div
                    className={styles.avatar}
                    style={{
                      background: UserColor.getColorById(match.color_id).rgb,
                    }}
                  >
                    {match.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{match.username}</span>
                </div>
                <button
                  className={styles.actionButton}
                  onClick={() => onClick(match)}
                >
                  Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
