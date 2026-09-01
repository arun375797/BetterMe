import crypto from "node:crypto";

const SESSION_MS = 4 * 60 * 60 * 1000;

// PIN is stored XOR-packed, then decoded at runtime — never as plaintext.
const PIN_XOR = 0x5a;
const PIN_ENC = [0x6b, 0x6b, 0x6f, 0x6f];

const SECRET_ENC = "YmV0dGVybWUtc2Vzc2lvbi1zaWduLWtleQ==";

function decodePin() {
  return Buffer.from(PIN_ENC.map((b) => b ^ PIN_XOR)).toString("utf8");
}

function sessionSecret() {
  return process.env.AUTH_SECRET || Buffer.from(SECRET_ENC, "base64").toString("utf8");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    crypto.timingSafeEqual(right, right);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

export function pinMatches(input) {
  return safeEqual(String(input ?? "").trim(), decodePin());
}

export function createSession() {
  const expiresAt = Date.now() + SESSION_MS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return {
    token: `${payload}.${sig}`,
    expiresAt,
    expiresInMs: SESSION_MS,
  };
}

export function verifySession(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!Number.isFinite(data?.exp) || Date.now() >= data.exp) return null;
  return data;
}

export function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const session = verifySession(token);
  if (!session) {
    return res.status(401).json({ message: "Session expired. Sign in again." });
  }
  req.session = session;
  next();
}
