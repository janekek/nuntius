import fs from "fs/promises";
import path from "path";
import { Status, StatusDetail } from "../../../frontend/src/shared/Status";

declare module "express-session" {
  interface SessionData {
    loggedIn: boolean;
    username: string;
  }
}

export async function addChatMessageToDatabase(
  session: any,
  msg: string,
  chatID: string,
): Promise<StatusDetail> {
  if (!session.loggedIn) {
    return Status.USER_NOT_LOGGED_IN;
  }

  const sender = session.username;
  const chatsPath = path.join(__dirname, "../../database/chats.json");

  try {
    const fileContent = await fs.readFile(chatsPath, "utf-8");
    const data = JSON.parse(fileContent);

    for (const chat of data.chats) {
      if (chat.chatID === chatID) {
        if (chat.usernames.includes(sender)) {
          const newMsg = {
            sender: sender,
            text: msg,
            timestamp: new Date()
              .toISOString()
              .replace("T", " ")
              .substring(0, 19), // YYYY-MM-DD HH:mm:ss
          };

          chat.messages.push(newMsg);

          // Datei überschreiben (entspricht f.seek(0) + f.truncate())
          await fs.writeFile(chatsPath, JSON.stringify(data, null, 2), "utf-8");

          return Status.OK;
        } else {
          return Status.USER_NOT_PART_OF_CHAT;
        }
      }
    }
    return Status.CHAT_NOT_FOUND;
  } catch (error) {
    console.error("Datenbankfehler:", error);
    return Status.ERROR;
  }
}
