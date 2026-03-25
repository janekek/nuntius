import { Status } from "../../../frontend/src/shared/Status";

export function handleLogout(req: any, res: any) {
  req.session.destroy((err: any) => {
    if (err) {
      console.error("Fehler beim Löschen der Session:", err);
      return res.json(Status.ERROR);
    }
    res.clearCookie("connect.sid");
    return res.json(Status.OK);
  });
}
