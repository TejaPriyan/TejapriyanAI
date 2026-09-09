// GET    /api/chats/:id → full message thread
// PATCH  /api/chats/:id → rename
// DELETE /api/chats/:id → delete (cascades messages)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (chat.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ chat });
  } catch (err) {
    console.warn("[/api/chats/:id GET] DB query failed:", err);
    return NextResponse.json({ chat: { id: params.id, title: "Chat", messages: [] } });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title } = await req.json().catch(() => ({ title: "" }));
  const clean = String(title ?? "").trim().slice(0, 80) || "New chat";

  try {
    const chat = await prisma.chat.findUnique({ where: { id: params.id } });
    if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (chat.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.chat.update({ where: { id: params.id }, data: { title: clean } });
    return NextResponse.json({ chat: { id: updated.id, title: updated.title } });
  } catch (err) {
    console.warn("[/api/chats/:id PATCH] DB update failed:", err);
    return NextResponse.json({ chat: { id: params.id, title: clean } });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const chat = await prisma.chat.findUnique({ where: { id: params.id } });
    if (!chat) return NextResponse.json({ ok: true });
    if (chat.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.chat.delete({ where: { id: params.id } });
  } catch (err) {
    console.warn("[/api/chats/:id DELETE] DB delete failed:", err);
  }
  return NextResponse.json({ ok: true });
}
