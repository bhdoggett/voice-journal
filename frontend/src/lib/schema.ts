import { boolean, customType, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// pgvector custom column type
const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(",").map(Number);
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
});

const ts = (name: string) => timestamp(name, { mode: "string" });

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  createdAt: ts("createdAt").notNull().defaultNow(),
  updatedAt: ts("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: ts("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: ts("createdAt").notNull().defaultNow(),
  updatedAt: ts("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: ts("accessTokenExpiresAt"),
  refreshTokenExpiresAt: ts("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("createdAt").notNull().defaultNow(),
  updatedAt: ts("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expiresAt").notNull(),
  createdAt: ts("createdAt").notNull().defaultNow(),
  updatedAt: ts("updatedAt").notNull().defaultNow(),
});

export const journalEntry = pgTable("journal_entry", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

// One embedding per journal entry (768 dims = Gemini text-embedding-004)
export const entryEmbedding = pgTable("entry_embedding", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  entryId: text("entry_id")
    .notNull()
    .references(() => journalEntry.id, { onDelete: "cascade" }),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

// Extracted themes per entry (denormalized for fast aggregation)
export const entryTheme = pgTable("entry_theme", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  entryId: text("entry_id")
    .notNull()
    .references(() => journalEntry.id, { onDelete: "cascade" }),
  theme: text("theme").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});
