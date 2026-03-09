import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalEntry } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db
    .select()
    .from(journalEntry)
    .where(eq(journalEntry.userId, session.user.id))
    .orderBy(desc(journalEntry.createdAt));

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      text: e.text,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, text, createdAt, updatedAt } = body as {
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  };

  await db.insert(journalEntry).values({
    id,
    userId: session.user.id,
    text,
    createdAt,
    updatedAt,
  });

  // Fire-and-forget: generate embedding + themes asynchronously
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/analyze/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: JSON.stringify({ entryId: id }),
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
