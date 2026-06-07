import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Login — returns { user, token } or null
// ---------------------------------------------------------------------------
export const loginUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(1),
      password: z.string().min(1),
      remember: z.boolean().optional().default(false),
    }),
  )
  .handler(async ({ data }) => {
    const { authenticateUser } = await import("../auth.server");
    return authenticateUser(data.username, data.password, data.remember);
  });

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export const registerUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(1),
      password: z.string().min(8),
      fullName: z.string().min(1),
      email: z.string().email(),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
      occupation: z.string().optional(),
      isPwd: z.string().optional(),
      civilStatus: z.string().optional(),
      bloodType: z.string().optional(),
      emergencyContact: z.string().optional(),
      emergencyPhone: z.string().optional(),
      purok: z.string().optional(),
      religion: z.string().optional(),
      nationality: z.string().optional(),
      educationLevel: z.string().optional(),
      philhealthNo: z.string().optional(),
      tinNo: z.string().optional(),
      voterIdNo: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { createUser } = await import("../auth.server");
    const result = await createUser({ ...data, role: "resident" } as any);
    notifyBadgeHub("users").catch(() => {});
    return result;
  });

// ---------------------------------------------------------------------------
// Validate session token
// ---------------------------------------------------------------------------
export const validateSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { validateSession: validateFn } = await import("../auth.server");
    return validateFn(data.token);
  });

// ---------------------------------------------------------------------------
// Logout — clear session
// ---------------------------------------------------------------------------
export const logoutUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { clearSession, getAuthUserFromToken } = await import("../auth.server");
    const { logLogout } = await import("../audit.server");
    // Resolve caller identity BEFORE clearing session
    let actorName = "User";
    let actorId = "unknown";
    try {
      const { user } = await getAuthUserFromToken(data.token);
      actorName = user.fullName;
      actorId = user.id;
    } catch {}
    await clearSession(data.token);
    await logLogout(actorName, actorId).catch(() => {});
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Fetch user by ID
// ---------------------------------------------------------------------------
export const fetchUserById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().optional(), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAuth(data.token);
    const { getUserById } = await import("../auth.server");
    return getUserById(data.id);
  });

// ---------------------------------------------------------------------------
// RBAC helpers — used inline in handlers
// ---------------------------------------------------------------------------

/** Require the caller to have a valid session and one of the listed roles */
async function requireRole(token: string | undefined | null, ...roles: string[]): Promise<any> {
  const { requireRole: enforce } = await import("../auth.server");
  return enforce(token, ...roles as any);
}

/** Require the caller to be authenticated (any role) */
async function requireAuth(token: string | undefined | null): Promise<any> {
  const { getAuthUserFromToken } = await import("../auth.server");
  const result = await getAuthUserFromToken(token);
  return result.user;
}

// ---------------------------------------------------------------------------
// Get all users — super_admin only
// ---------------------------------------------------------------------------
export const getUsers = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().optional() }))
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin");
    const { getAllUsers } = await import("../auth.server");
    return getAllUsers();
  });

// ---------------------------------------------------------------------------
// Create user (admin) — super_admin only
// ---------------------------------------------------------------------------
export const createUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().optional(),
      username: z.string().min(1),
      password: z.string().min(8),
      fullName: z.string().min(1),
      email: z.string().email(),
      role: z.string().optional(),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
      occupation: z.string().optional(),
      isPwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin");
    const { createUser: createServerUser } = await import("../auth.server");
    const result = await createServerUser(data as any);
    notifyBadgeHub("users").catch(() => {});
    return result;
  });

// ---------------------------------------------------------------------------
// Update user — super_admin only
// ---------------------------------------------------------------------------
export const updateUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().optional(),
      id: z.string().min(1),
      username: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email(),
      role: z.string().min(1),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
      password: z.string().min(8).or(z.literal("")).optional(),
      approved: z.boolean().optional(),
      occupation: z.string().optional(),
      isPwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin");
    const { updateUser: updateServerUser } = await import("../auth.server");
    const result = await updateServerUser(data as any);
    notifyBadgeHub("users").catch(() => {});
    return result;
  });

// ---------------------------------------------------------------------------
// Delete user — super_admin only
// ---------------------------------------------------------------------------
export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().optional(), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin");
    const { deleteUser: removeUser } = await import("../auth.server");
    const result = await removeUser(data.id);
    notifyBadgeHub("users").catch(() => {});
    return result;
  });

// ---------------------------------------------------------------------------
// Barangay Info
// ---------------------------------------------------------------------------
export const getBarangayInfo = createServerFn({ method: "POST" })
  .handler(async () => {
    const { getBarangayInfo: getInfo } = await import("../auth.server");
    return getInfo();
  });

export const saveBarangayInfo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().optional(),
      name: z.string().optional(),
      municipality: z.string().optional(),
      province: z.string().optional(),
      address: z.string().optional(),
      contact: z.string().optional(),
      email: z.string().optional(),
      captain: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin", "captain", "secretary");
    const { saveBarangayInfo: saveInfo } = await import("../auth.server");
    return saveInfo(data);
  });

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
export const getDashboardStats = createServerFn({ method: "POST" })
  .handler(async () => {
    const { getDashboardStats: getStats } = await import("../auth.server");
    return getStats();
  });

// ---------------------------------------------------------------------------
// Inquiries (contact form)
// ---------------------------------------------------------------------------
export const submitContactInquiry = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      subject: z.string().optional().default(""),
      message: z.string().min(1),
      type: z.enum(["general", "bug", "feature", "feedback"]).optional().default("general"),
      meta: z.record(z.union([z.string(), z.number()])).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { readTableData, writeTableData } = await import("../auth.server");
    const existing = ((await readTableData("inquiries")) as any[]) || [];
    const now = new Date().toISOString();
    const newInquiry = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
      type: data.type,
      status: "new",
      name: data.name,
      email: data.email,
      subject: data.subject ?? "",
      message: data.message,
      meta: data.meta ?? {},
      createdAt: now,
      updatedAt: now,
    };
    await writeTableData("inquiries", [newInquiry, ...existing]);
    notifyBadgeHub("inquiries").catch(() => {});

    // Fire-and-forget email notifications
    (async () => {
      try {
        const { sendInquiryAdminEmail, sendInquiryAutoReply } = await import("../email.server");
        const adminEmail = "ecagraraymanagementsystem@gmail.com";
        const adminResult = await sendInquiryAdminEmail({
          adminEmail,
          kind: data.type as any,
          name: data.name,
          email: data.email,
          subject: data.subject ?? "",
          message: data.message,
          meta: data.meta as any,
          id: newInquiry.id,
          createdAt: now,
        });
        if (!adminResult.ok) {
          console.warn(`[inquiry] admin email failed: ${adminResult.error ?? "unknown"}`);
        }
        if (data.email) {
          await sendInquiryAutoReply({
            to: data.email,
            kind: data.type as any,
            name: data.name,
            subject: data.subject ?? "",
            id: newInquiry.id,
          });
        }
      } catch (err) {
        console.warn("[inquiry] email dispatch failed:", err);
      }
    })();

    // Log inquiry submission
    try {
      const { logInquirySubmitted } = await import("../audit.server");
      await logInquirySubmitted(data.name, data.email).catch(() => {});
    } catch {}

    return { success: true, id: newInquiry.id };
  });

export const updateInquiryStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().optional(),
      id: z.string().min(1),
      status: z.enum(["new", "in_review", "resolved", "closed"]),
    }),
  )
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin", "secretary");
    const { readTableData, writeTableData } = await import("../auth.server");
    const existing = ((await readTableData("inquiries")) as any[]) || [];
    const next = existing.map((inq) =>
      inq.id === data.id
        ? { ...inq, status: data.status, updatedAt: new Date().toISOString() }
        : inq,
    );
    await writeTableData("inquiries", next);
    notifyBadgeHub("inquiries").catch(() => {});
    return { success: true };
  });

export const deleteInquiry = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().optional(), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin", "secretary");
    const { readTableData, writeTableData } = await import("../auth.server");
    const existing = ((await readTableData("inquiries")) as any[]) || [];
    await writeTableData("inquiries", existing.filter((i) => i.id !== data.id));
    notifyBadgeHub("inquiries").catch(() => {});
    return { success: true };
  });

export const sendInquiryReply = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().optional(),
      to: z.string().email(),
      name: z.string().min(1),
      originalSubject: z.string(),
      originalMessage: z.string().min(1),
      replyMessage: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin", "secretary");
    const { sendEmail, renderInquiryReply } = await import("../email.server");
    const { subject, html, text } = renderInquiryReply({
      name: data.name,
      originalSubject: data.originalSubject,
      originalMessage: data.originalMessage,
      replyMessage: data.replyMessage,
      replyDate: new Date().toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" }),
    });
    const result = await sendEmail({
      to: data.to,
      subject,
      html,
      text,
    });
    if (!result.ok) {
      return { success: false, error: result.error ?? "Failed to send email" };
    }
    return { success: true, messageId: result.messageId };
  });

export const listInquiries = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().optional() }))
  .handler(async ({ data }) => {
    await requireRole(data.token, "super_admin", "secretary");
    const { readTableData } = await import("../auth.server");
    const list = ((await readTableData("inquiries")) as any[]) || [];
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------
export const updateUserProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().optional(),
      id: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email(),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Require auth + verify the caller owns this profile (or is super_admin)
    const caller = await requireAuth(data.token);
    if (caller.id !== data.id && caller.role !== "super_admin") {
      throw new Error("Unauthorized: you can only update your own profile");
    }
    const { updateUserProfile } = await import("../auth.server");
    const result = await updateUserProfile(data);
    notifyBadgeHub("users").catch(() => {});
    return result;
  });

// ---------------------------------------------------------------------------
// BadgeHub notification helper — notifies the BadgeHub Durable Object that
// a table's data has changed so it can push a real-time badge update to all
// connected WebSocket clients.
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget notification to the BadgeHub DO that a table's data changed.
 * Silently fails if the DO binding is unavailable (e.g., local Node.js dev).
 */
async function notifyBadgeHub(table: string) {
  try {
    const specifier = "cloudflare:workers";
    const { env } = await import(/* @vite-ignore */ specifier);
    const badgeEnv = env as { BADGE_HUB?: { getByName(name: string): { fetch(req: Request | string, init?: any): Promise<any> } } };
    if (!badgeEnv.BADGE_HUB) return;
    const stub = badgeEnv.BADGE_HUB.getByName("global");
    await stub.fetch("http://do/_badge/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ table }),
    });
  } catch {
    // BadgeHub not available — badge counts will update on next poll cycle
  }
}

// ---------------------------------------------------------------------------
// Generic table data operations (used by CrudPage)
// Maps each table to the roles that can access it.
// ---------------------------------------------------------------------------

/** 
 * Tables that are publicly readable (no authentication required).
 * These are used by the public landing page and alert banner.
 */
// Audit logging helpers — resolves caller identity and writes an audit entry.
// Uses the locally-defined requireAuth which imports from auth.server internally.
async function auditAction(action: string, target: string, details: string, token?: string | null, severity: "info" | "warning" | "critical" = "info") {
  try {
    const { logAudit } = await import("../audit.server");
    let actor = "System";
    let actorId = "system";
    try {
      const caller = await requireAuth(token);
      actor = caller.fullName;
      actorId = caller.id;
    } catch {}
    await logAudit({ actor, actorId, action, target, details, severity });
  } catch {}
}

const PUBLIC_TABLES = new Set([
  "announcements", "alerts", "events", "officials", "residents",
  "inquiries", "households", "volunteers",
]);

/** Write-access roles per table. Only authenticated users with matching roles can write. */
const TABLE_WRITE_ROLES: Record<string, string[]> = {
  announcements: ["super_admin", "captain", "secretary"],
  alerts: ["super_admin", "captain", "disaster"],
  incidents: ["super_admin", "captain", "disaster"],
  complaints: ["super_admin", "secretary", "captain"],
  document_requests: ["super_admin", "secretary"],
  emergency_requests: ["super_admin", "disaster", "captain"],
  evac_centers: ["super_admin", "disaster", "captain"],
  residents: ["super_admin", "secretary"],
  households: ["super_admin", "secretary"],
  officials: ["super_admin"],
  volunteers: ["super_admin", "sk_officer", "disaster"],
  youth: ["super_admin", "sk_officer"],
  events: ["super_admin", "sk_officer", "captain"],
  polls: ["super_admin", "sk_officer", "captain"],
  inquiries: ["super_admin", "secretary"],
  notifications: ["super_admin", "captain", "secretary"],
  password_resets: ["super_admin"],
  app_data: ["super_admin"],
};

/** Get allowed roles for writing to a table */
function getTableWriteRoles(table: string): string[] {
  return TABLE_WRITE_ROLES[table] || ["super_admin"];
}

/** Require auth + role for write, allow public read for public tables */
async function requireTableAccess(
  token: string | null | undefined,
  table: string,
  writeAccess: boolean,
): Promise<void> {
  if (writeAccess) {
    // Write operations always require auth + role
    await requireRole(token, ...getTableWriteRoles(table) as any);
  } else if (!PUBLIC_TABLES.has(table)) {
    // Non-public tables require auth for read too
    await requireAuth(token);
  }
  // Public tables are readable without auth
}

export const getTableData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().optional(), table: z.string() }))
  .handler(async ({ data }) => {
    await requireTableAccess(data.token, data.table, false);
    const { readTableData } = await import("../auth.server");
    const rows = await readTableData(data.table);
    await auditAction("read_table", data.table, `Read ${rows.length} rows`, data.token);
    return rows;
  });

export const saveTableData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().optional(), table: z.string(), data: z.array(z.any()) }))
  .handler(async ({ data }) => {
    await requireTableAccess(data.token, data.table, true);
    const { writeTableData } = await import("../auth.server");
    const result = await writeTableData(data.table, data.data);
    await auditAction("write_table", data.table, `Wrote ${data.data.length} rows`, data.token);
    // Notify BadgeHub for instant badge update on all connected dashboards
    notifyBadgeHub(data.table).catch(() => {});
    return result;
  });

// ---------------------------------------------------------------------------
// Password reset flow
// ---------------------------------------------------------------------------
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const { requestPasswordReset: serverFn } = await import("../auth.server");
    return serverFn(data.email);
  });

export const verifyResetCode = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), code: z.string().min(6).max(6) }))
  .handler(async ({ data }) => {
    const { verifyResetCode: serverFn } = await import("../auth.server");
    return serverFn(data.email, data.code);
  });

export const completePasswordReset = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      code: z.string().min(6).max(6),
      newPassword: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    const { completePasswordReset: serverFn } = await import("../auth.server");
    return serverFn(data.email, data.code, data.newPassword);
  });
