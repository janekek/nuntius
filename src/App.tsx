import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./frontend/pages/login";
import Chats from "./frontend/pages/chats";
import ChatPage from "./frontend/pages/chatPage";
import Logout from "./frontend/components/logout";

import "./frontend/styles/index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/:chatID" element={<ChatPage />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </BrowserRouter>
  );
}
