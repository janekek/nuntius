import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/loginPage/loginPage";
import Chats from "./pages/chatsPage/chatsPage";
import ChatPage from "./pages/chatPage/chatPage";
import Logout from "./components/logout";

import SignUpPage from "./pages/signUpPage/signUpPage";
import NavBar from "./components/navbar/NavBar";
import SettingsPage from "./pages/settingsPage/settingsPage";
import PageContainer from "./components/pageContainer/pageContainer";

export default function App() {
  return (
    <>
      <PageContainer>
        <NavBar />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/chats/:chatID" element={<ChatPage />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </BrowserRouter>
      </PageContainer>
    </>
  );
}
