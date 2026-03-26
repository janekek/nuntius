import { Status, StatusDetail } from "../../../frontend/src/shared/Status";
import { addMessageToChat } from "../../database/databaseOperations";

export function addChatMessageToDatabase(
  session: any,
  msg: string,
  chat_id: number,
): StatusDetail {
  if (!session.loggedIn) {
    return Status.USER_NOT_LOGGED_IN;
  }
  const sender = session.username;
  console.log(sender);
  console.log(chat_id);
  console.log(msg);
  addMessageToChat(chat_id, sender, msg);
  return Status.OK;
}
