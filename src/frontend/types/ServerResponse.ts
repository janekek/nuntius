import type { Chat } from "./chat";

export interface ServerResponse<T> {
  status: number;
  content: T;
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
