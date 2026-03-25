import type { Response } from "express";
import type { Chat } from "../types/chat";

export default interface ServerResponse<T> {
  status: Status;
  content: T;
}

export function sendResponse<T>(res: any, status: Status, content: T) {
  const response: ServerResponse<T> = {
    status,
    content,
  };
  res.json(response);
}

export interface Status {
  code: number;
  msg: string;
}

//ResponseTypes
export interface ChatPackage {
  username: string;
  chat: Chat;
}

export interface ChatsPackage {
  username: string;
  chats: Chat[];
}

export interface LoginPackage {}
