import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalEntry } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entries } = await request.json() as {
    entries: { id: string; text: string; createdAt: string; updatedAt: string }[];
  };

  if (entries.length > 0) {
    await db
      .insert(journalEntry)
      .values(entries.map((e) => ({ ...e, userId: session.user.id })))
      .onConflictDoNothing();
  }

  return NextResponse.json({ ok: true });
}
