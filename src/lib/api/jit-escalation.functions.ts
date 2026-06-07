import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const requestJITEscalation = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    userId: z.string().min(1),
    userName: z.string().min(1),
    role: z.string().min(1),
    permissions: z.array(z.string()).min(1),
    justification: z.string().min(10).max(500),
  }))
  .handler(async ({ data }) => {
    const { requestEscalation } = await import("../jit-escalation.server");
    return requestEscalation(data);
  });

export const approveJITEscalation = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().min(1),
    approvedBy: z.string().min(1),
    approvedByName: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const { approveEscalation } = await import("../jit-escalation.server");
    await approveEscalation(data.id, data.approvedBy, data.approvedByName);
    return { success: true };
  });

export const revokeJITEscalation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { revokeEscalation } = await import("../jit-escalation.server");
    await revokeEscalation(data.id);
    return { success: true };
  });

export const getActiveJITEscalation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { getActiveEscalation, cleanupExpired } = await import("../jit-escalation.server");
    await cleanupExpired();
    return getActiveEscalation(data.userId);
  });

export const listJITEscalations = createServerFn({ method: "POST" })
  .inputValidator(z.object({ status: z.string().optional() }))
  .handler(async ({ data }) => {
    const { listEscalations, cleanupExpired } = await import("../jit-escalation.server");
    await cleanupExpired();
    return listEscalations(data.status);
  });
