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
    // Falls du express-socket.io-session nutzt, hast du Zugriff auf socket.handshake.session
    // Falls nicht, übergeben wir hier ein simuliertes Session-Objekt oder nutzen die Middleware
    const session = (socket.request as any).session;

    console.log(session);
    if (!session || !session.loggedIn) {
      console.log("Fehler: Benutzer nicht eingeloggt");
      return socket.emit("error", { message: "Nicht authentifiziert" });
    }
    console.log("Eingeloggt als:", session.loggedIn);

    const result = await addChatMessageToDatabase(
      session,
      data.msg,
      data.chatID,
    );

    console.log(result);

    if (result.code === Status.OK.code) {
      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);

      io.to(data.chatID).emit("receiveMessage", {
        sender: session.username,
        text: data.msg,
        timestamp: timestamp,
        status: result.msg,
      });
    } else {
      // Optional: Dem Absender mitteilen, dass etwas schief ging
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
