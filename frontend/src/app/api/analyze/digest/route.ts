import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalEntry } from "@/lib/schema";
import { generateDigest } from "@/lib/gemini";
import { and, eq, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { period } = await request.json() as { period: "week" | "month" };
  const days = period === "week" ? 7 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const entries = await db
    .select()
    .from(journalEntry)
    .where(
      and(
        eq(journalEntry.userId, session.user.id),
        gte(journalEntry.createdAt, since)
      )
    );

  if (entries.length === 0) {
    return NextResponse.json({ digest: "No entries found for this period." });
  }

  try {
    const digest = await generateDigest(
      entries.map((e) => e.text),
      period === "week" ? "week" : "month"
    );
    return NextResponse.json({ digest });
  } catch (err) {
    console.error("Digest error:", err);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
