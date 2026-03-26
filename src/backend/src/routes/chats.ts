import { Request, Response } from "express";
import { Status } from "../../../frontend/src/shared/Status";
import { getAllFullChatsOfUser } from "../../database/databaseOperations";
import { generateResponse } from "../../../frontend/src/shared/ServerResponse";

export async function handleChats(req: Request, res: Response) {
  const currentUser: string = req.session.username!;
  const userChats = getAllFullChatsOfUser(currentUser);

  return generateResponse(res, Status.OK, {
    username: currentUser,
    chats: userChats,
  });
}
