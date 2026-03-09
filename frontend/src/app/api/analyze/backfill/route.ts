import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entryEmbedding, entryTheme, journalEntry } from "@/lib/schema";
import { generateEmbedding, extractThemes } from "@/lib/gemini";
import { and, eq, notInArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find all entry IDs that already have embeddings
  const existing = await db
    .select({ entryId: entryEmbedding.entryId })
    .from(entryEmbedding)
    .where(eq(entryEmbedding.userId, session.user.id));

  const embeddedIds = existing.map((r) => r.entryId);

  const toEmbed = embeddedIds.length > 0
    ? await db
        .select()
        .from(journalEntry)
        .where(and(eq(journalEntry.userId, session.user.id), notInArray(journalEntry.id, embeddedIds)))
    : await db
        .select()
        .from(journalEntry)
        .where(eq(journalEntry.userId, session.user.id));

  let processed = 0;

  for (const entry of toEmbed) {
    const [embedding, themes] = await Promise.all([
      generateEmbedding(entry.text),
      extractThemes(entry.text),
    ]);

    await db.insert(entryEmbedding).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      entryId: entry.id,
      embedding,
    });

    if (themes.length > 0) {
      await db.delete(entryTheme).where(eq(entryTheme.entryId, entry.id));
      await db.insert(entryTheme).values(
        themes.map((theme) => ({
          id: crypto.randomUUID(),
          userId: session.user.id,
          entryId: entry.id,
          theme,
        }))
      );
    }

    processed++;
  }

  return NextResponse.json({ ok: true, processed, total: toEmbed.length });
}
