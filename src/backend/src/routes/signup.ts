import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Status } from "../../../frontend/src/shared/Status";
import ServerResponse, {
  sendResponse,
} from "../../../frontend/src/shared/ServerResponse";

export async function handleSignUp(req: Request, res: Response) {
  if (req.session.loggedIn) {
    return res.json(Status.USER_LOGGED_IN);
  }

  const { username, password, password2 } = req.body;
  const usersPath = path.join(__dirname, "../../database/users.json");

  try {
    const fileData = await fs.readFile(usersPath, "utf-8");
    const users: any[] = JSON.parse(fileData);

    const userExists = users.some((u) => u.username === username);
    if (userExists) {
      return sendResponse<String>(res, Status.USERNAME_TAKEN, "");
    }

    if (!username || username.length <= 3) {
      return sendResponse<String>(res, Status.USERNAME_TOO_SHORT, "");
    }

    if (password === password2) {
      return sendResponse<String>(res, Status.PASSWORDS_MATCH, "");
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const newUser = {
      username: username,
      password: hashedPassword,
    };

    users.push(newUser);

    await fs.writeFile(usersPath, JSON.stringify(users, null, 4), "utf-8");

    return sendResponse<String>(res, Status.OK, "");
  } catch (error) {
    console.error("Signup Fehler:", error);
    return sendResponse<String>(res, Status.ERROR, "");
  }
}
