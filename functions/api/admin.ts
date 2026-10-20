/// <reference types="@cloudflare/workers-types" />
// Staff endpoints for the dashboard at /ar/admin/. Every call needs
// "Authorization: Bearer <ADMIN_TOKEN>" (a Worker secret).
//   GET  /api/admin/leads?status=&limit=  → recent requests
//   POST /api/admin/status {leadId, status, note?, notify?} → update status, optionally e-mail the client
//   /api/admin/social…, /api/admin/funnel → social publishing hub and funnel report (social.ts)
import { json, sendEmail, type Env } from "./request";
import { handleSocialAdmin, type SocialEnv } from "./social";
import { LEAD_ID, isStatus, safeEqual, statusEmail } from "../../src/lib/tracking";

function authorized(request: Request, env: Env) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  return !!env.ADMIN_TOKEN && safeEqual(token, env.ADMIN_TOKEN);
}

export async function handleAdmin(request: Request, env: SocialEnv, path: string): Promise<Response> {
  if (!env.ADMIN_TOKEN) return json(503, { ok: false, error: "admin_not_configured" });
  if (!authorized(request, env)) return json(401, { ok: false, error: "unauthorized" });
  if (!env.DB) return json(503, { ok: false, error: "tracking_unavailable" });
  if (path.startsWith("/api/admin/social") || path === "/api/admin/funnel") return handleSocialAdmin(request, env, path);

  if (path === "/api/admin/leads" && request.method === "GET") {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
    const filter = isStatus(status) ? `WHERE status = ?1` : "";
    const stmt = env.DB.prepare(
      `SELECT lead_id, kind, service, company, contact_name, email, phone, location, urgent, submitted_at, status, status_updated_at
       FROM leads ${filter} ORDER BY submitted_at DESC LIMIT ${limit}`,
    );
    const rows = await (filter ? stmt.bind(status) : stmt).all();
    return json(200, { ok: true, leads: rows.results ?? [] });
  }

  if (path === "/api/admin/status" && request.method === "POST") {
    let body: { leadId?: string; status?: string; note?: string; notify?: boolean };
    try { body = await request.json(); } catch { return json(400, { ok: false, error: "bad_request" }); }
    const leadId = String(body.leadId ?? "").trim().toUpperCase();
    const note = String(body.note ?? "").trim().slice(0, 1000);
    if (!LEAD_ID.test(leadId) || !isStatus(body.status)) return json(422, { ok: false, error: "validation" });

    const lead = await env.DB.prepare(`SELECT email, contact_name, payload FROM leads WHERE lead_id = ?1`)
      .bind(leadId).first<{ email: string; contact_name: string; payload: string | null }>();
    if (!lead) return json(404, { ok: false, error: "not_found" });

    let notified = false;
    if (body.notify && lead.email) {
      let lang: "en" | "ar" = "ar";
      try { lang = JSON.parse(lead.payload ?? "{}").lang === "en" ? "en" : "ar"; } catch { /* keep Arabic */ }
      const trackUrl = `https://selorin.co${lang === "ar" ? "/ar" : ""}/track/?id=${encodeURIComponent(leadId)}`;
      const mail = statusEmail({ lang, name: lead.contact_name, leadId, status: body.status, note, trackUrl });
      try {
        await sendEmail(env, { to: lead.email, subject: mail.subject, text: mail.text, replyTo: env.SALES_EMAIL ?? "sales@selorin.co" });
        notified = true;
      } catch (err) {
        console.error("status email failed", leadId, err);
      }
    }

    await env.DB.batch([
      env.DB.prepare(`UPDATE leads SET status = ?1, status_updated_at = datetime('now') WHERE lead_id = ?2`).bind(body.status, leadId),
      env.DB.prepare(`INSERT INTO lead_events (lead_id, status, note, at, notified) VALUES (?1, ?2, ?3, datetime('now'), ?4)`)
        .bind(leadId, body.status, note || null, notified ? 1 : 0),
    ]);
    return json(200, { ok: true, leadId, status: body.status, notified });
  }

  return json(404, { ok: false, error: "not_found" });
}
