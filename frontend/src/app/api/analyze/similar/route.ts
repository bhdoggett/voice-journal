import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entryEmbedding, journalEntry } from "@/lib/schema";
import { generateEmbedding } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entryId = request.nextUrl.searchParams.get("entryId");
  if (!entryId) return NextResponse.json({ error: "Missing entryId" }, { status: 400 });

  // Get the embedding for this entry
  const [emb] = await db
    .select()
    .from(entryEmbedding)
    .where(eq(entryEmbedding.entryId, entryId))
    .limit(1);

  if (!emb) {
    // Entry not embedded yet — generate on the fly
    const [entry] = await db
      .select()
      .from(journalEntry)
      .where(eq(journalEntry.id, entryId))
      .limit(1);
    if (!entry || entry.userId !== session.user.id) {
      return NextResponse.json({ entries: [] });
    }
    const embedding = await generateEmbedding(entry.text);
    const embStr = `[${embedding.join(",")}]`;
    const rows = await db.execute(
      sql`SELECT e.id, e.text, e.created_at as "createdAt",
               1 - (v.embedding <=> ${embStr}::vector) AS score
          FROM entry_embedding v
          JOIN journal_entry e ON e.id = v.entry_id
          WHERE v.user_id = ${session.user.id} AND v.entry_id != ${entryId}
          ORDER BY v.embedding <=> ${embStr}::vector
          LIMIT 5`
    );
    return NextResponse.json({ entries: rows.rows });
  }

  const embStr = `[${(emb.embedding as number[]).join(",")}]`;
  const rows = await db.execute(
    sql`SELECT e.id, e.text, e.created_at as "createdAt",
             1 - (v.embedding <=> ${embStr}::vector) AS score
        FROM entry_embedding v
        JOIN journal_entry e ON e.id = v.entry_id
        WHERE v.user_id = ${session.user.id} AND v.entry_id != ${entryId}
        ORDER BY v.embedding <=> ${embStr}::vector
        LIMIT 5`
  );

  return NextResponse.json({ entries: rows.rows });
}
