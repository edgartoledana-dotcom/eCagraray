import { scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { a as uid } from "./store-CFBfCpGU.js";
import fs from "node:fs/promises";
import path from "node:path";
import "react";
const DB_PATH = path.resolve(process.cwd(), "data", "ecagraray.db.json");
function defaultDatabase() {
  return {
    users: [],
    barangay: {
      name: "Barangay Cagraray",
      municipality: "Bato",
      province: "Catanduanes",
      address: "Cagraray, Bato, Catanduanes",
      contact: "+63 977 008 6455",
      email: "info@ecagraray.gov.ph",
      captain: ""
    },
    residents: [],
    households: [],
    volunteers: [],
    events: []
  };
}
async function ensureDatabaseFolder() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
}
async function readDatabase() {
  await ensureDatabaseFolder();
  try {
    const contents = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(contents);
  } catch (error) {
    const database = defaultDatabase();
    await writeDatabase(database);
    return database;
  }
}
async function writeDatabase(database) {
  await ensureDatabaseFolder();
  await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2), "utf-8");
}
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
function verifyPassword(password, passwordHash) {
  if (typeof passwordHash !== "string") return false;
  const [salt, derived] = passwordHash.split(":");
  if (!salt || !derived) return false;
  const attempt = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(derived, "hex"));
}
function sanitizeUser(user) {
  const { passwordHash, password, ...rest } = user;
  return rest;
}
async function seedServerDatabase() {
  const db = await readDatabase();
  let migrated = false;
  db.users = db.users.map((user) => {
    if (typeof user?.passwordHash === "string") {
      if (typeof user.password === "string") {
        migrated = true;
        const { password, ...rest } = user;
        return { ...rest, passwordHash: user.passwordHash };
      }
      return user;
    }
    if (typeof user.password === "string") {
      migrated = true;
      const { password, ...rest } = user;
      return { ...rest, passwordHash: hashPassword(password) };
    }
    return user;
  });
  if (db.users.length === 0) {
    const createSeedUser = (username, password, fullName, email, role) => ({
      id: uid(),
      username,
      passwordHash: hashPassword(password),
      fullName,
      email,
      role,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    db.users = [
      createSeedUser("admin", "admin123", "System Administrator", "admin@ecagraray.gov.ph", "super_admin"),
      createSeedUser("captain", "captain123", "Barangay Captain", "captain@ecagraray.gov.ph", "captain"),
      createSeedUser("secretary", "secretary123", "Barangay Secretary", "secretary@ecagraray.gov.ph", "secretary"),
      createSeedUser("skofficer", "skofficer123", "SK Officer", "skofficer@ecagraray.gov.ph", "sk_officer"),
      createSeedUser("disaster", "disaster123", "Disaster Response Officer", "disaster@ecagraray.gov.ph", "disaster"),
      createSeedUser("resident", "resident123", "Edgar Toledana", "resident@ecagraray.gov.ph", "resident")
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
      captain: ""
    };
  }
  if (migrated) {
    await writeDatabase(db);
  }
  return db;
}
async function authenticateUser(username, password) {
  const db = await seedServerDatabase();
  const normalized = username.trim().toLowerCase();
  const found = db.users.find((user) => user.username.toLowerCase() === normalized);
  if (!found) return null;
  return verifyPassword(password, found.passwordHash) ? sanitizeUser(found) : null;
}
async function getUserById(id) {
  const db = await seedServerDatabase();
  const user = db.users.find((user2) => user2.id === id);
  return user ? sanitizeUser(user) : null;
}
async function createUser(payload) {
  const db = await seedServerDatabase();
  const existingUsername = db.users.some((user) => user.username.toLowerCase() === payload.username.toLowerCase());
  const existingEmail = db.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase());
  if (existingUsername) throw new Error("Username already taken");
  if (existingEmail) throw new Error("Email already registered");
  const newUser = {
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.users.push(newUser);
  await writeDatabase(db);
  return sanitizeUser(newUser);
}
async function getAllUsers() {
  const db = await seedServerDatabase();
  return db.users.map((user) => sanitizeUser(user));
}
async function updateUser(payload) {
  const db = await seedServerDatabase();
  const index = db.users.findIndex((user) => user.id === payload.id);
  if (index < 0) throw new Error("User not found");
  const existing = db.users[index];
  const existingUsername = db.users.some(
    (user) => user.username.toLowerCase() === payload.username.toLowerCase() && user.id !== payload.id
  );
  const existingEmail = db.users.some(
    (user) => user.email.toLowerCase() === payload.email.toLowerCase() && user.id !== payload.id
  );
  if (existingUsername) throw new Error("Username already taken");
  if (existingEmail) throw new Error("Email already registered");
  const updated = {
    ...existing,
    username: payload.username,
    fullName: payload.fullName,
    email: payload.email,
    role: payload.role,
    contact: payload.contact,
    address: payload.address,
    birthdate: payload.birthdate,
    gender: payload.gender,
    passwordHash: payload.password ? hashPassword(payload.password) : existing.passwordHash
  };
  db.users[index] = updated;
  await writeDatabase(db);
  return sanitizeUser(updated);
}
async function deleteUser(id) {
  const db = await seedServerDatabase();
  db.users = db.users.filter((user) => user.id !== id);
  await writeDatabase(db);
  return { success: true };
}
async function updateUserProfile(payload) {
  const db = await seedServerDatabase();
  const index = db.users.findIndex((user) => user.id === payload.id);
  if (index < 0) return null;
  const existing = db.users[index];
  const updated = {
    ...existing,
    fullName: payload.fullName,
    email: payload.email,
    contact: payload.contact,
    address: payload.address,
    birthdate: payload.birthdate,
    gender: payload.gender
  };
  db.users[index] = updated;
  await writeDatabase(db);
  return sanitizeUser(updated);
}
async function getBarangayInfo() {
  const db = await seedServerDatabase();
  return db.barangay;
}
async function saveBarangayInfo(info) {
  const db = await seedServerDatabase();
  db.barangay = { ...db.barangay, ...info };
  await writeDatabase(db);
  return db.barangay;
}
async function getDashboardStats() {
  const db = await seedServerDatabase();
  return {
    residents: db.residents.length,
    households: db.households.length,
    volunteers: db.volunteers.length,
    events: db.events.length
  };
}
export {
  authenticateUser,
  createUser,
  deleteUser,
  getAllUsers,
  getBarangayInfo,
  getDashboardStats,
  getUserById,
  saveBarangayInfo,
  updateUser,
  updateUserProfile
};
