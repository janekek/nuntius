export interface EnhancedUser {
  username: string;
  password_hash: string;
  public_key: string;
}

export interface Chat {
  id: number;
  chat_name: string;
}

export interface ChatParticipant {
  chat_id: number;
  username: string;
}

export interface Message {
  id?: number;
  chat_id?: number;
  sender_username: string;
  content: string;
  timestamp: string;
}

export interface FullChat {
  chat_id: number;
  chat_name: string | null;
  participants: string[];
  messages: Message[];
}
