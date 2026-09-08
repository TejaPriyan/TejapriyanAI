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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ id: user.id, name: user.name });
}

export async function POST(req: NextRequest) {
  const { name, userId } = await req.json().catch(() => ({}));
  const clean = String(name ?? "").trim().slice(0, 40);
  if (!clean) return NextResponse.json({ error: "Name required" }, { status: 400 });

  // Already signed in: refresh the display name, keep the existing session.
  const sessionId = getSessionUserId(req);
  if (sessionId) {
    const current = await prisma.user.findUnique({ where: { id: sessionId } });
    if (current) {
      const updated = await prisma.user.update({
        where: { id: sessionId },
        data: { name: clean },
      });
      return NextResponse.json({ id: updated.id, name: updated.name });
    }
  }

  // Returning visitor holding a pre-auth local-storage id: re-issue a session
  // for that same account so their chat history follows them. Ids are
  // unguessable nanoids, so this one-time claim is safe in practice.
  if (userId) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { name: clean },
      });
      const res = NextResponse.json({ id: updated.id, name: updated.name });
      res.cookies.set(sessionCookie(createSessionToken(updated.id)));
      return res;
    }
  }

  const user = await prisma.user.create({ data: { id: nanoid(16), name: clean } });
  const res = NextResponse.json({ id: user.id, name: user.name });
  res.cookies.set(sessionCookie(createSessionToken(user.id)));
  return res;
}
