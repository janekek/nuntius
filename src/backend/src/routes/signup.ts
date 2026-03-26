import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Status } from "../../../frontend/src/shared/Status";
import {
  generateResponse,
  sendResponse,
} from "../../../frontend/src/shared/ServerResponse";
import { createUser, isUsernameTaken } from "../../database/databaseOperations";
import { EnhancedUser } from "../../../frontend/src/shared/types";

export async function handleSignUp(req: Request, res: Response) {
  if (req.session.loggedIn) {
    return sendResponse<String>(res, Status.USER_LOGGED_IN, "");
  }

  const { username, password, password2 } = req.body;

  try {
    if (!username || username.length <= 3) {
      return sendResponse<String>(res, Status.USERNAME_TOO_SHORT, "");
    }

    if (isUsernameTaken(username)) {
      return sendResponse<String>(res, Status.USERNAME_TAKEN, "");
    }

    if (password === password2) {
      return sendResponse<String>(res, Status.PASSWORDS_MATCH, "");
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user: EnhancedUser = {
      username: username,
      password_hash: hashedPassword,
      public_key: "",
    };

    createUser(user);
    return generateResponse(res, Status.OK, "");
  } catch (error) {
    console.error("Signup Fehler:", error);
    return generateResponse(res, Status.ERROR, "");
  }
}
