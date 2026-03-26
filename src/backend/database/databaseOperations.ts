import { Status } from "../../frontend/src/shared/Status";
import {
  EnhancedUser,
  FullChat,
  Message,
} from "../../frontend/src/shared/types";
import db from "./database";

//login-functions
export const checkCredentials = (
  username: string,
  password_hash: string,
): boolean => {
  const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
  const user = stmt.get(username) as EnhancedUser | undefined;
  if (!user) return false;
  return user.password_hash === password_hash;
};

//signup-functions
export const isUsernameTaken = (username: string): boolean => {
  const stmt = db.prepare("SELECT 1 FROM users WHERE username = ?");
  const result = stmt.get(username);
  return !!result;
};

export const createUser = (user: EnhancedUser): Status => {
  const stmt = db.prepare(
    "INSERT INTO users (username, password_hash, public_key) VALUES (?, ?, ?)",
  );
  stmt.run(user.username, user.password_hash, user.public_key);
  return Status.OK;
};

//chat-functions
export const createChatWithoutUsers = (chat_name: string): number => {
  const info = db.prepare("INSERT INTO chats DEFAULT VALUES").run();
  const chat_id = info.lastInsertRowid;
  return chat_id;
};

export const createChatWithUsers = (
  chat_name: string,
  users: string[],
): number => {
  const new_chat_id: number = createChatWithoutUsers(chat_name);
  for (const user of users) {
    addUserToChat(new_chat_id, user);
  }
  return new_chat_id;
};

export const addUserToChat = (chat_id: number, user: string) => {
  const stmt = db.prepare(
    "INSERT INTO chat_participants (chat_id, username) VALUES (?, ?)",
  );
  stmt.run(chat_id, user);
};

export const addMessageToChat = (
  chat_id: number,
  sender_username: string,
  content: string,
): void => {
  const stmt = db.prepare(
    "INSERT INTO messages (chat_id, sender_username, content) VALUES (?, ?, ?)",
  );
  stmt.run(chat_id, sender_username, content);
};

export const searchUsersByPrefix = (prefix: string): string[] => {
  const statement = db.prepare(
    "SELECT username from users WHERE username LIKE ?",
  );
  const rows = statement.all(prefix + "%") as { username: string }[];
  return rows.map((row) => row.username);
};

export const getUserChats = (username: string) => {
  const stmt = db.prepare(`
        SELECT c.id, c.chat_name 
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.username = ?
    `);
  return stmt.all(username) as { id: number; chat_name: string | null }[];
};

export const getChatParticipants = (chat_id: number) => {
  const stmt = db.prepare(`
        SELECT username 
        FROM chat_participants 
        WHERE chat_id = ?
    `);

  const rows = stmt.all(chat_id) as { username: string }[];
  return rows.map((row) => row.username);
};

export const getChatMessages = (chat_id: number): Message[] => {
  const stmt = db.prepare(`
        SELECT id, sender_username, content, timestamp 
        FROM messages 
        WHERE chat_id = ? 
        ORDER BY timestamp ASC
    `);

  return stmt.all(chat_id) as Message[];
};

export const getFullChat = (chat_id: number): FullChat | null => {
  const chatBase = db
    .prepare(
      `
        SELECT chat_name
        FROM chats
        WHERE id = ?
      `,
    )
    .get(chat_id) as { chat_name: string | null } | undefined;

  if (!chatBase) return null;

  const participants = getChatParticipants(chat_id);
  const messages = getChatMessages(chat_id);

  return {
    chat_id,
    chat_name: chatBase.chat_name,
    participants,
    messages,
  };
};

export const getAllFullChatsOfUser = (username: string): FullChat[] => {
  const chatBaseInfo = db
    .prepare(
      `
        SELECT c.id, c.chat_name 
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.username = ?
    `,
    )
    .all(username) as { id: number; chat_name: string | null }[];

  return chatBaseInfo.map((chat) => {
    return getFullChat(chat.id)!;
  });
};

//inject from outside
export const run_sql_code = (code: string) => {
  return db.prepare(code).all();
};
