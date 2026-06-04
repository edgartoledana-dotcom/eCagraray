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
}

export interface ProfilePayload {
  id: string;
  fullName: string;
  email: string;
  contact?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
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
    if (typeof user?.passwordHash === "string") {
      if (typeof (user as any).password === "string") {
        migrated = true;
        const { password, ...rest } = user as any;
        return { ...rest, passwordHash: user.passwordHash } as DbUser;
      }
      return user as DbUser;
    }

    if (typeof (user as any).password === "string") {
      migrated = true;
      const { password, ...rest } = user as any;
      return { ...rest, passwordHash: hashPassword(password) } as DbUser;
    }

    return user as DbUser;
  });

  if (db.users.length === 0) {
    const createSeedUser = (username: string, password: string, fullName: string, email: string, role: Role): DbUser => ({
      id: uid(),
      username,
      passwordHash: hashPassword(password),
      fullName,
      email,
      role,
      createdAt: new Date().toISOString(),
    });

    db.users = [
      createSeedUser("admin", "admin123", "System Administrator", "admin@ecagraray.gov.ph", "super_admin"),
      createSeedUser("captain", "captain123", "Barangay Captain", "captain@ecagraray.gov.ph", "captain"),
      createSeedUser("secretary", "secretary123", "Barangay Secretary", "secretary@ecagraray.gov.ph", "secretary"),
      createSeedUser("skofficer", "skofficer123", "SK Officer", "skofficer@ecagraray.gov.ph", "sk_officer"),
      createSeedUser("disaster", "disaster123", "Disaster Response Officer", "disaster@ecagraray.gov.ph", "disaster"),
      createSeedUser("resident", "resident123", "Edgar Toledana", "resident@ecagraray.gov.ph", "resident"),
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
      email: "info@ecagraray.gov.ph",
      captain: "",
    };
  }

  if (migrated) {
    await writeDatabase(db);
  }

  return db;
}

export async function authenticateUser(username: string, password: string) {
  const db = await seedServerDatabase();
  const normalized = username.trim().toLowerCase();
  const found = db.users.find((user) => user.username.toLowerCase() === normalized) as DbUser | undefined;
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
  const existingUsername = db.users.some((user) => user.username.toLowerCase() === payload.username.toLowerCase());
  const existingEmail = db.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase());
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
  const existingUsername = db.users.some(
    (user) => user.username.toLowerCase() === payload.username.toLowerCase() && user.id !== payload.id,
  );
  const existingEmail = db.users.some(
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
    passwordHash: payload.password ? hashPassword(payload.password) : existing.passwordHash,
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
    residents: db.residents.length,
    households: db.households.length,
    volunteers: db.volunteers.length,
    events: db.events.length,
  };
}
