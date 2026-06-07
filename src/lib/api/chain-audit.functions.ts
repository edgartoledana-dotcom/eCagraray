import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyAuditChain = createServerFn({ method: "POST" })
  .inputValidator(z.object({ limit: z.number().optional() }))
  .handler(async ({ data }) => {
    const { verifyChain } = await import("../chain-audit.server");
    return verifyChain(data.limit ?? 1000);
  });

export const appendAuditEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    actor: z.string().min(1),
    actorId: z.string(),
    action: z.string().min(1),
    target: z.string(),
    details: z.string(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    severity: z.enum(["info", "warning", "critical"]),
  }))
  .handler(async ({ data }) => {
    const { appendAuditChain } = await import("../chain-audit.server");
    return appendAuditChain(data);
  });
