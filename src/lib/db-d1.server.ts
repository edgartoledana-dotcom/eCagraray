import type { DatabaseSchema } from "./db.server";

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  run(): Promise<any>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

const STORE_KEY = "main";

async function getD1(): Promise<D1Database | null> {
  try {
    const specifier = "cloudflare:workers";
    const { env } = await import(/* @vite-ignore */ specifier);
    return (env as { DB?: D1Database }).DB ?? null;
  } catch {
    return null;
  }
}

export async function readFromD1(): Promise<DatabaseSchema | null> {
  const db = await getD1();
  if (!db) return null;

  const row = await db
    .prepare("SELECT value FROM app_data WHERE key = ?")
    .bind(STORE_KEY)
    .first<{ value: string }>();

  if (!row?.value) return null;
  return JSON.parse(row.value) as DatabaseSchema;
}

export async function writeToD1(database: DatabaseSchema) {
  const db = await getD1();
  if (!db) throw new Error("D1 database binding not available");

  await db
    .prepare(
      `INSERT INTO app_data (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
    )
    .bind(STORE_KEY, JSON.stringify(database))
    .run();
}

export async function isD1(): Promise<boolean> {
  const db = await getD1();
  return db !== null;
}
