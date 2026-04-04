import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import styles from "./settingsPage.module.css";
import { UserColor } from "../../shared/colors";
import type ServerResponse from "../../shared/ServerResponse";
import { Status } from "../../shared/Status";
import { callAPI } from "../../utils/apiClient";
import Toast from "../../components/toast/toast";
import PageContainer from "../../components/pageContainer/pageContainer";
import Footer from "../../components/footer/footer";
import LoadingPage from "../LoadingPage";
import SiteContainer from "../../components/siteContainer/siteContainer";
import MainMiddleComponent from "../../components/mainMiddleComponent/mainMiddleComponent";
import type { SilentResponse } from "../../shared/ServerResponse";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [activeColorId, setActiveColorId] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const allColors = UserColor.getAllColors();

  const navigator = useNavigate();

  useEffect(() => {
    try {
      const response = callAPI<
        ServerResponse<{
          color_id: number;
          send_read_receipt_default: boolean;
        }>
      >("/settings", {
        method: "GET",
      });
      response.then((res) => {
        console.log(res);
        if (res.status.code === Status.OK.code) {
          setActiveColorId(res.content.color_id);
          console.log(res.content.send_read_receipt_default);
          setReadReceipts(res.content.send_read_receipt_default);
        }
        setIsLoading(false);
      });
    } catch {
      setIsLoading(false);
    }
  }, []);

  const toggleReceiptsMutation = useMutation({
    mutationFn: async (
      send_read_receipts_default: boolean,
    ): Promise<ServerResponse<any>> =>
      callAPI("/receipts", {
        method: "PUT",
        body: JSON.stringify({
          send_read_receipts_default,
        }),
      }),
    onSuccess: (response) => {
      if (response?.status.code === Status.OK.code) {
        setToastMsg("Read receipts successfully updated.");
      }
    },
  });

  const changeColorMutation = useMutation({
    mutationFn: async (color_id: number): Promise<ServerResponse<any>> =>
      callAPI("/color", {
        method: "PUT",
        body: JSON.stringify({ color_id }),
      }),
    onSuccess: (response) => {
      if (response?.status.code === Status.OK.code) {
        setToastMsg("Color successfully changed!");
      }
    },
  });

  const handleToggleReceipts = () => {
    const newValue = !readReceipts;
    setReadReceipts(newValue);
    toggleReceiptsMutation.mutate(newValue);
  };

  const handleColorSelect = (id: number) => {
    setActiveColorId(id);
    changeColorMutation.mutate(id);
  };

  const handleDeleteAccount = () => {
    const call = callAPI<ServerResponse<SilentResponse>>("/user/delete", {
      method: "POST",
    });
    call.then((res) => {
      if (res.status.code === Status.OK.code) {
        //sendToast TODO
        navigator("/");
      }
    });
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <SiteContainer>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <MainMiddleComponent
        title="Settings"
        subtitle="Manage your preferences and privacy."
        maxWidth="500px"
        footer={
          <>
            Go back to chats <Link to="/chats">here.</Link>
          </>
        }
      >
        <div className={styles.settingsList}>
          {/* SETTING 1: Read Receipts */}
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h2 className={styles.settingTitle}>Read Receipts (Default)</h2>
              <p className={styles.settingDesc}>
                Send read receipts for new chats. Can be overridden on a
                per-chat basis.
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={readReceipts}
                onChange={handleToggleReceipts}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {/* SETTING 2: Main Color */}
          <div className={styles.settingItemColor}>
            <div className={styles.settingInfo}>
              <h2 className={styles.settingTitle}>Profile Color</h2>
              <p className={styles.settingDesc}>
                Customize the look and feel of Nuntius.
              </p>
            </div>
            <div className={styles.colorPicker}>
              {allColors.map((color) => (
                <button
                  key={color.id}
                  className={`${styles.colorSwatch} ${activeColorId === color.id ? styles.activeSwatch : ""}`}
                  style={{ backgroundColor: color.rgb }}
                  onClick={() => handleColorSelect(color.id)}
                  title={color.name}
                ></button>
              ))}
            </div>
          </div>

          {/* SETTING 3: Danger Zone */}
          <div className={styles.settingItemDanger}>
            <div className={styles.settingInfo}>
              <h2 className={styles.settingTitleDanger}>Danger Zone</h2>
              <p className={styles.settingDesc}>
                Permanently delete your account. All messages will be lost.
              </p>
            </div>
            <button className={styles.dangerBtn} onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        </div>
      </MainMiddleComponent>
    </SiteContainer>
  );
}
