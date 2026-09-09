// GET  /api/chats       → chat list for the sidebar (optional ?q= search)
// POST /api/chats       → create an empty chat
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q")?.trim();

  try {
    // Search mode: match chat titles or any message body.
    const where = q
      ? {
          userId,
          OR: [
            { title: { contains: q } },
            { messages: { some: { content: { contains: q } } } },
          ],
        }
      : { userId };

    const chats = await prisma.chat.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
      take: 200,
    });
    return NextResponse.json({ chats });
  } catch (err) {
    console.warn("[/api/chats GET] DB query failed, returning empty list:", err);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({ data: { id: userId, name: "Friend" } }).catch(() => null);
    }
    const chat = await prisma.chat.create({ data: { userId } });
    return NextResponse.json({ chat: { id: chat.id, title: chat.title, updatedAt: chat.updatedAt } });
  } catch (err) {
    console.warn("[/api/chats POST] DB write failed, returning ephemeral chat id:", err);
    const fallbackId = `chat_${Date.now()}`;
    return NextResponse.json({ chat: { id: fallbackId, title: "New chat", updatedAt: new Date() } });
  }
}
