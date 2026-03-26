import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import sessionFileStore from "session-file-store";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { handleLogin } from "./routes/login";
import { handleLogout } from "./routes/logout";
import { handleChats } from "./routes/chats";
import { handleSingleChat } from "./routes/chat";
import { handleSignUp } from "./routes/signup";
import { addChatMessageToDatabase } from "./chat/receiveChat";
import { Status } from "../../frontend/src/shared/Status";
import { addMessageToChat, run_sql_code } from "../database/databaseOperations";
import { generateResponse } from "../../frontend/src/shared/ServerResponse";
import { Message } from "../../frontend/src/shared/types";

declare module "express-session" {
  interface SessionData {
    loggedIn: boolean;
    username: string;
  }
}

const app = express();
const server = http.createServer(app);
const FileStore = sessionFileStore(session);

const sessionMiddleware = session({
  store: new FileStore({
    path: "./sessions",
    retries: 0,
  }),
  secret: "verySecretKey",
  resave: false,
  saveUninitialized: false, // Auf false setzen, um Müll-Sessions zu vermeiden
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24, // 24 hrs
  },
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.json({ status: Status.USER_NOT_LOGGED_IN });
  }
};

// API Routes
app.post("/api/login", handleLogin);
app.post("/api/signup", handleSignUp);
app.post("/api/logout", handleLogout);
app.get("/api/chats", requireAuth, handleChats);
app.get("/api/chat/:chatID", requireAuth, handleSingleChat);

app.get("/api/database", (req: any, res: any) => {
  const { command, password } = req.body;
  const response = run_sql_code(command);
  generateResponse(res, Status.OK, response);
});

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});
io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", (data: { chatID: string }) => {
    socket.join(data.chatID);
    console.log(`User ${socket.id} ist Raum ${data.chatID} beigetreten`);
  });

  socket.on("sendMessage", async (data: { chatID: string; msg: string }) => {
    const session = (socket.request as any).session;
    if (!session || !session.loggedIn) {
      return socket.emit("error", { message: "Nicht authentifiziert" });
    }
    console.log("Eingeloggt als:", session.loggedIn);

    const result = addChatMessageToDatabase(
      session,
      data.msg,
      Number(data.chatID),
    );

    if (result.code === Status.OK.code) {
      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);

      const message: Message = {
        content: data.msg,
        sender_username: session.username,
        timestamp: timestamp,
      };

      io.to(data.chatID + "").emit("receiveMessage", {
        status: result.msg,
        message,
      });
    } else {
      socket.emit("error", { message: result.msg });
    }
  });
});

app.get("/", (req, res) => {
  res.send("Nuntius API is running.");
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
