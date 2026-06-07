import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

let db: Database.Database | null = null;

function getDbPath(): string {
  return path.resolve(process.cwd(), "data", "ecagraray.db");
}

export function getLocalDb(): Database.Database {
  if (db) return db;

  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run all available migrations
  runMigrations(db);

  return db;
}

function runMigrations(database: Database.Database) {
  const migrationsDir = path.resolve(process.cwd(), "migrations");
  if (!fs.existsSync(migrationsDir)) return;

  // Create migration tracking table
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      run_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    database
      .prepare("SELECT name FROM _migrations")
      .all()
      .map((r: any) => r.name),
  );

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

    // Remove PRAGMA foreign_keys lines for local SQLite (already enabled above)
    const cleanedSql = sql
      .replace(/PRAGMA foreign_keys = ON;/gi, "")
      .replace(/PRAGMA\s+foreign_keys\s*=\s*ON\s*;/gi, "");

    try {
      database.exec(cleanedSql);
      database
        .prepare("INSERT INTO _migrations (name) VALUES (?)")
        .run(file);
      console.log(`[db-local] Applied migration: ${file}`);
    } catch (err) {
      console.error(`[db-local] Migration ${file} failed:`, err);
      throw err;
    }
  }
}

export function closeLocalDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// D1-compatible query interface
export function prepare(sql: string) {
  const database = getLocalDb();
  const stmt = database.prepare(sql);

  return {
    bind(...values: any[]) {
      const boundStmt = stmt.bind(...values);
      return {
        first<T = any>(): T | null {
          const row = boundStmt.get() as T | undefined;
          return row ?? null;
        },
        all<T = any>(): T[] {
          return boundStmt.all() as T[];
        },
        run(): { meta: { changes: number; lastInsertRowid: number | bigint } } {
          const info = boundStmt.run();
          return {
            meta: {
              changes: info.changes,
              lastInsertRowid: info.lastInsertRowid,
            },
          };
        },
    raw(): any[][] {
      return (boundStmt.raw() as unknown) as any[][];
    },
    iterate(): IterableIterator<any> {
          return boundStmt.iterate();
        },
      };
    },
    first<T = any>(...values: any[]): T | null {
      const row = stmt.get(...values) as T | undefined;
      return row ?? null;
    },
    all<T = any>(...values: any[]): T[] {
      return stmt.all(...values) as T[];
    },
    run(...values: any[]): { meta: { changes: number; lastInsertRowid: number | bigint } } {
      const info = stmt.run(...values);
      return {
        meta: {
          changes: info.changes,
          lastInsertRowid: info.lastInsertRowid,
        },
      };
    },
  };
}
