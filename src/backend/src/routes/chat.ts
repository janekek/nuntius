import { Request, Response } from "express";
import { Status } from "../../../frontend/src/shared/Status";
import { getFullChat } from "../../database/databaseOperations";
import { generateResponse } from "../../../frontend/src/shared/ServerResponse";

export async function handleSingleChat(req: Request, res: Response) {
  const currentUser = req.session.username;
  const chat_id = req.params.chatID;

  const isNumber = (s: string): boolean =>
    s.trim() !== "" && !Number.isNaN(Number(s));

  if (Array.isArray(chat_id)) {
    return generateResponse<string>(res, Status.ERROR, "Invalid input");
  }
  if (!isNumber(chat_id)) {
    return generateResponse<string>(
      res,
      Status.ERROR,
      "chat_id is not a number",
    );
  }

  const fullChat = getFullChat(Number(chat_id));

  return generateResponse(res, Status.OK, { username: currentUser, fullChat });
}
