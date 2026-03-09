import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/gemini";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await request.json() as { query: string };
  if (!query?.trim()) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  try {
    const embedding = await generateEmbedding(query);
    const embStr = `[${embedding.join(",")}]`;

    const rows = await db.execute(
      sql`SELECT e.id, e.text, e.created_at as "createdAt",
               1 - (v.embedding <=> ${embStr}::vector) AS score
          FROM entry_embedding v
          JOIN journal_entry e ON e.id = v.entry_id
          WHERE v.user_id = ${session.user.id}
          ORDER BY v.embedding <=> ${embStr}::vector
          LIMIT 10`
    );

    return NextResponse.json({ entries: rows.rows });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
