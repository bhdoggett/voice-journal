import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entryEmbedding, entryTheme, journalEntry } from "@/lib/schema";
import { generateEmbedding, extractThemes } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await request.json() as { entryId: string };
  if (!entryId) return NextResponse.json({ error: "Missing entryId" }, { status: 400 });

  const [entry] = await db
    .select()
    .from(journalEntry)
    .where(eq(journalEntry.id, entryId))
    .limit(1);

  if (!entry || entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [embedding, themes] = await Promise.all([
    generateEmbedding(entry.text),
    extractThemes(entry.text),
  ]);

  // Upsert embedding (delete + insert to handle re-runs)
  await db.delete(entryEmbedding).where(eq(entryEmbedding.entryId, entryId));
  await db.insert(entryEmbedding).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    entryId,
    embedding,
  });

  // Replace themes
  await db.delete(entryTheme).where(eq(entryTheme.entryId, entryId));
  if (themes.length > 0) {
    await db.insert(entryTheme).values(
      themes.map((theme) => ({
        id: crypto.randomUUID(),
        userId: session.user.id,
        entryId,
        theme,
      }))
    );
  }

  return NextResponse.json({ ok: true, themes });
}
