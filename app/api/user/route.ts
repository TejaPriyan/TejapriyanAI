// GET  /api/user → the session's user { id, name } (401 when signed out)
// POST /api/user → name-only onboarding: creates or re-attaches a user and
//                   issues a signed httpOnly session cookie.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { createSessionToken, getSessionUserId, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // In serverless environments where local SQLite can reset between deployments,
      // honor the signed session cookie rather than locking out the user.
      return NextResponse.json({ id: userId, name: "Friend" });
    }
    return NextResponse.json({ id: user.id, name: user.name });
  } catch (err) {
    console.warn("[/api/user GET] Database query failed, using session identity:", err);
    return NextResponse.json({ id: userId, name: "Friend" });
  }
}

export async function POST(req: NextRequest) {
  const { name, userId } = await req.json().catch(() => ({}));
  const clean = String(name ?? "").trim().slice(0, 40);
  if (!clean) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const sessionId = getSessionUserId(req);
  const targetId = sessionId || userId || nanoid(16);

  try {
    // Attempt database persistence (works in local dev & persistent servers)
    let user = await prisma.user.findUnique({ where: { id: targetId } });
    if (user) {
      user = await prisma.user.update({
        where: { id: targetId },
        data: { name: clean },
      });
    } else {
      user = await prisma.user.create({
        data: { id: targetId, name: clean },
      });
    }

    const res = NextResponse.json({ id: user.id, name: user.name });
    res.cookies.set(sessionCookie(createSessionToken(user.id)));
    return res;
  } catch (err) {
    // Serverless fallback: if SQLite is read-only (e.g. Vercel) or tables are unmigrated,
    // we NEVER hang or block the user. Issue the signed cookie with targetId directly.
    console.warn("[/api/user POST] Database write failed, falling back to stateless session:", err);
    const res = NextResponse.json({ id: targetId, name: clean });
    res.cookies.set(sessionCookie(createSessionToken(targetId)));
    return res;
  }
}
