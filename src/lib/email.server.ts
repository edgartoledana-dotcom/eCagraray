// Email service for e-Cagraray
// Supports Resend HTTP API (recommended for Cloudflare Workers).
// Falls back to console logging when not configured (dev mode).

const FROM_NAME = "e-Cagraray Smart Barangay";
const DEFAULT_FROM = "noreply@ecagraray.app";
const SUPPORTED_FROM_DOMAINS = ["ecagraray.app", "ecagraray.gov.ph"];

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailResult {
  ok: boolean;
  messageId?: string;
  provider: "resend" | "console";
  error?: string;
}

function isFromDomainAllowed(from: string): boolean {
  const domain = from.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return SUPPORTED_FROM_DOMAINS.includes(domain);
}

async function sendViaResend(payload: EmailPayload, apiKey: string, from: string): Promise<EmailResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${from}>`,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      return { ok: false, provider: "resend", error: `Resend ${response.status}: ${body}` };
    }
    const data = (await response.json()) as { id?: string };
    return { ok: true, messageId: data.id, provider: "resend" };
  } catch (err: any) {
    return { ok: false, provider: "resend", error: err?.message ?? "Network error" };
  }
}

export function renderOtpEmail(opts: {
  fullName: string;
  code: string;
  expiresMinutes: number;
  lang?: "en" | "fil" | "bik";
}): { subject: string; html: string; text: string } {
  const lang = opts.lang ?? "en";
  const subjectByLang = {
    en: "Your e-Cagraray verification code",
    fil: "Ang iyong e-Cagraray verification code",
    bik: "An saimong e-Cagraray verification code",
  } as const;
  const introByLang = {
    en: `Hello ${opts.fullName}, use the code below to verify your password reset request.`,
    fil: `Kumusta ${opts.fullName}, gamitin ang code sa ibaba para i-verify ang iyong password reset.`,
    bik: `Kumusta ${opts.fullName}, gamiton an code sa ibaba para i-verify an saimong password reset.`,
  } as const;
  const subject = subjectByLang[lang];
  const intro = introByLang[lang];
  const expiresText = `This code expires in ${opts.expiresMinutes} minutes.`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#0F4C81 0%,#2563EB 100%);color:#ffffff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.01em">e-Cagraray</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.9">Smart Barangay Portal</p>
        </div>
        <div style="padding:28px 24px">
          <p style="margin:0 0 16px;font-size:15px;color:#0f172a;line-height:1.55">${intro}</p>
          <div style="background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:12px;padding:18px;text-align:center;margin:18px 0">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:800;letter-spacing:0.4em;color:#0F4C81">${opts.code}</div>
          </div>
          <p style="margin:0 0 6px;font-size:13px;color:#475569;line-height:1.5">${expiresText}</p>
          <p style="margin:18px 0 0;font-size:12px;color:#64748b;line-height:1.5">If you did not request this code, please ignore this email or contact the Barangay Secretariat.</p>
        </div>
        <div style="background:#f8fafc;padding:14px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">© e-Cagraray · Republic of the Philippines · Brgy. Cagraray, Bato, Catanduanes</p>
        </div>
      </div>
    </div>
  `;
  const text = `${intro}\n\nVerification code: ${opts.code}\n\n${expiresText}\n\nIf you did not request this code, please ignore this email.`;
  return { subject, html, text };
}

export async function sendOtpEmail(opts: {
  to: string;
  fullName: string;
  code: string;
  expiresMinutes?: number;
  lang?: "en" | "fil" | "bik";
}): Promise<EmailResult> {
  const { subject, html, text } = renderOtpEmail({
    fullName: opts.fullName,
    code: opts.code,
    expiresMinutes: opts.expiresMinutes ?? 5,
    lang: opts.lang,
  });
  return sendEmail({ to: opts.to, subject, html, text });
}

export type InquiryKind = "bug" | "feature" | "feedback" | "general";

const INQUIRY_KIND_LABEL: Record<InquiryKind, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  feedback: "Feedback",
  general: "Contact Inquiry",
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInquiryAdminEmail(opts: {
  kind: InquiryKind;
  name: string;
  email: string;
  subject: string;
  message: string;
  meta?: Record<string, string | number | undefined>;
  id: string;
  createdAt: string;
}): { subject: string; html: string; text: string } {
  const label = INQUIRY_KIND_LABEL[opts.kind] ?? "Contact";
  const subject = `[${label}] ${opts.subject || "New submission"} — from ${opts.name}`;
  const metaRows = Object.entries(opts.meta ?? {})
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">${escHtml(k)}</td><td style="padding:6px 12px;color:#0f172a;font-size:14px">${escHtml(String(v))}</td></tr>`)
    .join("");
  const metaTable = metaRows
    ? `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">${metaRows}</table>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="padding:18px 24px;background:linear-gradient(135deg,#0f766e,#0e7490);color:#ffffff">
    <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.85">${escHtml(label)}</div>
    <div style="font-size:18px;font-weight:700;margin-top:4px">${escHtml(opts.subject || "(no subject)")}</div>
  </div>
  <div style="padding:24px">
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;width:120px">From</td><td style="padding:6px 12px;color:#0f172a;font-size:14px"><b>${escHtml(opts.name)}</b> &lt;<a href="mailto:${escHtml(opts.email)}" style="color:#0e7490">${escHtml(opts.email)}</a>&gt;</td></tr>
      <tr><td style="padding:6px 12px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">ID</td><td style="padding:6px 12px;color:#0f172a;font-size:14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${escHtml(opts.id)}</td></tr>
      <tr><td style="padding:6px 12px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">Received</td><td style="padding:6px 12px;color:#0f172a;font-size:14px">${escHtml(opts.createdAt)}</td></tr>
    </table>
    <div style="margin-top:18px;padding:16px;background:#f8fafc;border-left:4px solid #0e7490;border-radius:6px;color:#0f172a;font-size:14px;line-height:1.55;white-space:pre-wrap">${escHtml(opts.message)}</div>
    ${metaTable}
    <div style="margin-top:24px;text-align:center">
      <a href="https://ecagraray.app/dashboard/contact-messages" style="display:inline-block;padding:12px 22px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Open in dashboard</a>
    </div>
    <p style="margin-top:18px;color:#94a3b8;font-size:11px;text-align:center">Reply directly to this email to respond to ${escHtml(opts.name)}.</p>
  </div>
</div>
</body></html>`;
  const text = `${label}: ${opts.subject}\n\nFrom: ${opts.name} <${opts.email}>\nID: ${opts.id}\nReceived: ${opts.createdAt}\n\n${opts.message}\n\n${Object.entries(opts.meta ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nOpen: https://ecagraray.app/dashboard/contact-messages`;
  return { subject, html, text };
}

export function renderInquiryAutoReply(opts: {
  kind: InquiryKind;
  name: string;
  subject: string;
  id: string;
}): { subject: string; html: string; text: string } {
  const label = INQUIRY_KIND_LABEL[opts.kind] ?? "Message";
  const subject = `We received your ${label.toLowerCase()} — e-Cagraray`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="padding:18px 24px;background:linear-gradient(135deg,#0f766e,#0e7490);color:#ffffff">
    <div style="font-size:18px;font-weight:700">Thank you, ${escHtml(opts.name.split(" ")[0] || opts.name)}!</div>
    <div style="font-size:13px;opacity:0.9;margin-top:4px">We received your ${escHtml(label.toLowerCase())}</div>
  </div>
  <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6">
    <p>Salamat sa pagpapadala! Your <b>${escHtml(label.toLowerCase())}</b> has been logged with reference ID:</p>
    <p style="text-align:center;margin:20px 0"><code style="display:inline-block;padding:10px 16px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#0f172a">${escHtml(opts.id)}</code></p>
    <p>The system administrator will review your <b>"${escHtml(opts.subject || "(no subject)")}"</b> shortly. If we need more information, we'll reach out via the email you provided.</p>
    <p style="margin-top:24px">Mabuhay!<br/><b>The e-Cagraray Smart Barangay Team</b><br/><span style="color:#64748b;font-size:12px">Brgy. Cagraray, Bato, Catanduanes</span></p>
  </div>
</div>
</body></html>`;
  const text = `Thank you, ${opts.name}!\n\nWe received your ${label.toLowerCase()} with reference ID: ${opts.id}.\n\nSubject: ${opts.subject}\n\nThe system administrator will review it shortly. If we need more information, we'll reach out via the email you provided.\n\nMabuhay!\nThe e-Cagraray Smart Barangay Team\nBrgy. Cagraray, Bato, Catanduanes`;
  return { subject, html, text };
}

export async function sendInquiryAdminEmail(opts: {
  adminEmail: string;
  kind: InquiryKind;
  name: string;
  email: string;
  subject: string;
  message: string;
  meta?: Record<string, string | number | undefined>;
  id: string;
  createdAt: string;
}): Promise<EmailResult> {
  const { subject, html, text } = renderInquiryAdminEmail(opts);
  return sendEmail({ to: opts.adminEmail, subject, html, text, replyTo: opts.email });
}

export function renderInquiryReply(opts: {
  name: string;
  originalSubject: string;
  originalMessage: string;
  replyMessage: string;
  replyDate: string;
}): { subject: string; html: string; text: string } {
  const subject = `Re: ${opts.originalSubject || "Your submission to e-Cagraray"}`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="padding:18px 24px;background:#0F4C81;color:#ffffff">
    <div style="font-size:18px;font-weight:700">Re: ${escHtml(opts.originalSubject || "Your submission")}</div>
    <div style="font-size:13px;opacity:0.9;margin-top:4px">Reply from the Barangay Secretariat</div>
  </div>
  <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6">
    <p>Hello <b>${escHtml(opts.name)}</b>,</p>
    <div style="padding:16px;background:#f0f9ff;border-left:4px solid #0F4C81;border-radius:6px;margin:16px 0;color:#0f172a;white-space:pre-wrap">${escHtml(opts.replyMessage)}</div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
    <p style="font-size:12px;color:#64748b;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">Your original message</p>
    <div style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;color:#475569;white-space:pre-wrap">${escHtml(opts.originalMessage)}</div>
    <p style="margin-top:20px;font-size:12px;color:#94a3b8">Sent ${escHtml(opts.replyDate)}</p>
    <p style="margin-top:20px">Mabuhay!<br/><b>The e-Cagraray Smart Barangay Team</b><br/><span style="color:#64748b;font-size:12px">Brgy. Cagraray, Bato, Catanduanes</span></p>
  </div>
</div>
</body></html>`;
  const text = `Hello ${opts.name},\n\n${opts.replyMessage}\n\n---\nYour original message:\n${opts.originalMessage}\n\nSent ${opts.replyDate}\n\nMabuhay!\nThe e-Cagraray Smart Barangay Team\nBrgy. Cagraray, Bato, Catanduanes`;
  return { subject, html, text };
}

export async function sendInquiryAutoReply(opts: {
  to: string;
  kind: InquiryKind;
  name: string;
  subject: string;
  id: string;
}): Promise<EmailResult> {
  const { subject, html, text } = renderInquiryAutoReply(opts);
  return sendEmail({ to: opts.to, subject, html, text });
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = (typeof process !== "undefined" && (process.env as any)?.RESEND_API_KEY) || "";
  const fromAddress =
    (typeof process !== "undefined" && (process.env as any)?.EMAIL_FROM) || DEFAULT_FROM;
  const envReplyTo = (typeof process !== "undefined" && (process.env as any)?.EMAIL_REPLY_TO) || "ecagraraymanagementsystem@gmail.com";
  const replyTo = payload.replyTo ?? envReplyTo;

  if (!apiKey) {
    // Dev fallback: log to console. The UI also shows the code so the user can complete the flow.
    // eslint-disable-next-line no-console
    console.log(
      `[email:dev] To: ${payload.to} | From: ${fromAddress} | Reply-To: ${replyTo} | Subject: ${payload.subject}\n${payload.text}`,
    );
    return { ok: true, provider: "console" };
  }

  if (!isFromDomainAllowed(fromAddress)) {
    return {
      ok: false,
      provider: "resend",
      error: `Sender domain "${fromAddress.split("@")[1]}" not onboarded. Add it via wrangler or set EMAIL_FROM to a verified domain.`,
    };
  }

  return sendViaResend({ ...payload, replyTo }, apiKey, fromAddress);
}
