import { useEffect, useState } from "react";
import styles from "./chatPageSettings.module.css";
import Input from "../../components/input/Input";
import type { NavigateFunction } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { callAPI } from "../../utils/apiClient";
import { Status } from "../../shared/Status";
import type ServerResponse from "../../shared/ServerResponse";
import LoadingPage from "../LoadingPage";
import SearchUserComponent from "../../components/searchUserComponent/searchUserComponent";

export default function ChatPageSettings({
  navigator,
  setToastMsg,
  chat_id,
  currentUsername,
}: {
  navigator: NavigateFunction;
  setToastMsg: React.Dispatch<React.SetStateAction<string>>;
  chat_id: number;
  currentUsername: string;
}) {
  const [sendReadReceipts, setSendReadReceipts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(chat_id);
    const response = callAPI<ServerResponse<{ send_read_receipts: boolean }>>(
      "/settingsChat",
      {
        method: "POST",
        body: JSON.stringify({ chat_id: chat_id }),
      },
    );
    response.then((res) => {
      console.log("hier kommt kurt");
      console.log(res);
      switch (res.status.code) {
        case Status.OK.code:
          setSendReadReceipts(res.content.send_read_receipts);
          setIsLoading(false);
          return;
        default:
          console.log("Error in loading settings.");
          setIsLoading(false);
      }
    });
  }, []);

  const handleAddUser = (userToAdd: string) => {
    //TODO
  };

  const handleLeaveChat = () => {
    // TODO
  };

  const toggleReceiptsMutation = useMutation({
    mutationFn: async (
      send_read_receipts: boolean,
    ): Promise<ServerResponse<any>> =>
      callAPI("/receiptsChat", {
        method: "PUT",
        body: JSON.stringify({
          send_read_receipts,
          chat_id: chat_id,
        }),
      }),
    onSuccess: (response) => {
      switch (response.status.code) {
        case Status.OK.code:
          setSendReadReceipts(!sendReadReceipts);
          setToastMsg("Lesebestätigung für diesen Chat aktualisiert.");
          return;
        default:
          console.log("An error occured while changing sendReadReceipts-state");
      }
    },
  });

  const handleToggleReceipts = () => {
    toggleReceiptsMutation.mutate(!sendReadReceipts);
  };

  useEffect(() => {
    console.log(chat_id);
    const response = callAPI<ServerResponse<{ send_read_receipts: boolean }>>(
      "/settingsChat",
      {
        method: "POST",
        body: JSON.stringify({ chat_id: chat_id }),
      },
    );
    response.then((res) => {
      console.log("hier kommt kurt");
      console.log(res);
      switch (res.status.code) {
        case Status.OK.code:
          setSendReadReceipts(res.content.send_read_receipts);
          setIsLoading(false);
          return;
        default:
          console.log("Error in loading settings.");
          setIsLoading(false);
      }
    });
  }, []);

  if (isLoading) return <LoadingPage />;

  return (
    <>
      <div className={styles.chatSettingsView}>
        {/* Setting 1: Read Receipts */}
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <h2 className={styles.settingTitle}>Lesebestätigungen</h2>
            <p className={styles.settingDesc}>
              Sende "Gelesen"-Haken in diesem Chat.
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={sendReadReceipts}
              onChange={handleToggleReceipts}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.divider}></div>

        {/* Setting 2: Nutzer hinzufügen */}
        <div className={styles.settingItemColumn}>
          <div className={styles.settingInfo}>
            <h2 className={styles.settingTitle}>Nutzer hinzufügen</h2>
            <p className={styles.settingDesc}>
              Suche nach einem Nutzernamen, um ihn in diesen Chat einzuladen.
            </p>
          </div>
          <SearchUserComponent
            username={""}
            onClick={(match) => handleAddUser(match.username)}
          />
        </div>

        <div className={styles.divider}></div>

        {/* Setting 3: Danger Zone */}
        <div className={styles.settingItemDanger}>
          <div className={styles.settingInfo}>
            <h2 className={styles.settingTitleDanger}>Chat verlassen</h2>
            <p className={styles.settingDesc}>
              Du wirst aus dieser Unterhaltung entfernt.
            </p>
          </div>
          <button className={styles.dangerBtn} onClick={handleLeaveChat}>
            Verlassen
          </button>
        </div>
      </div>
    </>
  );
}
