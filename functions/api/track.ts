/// <reference types="@cloudflare/workers-types" />
// GET /api/track?id=SEL-2026-000123&email=client@example.com
// Lets a client see the status and timeline of their own request. Both the request ID and the
// e-mail used on the form must match, so IDs alone cannot be used to read other requests.
import { json, type Env } from "./request";
import { LEAD_ID, normalizeEmail } from "../../src/lib/tracking";

export async function handleTrack(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") ?? "").trim().toUpperCase();
  const email = normalizeEmail(url.searchParams.get("email") ?? "");
  if (!LEAD_ID.test(id) || !email.includes("@")) return json(400, { ok: false, error: "bad_request" });
  if (!env.DB) return json(503, { ok: false, error: "tracking_unavailable" });

  const lead = await env.DB.prepare(
    `SELECT lead_id, kind, service, payload, submitted_at, status, status_updated_at FROM leads WHERE lead_id = ?1 AND lower(email) = ?2`,
  ).bind(id, email).first<{ lead_id: string; kind: string; service: string | null; payload: string | null; submitted_at: string; status: string; status_updated_at: string | null }>();
  if (!lead) return json(404, { ok: false, error: "not_found" });

  const events = await env.DB.prepare(`SELECT status, note, at FROM lead_events WHERE lead_id = ?1 ORDER BY at ASC, id ASC`)
    .bind(id).all<{ status: string; note: string | null; at: string }>();

  let serviceName = "";
  try { serviceName = JSON.parse(lead.payload ?? "{}")?.service?.name ?? ""; } catch { /* name stays empty */ }

  return json(200, {
    ok: true,
    request: {
      id: lead.lead_id,
      kind: lead.kind,
      service: serviceName || lead.service,
      submittedAt: lead.submitted_at,
      status: lead.status,
      updatedAt: lead.status_updated_at ?? lead.submitted_at,
      history: events.results ?? [],
    },
  });
}
