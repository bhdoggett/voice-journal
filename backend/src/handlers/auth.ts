import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

interface SessionRow {
  id: string;
  expires_at: Date;
  user_id: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
}

export const handler = async (event: {
  body?: string;
}): Promise<{ statusCode: number; body: string }> => {
  let token: string | undefined;
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    token = body?.token;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ valid: false, error: "Invalid request body" }) };
  }

  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ valid: false, error: "Missing token" }) };
  }

  const client = await pool.connect();
  try {
    const sessionResult = await client.query<SessionRow>(
      `SELECT id, expires_at, user_id FROM session WHERE token = $1 LIMIT 1`,
      [token]
    );

    if (sessionResult.rowCount === 0) {
      return { statusCode: 401, body: JSON.stringify({ valid: false, error: "Session not found" }) };
    }

    const session = sessionResult.rows[0];
    if (new Date(session.expires_at) < new Date()) {
      return { statusCode: 401, body: JSON.stringify({ valid: false, error: "Session expired" }) };
    }

    const userResult = await client.query<UserRow>(
      `SELECT id, name, email FROM "user" WHERE id = $1 LIMIT 1`,
      [session.user_id]
    );

    if (userResult.rowCount === 0) {
      return { statusCode: 401, body: JSON.stringify({ valid: false, error: "User not found" }) };
    }

    const user = userResult.rows[0];
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true, user: { id: user.id, name: user.name, email: user.email } }),
    };
  } finally {
    client.release();
  }
};
