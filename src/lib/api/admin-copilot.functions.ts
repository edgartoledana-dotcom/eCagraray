import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const parseAdminCommand = createServerFn({ method: "POST" })
  .inputValidator(z.object({ command: z.string().min(1).max(2000) }))
  .handler(async ({ data }) => {
    const { parseAdminCommand } = await import("../admin-copilot.server");
    return parseAdminCommand(data.command);
  });

export const executeToolAction = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    action: z.string().min(1),
    params: z.record(z.any()),
    confirmed: z.literal(true),
  }))
  .handler(async ({ data }) => {
    switch (data.action) {
      case "list_audit_entries": {
        const { readAuditLogD1 } = await import("../db-d1.server");
        const entries = await readAuditLogD1(
          data.params.limit ?? 50,
          data.params.severity,
        );
        return { ok: true, data: entries };
      }
      case "export_audit": {
        const { readAuditLogD1 } = await import("../db-d1.server");
        const entries = await readAuditLogD1(data.params.days ? 9999 : 200);
        return { ok: true, data: entries };
      }
      case "list_users": {
        const { getAllUsers } = await import("../auth.server");
        const users = await getAllUsers();
        let filtered = users;
        if (data.params.role) filtered = filtered.filter((u: any) => u.role === data.params.role);
        if (data.params.status === "pending") filtered = filtered.filter((u: any) => !u.approved);
        if (data.params.status === "suspended") filtered = filtered.filter((u: any) => u.suspended);
        return { ok: true, data: filtered.map((u: any) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, approved: u.approved })) };
      }
      case "get_user": {
        const { getUserById } = await import("../auth.server");
        const user = await getUserById(data.params.userId);
        if (!user) return { ok: false, error: "User not found" };
        return { ok: true, data: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, approved: user.approved, createdAt: user.createdAt } };
      }
      case "view_system_metrics": {
        const { getAllUsers } = await import("../auth.server");
        const users = await getAllUsers();
        const { collectSystemMetrics } = await import("../admin");
        const metrics = collectSystemMetrics();
        return { ok: true, data: { ...metrics, totalUsers: users.length } };
      }
      case "run_backup": {
        const { createBackup } = await import("../admin");
        const backup = createBackup(data.params.label || "Co-Pilot Backup");
        return { ok: true, data: { id: backup.id, label: backup.label, tables: backup.tables } };
      }
      case "view_config": {
        const { getSystemConfig } = await import("../admin");
        return { ok: true, data: getSystemConfig() };
      }
      default:
        return { ok: false, error: `Action '${data.action}' execution handler not implemented` };
    }
  });
