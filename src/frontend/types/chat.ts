export interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  chatID: string;
  messages: Message[];
  usernames: string[];
}
