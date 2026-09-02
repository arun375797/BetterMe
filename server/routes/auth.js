import { Router } from "express";
import {
  clearSessionCookie,
  createSession,
  pinMatches,
  requireAuth,
  setSessionCookie,
} from "../lib/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const pin = String(req.body?.pin ?? "").trim();
  if (!pinMatches(pin)) {
    return res.status(403).json({ message: "Wrong password. Try again." });
  }
  const session = createSession();
  setSessionCookie(res, session.token);
  res.json(session);
});

router.post("/logout", requireAuth, (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, expiresAt: req.session.exp });
});

export default router;
