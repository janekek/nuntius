import { Request, Response } from "express";
// Angenommen, getChats ist in deiner chats.ts exportiert
import { getChats } from "./chats";
import { Status } from "../../../frontend/src/shared/Status";

export async function handleSingleChat(req: Request, res: Response) {
  const currentUser = req.session.username;
  const chatID = req.params.chatID;

  const allChats = await getChats();
  const chat = allChats.find((c) => c.chatID === chatID);

  if (!chat) {
    return res.json({ status: Status.CHAT_NOT_FOUND });
  }

  if (!chat.usernames.includes(currentUser)) {
    return res.json({
      status: Status.USER_NOT_PART_OF_CHAT,
    });
  }

  return res.json({
    status: Status.OK,
    content: {
      username: currentUser,
      chat: chat,
    },
  });
}
