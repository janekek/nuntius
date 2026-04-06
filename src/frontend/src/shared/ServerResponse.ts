import type { FullChat } from "./types";

export default interface ServerResponse<T> {
  status: Status;
  content: T;
}

export function generateResponse<T>(
  res: any,
  status: Status,
  content: T,
): ServerResponse<T> {
  return res.json({ status, content } as ServerResponse<T>);
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
  fullChat: FullChat;
}

export interface ChatsPackage {
  username: string;
  chats: FullChat[];
}

export interface SilentResponse {
  emptyString: string;
}

export interface SearchMatch {
  username: string;
  color_id: number;
}
