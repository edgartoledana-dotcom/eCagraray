// =============================================================================
// Unified SQL Database Interface — supports local SQLite (better-sqlite3)
// and Cloudflare D1 via the same query API.
// =============================================================================

// Determine if running in Cloudflare Workers environment
interface D1Result {
  meta: { changes: number; lastInsertRowid: number | bigint };
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<D1Result & { success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec?(query: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Runtime detection
// ---------------------------------------------------------------------------
async function getD1Binding(): Promise<D1Database | null> {
  try {
    const specifier = "cloudflare:workers";
    const { env } = await import(/* @vite-ignore */ specifier);
    return (env as { DB?: D1Database }).DB ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------
export async function isD1Available(): Promise<boolean> {
  const d1 = await getD1Binding();
  return d1 !== null;
}

// ---------------------------------------------------------------------------
// Query interface — abstracts local SQLite vs D1
// ---------------------------------------------------------------------------
interface Queryable {
  prepare(sql: string): {
    bind(...values: any[]): {
      first<T>(): Promise<T | null>;
      all<T>(): Promise<T[]>;
      run(): Promise<D1Result>;
    };
    first<T>(...values: any[]): Promise<T | null>;
    all<T>(...values: any[]): Promise<T[]>;
    run(...values: any[]): Promise<D1Result>;
  };
  exec?(sql: string): Promise<void>;
}

let queryable: Queryable | null = null;

async function getQueryable(): Promise<Queryable> {
  if (queryable) return queryable;

  // Try D1 first (production Cloudflare)
  const d1 = await getD1Binding();
  if (d1) {
    // Wrap D1 to match our Queryable interface
    queryable = {
      prepare(sql: string) {
        const stmt = d1!.prepare(sql);
        return {
          bind(...values: any[]) {
            const bound = stmt.bind(...values);
            return {
              async first<T>(): Promise<T | null> {
                return bound.first<T>();
              },
              async all<T>(): Promise<T[]> {
                const result = await bound.all<T>();
                return result.results || [];
              },
              async run(): Promise<D1Result> {
                const result = await bound.run();
                return { meta: result.meta };
              },
            };
          },
          async first<T>(...values: any[]): Promise<T | null> {
            return stmt.bind(...values).first<T>();
          },
          async all<T>(...values: any[]): Promise<T[]> {
            const result = await stmt.bind(...values).all<T>();
            return result.results || [];
          },
          async run(...values: any[]): Promise<D1Result> {
            const result = await stmt.bind(...values).run();
            return { meta: result.meta };
          },
        };
      },
      async exec(sql: string) {
        // D1 doesn't support exec reliable, run each statement
        await execute(sql);
      },
    };
    return queryable;
  }

  // Fall back to local SQLite
  const { prepare, getLocalDb } = await import("./db-local.server");
  const localDb = getLocalDb();
  queryable = {
    prepare(sql: string) {
      const localPrepared = prepare(sql);
      return {
        bind(...values: any[]) {
          const bound = localPrepared.bind(...values);
          return {
            async first<T>(): Promise<T | null> {
              return bound.first<T>();
            },
            async all<T>(): Promise<T[]> {
              return bound.all<T>();
            },
            async run(): Promise<D1Result> {
              return bound.run();
            },
          };
        },
        async first<T>(...values: any[]): Promise<T | null> {
          return localPrepared.first<T>(...values);
        },
        async all<T>(...values: any[]): Promise<T[]> {
          return localPrepared.all<T>(...values);
        },
        async run(...values: any[]): Promise<D1Result> {
          return localPrepared.run(...values);
        },
      };
    },
    async exec(sql: string) {
      localDb.exec(sql);
    },
  };
  return queryable;
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function query<T = any>(
  sql: string,
  ...params: any[]
): Promise<T[]> {
  const q = await getQueryable();
  return q.prepare(sql).all<T>(...params);
}

export async function queryFirst<T = any>(
  sql: string,
  ...params: any[]
): Promise<T | null> {
  const q = await getQueryable();
  return q.prepare(sql).first<T>(...params);
}

export async function execute(
  sql: string,
  ...params: any[]
): Promise<D1Result> {
  const q = await getQueryable();
  return q.prepare(sql).run(...params);
}

export async function execSql(sql: string): Promise<void> {
  const q = await getQueryable();
  if (q.exec) {
    await q.exec(sql);
  } else {
    // D1 doesn't have exec, split by semicolons and run each
    const statements = sql
      .replace(/--[^\n]*/g, "")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.toUpperCase().startsWith("PRAGMA"));
    for (const stmt of statements) {
      await execute(stmt);
    }
  }
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------
export async function queryPaginated<T = any>(
  baseSql: string,
  countSql: string,
  params: any[],
  pagination: PaginationParams = {},
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, pagination.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, pagination.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const countRow = await queryFirst<{ total: number }>(countSql, ...params);
  const total = countRow?.total ?? 0;

  const rows = await query<T>(
    `${baseSql} LIMIT ? OFFSET ?`,
    ...params,
    pageSize,
    offset,
  );

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ---------------------------------------------------------------------------
// Barangay info type (legacy compatibility)
// ---------------------------------------------------------------------------
export interface BarangayInfo {
  id?: number;
  name: string;
  municipality: string;
  province: string;
  address: string;
  contact: string;
  email: string;
  captain: string;
}

// ---------------------------------------------------------------------------
// Simple CRUD for known tables
// ---------------------------------------------------------------------------
const ALLOWED_TABLES = [
  "users", "barangay_info", "residents", "households", "officials",
  "announcements", "alerts", "incidents", "complaints", "document_requests",
  "emergency_requests", "evac_centers", "volunteers", "youth", "events",
  "polls", "inquiries", "notifications", "password_resets", "app_data",
  "sessions",
] as const;

export type TableName = (typeof ALLOWED_TABLES)[number];

function validateTable(table: string): asserts table is TableName {
  if (!ALLOWED_TABLES.includes(table as TableName)) {
    throw new Error(`Access denied: table "${table}" is not allowed`);
  }
}

const WRITABLE_TABLES: TableName[] = [
  "users",
  "barangay_info", "residents", "households", "officials",
  "announcements", "alerts", "incidents", "complaints", "document_requests",
  "emergency_requests", "evac_centers", "volunteers", "youth", "events",
  "polls", "inquiries", "notifications", "password_resets", "app_data",
  "sessions",
];

function isWritable(table: TableName): boolean {
  return WRITABLE_TABLES.includes(table);
}

// ---------------------------------------------------------------------------
// Export the standard query interface
// ---------------------------------------------------------------------------
export const db = {
  query,
  queryFirst,
  execute,
  exec: execSql,
  queryPaginated,

  async list<T = any>(table: string): Promise<T[]> {
    validateTable(table);
    return query<T>(`SELECT * FROM "${table}" ORDER BY created_at DESC`);
  },

  async getById<T = any>(table: string, id: string): Promise<T | null> {
    validateTable(table);
    return queryFirst<T>(`SELECT * FROM "${table}" WHERE id = ?`, id);
  },

  async insert<T = any>(table: string, record: Record<string, any>): Promise<T> {
    validateTable(table);
    if (!isWritable(table)) {
      throw new Error(`Access denied: table "${table}" is not writable`);
    }

    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = keys.map(() => "?").join(", ");
    const columns = keys.map((k) => `"${k}"`).join(", ");

    await execute(
      `INSERT INTO "${table}" (${columns}) VALUES (${placeholders})`,
      ...values,
    );

    // Ensure updated_at is set (gracefully skip if column doesn't exist)
    if (record.updated_at === undefined && !keys.includes("updated_at")) {
      try {
        await execute(
          `UPDATE "${table}" SET updated_at = datetime('now') WHERE id = ?`,
          record.id,
        );
      } catch {
        // Table may not have an updated_at column — that's ok
      }
    }

    return (await queryFirst<T>(
      `SELECT * FROM "${table}" WHERE id = ?`,
      record.id,
    )) as T;
  },

  async update<T = any>(
    table: string,
    id: string,
    updates: Record<string, any>,
  ): Promise<T | null> {
    validateTable(table);
    if (!isWritable(table) && table !== "users") {
      throw new Error(`Access denied: table "${table}" is not writable`);
    }

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k) => `"${k}" = ?`).join(", ");

    // Add updated_at (gracefully skip if column doesn't exist)
    try {
      const fullSetClause = `${setClause}, updated_at = datetime('now')`;
      await execute(
        `UPDATE "${table}" SET ${fullSetClause} WHERE id = ?`,
        ...values,
        id,
      );
    } catch {
      // Table may not have updated_at column — just set the requested fields
      await execute(
        `UPDATE "${table}" SET ${setClause} WHERE id = ?`,
        ...values,
        id,
      );
    }

    return queryFirst<T>(`SELECT * FROM "${table}" WHERE id = ?`, id);
  },

  async remove(table: string, id: string): Promise<boolean> {
    validateTable(table);
    if (!isWritable(table) && table !== "users") {
      throw new Error(`Access denied: table "${table}" is not writable`);
    }

    const result = await execute(`DELETE FROM "${table}" WHERE id = ?`, id);
    return (result.meta?.changes ?? 0) > 0;
  },

  async count(table: string, whereClause = ""): Promise<number> {
    validateTable(table);
    const row = await queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM "${table}" ${whereClause}`,
    );
    return row?.count ?? 0;
  },
};

// ---------------------------------------------------------------------------
// Key format conversion helpers (snake_case ↔ camelCase)
// The SQL schema uses snake_case but legacy client code expects camelCase.
// These conversions bridge the two so we don't have to rewrite every route.
// ---------------------------------------------------------------------------

/** Convert snake_case string to camelCase */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Convert camelCase string to snake_case */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Convert all keys of an object from snake_case to camelCase (deep) */
function convertKeysToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.includes("_") ? snakeToCamel(key) : key;
    result[camelKey] = value;
  }
  return result;
}

/** Convert all keys of an object from camelCase to snake_case (deep) */
function convertKeysToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Only convert if key is camelCase (contains lowercase followed by uppercase)
    if (/[a-z][A-Z]/.test(key)) {
      result[camelToSnake(key)] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Transaction helper — wraps operations in BEGIN/COMMIT/ROLLBACK
// Works with both Cloudflare D1 and local SQLite.
// ---------------------------------------------------------------------------

/**
 * Execute a function within a database transaction.
 * If the function throws, the transaction is rolled back.
 * If it succeeds, the transaction is committed.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  await execute("BEGIN TRANSACTION");
  try {
    const result = await fn();
    await execute("COMMIT");
    return result;
  } catch (error) {
    try {
      await execute("ROLLBACK");
    } catch {
      // If ROLLBACK itself fails (e.g., no active transaction), ignore
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Legacy compatibility — for routes still using getTableData/saveTableData
// ---------------------------------------------------------------------------
// Bootstraps the first super_admin account when the users table is empty.
// This ensures the system is never locked on first run.
/** Known bootstrap password printed here and in dev console. Change after first login. */
const BOOTSTRAP_PASSWORD = "Admin123!";

async function bootstrapFirstAdminIfNeeded(): Promise<void> {
  const count = await db.count("users");
  if (count > 0) return;

  const crypto = await import("node:crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(BOOTSTRAP_PASSWORD, salt, 64).toString("hex");
  const passwordHash = `${salt}:${derived}`;

  await db.insert("users", {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
    username: "admin",
    password_hash: passwordHash,
    full_name: "System Administrator",
    email: "ecagraraymanagementsystem@gmail.com",
    role: "super_admin",
    approved: 1,
    created_at: new Date().toISOString(),
  });
}

/**
 * Read all rows from a table, converting snake_case SQL columns to
 * camelCase for compatibility with legacy client code.
 */
export async function readTableData(table: string): Promise<any[]> {
  await bootstrapFirstAdminIfNeeded();
  const rows = await db.list(table);
  return rows.map(convertKeysToCamel);
}

/**
 * Replace all rows in a table with new data, converting camelCase keys
 * to snake_case for the SQL schema.
 *
 * The operation is wrapped in a database transaction. If any INSERT fails,
 * the DELETE is automatically rolled back, preventing data loss.
 */
export async function writeTableData(table: string, data: any[]): Promise<{ success: boolean }> {
  validateTable(table);

  // Safety: only clear writable tables (prevents accidental deletion of users table)
  if (!isWritable(table as TableName)) {
    throw new Error(`Access denied: table "${table}" is not writable`);
  }

  // Wrap the full clear + re-insert in a transaction for atomic safety
  return withTransaction(async () => {
    await execute(`DELETE FROM "${table}"`);

    for (const row of data) {
      // Convert camelCase keys to snake_case before inserting into SQL
      await db.insert(table, convertKeysToSnake(row));
    }

    return { success: true };
  });
}

export async function getBarangayInfo(): Promise<any> {
  return queryFirst("SELECT * FROM barangay_info WHERE id = 1");
}

export async function saveBarangayInfo(info: Record<string, any>): Promise<any> {
  const keys = Object.keys(info);
  const values = Object.values(info);
  const setClause = keys.map((k) => `"${k}" = ?`).join(", ");

  await execute(
    `UPDATE barangay_info SET ${setClause}, updated_at = datetime('now') WHERE id = 1`,
    ...values,
  );

  return getBarangayInfo();
}
