import crypto from "crypto";
import { Status } from "../../../frontend/src/shared/Status";
import { checkCredentials } from "../../database/databaseOperations";
import { generateResponse } from "../../../frontend/src/shared/ServerResponse";

function checkLoginData(username: string, password: string): boolean {
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  return checkCredentials(username, hashedPassword);
}

export async function handleLogin(req: any, res: any) {
  const { username, password } = req.body;
  if (checkLoginData(username, password)) {
    req.session.loggedIn = true;
    req.session.username = username;
    return generateResponse(res, Status.OK, "");
  } else {
    return generateResponse(
      res,
      Status.LOGIN_USERNAME_OR_PASSWORD_INCORRECT,
      "",
    );
  }
}
