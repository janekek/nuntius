import type { NavigateFunction } from "react-router-dom";
import type { SilentResponse } from "../../shared/ServerResponse";
import type ServerResponse from "../../shared/ServerResponse";
import { Status } from "../../shared/Status";
import { callAPI } from "../../utils/apiClient";
import styles from "./logoutBtn.module.css";

export default function LogoutBtn({
  navigator,
  setToastMsg,
}: {
  navigator: NavigateFunction;
  setToastMsg: React.Dispatch<React.SetStateAction<string>>;
}) {
  const handleLogout = () => {
    const response = callAPI<ServerResponse<SilentResponse>>("/logout", {
      method: "GET",
    });
    response.then((res) => {
      switch (res.status.code) {
        case Status.OK.code:
          navigator("/");
          return;
        default:
          setToastMsg(res.status.msg);
      }
    });
  };

  return (
    <>
      <button className={styles.btn} onClick={handleLogout}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Logout
      </button>
    </>
  );
}
