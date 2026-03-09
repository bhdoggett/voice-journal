import { Pool } from "pg";
import { GoogleGenAI } from "@google/genai";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
});

const aiText = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const TEXT_MODEL = "gemini-2.0-flash";

const THEME_LIST = [
  "relationships", "work", "creativity", "health", "sleep", "family",
  "friendship", "grief", "gratitude", "uncertainty", "growth", "loss",
  "anxiety", "joy", "purpose", "identity", "spirituality", "finances",
  "nature", "learning", "conflict", "self-reflection", "change", "rest",
  "communication", "fear", "accomplishment", "longing", "solitude", "play",
];

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API error ${res.status}: ${err}`);
  }
  const data = await res.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

async function extractThemes(text: string): Promise<string[]> {
  const prompt = `You are analyzing a personal journal entry to identify themes.

Available themes: ${THEME_LIST.join(", ")}

Instructions:
- Select 1–5 themes that genuinely appear in this entry
- Only use themes from the list above, unless nothing fits — then add one "other: [brief label]"
- Do not suggest actions. Do not evaluate or judge. Do not use clinical language.
- Respond with ONLY a JSON array of strings, e.g. ["relationships", "uncertainty"]

Journal entry:
${text}`;

  const response = await aiText.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts: [{ text: prompt }], role: "user" }],
  });

  const raw = response.candidates![0].content!.parts![0].text!.trim();
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore parse errors
  }
  return [];
}

async function generateDigest(entries: string[], period: string): Promise<string> {
  const combined = entries.map((e, i) => `Entry ${i + 1}:\n${e}`).join("\n\n---\n\n");
  const prompt = `You are reading a collection of personal journal entries from the past ${period}.

Instructions:
- Write a single, brief observational paragraph (3–5 sentences) describing what themes and patterns you notice
- Be purely descriptive — what the person wrote about, what topics recurred, what the writing touched on
- Do NOT suggest actions, give advice, evaluate, or use clinical/diagnostic language
- Do NOT tell the person what their patterns "mean"
- Use plain, warm language as if noting observations to yourself

Journal entries:
${combined}`;

  const response = await aiText.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts: [{ text: prompt }], role: "user" }],
  });

  return response.candidates![0].content!.parts![0].text!.trim();
}

function embStr(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

type Action = "embed" | "similar" | "themes" | "search" | "digest" | "backfill";

interface Payload {
  action: Action;
  userId: string;
  entryId?: string;
  text?: string;
  query?: string;
  period?: "week" | "month";
}

export const handler = async (event: { body?: string }): Promise<{ statusCode: number; body: string }> => {
  let payload: Payload;
  try {
    payload = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const { action, userId } = payload;
  if (!action || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing action or userId" }) };
  }

  const client = await pool.connect();
  try {
    switch (action) {
      case "embed": {
        const { entryId } = payload;
        if (!entryId) return { statusCode: 400, body: JSON.stringify({ error: "Missing entryId" }) };

        const res = await client.query(
          `SELECT text FROM journal_entry WHERE id = $1 AND user_id = $2 LIMIT 1`,
          [entryId, userId]
        );
        if (res.rowCount === 0) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

        const text = res.rows[0].text as string;
        const [embedding, themes] = await Promise.all([
          generateEmbedding(text),
          extractThemes(text),
        ]);

        await client.query(`DELETE FROM entry_embedding WHERE entry_id = $1`, [entryId]);
        await client.query(
          `INSERT INTO entry_embedding (id, user_id, entry_id, embedding) VALUES ($1, $2, $3, $4::vector)`,
          [crypto.randomUUID(), userId, entryId, embStr(embedding)]
        );

        await client.query(`DELETE FROM entry_theme WHERE entry_id = $1`, [entryId]);
        for (const theme of themes) {
          await client.query(
            `INSERT INTO entry_theme (id, user_id, entry_id, theme) VALUES ($1, $2, $3, $4)`,
            [crypto.randomUUID(), userId, entryId, theme]
          );
        }

        return { statusCode: 200, body: JSON.stringify({ ok: true, themes }) };
      }

      case "similar": {
        const { entryId } = payload;
        if (!entryId) return { statusCode: 400, body: JSON.stringify({ error: "Missing entryId" }) };

        const embRes = await client.query(
          `SELECT embedding FROM entry_embedding WHERE entry_id = $1 LIMIT 1`,
          [entryId]
        );
        if (embRes.rowCount === 0) return { statusCode: 200, body: JSON.stringify({ entries: [] }) };

        const embedding = embRes.rows[0].embedding as string;
        const rows = await client.query(
          `SELECT e.id, e.text, e.created_at as "createdAt",
                  1 - (v.embedding <=> $1::vector) AS score
           FROM entry_embedding v
           JOIN journal_entry e ON e.id = v.entry_id
           WHERE v.user_id = $2 AND v.entry_id != $3
           ORDER BY v.embedding <=> $1::vector
           LIMIT 5`,
          [embedding, userId, entryId]
        );

        return { statusCode: 200, body: JSON.stringify({ entries: rows.rows }) };
      }

      case "themes": {
        const rows = await client.query(
          `SELECT theme, count(*)::int AS count, array_agg(entry_id ORDER BY created_at DESC) AS "exampleEntryIds"
           FROM entry_theme
           WHERE user_id = $1
           GROUP BY theme
           ORDER BY count(*) DESC
           LIMIT 20`,
          [userId]
        );
        return { statusCode: 200, body: JSON.stringify({ themes: rows.rows }) };
      }

      case "search": {
        const { query } = payload;
        if (!query) return { statusCode: 400, body: JSON.stringify({ error: "Missing query" }) };

        const embedding = await generateEmbedding(query);
        const rows = await client.query(
          `SELECT e.id, e.text, e.created_at as "createdAt",
                  1 - (v.embedding <=> $1::vector) AS score
           FROM entry_embedding v
           JOIN journal_entry e ON e.id = v.entry_id
           WHERE v.user_id = $2
           ORDER BY v.embedding <=> $1::vector
           LIMIT 10`,
          [embStr(embedding), userId]
        );
        return { statusCode: 200, body: JSON.stringify({ entries: rows.rows }) };
      }

      case "digest": {
        const { period = "month" } = payload;
        const days = period === "week" ? 7 : 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const rows = await client.query(
          `SELECT text FROM journal_entry WHERE user_id = $1 AND created_at >= $2`,
          [userId, since]
        );
        if (rows.rowCount === 0) {
          return { statusCode: 200, body: JSON.stringify({ digest: "No entries found for this period." }) };
        }

        const digest = await generateDigest(rows.rows.map((r) => r.text as string), period);
        return { statusCode: 200, body: JSON.stringify({ digest }) };
      }

      case "backfill": {
        const existingRes = await client.query(
          `SELECT entry_id FROM entry_embedding WHERE user_id = $1`,
          [userId]
        );
        const embeddedIds = existingRes.rows.map((r) => r.entry_id as string);

        const entriesRes = embeddedIds.length > 0
          ? await client.query(
              `SELECT id, text FROM journal_entry WHERE user_id = $1 AND id != ALL($2)`,
              [userId, embeddedIds]
            )
          : await client.query(
              `SELECT id, text FROM journal_entry WHERE user_id = $1`,
              [userId]
            );

        let processed = 0;
        const BATCH = 10;
        const rows = entriesRes.rows as { id: string; text: string }[];

        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH);
          await Promise.all(
            batch.map(async (entry) => {
              const [embedding, themes] = await Promise.all([
                generateEmbedding(entry.text),
                extractThemes(entry.text),
              ]);
              await client.query(
                `INSERT INTO entry_embedding (id, user_id, entry_id, embedding) VALUES ($1, $2, $3, $4::vector)`,
                [crypto.randomUUID(), userId, entry.id, embStr(embedding)]
              );
              await client.query(`DELETE FROM entry_theme WHERE entry_id = $1`, [entry.id]);
              for (const theme of themes) {
                await client.query(
                  `INSERT INTO entry_theme (id, user_id, entry_id, theme) VALUES ($1, $2, $3, $4)`,
                  [crypto.randomUUID(), userId, entry.id, theme]
                );
              }
              processed++;
            })
          );
        }

        return { statusCode: 200, body: JSON.stringify({ ok: true, processed, total: rows.length }) };
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
    }
  } finally {
    client.release();
  }
};
