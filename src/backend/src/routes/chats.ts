import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { Status } from "../../../frontend/src/shared/Status";

declare module "express-session" {
  interface SessionData {
    loggedIn: boolean;
    username: string;
  }
}

export async function getChats(): Promise<any[]> {
  try {
    const filePath = path.join(__dirname, "../../database/chats.json");
    const data = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(data);
    return json.chats;
  } catch (error) {
    console.error("Fehler beim Lesen der Chats:", error);
    return [];
  }
}

export async function handleChats(req: Request, res: Response) {
  const currentUser = req.session.username;
  const allChats = await getChats();
  const userChats = allChats.filter((chat) =>
    chat.usernames.includes(currentUser),
  );

  const response = {
    status: Status.OK,
    content: {
      username: currentUser,
      chats: userChats,
    },
  };

  return res.json(response);
}
