/**
 * session.ts — stateless, signed session cookies.
 *
 * The client NEVER tells the server who it is; identity is read from an
 * httpOnly cookie whose value is `${userId}.${expiry}.${hmac}`. Tampering
 * with the cookie (or the old client-supplied `userId` field) is therefore
 * useless: every API route derives the user from `getSessionUserId(req)`.
 *
 * Sessions last 30 days. No DB writes, no session table, revocation by
 * rotating AUTH_SECRET (which invalidates every cookie at once).
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "tp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

let warnedAboutSecret = false;
function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (!warnedAboutSecret) {
    console.warn(
      "[session] AUTH_SECRET is not set — using an insecure dev fallback. " +
        "Generate one (e.g. `openssl rand -hex 32`) and put it in .env before going live."
    );
    warnedAboutSecret = true;
  }
  return "tp-insecure-dev-fallback-secret";
}

function hmac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Mint a session token for a user id. */
export function createSessionToken(userId: string): string {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${userId}.${expires}`;
  return `${payload}.${hmac(payload)}`;
}

/** Verify a token → the userId it was issued for, or null. */
export function verifySessionToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(userId)) return null;
  const expected = hmac(`${userId}.${expires}`);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return null;
  return userId;
}

/** The authenticated user id for a request (from the session cookie), or null. */
export function getSessionUserId(req: NextRequest): string | null {
  return verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
}

/** Cookie attributes for `NextResponse.cookies.set(...)`. */
export function sessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
