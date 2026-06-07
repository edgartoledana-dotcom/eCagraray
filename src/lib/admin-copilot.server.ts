import { askAI } from "./ai.server";

export interface CopilotToolCall {
  action: string;
  params: Record<string, any>;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface CopilotResult {
  toolCall: CopilotToolCall | null;
  explanation: string;
  needsConfirmation: boolean;
  raw: string;
}

const SYSTEM_PROMPT = `You are the Admin Co-Pilot for the e-Cagraray Smart Barangay Management System.
Your role is to parse natural language admin commands and convert them into structured tool calls.

Available tools and their risk levels:

TOOL: list_audit_entries
  params: { days?: number, severity?: "info"|"warning"|"critical", limit?: number }
  description: "View recent audit log entries, optionally filtered by days or severity."
  risk: "low"

TOOL: export_audit
  params: { days?: number }
  description: "Export audit log entries from the last N days as JSON."
  risk: "low"

TOOL: list_users
  params: { role?: string, status?: "active"|"pending"|"suspended" }
  description: "List all system users, optionally filtered by role or status."
  risk: "low"

TOOL: get_user
  params: { userId: string }
  description: "View details for a specific user by ID."
  risk: "low"

TOOL: revoke_user
  params: { userId: string, reason?: string }
  description: "Revoke/suspend a user's access to the system."
  risk: "critical"

TOOL: list_escalations
  params: { status?: "active"|"expired"|"revoked" }
  description: "View current JIT privilege escalation requests."
  risk: "low"

TOOL: generate_api_token
  params: { expiresInHours: number, label?: string }
  description: "Generate a 24-hour temporary API token for external access."
  risk: "high"

TOOL: view_system_metrics
  params: {}
  description: "View current system health metrics (users, storage, uptime)."
  risk: "low"

TOOL: run_backup
  params: { label?: string }
  description: "Trigger an on-demand system backup."
  risk: "medium"

TOOL: view_config
  params: {}
  description: "View current system configuration."
  risk: "low"

TOOL: update_config
  params: { key: string, value: any }
  description: "Update a system configuration setting."
  risk: "high"

TOOL: unknown
  params: { query: string }
  description: "When the request does not match any known tool, explain what you can do."
  risk: "low"

Rules:
1. Always output ONLY a JSON object with fields: toolCall (object with action, params, description, riskLevel) or null, explanation (string explaining what you understood), needsConfirmation (boolean — true for risk medium+).
2. For risk "low" actions like viewing audit logs or listing users, set needsConfirmation to false.
3. For risk "medium" actions like running backup, set needsConfirmation to true.
4. For risk "high" actions like generating tokens or updating config, always set needsConfirmation to true.
5. For risk "critical" actions like revoking user access, always set needsConfirmation to true.
6. If the user's request is ambiguous or doesn't match a tool, use toolCall: null and explain what tools are available.
7. Never attempt to execute SQL directly — you can only use the approved tool list.
8. Be concise in explanations — 1-2 sentences max.`;

export async function parseAdminCommand(command: string): Promise<CopilotResult> {
  const result = await askAI({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: command }],
    maxTokens: 512,
    temperature: 0.1,
  });

  const raw = result.text;
  let parsed: any = null;

  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end > start) {
        parsed = JSON.parse(raw.slice(start, end + 1));
      }
    } catch {}
  }

  if (!parsed || !parsed.toolCall) {
    return {
      toolCall: null,
      explanation: parsed?.explanation || "Could not parse your command into a system action.",
      needsConfirmation: false,
      raw,
    };
  }

  return {
    toolCall: {
      action: parsed.toolCall.action || "unknown",
      params: parsed.toolCall.params || {},
      description: parsed.toolCall.description || "",
      riskLevel: parsed.toolCall.riskLevel || "low",
    },
    explanation: parsed.explanation || "",
    needsConfirmation: parsed.needsConfirmation !== false,
    raw,
  };
}

export function validateToolCall(toolCall: CopilotToolCall): { valid: boolean; error?: string } {
  const VALID_ACTIONS = [
    "list_audit_entries", "export_audit", "list_users", "get_user",
    "revoke_user", "list_escalations", "generate_api_token",
    "view_system_metrics", "run_backup", "view_config", "update_config",
  ];

  if (!VALID_ACTIONS.includes(toolCall.action)) {
    return { valid: false, error: `Unknown action: ${toolCall.action}` };
  }

  if (toolCall.action === "revoke_user" && !toolCall.params.userId) {
    return { valid: false, error: "userId is required for revoke_user" };
  }

  if (toolCall.action === "generate_api_token" && !toolCall.params.expiresInHours) {
    return { valid: false, error: "expiresInHours is required for generate_api_token" };
  }

  if (toolCall.action === "update_config" && (!toolCall.params.key || toolCall.params.value === undefined)) {
    return { valid: false, error: "key and value are required for update_config" };
  }

  if (toolCall.action === "get_user" && !toolCall.params.userId) {
    return { valid: false, error: "userId is required for get_user" };
  }

  return { valid: true };
}
