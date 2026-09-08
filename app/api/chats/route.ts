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
}

export async function POST(req: NextRequest) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 401 });
  const chat = await prisma.chat.create({ data: { userId } });
  return NextResponse.json({ chat: { id: chat.id, title: chat.title, updatedAt: chat.updatedAt } });
}
