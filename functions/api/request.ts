/// <reference types="@cloudflare/workers-types" />
// POST /api/request — receives service requests and contact inquiries.
// Layers: origin check (CSRF) → body size cap → honeypot + time trap → Turnstile →
// rate limit → server-side validation → upload validation → lead ID → email + optional webhook.
import { validate, type FormKind, type Values } from "../../src/lib/forms";
import { buildLead, confirmationEmail, emailHtml, emailSubject, emailText, formatLeadId, type Lead } from "../../src/lib/lead";
import { checkUploads, type CheckedFile } from "../../src/lib/uploads";

interface Env {
  SALES_EMAIL?: string; // default sales@selorin.co
  MAIL_FROM?: string; // e.g. "Selorin Website <website@selorin.co>" — domain must be verified with the provider
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  ALLOWED_ORIGINS?: string; // comma-separated, e.g. "https://selorin.co,https://www.selorin.co"
  SEND_CONFIRMATION?: string; // "true" to email the client a confirmation
  LEAD_WEBHOOK_URL?: string; // optional CRM / automation endpoint (receives the Lead JSON)
  LEAD_WEBHOOK_SECRET?: string;
  DB?: D1Database; // optional: lead log + sequential IDs + rate limiting
  EMAIL_DRY_RUN?: string; // "true" in local development: log emails instead of sending
}

const MAX_BODY = 12 * 1024 * 1024;
const RATE = { windowMinutes: 10, max: 5 };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function originAllowed(request: Request, env: Env) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = (env.ALLOWED_ORIGINS ?? "https://selorin.co,https://www.selorin.co").split(",").map((s) => s.trim());
  const url = new URL(origin);
  return allowed.includes(origin) || url.hostname.endsWith(".pages.dev") || url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(env: Env, token: string, ip: string) {
  if (!env.TURNSTILE_SECRET) return true; // not configured (local/dev)
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

async function nextLeadId(env: Env, now: Date): Promise<string> {
  const year = now.getUTCFullYear();
  if (env.DB) {
    const row = await env.DB.prepare(
      "INSERT INTO lead_counters (year, value) VALUES (?1, 1) ON CONFLICT(year) DO UPDATE SET value = value + 1 RETURNING value",
    ).bind(year).first<{ value: number }>();
    if (row) return formatLeadId(year, row.value);
  }
  // Fallback without a database: unique but not sequential.
  const rand = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return formatLeadId(year, rand);
}

async function rateLimited(env: Env, ipHash: string) {
  if (!env.DB) return false;
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ?1 AND submitted_at > datetime('now', ?2)`,
  ).bind(ipHash, `-${RATE.windowMinutes} minutes`).first<{ n: number }>();
  return (row?.n ?? 0) >= RATE.max;
}

const b64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

async function sendEmail(env: Env, msg: { to: string; subject: string; text: string; html?: string; replyTo?: string; files?: CheckedFile[] }) {
  if (env.EMAIL_DRY_RUN === "true") {
    console.log(`[dry-run email] to=${msg.to} reply-to=${msg.replyTo ?? "-"} subject=${msg.subject} attachments=${msg.files?.map((f) => f.name).join(",") || "none"}\n${msg.text}`);
    return;
  }
  if (!env.RESEND_API_KEY) throw new Error("Email provider not configured (RESEND_API_KEY)");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM ?? "Selorin Website <website@selorin.co>",
      to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html,
      reply_to: msg.replyTo,
      attachments: msg.files?.map((f) => ({ filename: f.name, content: b64(f.bytes), content_type: f.type })),
    }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
}

async function logLead(env: Env, lead: Lead, ipHash: string, delivered: boolean) {
  if (!env.DB) return;
  await env.DB.prepare(
    `INSERT INTO leads (lead_id, kind, submitted_at, service, industry, company, contact_name, email, phone, location, source_page, utm_source, utm_medium, utm_campaign, urgent, ip_hash, delivered, payload)
     VALUES (?1, ?2, datetime('now'), ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)`,
  ).bind(
    lead.leadId, lead.kind, lead.service.slug, lead.industry, lead.company, lead.contactName, lead.email, lead.phone, lead.location,
    lead.sourcePage, lead.utm.source, lead.utm.medium, lead.utm.campaign, lead.urgent ? 1 : 0, ipHash, delivered ? 1 : 0, JSON.stringify(lead),
  ).run();
}

function respond(request: Request, status: number, body: Record<string, unknown>) {
  // Progressive enhancement: plain HTML form posts (no JS) get redirected instead of JSON.
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  if (wantsJson) return json(status, body);
  const lang = body.lang === "ar" ? "/ar" : "";
  if (status === 200) return Response.redirect(new URL(`${lang}/request/received/?id=${body.requestId}`, request.url).toString(), 303);
  return new Response(`Your request could not be sent (${body.error}). Please go back and check the form, or email sales@selorin.co.`, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  if (!originAllowed(request, env)) return json(403, { ok: false, error: "forbidden_origin" });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY) return json(413, { ok: false, error: "too_large" });
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) return json(415, { ok: false, error: "unsupported_type" });

  let form: FormData;
  try { form = await request.formData(); } catch { return json(400, { ok: false, error: "bad_request" }); }

  const values: Values = {};
  const files: File[] = [];
  for (const [k, v] of form.entries()) {
    if (typeof v !== "string") { if (k === "attachments") files.push(v as unknown as File); continue; }
    const prev = values[k];
    values[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  const kind: FormKind = values.kind === "contact" ? "contact" : "request";
  const lang = values.lang === "ar" ? "ar" : "en";

  // Bots: hidden honeypot field filled, or submitted faster than a human could.
  const startedAt = Number(values.startedAt);
  if (values.website || (startedAt && Date.now() - startedAt < 3000)) {
    return respond(request, 200, { ok: true, requestId: formatLeadId(new Date().getUTCFullYear(), 0), lang }); // silently drop
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "";
  if (!(await verifyTurnstile(env, String(values["cf-turnstile-response"] ?? ""), ip))) return respond(request, 400, { ok: false, error: "captcha", lang });
  const ipHash = await sha256(`${ip}:selorin`);
  if (await rateLimited(env, ipHash)) return respond(request, 429, { ok: false, error: "rate_limited", lang });

  const { errors, fields } = validate(kind, values);
  if (Object.keys(errors).length) return respond(request, 422, { ok: false, error: "validation", errors, lang });

  const uploads = await checkUploads(files);
  if (!uploads.ok) return respond(request, 422, { ok: false, error: "attachments", errors: { attachments: uploads.error }, lang });

  const now = new Date();
  const leadId = await nextLeadId(env, now);
  const lead = buildLead({ leadId, kind, values, fields, now, attachments: uploads.files.map(({ name, size, type }) => ({ name, size, type })) });

  let delivered = false;
  try {
    await sendEmail(env, { to: env.SALES_EMAIL ?? "sales@selorin.co", subject: emailSubject(lead), text: emailText(lead), html: emailHtml(lead), replyTo: lead.email, files: uploads.files });
    delivered = true;
  } catch (err) {
    console.error("lead email failed", leadId, err);
  }

  waitUntil((async () => {
    await logLead(env, lead, ipHash, delivered).catch((e) => console.error("lead log failed", e));
    if (env.LEAD_WEBHOOK_URL) {
      await fetch(env.LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json", ...(env.LEAD_WEBHOOK_SECRET ? { "x-selorin-signature": await sha256(env.LEAD_WEBHOOK_SECRET + lead.leadId) } : {}) },
        body: JSON.stringify(lead),
      }).catch((e) => console.error("lead webhook failed", e));
    }
    if (delivered && env.SEND_CONFIRMATION === "true") {
      const c = confirmationEmail(lead);
      await sendEmail(env, { to: lead.email, subject: c.subject, text: c.text, replyTo: env.SALES_EMAIL ?? "sales@selorin.co" }).catch((e) => console.error("confirmation failed", e));
    }
  })());

  // If email failed and there is no database copy either, the lead would be lost: tell the user.
  if (!delivered && !env.DB) return respond(request, 502, { ok: false, error: "delivery", lang });
  return respond(request, 200, { ok: true, requestId: leadId, lang });
};

export const onRequest: PagesFunction<Env> = async () => json(405, { ok: false, error: "method_not_allowed" });
