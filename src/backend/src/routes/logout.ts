import { generateResponse } from "../../../frontend/src/shared/ServerResponse";
import { Status } from "../../../frontend/src/shared/Status";

export function handleLogout(req: any, res: any) {
  req.session.destroy((err: any) => {
    if (err) {
      console.error("Fehler beim Löschen der Session:", err);
      return generateResponse(
        res,
        Status.ERROR,
        "An error occured while logging out.",
      );
    }
    res.clearCookie("connect.sid");
    return generateResponse(res, Status.OK, "");
  });
}
