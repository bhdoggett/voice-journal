import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entryTheme } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      theme: entryTheme.theme,
      count: sql<number>`count(*)::int`,
      exampleEntryIds: sql<string[]>`array_agg(entry_id order by created_at desc)`,
    })
    .from(entryTheme)
    .where(eq(entryTheme.userId, session.user.id))
    .groupBy(entryTheme.theme)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  return NextResponse.json({ themes: rows });
}
