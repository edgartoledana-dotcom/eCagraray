import fs from "node:fs/promises";
import path from "node:path";

export interface BarangayInfo {
  name: string;
  municipality: string;
  province: string;
  address: string;
  contact: string;
  email: string;
  captain: string;
}

export interface DatabaseSchema {
  users: Array<Record<string, unknown>>;
  barangay: BarangayInfo;
  residents: unknown[];
  households: unknown[];
  volunteers: unknown[];
  events: unknown[];
}

const DB_PATH = path.resolve(process.cwd(), "data", "ecagraray.db.json");

export function defaultDatabase(): DatabaseSchema {
  return {
    users: [],
    barangay: {
      name: "Barangay Cagraray",
      municipality: "Bato",
      province: "Catanduanes",
      address: "Cagraray, Bato, Catanduanes",
      contact: "+63 977 008 6455",
      email: "info@ecagraray.gov.ph",
      captain: "",
    },
    residents: [],
    households: [],
    volunteers: [],
    events: [],
  };
}

async function ensureDatabaseFolder() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
}

async function readFromFilesystem(): Promise<DatabaseSchema> {
  await ensureDatabaseFolder();
  try {
    const contents = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(contents) as DatabaseSchema;
  } catch {
    const database = defaultDatabase();
    await writeToFilesystem(database);
    return database;
  }
}

async function writeToFilesystem(database: DatabaseSchema) {
  await ensureDatabaseFolder();
  await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2), "utf-8");
}

async function tryD1() {
  if (process.env.DEPLOY_TARGET !== "cloudflare") return null;
  try {
    const d1 = await import("./db-d1.server");
    return d1;
  } catch {
    return null;
  }
}

export async function readDatabase(): Promise<DatabaseSchema> {
  const d1 = await tryD1();
  if (d1) {
    const fromD1 = await d1.readFromD1();
    if (fromD1) return fromD1;
    const database = defaultDatabase();
    await d1.writeToD1(database);
    return database;
  }
  return readFromFilesystem();
}

export async function writeDatabase(database: DatabaseSchema) {
  const d1 = await tryD1();
  if (d1) {
    await d1.writeToD1(database);
    return;
  }
  await writeToFilesystem(database);
}
