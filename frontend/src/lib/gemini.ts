import "server-only";

const THEME_LIST = [
  "relationships", "work", "creativity", "health", "sleep", "family",
  "friendship", "grief", "gratitude", "uncertainty", "growth", "loss",
  "anxiety", "joy", "purpose", "identity", "spirituality", "finances",
  "nature", "learning", "conflict", "self-reflection", "change", "rest",
  "communication", "fear", "accomplishment", "longing", "solitude", "play",
];

async function openai<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const data = await openai<{ data: { embedding: number[] }[] }>("embeddings", {
    model: "text-embedding-3-small",
    input: text,
  });
  return data.data[0].embedding;
}

export async function extractThemes(text: string): Promise<string[]> {
  const prompt = `You are analyzing a personal journal entry to identify themes.

Available themes: ${THEME_LIST.join(", ")}

Instructions:
- Select 1–5 themes that genuinely appear in this entry
- Only use themes from the list above, unless nothing fits — then add one "other: [brief label]"
- Do not suggest actions. Do not evaluate or judge. Do not use clinical language.
- Respond with ONLY a JSON array of strings, e.g. ["relationships", "uncertainty"]

Journal entry:
${text}`;

  const data = await openai<{ choices: { message: { content: string } }[] }>("chat/completions", {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const raw = data.choices[0].message.content.trim();
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore
  }
  return [];
}

export async function generateDigest(entries: string[], period: string): Promise<string> {
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

  const data = await openai<{ choices: { message: { content: string } }[] }>("chat/completions", {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return data.choices[0].message.content.trim();
}
