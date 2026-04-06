export interface EnhancedUser {
  username: string;
  password_hash: string;
  public_key: string;
  color_id: number;
}

export interface Chat {
  id: number;
  chat_name: string;
}

export interface ChatParticipant {
  username: string;
  last_read_message_id: number;
  color_id: number;
}

export interface Message {
  id: number;
  chat_id?: number;
  sender_username: string;
  content: string;
  timestamp: string;
}

export interface FullChat {
  chat_id: number;
  chat_name: string | null;
  participants: ChatParticipant[];
  messages: Message[];
  last_read_message_id: number;
  unread_count: number;
}
