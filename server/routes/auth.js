import { Router } from "express";
import { createSession, pinMatches, requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const pin = String(req.body?.pin ?? "").trim();
  if (!pinMatches(pin)) {
    return res.status(403).json({ message: "Wrong password. Try again." });
  }
  res.json(createSession());
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, expiresAt: req.session.exp });
});

export default router;
