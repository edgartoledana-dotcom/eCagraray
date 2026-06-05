import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User, Role } from "./store";
import { uid } from "./store";
import { readDatabase, writeDatabase, type BarangayInfo, type DatabaseSchema } from "./db.server";

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  contact?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  role?: Role;
  occupation?: string;
  isPwd?: string;
}

export interface UpdateUserPayload {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  contact?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  password?: string;
  approved?: boolean;
  occupation?: string;
  isPwd?: string;
}

export interface ProfilePayload {
  id: string;
  fullName: string;
  email: string;
  contact?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  occupation?: string;
  isPwd?: string;
}

type DbUser = Omit<User, "password"> & { passwordHash: string };

type PublicUser = Omit<DbUser, "passwordHash">;

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, passwordHash?: string) {
  if (typeof passwordHash !== "string") return false;
  const [salt, derived] = passwordHash.split(":");
  if (!salt || !derived) return false;
  const attempt = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(derived, "hex"));
}

function sanitizeUser(user: DbUser): PublicUser {
  const { passwordHash, password, ...rest } = user as any;
  return rest;
}

function createDbUser(user: Omit<User, "password"> & { passwordHash: string }): DbUser {
  return user;
}

async function seedServerDatabase() {
  const db = await readDatabase();
  let migrated = false;

  db.users = db.users.map((user) => {
    let u = { ...user } as any;
    let changed = false;

    // Auto-migrate old superadmin/admin to new systemadmin info
    if (u.role === "super_admin" || u.username === "admin") {
      if (u.username !== "systemadmin") {
        u.username = "systemadmin";
        changed = true;
      }
      if (u.role !== "super_admin") {
        u.role = "super_admin";
        changed = true;
      }
      if (u.fullName !== "System Administrator") {
        u.fullName = "System Administrator";
        changed = true;
      }
      if (!verifyPassword("systemadmin113185", u.passwordHash)) {
        u.passwordHash = hashPassword("systemadmin113185");
        changed = true;
      }
    }

    if (typeof u.passwordHash === "string") {
      if (typeof u.password === "string") {
        changed = true;
        const { password, ...rest } = u;
        u = { ...rest, passwordHash: u.passwordHash };
      }
    } else if (typeof u.password === "string") {
      changed = true;
      const { password, ...rest } = u;
      u = { ...rest, passwordHash: hashPassword(password) };
    }

    if (changed) {
      migrated = true;
    }
    return u as DbUser;
  });

  if (db.users.length === 0) {
    const createSeedUser = (username: string, password: string, fullName: string, email: string, role: Role): DbUser => ({
      id: uid(),
      username,
      passwordHash: hashPassword(password),
      fullName,
      email,
      role,
      approved: true,
      createdAt: new Date().toISOString(),
    });

    db.users = [
      createSeedUser("systemadmin", "systemadmin113185", "System Administrator", "admin@ecagraray.gov.ph", "super_admin"),
    ];
    migrated = true;
  }

  if (!db.barangay) {
    db.barangay = {
      name: "Barangay Cagraray",
      municipality: "Bato",
      province: "Catanduanes",
      address: "Cagraray, Bato, Catanduanes",
      contact: "+63 977 008 6455",
      email: "ecagraraymanagementsystem@gmail.com",
      captain: "",
    };
  }

  if (!db.officials || db.officials.length === 0) {
    db.officials = [
      { id: "1", name: "Joseph D. Torrepalma", role: "Punong Barangay (Barangay Captain)", committee: "Overall Community Head", createdAt: new Date().toISOString() },
      { id: "2", name: "Renante T. Tenerife", role: "Barangay Kagawad (Councilor)", committee: "Committee on Finance, Budget and Appropriation", createdAt: new Date().toISOString() },
      { id: "3", name: "Marilyn C. Toledana", role: "Barangay Kagawad (Councilor)", committee: "Committee on Education and VAWC", createdAt: new Date().toISOString() },
      { id: "4", name: "Nick Cyril G. Solo", role: "Barangay Kagawad (Councilor)", committee: "Committee on Infrastructure and Public Works", createdAt: new Date().toISOString() },
      { id: "5", name: "Rafael T. Tatel", role: "Barangay Kagawad (Councilor)", committee: "Committee on Peace and Order", createdAt: new Date().toISOString() },
      { id: "6", name: "Melchor C. Bernal", role: "Barangay Kagawad (Councilor)", committee: "Committee on Disaster Risk Reduction and Management", createdAt: new Date().toISOString() },
      { id: "7", name: "Regie Boy S. Torrepalma", role: "Barangay Kagawad (Councilor)", committee: "Committee on Agriculture and Livelihood", createdAt: new Date().toISOString() },
      { id: "8", name: "Rosemarie T. Torrepalma", role: "Barangay Kagawad (Councilor)", committee: "Committee on Health and Sanitation", createdAt: new Date().toISOString() },
      { id: "9", name: "Jean D. Templonuevo", role: "Barangay Kagawad (Councilor)", committee: "Committee on Youth and Sports Development", createdAt: new Date().toISOString() },
      { id: "10", name: "Racquel V. Tatel", role: "Barangay Treasurer", committee: "Financial Records & Logistics", createdAt: new Date().toISOString() },
      { id: "11", name: "Angelene T. Tazarra", role: "Barangay Secretary", committee: "Administration & Records Management", createdAt: new Date().toISOString() },
    ];
    migrated = true;
  }

  if (migrated) {
    await writeDatabase(db);
  }

  return db;
}

export async function authenticateUser(username: string, password: string) {
  const db = await seedServerDatabase();
  const normalized = username.trim().toLowerCase();
  const found = (db.users as DbUser[]).find((user) => user.username.toLowerCase() === normalized);
  if (!found) return null;
  return verifyPassword(password, found.passwordHash) ? sanitizeUser(found) : null;
}

export async function getUserById(id: string) {
  const db = await seedServerDatabase();
  const user = db.users.find((user) => user.id === id) as DbUser | undefined;
  return user ? sanitizeUser(user) : null;
}

export async function createUser(payload: RegisterPayload) {
  const db = await seedServerDatabase();
  const existingUsername = (db.users as DbUser[]).some((user) => user.username.toLowerCase() === payload.username.toLowerCase());
  const existingEmail = (db.users as DbUser[]).some((user) => user.email.toLowerCase() === payload.email.toLowerCase());
  if (existingUsername) throw new Error("Username already taken");
  if (existingEmail) throw new Error("Email already registered");

  const newUser: DbUser = {
    id: uid(),
    username: payload.username,
    passwordHash: hashPassword(payload.password),
    fullName: payload.fullName,
    email: payload.email,
    contact: payload.contact,
    address: payload.address,
    birthdate: payload.birthdate,
    gender: payload.gender,
    role: payload.role ?? "resident",
    approved: false, // New self-registered accounts are pending LGU approval
    occupation: payload.occupation,
    isPwd: payload.isPwd,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  await writeDatabase(db);
  return sanitizeUser(newUser);
}

export async function getAllUsers() {
  const db = await seedServerDatabase();
  return db.users.map((user) => sanitizeUser(user as DbUser));
}

export async function updateUser(payload: UpdateUserPayload) {
  const db = await seedServerDatabase();
  const index = db.users.findIndex((user) => user.id === payload.id);
  if (index < 0) throw new Error("User not found");

  const existing = db.users[index] as DbUser;
  const existingUsername = (db.users as DbUser[]).some(
    (user) => user.username.toLowerCase() === payload.username.toLowerCase() && user.id !== payload.id,
  );
  const existingEmail = (db.users as DbUser[]).some(
    (user) => user.email.toLowerCase() === payload.email.toLowerCase() && user.id !== payload.id,
  );
  if (existingUsername) throw new Error("Username already taken");
  if (existingEmail) throw new Error("Email already registered");

  const updated: DbUser = {
    ...existing,
    username: payload.username,
    fullName: payload.fullName,
    email: payload.email,
    role: payload.role,
    contact: payload.contact,
    address: payload.address,
    birthdate: payload.birthdate,
    gender: payload.gender,
    approved: typeof payload.approved === "boolean" ? payload.approved : existing.approved,
    passwordHash: payload.password ? hashPassword(payload.password) : existing.passwordHash,
    occupation: payload.occupation !== undefined ? payload.occupation : existing.occupation,
    isPwd: payload.isPwd !== undefined ? payload.isPwd : existing.isPwd,
  };

  db.users[index] = updated;
  await writeDatabase(db);
  return sanitizeUser(updated);
}

export async function deleteUser(id: string) {
  const db = await seedServerDatabase();
  db.users = db.users.filter((user) => user.id !== id);
  await writeDatabase(db);
  return { success: true };
}

export async function updateUserProfile(payload: ProfilePayload) {
  const db = await seedServerDatabase();
  const index = db.users.findIndex((user) => user.id === payload.id);
  if (index < 0) return null;
  const existing = db.users[index] as DbUser;
  const updated: DbUser = {
    ...existing,
    fullName: payload.fullName,
    email: payload.email,
    contact: payload.contact,
    address: payload.address,
    birthdate: payload.birthdate,
    gender: payload.gender,
    occupation: payload.occupation !== undefined ? payload.occupation : existing.occupation,
    isPwd: payload.isPwd !== undefined ? payload.isPwd : existing.isPwd,
  };
  db.users[index] = updated;
  await writeDatabase(db);
  return sanitizeUser(updated);
}

export async function getBarangayInfo() {
  const db = await seedServerDatabase();
  return db.barangay;
}

export async function saveBarangayInfo(info: Partial<BarangayInfo>) {
  const db = await seedServerDatabase();
  db.barangay = { ...db.barangay, ...info };
  await writeDatabase(db);
  return db.barangay;
}

export async function getDashboardStats() {
  const db = await seedServerDatabase();
  return {
    residents: (db.residents || []).length,
    households: (db.households || []).length,
    volunteers: (db.volunteers || []).length,
    events: (db.events || []).length,
  };
}

export async function readTableData(table: string) {
  const db = await seedServerDatabase();
  return (db as any)[table] || [];
}

export async function writeTableData(table: string, data: any[]) {
  const db = await seedServerDatabase();
  (db as any)[table] = data;
  await writeDatabase(db);
  return { success: true };
}
