import fs from "node:fs/promises";
import path from "node:path";
import { isD1, readFromD1, writeToD1 } from "./db-d1.server";

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

function getDbPath(): string {
  return path.resolve(process.cwd(), "data", "ecagraray.db.json");
}

async function ensureDatabaseFolder() {
  const dbPath = getDbPath();
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
}

async function readFromFilesystem(): Promise<DatabaseSchema> {
  const dbPath = getDbPath();
  await ensureDatabaseFolder();
  try {
    const contents = await fs.readFile(dbPath, "utf-8");
    return JSON.parse(contents) as DatabaseSchema;
  } catch {
    const database = defaultDatabase();
    await writeToFilesystem(database);
    return database;
  }
}

async function writeToFilesystem(database: DatabaseSchema) {
  const dbPath = getDbPath();
  await ensureDatabaseFolder();
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2), "utf-8");
}

export async function readDatabase(): Promise<DatabaseSchema> {
  const useD1 = await isD1();
  if (useD1) {
    const fromD1 = await readFromD1();
    if (fromD1) return fromD1;
    const database = defaultDatabase();
    await writeToD1(database);
    return database;
  }
  return readFromFilesystem();
}

export async function writeDatabase(database: DatabaseSchema) {
  const useD1 = await isD1();
  if (useD1) {
    await writeToD1(database);
    return;
  }
  await writeToFilesystem(database);
}
