// =============================================================================
// Authentication & User Management — SQL database backed
// No seed data, no mock records, no JSON file dependency.
// Includes signed session token management with expiry and inactivity tracking.
// =============================================================================

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import type { User, Role } from "./store";
import { uid } from "./store";
import { db } from "./db.server";
import type { BarangayInfo } from "./db.server";
import { sanitizeText, normalizeEmail } from "./utils";
import {
  logLogin,
  logLoginFailed,
  logUserCreated,
  logUserUpdated,
  logUserDeleted,
  logProfileUpdated,
  logBarangayInfoUpdated,
  logPasswordResetRequested,
  logPasswordResetCompleted,
} from "./audit.server";

// ---------------------------------------------------------------------------
// Session token configuration
// ---------------------------------------------------------------------------
// Derive a stable secret from the app name (env overridable in production).
const SESSION_SECRET = process.env.SESSION_SECRET
  ? process.env.SESSION_SECRET
  : "ecagraray-session-secret-2026-v1";

const SESSION_DURATION_MS = {
  session: 60 * 60 * 1000,     // 1 hour for "don't remember me"
  remember: 24 * 60 * 60 * 1000, // 24 hours for "remember me"
};

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ---------------------------------------------------------------------------
// Rate Limiter — in-memory sliding window for login & sensitive endpoints
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 10;      // max attempts per window

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if an action is rate limited.
 * Uses a sliding window approach with in-memory storage.
 * Returns an object with { allowed, remaining, resetAfterMs }.
 */
export function checkRateLimit(key: string, maxAttempts: number = RATE_LIMIT_MAX_ATTEMPTS): {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
} {
  // Lazy cleanup of expired entries to prevent memory leaks (replaces module-level setInterval)
  cleanupExpiredRateLimits();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // First attempt or window expired — reset
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxAttempts - 1, resetAfterMs: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= maxAttempts) {
    // Rate limited
    const resetAfterMs = entry.resetAt - now;
    return { allowed: false, remaining: 0, resetAfterMs };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetAfterMs: entry.resetAt - now };
}

/**
 * Lazily clean up expired rate limit entries (called inside checkRateLimit
 * instead of a module-level setInterval, which is disallowed in Cloudflare
 * Workers at global scope).
 */
function cleanupExpiredRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt with salt)
// ---------------------------------------------------------------------------
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, passwordHash?: string): boolean {
  if (typeof passwordHash !== "string") return false;
  const [salt, derived] = passwordHash.split(":");
  if (!salt || !derived) return false;
  const attempt = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(derived, "hex"));
}

// ---------------------------------------------------------------------------
// User sanitization (strip password hash from responses)
// ---------------------------------------------------------------------------
type DbUser = {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  email: string;
  contact: string;
  address: string;
  birthdate: string;
  gender: string;
  role: Role;
  approved: number;
  occupation: string;
  is_pwd: string;
  civil_status: string;
  blood_type: string;
  emergency_contact: string;
  emergency_phone: string;
  purok: string;
  religion: string;
  nationality: string;
  education_level: string;
  philhealth_no: string;
  tin_no: string;
  voter_id_no: string;
  created_at: string;
};

function toUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    fullName: dbUser.full_name,
    email: dbUser.email,
    contact: dbUser.contact || undefined,
    address: dbUser.address || undefined,
    birthdate: dbUser.birthdate || undefined,
    gender: dbUser.gender || undefined,
    role: dbUser.role,
    approved: dbUser.approved === 1,
    occupation: dbUser.occupation || undefined,
    isPwd: dbUser.is_pwd || undefined,
    civilStatus: dbUser.civil_status || undefined,
    bloodType: dbUser.blood_type || undefined,
    emergencyContact: dbUser.emergency_contact || undefined,
    emergencyPhone: dbUser.emergency_phone || undefined,
    purok: dbUser.purok || undefined,
    religion: dbUser.religion || undefined,
    nationality: dbUser.nationality || undefined,
    educationLevel: dbUser.education_level || undefined,
    philhealthNo: dbUser.philhealth_no || undefined,
    tinNo: dbUser.tin_no || undefined,
    voterIdNo: dbUser.voter_id_no || undefined,
    createdAt: dbUser.created_at,
  };
}

// ---------------------------------------------------------------------------
// Session Token Management (HMAC-signed tokens, server-validated)
// ---------------------------------------------------------------------------

/**
 * Create a signed session token and persist the session in the database.
 */
export async function createSession(
  userId: string,
  remember: boolean,
  meta?: { ip?: string; userAgent?: string },
): Promise<string> {
  const sessionId = uid();
  const expiresAt = new Date(
    Date.now() + (remember ? SESSION_DURATION_MS.remember : SESSION_DURATION_MS.session),
  ).toISOString();

  // Build token: sessionId:expiresAt:signature
  const payload = `${sessionId}:${expiresAt}`;
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
  const token = `${payload}:${signature}`;

  // Persist session in DB (store hash of token for lookup safety)
  const tokenHash = createHmac("sha256", SESSION_SECRET)
    .update(token)
    .digest("hex");

  await db.insert("sessions", {
    id: sessionId,
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    last_activity: new Date().toISOString(),
    created_at: new Date().toISOString(),
    remember: remember ? 1 : 0,
    ip_address: meta?.ip ?? "",
    user_agent: meta?.userAgent ?? "",
  });

  return token;
}

/**
 * Validate a session token. Returns the user if valid, null otherwise.
 * Also updates last_activity to extend the session.
 */
export async function validateSession(
  token: string | null | undefined,
): Promise<{ user: User; token: string } | null> {
  if (!token) return null;

  // Parse token
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [sessionId, expiresAt, signature] = parts;

  // Verify HMAC signature
  const payload = `${sessionId}:${expiresAt}`;
  const expectedSig = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison
  if (signature.length !== expectedSig.length) return null;
  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  // Check expiry
  const expiryTime = new Date(expiresAt).getTime();
  if (Date.now() > expiryTime) {
    // Clean up expired session
    await db.remove("sessions", sessionId).catch(() => {});
    return null;
  }

  // Check inactivity timeout
  const session = await db.queryFirst<{ user_id: string; last_activity: string }>(
    "SELECT user_id, last_activity FROM sessions WHERE id = ?",
    sessionId,
  );
  if (!session) return null;

  const lastActivity = new Date(session.last_activity).getTime();
  if (Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
    // Expired due to inactivity
    await db.remove("sessions", sessionId).catch(() => {});
    return null;
  }

  // Update last_activity
  await db.execute(
    "UPDATE sessions SET last_activity = ? WHERE id = ?",
    new Date().toISOString(),
    sessionId,
  );

  // Fetch user
  const user = await db.queryFirst<DbUser>("SELECT * FROM users WHERE id = ?", session.user_id);
  if (!user) return null;

  return { user: toUser(user), token };
}

/**
 * Clear a session (logout).
 */
export async function clearSession(
  token: string | null | undefined,
): Promise<void> {
  if (!token) return;
  const parts = token.split(":");
  if (parts.length !== 3) return;
  const [sessionId] = parts;
  await db.remove("sessions", sessionId).catch(() => {});
}

/**
 * Clean up all expired sessions from the database.
 */
export async function clearExpiredSessions(): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.execute(
    "DELETE FROM sessions WHERE expires_at < ? OR (last_activity < ? AND remember = 0)",
    now,
    new Date(Date.now() - INACTIVITY_TIMEOUT_MS).toISOString(),
  );
  return result.meta?.changes ?? 0;
}

/**
 * Map roles to their default dashboard routes.
 */
export const ROLE_DASHBOARDS: Record<Role, string> = {
  super_admin: "/dashboard",
  captain: "/dashboard",
  secretary: "/dashboard",
  sk_officer: "/dashboard",
  disaster: "/dashboard",
  resident: "/dashboard",
};

/**
 * Get the default dashboard route for a given role.
 */
export function getDashboardForRole(role: Role): string {
  return ROLE_DASHBOARDS[role] || "/dashboard";
}

// ---------------------------------------------------------------------------
// RBAC — Role-Based Access Control helpers
// ---------------------------------------------------------------------------

/**
 * Extract the authenticated user from a session token (internal helper).
 * Throws with a clear message if the token is missing or invalid.
 */
export async function getAuthUserFromToken(
  token: string | null | undefined,
): Promise<{ user: User; token: string }> {
  if (!token) {
    throw new Error("Authentication required. No session token provided.");
  }
  const result = await validateSession(token);
  if (!result || !result.user) {
    throw new Error("Session expired or invalid. Please sign in again.");
  }
  return result;
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Throws with a 403-appropriate message if unauthorized.
 */
export async function requireRole(
  token: string | null | undefined,
  ...allowedRoles: Role[]
): Promise<User> {
  const { user } = await getAuthUserFromToken(token);
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Access denied. Role "${user.role}" does not have permission for this action. Required roles: ${allowedRoles.join(", ")}`,
    );
  }
  return user;
}

/**
 * Require the authenticated user to have a specific permission
 * (maps to ROLE_PERMISSIONS on the server for consistency).
 */
export async function requirePermission(
  token: string | null | undefined,
  permission: string,
): Promise<User> {
  const { user } = await getAuthUserFromToken(token);
  // Simple permission check: super_admin always passes;
  // otherwise the permission must grant access to the user's role.
  if (user.role === "super_admin") return user;
  // If we want to use ROLE_PERMISSIONS from store, we'd import it here.
  // For simplicity, we use requireRole with explicit role lists instead.
  throw new Error(
    `Access denied. Role "${user.role}" does not have permission "${permission}".`,
  );
}

// ---------------------------------------------------------------------------
// Register / Create
// ---------------------------------------------------------------------------
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
  civilStatus?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  purok?: string;
  religion?: string;
  nationality?: string;
  educationLevel?: string;
  philhealthNo?: string;
  tinNo?: string;
  voterIdNo?: string;
}

export async function createUser(payload: RegisterPayload): Promise<User> {
  // Sanitize inputs
  const sanitizedPayload = {
    ...payload,
    username: sanitizeText(payload.username, 50).replace(/\s+/g, ""),
    fullName: sanitizeText(payload.fullName, 100),
    email: normalizeEmail(payload.email),
    contact: payload.contact ? sanitizeText(payload.contact, 20) : undefined,
    address: payload.address ? sanitizeText(payload.address, 200) : undefined,
    occupation: payload.occupation ? sanitizeText(payload.occupation, 50) : undefined,
    purok: payload.purok ? sanitizeText(payload.purok, 50) : undefined,
    religion: payload.religion ? sanitizeText(payload.religion, 50) : undefined,
    nationality: payload.nationality ? sanitizeText(payload.nationality, 50) : undefined,
    emergencyContact: payload.emergencyContact ? sanitizeText(payload.emergencyContact, 100) : undefined,
  };

  const existingUsername = await db.queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER(?)",
    sanitizedPayload.username,
  );
  if (existingUsername?.count && existingUsername.count > 0) {
    throw new Error("Username already taken");
  }

  const existingEmail = await db.queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE LOWER(email) = LOWER(?)",
    payload.email,
  );
  if (existingEmail?.count && existingEmail.count > 0) {
    throw new Error("Email already registered");
  }

  const now = new Date().toISOString();
  const newUser = {
    id: uid(),
    username: sanitizedPayload.username,
    password_hash: hashPassword(payload.password),
    full_name: payload.fullName,
    email: payload.email,
    contact: sanitizedPayload.contact ?? "",
    address: sanitizedPayload.address ?? "",
    birthdate: payload.birthdate ?? "",
    gender: payload.gender ?? "",
    role: payload.role ?? "resident",
    approved: payload.role === "super_admin" ? 1 : 0,
    occupation: sanitizedPayload.occupation ?? "",
    is_pwd: payload.isPwd ?? "No",
    civil_status: payload.civilStatus ?? "Single",
    blood_type: payload.bloodType ?? "O+",
    emergency_contact: sanitizedPayload.emergencyContact ?? "",
    emergency_phone: payload.emergencyPhone ?? "",
    purok: sanitizedPayload.purok ?? "",
    religion: sanitizedPayload.religion ?? "",
    nationality: sanitizedPayload.nationality ?? "",
    education_level: payload.educationLevel ?? "",
    philhealth_no: payload.philhealthNo ?? "",
    tin_no: payload.tinNo ?? "",
    voter_id_no: payload.voterIdNo ?? "",
    created_at: now,
  };

  await db.insert("users", newUser);
  const created = toUser(newUser as any);
  await logUserCreated("System", "system", created.id, created.username).catch(() => {});
  return created;
}

// ---------------------------------------------------------------------------
// Authenticate — returns user + session token
// ---------------------------------------------------------------------------
export async function authenticateUser(
  username: string,
  password: string,
  remember: boolean = false,
): Promise<{ user: User; token: string } | null> {
  // Sanitize and normalize username
  const sanitizedUsername = sanitizeText(username, 50).toLowerCase().trim();

  // Check rate limit before processing
  const rateKey = `login:${sanitizedUsername}`;
  const rateCheck = checkRateLimit(rateKey);
  if (!rateCheck.allowed) {
    throw new Error(
      `Too many login attempts. Please try again in ${Math.ceil(rateCheck.resetAfterMs / 1000)} seconds.`,
    );
  }

  // Ensure the database has at least one admin (first-run bootstrap)
  const { readTableData: ensureDb } = await import("./db.server");
  await ensureDb("users");

  const user = await db.queryFirst<DbUser>(
    "SELECT * FROM users WHERE LOWER(username) = LOWER(?)",
    sanitizedUsername,
  );

  if (!user) {
    await logLoginFailed(sanitizedUsername).catch(() => {});
    return null;
  }
  if (!verifyPassword(password, user.password_hash)) {
    await logLoginFailed(sanitizedUsername).catch(() => {});
    return null;
  }

  const userObj = toUser(user);

  // Log successful login
  await logLogin(userObj.fullName, user.id).catch(() => {});

  // Create session
  const token = await createSession(user.id, remember);

  return { user: userObj, token };
}

// ---------------------------------------------------------------------------
// Get user by ID
// ---------------------------------------------------------------------------
export async function getUserById(id: string): Promise<User | null> {
  const user = await db.queryFirst<DbUser>(
    "SELECT * FROM users WHERE id = ?",
    id,
  );
  return user ? toUser(user) : null;
}

// ---------------------------------------------------------------------------
// Get all users
// ---------------------------------------------------------------------------
export async function getAllUsers(): Promise<User[]> {
  const users = await db.query<DbUser>(
    "SELECT * FROM users ORDER BY created_at DESC",
  );
  return users.map(toUser);
}

// ---------------------------------------------------------------------------
// Update user
// ---------------------------------------------------------------------------
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
  civilStatus?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  purok?: string;
  religion?: string;
  nationality?: string;
  educationLevel?: string;
  philhealthNo?: string;
  tinNo?: string;
  voterIdNo?: string;
}

export async function updateUser(payload: UpdateUserPayload): Promise<User> {
  const existing = await db.queryFirst<DbUser>(
    "SELECT * FROM users WHERE id = ?",
    payload.id,
  );
  if (!existing) throw new Error("User not found");

  const dupUsername = await db.queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER(?) AND id != ?",
    payload.username,
    payload.id,
  );
  if (dupUsername?.count && dupUsername.count > 0) {
    throw new Error("Username already taken");
  }

  const dupEmail = await db.queryFirst<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
    payload.email,
    payload.id,
  );
  if (dupEmail?.count && dupEmail.count > 0) {
    throw new Error("Email already registered");
  }

  const updates: Record<string, any> = {
    username: payload.username,
    full_name: payload.fullName,
    email: payload.email,
    role: payload.role,
    contact: payload.contact ?? existing.contact,
    address: payload.address ?? existing.address,
    birthdate: payload.birthdate ?? existing.birthdate,
    gender: payload.gender ?? existing.gender,
    approved: payload.approved === true ? 1 : payload.approved === false ? 0 : existing.approved,
    occupation: payload.occupation ?? existing.occupation,
    is_pwd: payload.isPwd ?? existing.is_pwd,
    civil_status: payload.civilStatus ?? existing.civil_status,
    blood_type: payload.bloodType ?? existing.blood_type,
    emergency_contact: payload.emergencyContact ?? existing.emergency_contact,
    emergency_phone: payload.emergencyPhone ?? existing.emergency_phone,
    purok: payload.purok ?? existing.purok,
    religion: payload.religion ?? existing.religion,
    nationality: payload.nationality ?? existing.nationality,
    education_level: payload.educationLevel ?? existing.education_level,
    philhealth_no: payload.philhealthNo ?? existing.philhealth_no,
    tin_no: payload.tinNo ?? existing.tin_no,
    voter_id_no: payload.voterIdNo ?? existing.voter_id_no,
  };

  if (payload.password && payload.password.length > 0) {
    updates.password_hash = hashPassword(payload.password);
  }

  const updated = await db.update("users", payload.id, updates);
  const result = toUser(updated as any);
  await logUserUpdated(
    "System", "system",
    payload.id, payload.username,
    `role=${payload.role}, approved=${payload.approved}`,
  ).catch(() => {});
  return result;
}

// ---------------------------------------------------------------------------
// Delete user
// ---------------------------------------------------------------------------
export async function deleteUser(id: string): Promise<{ success: boolean }> {
  const user = await db.queryFirst<DbUser>("SELECT full_name, username FROM users WHERE id = ?", id);
  await db.remove("users", id);
  await logUserDeleted(
    "System", "system",
    id,
    user?.username || "unknown",
  ).catch(() => {});
  return { success: true };
}

// ---------------------------------------------------------------------------
// Update profile
// ---------------------------------------------------------------------------
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
  civilStatus?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  purok?: string;
  religion?: string;
  nationality?: string;
  educationLevel?: string;
  philhealthNo?: string;
  tinNo?: string;
  voterIdNo?: string;
}

export async function updateUserProfile(payload: ProfilePayload): Promise<User | null> {
  const existing = await db.queryFirst<DbUser>(
    "SELECT * FROM users WHERE id = ?",
    payload.id,
  );
  if (!existing) return null;

  const updates: Record<string, any> = {
    full_name: payload.fullName,
    email: payload.email,
    contact: payload.contact ?? existing.contact,
    address: payload.address ?? existing.address,
    birthdate: payload.birthdate ?? existing.birthdate,
    gender: payload.gender ?? existing.gender,
  };

  if (payload.occupation !== undefined) updates.occupation = payload.occupation;
  if (payload.isPwd !== undefined) updates.is_pwd = payload.isPwd;
  if (payload.civilStatus !== undefined) updates.civil_status = payload.civilStatus;
  if (payload.bloodType !== undefined) updates.blood_type = payload.bloodType;
  if (payload.emergencyContact !== undefined) updates.emergency_contact = payload.emergencyContact;
  if (payload.emergencyPhone !== undefined) updates.emergency_phone = payload.emergencyPhone;
  if (payload.purok !== undefined) updates.purok = payload.purok;
  if (payload.religion !== undefined) updates.religion = payload.religion;
  if (payload.nationality !== undefined) updates.nationality = payload.nationality;
  if (payload.educationLevel !== undefined) updates.education_level = payload.educationLevel;
  if (payload.philhealthNo !== undefined) updates.philhealth_no = payload.philhealthNo;
  if (payload.tinNo !== undefined) updates.tin_no = payload.tinNo;
  if (payload.voterIdNo !== undefined) updates.voter_id_no = payload.voterIdNo;

  const updated = await db.update("users", payload.id, updates);
  const result = updated ? toUser(updated as any) : null;
  if (result) {
    await logProfileUpdated("System", payload.id).catch(() => {});
  }
  return result;
}

// ---------------------------------------------------------------------------
// Barangay Info
// ---------------------------------------------------------------------------
export async function getBarangayInfo(): Promise<BarangayInfo | null> {
  return db.queryFirst<BarangayInfo>("SELECT * FROM barangay_info WHERE id = 1");
}

export async function saveBarangayInfo(info: Partial<BarangayInfo>): Promise<any> {
  const keys = Object.keys(info);
  const values = Object.values(info);
  const setClause = keys.map((k) => `"${k}" = ?`).join(", ");
  await db.execute(
    `UPDATE barangay_info SET ${setClause}, updated_at = datetime('now') WHERE id = 1`,
    ...values,
  );
  const changedFields = keys.join(", ");
  await logBarangayInfoUpdated("System", "system", changedFields).catch(() => {});
  return getBarangayInfo();
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
export async function getDashboardStats() {
  const residents = await db.count("residents");
  const households = await db.count("households");
  const volunteers = await db.count("volunteers");
  const events = await db.count("events");
  return { residents, households, volunteers, events };
}

// ---------------------------------------------------------------------------
// Table data helpers (legacy compatibility) — re-exported from db.server
// ---------------------------------------------------------------------------
export { readTableData, writeTableData } from "./db.server";

// ---------------------------------------------------------------------------
// Password Reset Flow
// ---------------------------------------------------------------------------
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

function generateOtpCode(): string {
  const buf = randomBytes(3);
  const n = ((buf[0] << 16) | (buf[1] << 8) | buf[2]) % 1_000_000;
  return n.toString().padStart(6, "0");
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await db.queryFirst<DbUser>(
    "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
    normalized,
  );
  if (!user) {
    throw new Error("No account found with that email address.");
  }

  const recent = await db.queryFirst<{ id: string; created_at: string }>(
    "SELECT id, created_at FROM password_resets WHERE LOWER(email) = LOWER(?) AND used = 0 ORDER BY created_at DESC LIMIT 1",
    normalized,
  );
  if (recent && Date.now() - new Date(recent.created_at).getTime() < 30_000) {
    const wait = Math.ceil((30_000 - (Date.now() - new Date(recent.created_at).getTime())) / 1000);
    throw new Error(`Please wait ${wait}s before requesting a new code.`);
  }

  const code = generateOtpCode();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await db.execute(
    "UPDATE password_resets SET used = 1 WHERE LOWER(email) = LOWER(?) AND used = 0",
    normalized,
  );

  await db.insert("password_resets", {
    id: uid(),
    email: normalized,
    code,
    expires_at: expiresAt,
    used: 0,
    attempts: 0,
    created_at: now,
  });

  let emailSent = false;
  let emailError: string | undefined;
  try {
    const { sendOtpEmail } = await import("./email.server");
    const result = await sendOtpEmail({
      to: user.email,
      fullName: user.full_name,
      code,
      expiresMinutes: 5,
    });
    emailSent = result.ok;
    if (!result.ok) emailError = result.error;
    await logPasswordResetRequested(email).catch(() => {});
  } catch (err: any) {
    emailError = err?.message ?? "Email service error";
  }

  return {
    success: true as const,
    email: user.email,
    maskedEmail: maskEmail(user.email),
    fullName: user.full_name,
    expiresInSeconds: 300,
    emailSent,
    emailError,
  };
}

export async function verifyResetCode(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const record = await db.queryFirst<{
    id: string;
    expires_at: string;
    attempts: number;
    used: number;
  }>(
    "SELECT id, expires_at, attempts, used FROM password_resets WHERE LOWER(email) = LOWER(?) AND code = ? AND used = 0",
    normalized,
    code.trim(),
  );
  if (!record) {
    return { success: false as const, reason: "not_found" as const };
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { success: false as const, reason: "expired" as const };
  }
  if (record.attempts >= 5) {
    return { success: false as const, reason: "too_many_attempts" as const };
  }

  await db.execute(
    "UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?",
    record.id,
  );

  return {
    success: true as const,
    resetId: record.id,
    attemptsRemaining: 5 - record.attempts - 1,
  };
}

export async function completePasswordReset(
  email: string,
  code: string,
  newPassword: string,
) {
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new Error("Password must contain an uppercase letter and a number.");
  }

  const normalized = email.trim().toLowerCase();
  const record = await db.queryFirst<{ id: string; expires_at: string; attempts: number }>(
    "SELECT id, expires_at, attempts FROM password_resets WHERE LOWER(email) = LOWER(?) AND code = ? AND used = 0",
    normalized,
    code.trim(),
  );
  if (!record) throw new Error("Invalid or expired code. Please request a new one.");
  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new Error("Code has expired. Please request a new one.");
  }
  if (record.attempts >= 5) {
    throw new Error("Too many failed attempts. Please request a new code.");
  }

  const user = await db.queryFirst<DbUser>(
    "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
    normalized,
  );
  if (!user) throw new Error("User not found.");

  await db.execute(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
    hashPassword(newPassword),
    user.id,
  );
  await db.execute("UPDATE password_resets SET used = 1 WHERE id = ?", record.id);

  const updated = await getUserById(user.id);
  await logPasswordResetCompleted(user.id).catch(() => {});
  return { success: true as const, user: updated };
}
