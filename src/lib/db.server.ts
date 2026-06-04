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

function defaultDatabase(): DatabaseSchema {
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

export async function readDatabase(): Promise<DatabaseSchema> {
  await ensureDatabaseFolder();
  try {
    const contents = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(contents) as DatabaseSchema;
  } catch (error: unknown) {
    const database = defaultDatabase();
    await writeDatabase(database);
    return database;
  }
}

export async function writeDatabase(database: DatabaseSchema) {
  await ensureDatabaseFolder();
  await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2), "utf-8");
}
