import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const langSchema = z.enum(["en", "fil", "bik"]);

/**
 * Server function: ask Cagri AI (Cloudflare Workers AI).
 *
 * Inputs:
 *   - messages: full chat history (system + user + assistant turns)
 *   - lang: response language hint (en | fil | bik)
 *   - systemPrompt: optional override (e.g. inject barangay context)
 *   - maxTokens: optional cap
 *   - temperature: optional sampling (default 0.4)
 *
 * Returns:
 *   { text, usedLLM, model, latencyMs, error? }
 *
 * When Workers AI is unavailable (local dev without binding), usedLLM is
 * false and the client falls back to its smart-rule engine.
 */
export const askAI = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z.array(messageSchema).min(1).max(20),
      lang: langSchema.optional().default("en"),
      systemPrompt: z.string().max(2000).optional(),
      maxTokens: z.number().int().min(32).max(1024).optional(),
      temperature: z.number().min(0).max(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { askAI: ask } = await import("../ai.server");
    return ask({
      messages: data.messages,
      lang: data.lang,
      systemPrompt: data.systemPrompt,
      maxTokens: data.maxTokens,
      temperature: data.temperature,
    });
  });

/**
 * Cheap ping for the client to decide whether to show the
 * "Ask Cagri AI Pro" affordance.
 */
export const pingAI = createServerFn({ method: "GET" }).handler(async () => {
  const { isAIAvailable } = await import("../ai.server");
  return { available: await isAIAvailable() };
});
