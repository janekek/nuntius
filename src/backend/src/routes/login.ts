import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Status } from "../../../frontend/src/shared/Status";

interface User {
  username: string;
  password: string;
}

async function checkLoginData(
  username: string,
  password: string,
): Promise<boolean> {
  try {
    const filePath = path.join(__dirname, "../../database/users.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const users: User[] = JSON.parse(fileContent);

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    return users.some(
      (u) => u.username === username && u.password === hashedPassword,
    );
  } catch (error) {
    console.error("Fehler beim Lesen der User-Datei:", error);
    return false;
  }
}

export async function handleLogin(req: any, res: any) {
  const { username, password } = req.body;

  if (await checkLoginData(username, password)) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.json({ status: Status.OK });
  } else {
    return res.json({
      status: Status.LOGIN_USERNAME_OR_PASSWORD_INCORRECT,
    });
  }
}
