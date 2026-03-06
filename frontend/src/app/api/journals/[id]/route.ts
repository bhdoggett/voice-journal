import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalEntry } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { text } = await request.json();

  await db
    .update(journalEntry)
    .set({ text, updatedAt: new Date().toISOString() })
    .where(and(eq(journalEntry.id, id), eq(journalEntry.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .delete(journalEntry)
    .where(and(eq(journalEntry.id, id), eq(journalEntry.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
