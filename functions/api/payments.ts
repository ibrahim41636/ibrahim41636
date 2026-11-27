/// <reference types="@cloudflare/workers-types" />
// Quotes and payments through Moyasar (https://moyasar.com): the team sends a technical and
// financial proposal from the dashboard, the client approves and pays from the e-mailed link
// (mada, Apple Pay, STC Pay or card on Moyasar's hosted page), and each later instalment falls
// due when the team marks its stage complete.
//
// Public:  GET  /api/quote?t=TOKEN            → the proposal, its schedule and what is paid
//          POST /api/quote/accept {t}          → approve; returns the payment link if a payment is due
//          POST /api/quote/pay {t, ms}         → payment link for a due instalment
//          POST /api/quote/request-change {t, discount, schedule, note} → the client's one revision request
//          POST /api/pay/callback?ms=ID        → Moyasar invoice callback
//          POST /api/pay/webhook               → Moyasar dashboard webhook (optional)
// Staff (ADMIN_TOKEN, via admin.ts):
//          GET  /api/admin/quotes?lead=ID      → quotes with their instalments
//          POST /api/admin/quotes (multipart)  → create and e-mail a proposal with the offer files
//          POST /api/admin/milestone {id, action: due|paid|cancel, reference?}
//          POST /api/admin/quotes/cancel {quoteId}
//
// A payment is recorded only after this Worker reads the invoice back from Moyasar's API and
// sees it paid in SAR for the exact amount, so callbacks and webhooks cannot be forged into
// payments. Secrets: MOYASAR_SECRET_KEY, optional MOYASAR_WEBHOOK_SECRET. Live keys work only
// where MOYASAR_ALLOW_LIVE is "true" (production [vars] in wrangler.toml, never previews).
import { json, sendEmail, type Env } from "./request";
import { checkUploads, type CheckedFile } from "../../src/lib/uploads";
import { LEAD_ID } from "../../src/lib/tracking";
import {
  MOYASAR_API, TOKEN, buildSchedule, dueEmail, invoicePayload, isDeadInvoice, isPaidInvoice, keyAllowed, newToken, parseChangeRequest,
  quoteEmail, quoteUrl, receiptEmail, sarToHalalas, staffEmail, type Lang, type MoyasarInvoice, type PlanRow,
} from "../../src/lib/payments";
import { stageOf } from "../../src/lib/tracking";

export interface PayEnv extends Env {
  MOYASAR_SECRET_KEY?: string;
  MOYASAR_WEBHOOK_SECRET?: string;
  MOYASAR_ALLOW_LIVE?: string; // "true" only in production
  SITE_URL?: string; // canonical origin for links in e-mails, e.g. https://selorin.co
}

interface QuoteRow { quote_id: string; lead_id: string; token: string; lang: Lang; title: string; subtotal: number; vat: number; total: number; status: string; documents: string | null; valid_until: string; created_at: string; accepted_at: string | null; negotiable: number; change_request: string | null; change_requested_at: string | null; replaces: string | null }
interface MilestoneRow { id: number; quote_id: string; seq: number; label: string; trigger: "acceptance" | "milestone"; percent: number; amount: number; status: string; due_at: string | null; paid_at: string | null; invoice_id: string | null; invoice_url: string | null; payment_id: string | null; paid_by: string | null; reminders: number; last_reminder_at: string | null }
interface LeadRow { lead_id: string; email: string; contact_name: string; company: string | null; status: string; payload: string | null }

class PayError extends Error { constructor(public code: string, public http = 400) { super(code); } }

const origin = (request: Request | null, env: PayEnv) => env.SITE_URL || (request ? new URL(request.url).origin : "https://selorin.co");
const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- Moyasar

async function moyasar<T>(env: PayEnv, method: string, path: string, body?: unknown): Promise<T> {
  if (!keyAllowed(env.MOYASAR_SECRET_KEY, env.MOYASAR_ALLOW_LIVE)) throw new PayError("payments_not_configured", 503);
  const res = await fetch(MOYASAR_API + path, {
    method,
    headers: { authorization: `Basic ${btoa(`${env.MOYASAR_SECRET_KEY}:`)}`, "content-type": "application/json", accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("moyasar", method, path, res.status, JSON.stringify(data).slice(0, 400));
    throw new PayError("gateway_error", 502);
  }
  return data as T;
}

// ---------------------------------------------------------------- data

async function leadOf(env: PayEnv, leadId: string) {
  return env.DB!.prepare(`SELECT lead_id, email, contact_name, company, status, payload FROM leads WHERE lead_id = ?1`).bind(leadId).first<LeadRow>();
}

async function milestonesOf(env: PayEnv, quoteId: string) {
  return (await env.DB!.prepare(`SELECT * FROM quote_milestones WHERE quote_id = ?1 ORDER BY seq`).bind(quoteId).all<MilestoneRow>()).results ?? [];
}

async function quoteByToken(env: PayEnv, token: string) {
  if (!TOKEN.test(token)) return null;
  return env.DB!.prepare(`SELECT * FROM quotes WHERE token = ?1`).bind(token).first<QuoteRow>();
}

function leadLang(lead: LeadRow): Lang {
  try { return JSON.parse(lead.payload ?? "{}").lang === "en" ? "en" : "ar"; } catch { return "ar"; }
}

async function addEvent(env: PayEnv, leadId: string, status: string, note: string) {
  await env.DB!.prepare(`INSERT INTO lead_events (lead_id, status, note, at, notified) VALUES (?1, ?2, ?3, datetime('now'), 1)`).bind(leadId, status, note).run();
}

async function moveLeadToWork(env: PayEnv, lead: LeadRow, note: string) {
  const status = ["received", "reviewing", "quoted"].includes(lead.status) ? "in_progress" : lead.status;
  if (status !== lead.status) {
    await env.DB!.prepare(`UPDATE leads SET status = ?2, status_updated_at = datetime('now') WHERE lead_id = ?1`).bind(lead.lead_id, status).run();
    lead.status = status;
  }
  await addEvent(env, lead.lead_id, status, note);
}

async function mail(env: PayEnv, to: string, m: { subject: string; text: string; html?: string }, files?: CheckedFile[]) {
  await sendEmail(env, { to, subject: m.subject, text: m.text, html: m.html, replyTo: env.SALES_EMAIL ?? "sales@selorin.co", files });
}

// ---------------------------------------------------------------- payment state

/** Records a payment once. Returns false when the instalment was already paid (duplicate callback). */
async function markPaid(env: PayEnv, ms: MilestoneRow, quote: QuoteRow, lead: LeadRow, siteOrigin: string, paymentId: string, by: "moyasar" | "manual") {
  const updated = await env.DB!.prepare(
    `UPDATE quote_milestones SET status = 'paid', paid_at = datetime('now'), payment_id = ?2, paid_by = ?3 WHERE id = ?1 AND status != 'paid' RETURNING id`,
  ).bind(ms.id, paymentId, by).first<{ id: number }>();
  if (!updated) return false;

  const all = await milestonesOf(env, quote.quote_id);
  const remaining = all.filter((m) => m.status !== "paid" && m.status !== "cancelled").reduce((n, m) => n + m.amount, 0);
  const quoteStatus = remaining === 0 ? "paid" : quote.status === "sent" ? "accepted" : quote.status;
  await env.DB!.prepare(`UPDATE quotes SET status = ?2, accepted_at = COALESCE(accepted_at, datetime('now')) WHERE quote_id = ?1`).bind(quote.quote_id, quoteStatus).run();

  const lang = quote.lang;
  const label = ms.label;
  const amountText = (ms.amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
  await moveLeadToWork(env, lead, lang === "ar" ? `تم استلام دفعة «${label}» بمبلغ ${amountText} ريال.` : `Payment received: "${label}", SAR ${amountText}.`);

  const url = quoteUrl(siteOrigin, lang, quote.token);
  await mail(env, lead.email, receiptEmail({ lang, name: lead.contact_name, leadId: lead.lead_id, title: quote.title, url, label, amount: ms.amount, paymentId, remaining }))
    .catch((e) => console.error("receipt email failed", quote.quote_id, e));
  await mail(env, env.SALES_EMAIL ?? "sales@selorin.co", staffEmail("paid", { leadId: lead.lead_id, quoteId: quote.quote_id, company: lead.company ?? "", title: quote.title, label, amount: ms.amount, paymentId }))
    .catch((e) => console.error("staff payment email failed", quote.quote_id, e));
  return true;
}

/** Reads a due instalment's invoice back from Moyasar and records it if paid. */
async function sync(env: PayEnv, ms: MilestoneRow, quote: QuoteRow, lead: LeadRow, siteOrigin: string) {
  if (ms.status !== "due" || !ms.invoice_id) return ms;
  try {
    const inv = await moyasar<MoyasarInvoice>(env, "GET", `/invoices/${encodeURIComponent(ms.invoice_id)}`);
    if (isPaidInvoice(inv, ms.amount)) {
      const pay = inv.payments?.find((p) => p.status === "paid");
      await markPaid(env, ms, quote, lead, siteOrigin, pay?.id ?? inv.id, "moyasar");
      return { ...ms, status: "paid" };
    }
  } catch (e) {
    console.error("invoice sync failed", ms.id, e);
  }
  return ms;
}

/** Payment link for a due instalment: reuses a live invoice or creates a new one. */
async function invoiceUrl(env: PayEnv, ms: MilestoneRow, quote: QuoteRow, lead: LeadRow, siteOrigin: string): Promise<string | null> {
  if (ms.status !== "due") throw new PayError("not_due", 409);
  if (ms.invoice_id) {
    const inv = await moyasar<MoyasarInvoice>(env, "GET", `/invoices/${encodeURIComponent(ms.invoice_id)}`);
    if (isPaidInvoice(inv, ms.amount)) {
      const pay = inv.payments?.find((p) => p.status === "paid");
      await markPaid(env, ms, quote, lead, siteOrigin, pay?.id ?? inv.id, "moyasar");
      return null;
    }
    if (!isDeadInvoice(inv.status) && inv.amount === ms.amount && (inv.url || ms.invoice_url)) return inv.url ?? ms.invoice_url;
  }
  const page = quoteUrl(siteOrigin, quote.lang, quote.token);
  const inv = await moyasar<MoyasarInvoice>(env, "POST", "/invoices", invoicePayload({
    amount: ms.amount,
    description: `Selorin ${lead.lead_id}: ${ms.label}`,
    callbackUrl: `${siteOrigin}/api/pay/callback?ms=${ms.id}`,
    successUrl: `${page}&paid=1`,
    backUrl: page,
    expiresAt: new Date(Date.now() + 30 * 86400_000),
    metadata: { lead_id: lead.lead_id, quote_id: quote.quote_id, milestone_id: String(ms.id) },
  }));
  if (!inv.url) throw new PayError("gateway_error", 502);
  // Two clicks at once must not leave two payable invoices: only the first one is kept.
  const kept = await env.DB!.prepare(`UPDATE quote_milestones SET invoice_id = ?2, invoice_url = ?3 WHERE id = ?1 AND invoice_id IS ?4 RETURNING id`)
    .bind(ms.id, inv.id, inv.url, ms.invoice_id).first<{ id: number }>();
  if (!kept) {
    await moyasar(env, "PUT", `/invoices/${encodeURIComponent(inv.id)}/cancel`).catch(() => undefined);
    const now = await env.DB!.prepare(`SELECT invoice_url FROM quote_milestones WHERE id = ?1`).bind(ms.id).first<{ invoice_url: string | null }>();
    return now?.invoice_url ?? null;
  }
  return inv.url;
}

async function historyOf(env: PayEnv, leadId: string) {
  return (await env.DB!.prepare(`SELECT status, note, at FROM lead_events WHERE lead_id = ?1 ORDER BY at ASC, id ASC`).bind(leadId).all<{ status: string; note: string | null; at: string }>()).results ?? [];
}

function publicView(quote: QuoteRow, ms: MilestoneRow[], lead: LeadRow, history: { status: string; note: string | null; at: string }[]) {
  const paid = ms.filter((m) => m.status === "paid").reduce((n, m) => n + m.amount, 0);
  const expired = quote.status === "sent" && quote.valid_until < today();
  let change: unknown = null;
  try { change = quote.change_request ? JSON.parse(quote.change_request) : null; } catch { /* shown as requested without details */ }
  return {
    negotiable: quote.negotiable === 1 && !quote.change_requested_at, final: quote.negotiable !== 1, revised: !!quote.replaces,
    changeRequest: change, stage: stageOf(lead.status, quote.status), history,
    quoteId: quote.quote_id, leadId: quote.lead_id, lang: quote.lang, title: quote.title, company: lead.company ?? "", name: lead.contact_name,
    subtotal: quote.subtotal, vat: quote.vat, total: quote.total, paid, remaining: Math.max(quote.total - paid, 0),
    status: expired ? "expired" : quote.status, validUntil: quote.valid_until, createdAt: quote.created_at,
    documents: JSON.parse(quote.documents ?? "[]") as string[],
    milestones: ms.map((m) => ({ id: m.id, seq: m.seq, label: m.label, trigger: m.trigger, percent: m.percent, amount: m.amount, status: m.status, dueAt: m.due_at, paidAt: m.paid_at })),
  };
}

// ---------------------------------------------------------------- public endpoints

export async function handlePayments(request: Request, env: PayEnv, path: string): Promise<Response> {
  if (!env.DB) return json(503, { ok: false, error: "payments_unavailable" });
  const site = origin(request, env);
  try {
    if (path === "/api/quote" && request.method === "GET") {
      const quote = await quoteByToken(env, new URL(request.url).searchParams.get("t") ?? "");
      if (!quote) return json(404, { ok: false, error: "not_found" });
      const lead = await leadOf(env, quote.lead_id);
      if (!lead) return json(404, { ok: false, error: "not_found" });
      let ms = await milestonesOf(env, quote.quote_id);
      if (ms.some((m) => m.status === "due" && m.invoice_id)) {
        for (const m of ms) await sync(env, m, quote, lead, site);
        ms = await milestonesOf(env, quote.quote_id);
        Object.assign(quote, await env.DB.prepare(`SELECT status FROM quotes WHERE quote_id = ?1`).bind(quote.quote_id).first());
      }
      return json(200, { ok: true, quote: publicView(quote, ms, lead, await historyOf(env, lead.lead_id)) });
    }

    if ((path === "/api/quote/accept" || path === "/api/quote/pay" || path === "/api/quote/request-change") && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { t?: string; ms?: number; discount?: boolean; schedule?: boolean; note?: string };
      const quote = await quoteByToken(env, String(body.t ?? ""));
      if (!quote) return json(404, { ok: false, error: "not_found" });
      const lead = await leadOf(env, quote.lead_id);
      if (!lead) return json(404, { ok: false, error: "not_found" });
      if (quote.status === "cancelled" || quote.status === "superseded" || quote.status === "change_requested") return json(409, { ok: false, error: quote.status });
      let ms = await milestonesOf(env, quote.quote_id);

      // One revision round: only on a first proposal that is still open, and only once.
      if (path === "/api/quote/request-change") {
        if (quote.status !== "sent") return json(409, { ok: false, error: "not_open" });
        if (quote.valid_until < today()) return json(410, { ok: false, error: "expired" });
        if (quote.negotiable !== 1) return json(409, { ok: false, error: "final" });
        const parsed = parseChangeRequest(body);
        if (!parsed.ok) return json(422, { ok: false, error: `change_${parsed.error}` });
        const won = await env.DB.prepare(
          `UPDATE quotes SET status = 'change_requested', change_request = ?2, change_requested_at = datetime('now') WHERE quote_id = ?1 AND status = 'sent' AND negotiable = 1 AND change_requested_at IS NULL RETURNING quote_id`,
        ).bind(quote.quote_id, JSON.stringify(parsed.request)).first();
        if (!won) return json(409, { ok: false, error: "not_open" });
        const what = quote.lang === "ar"
          ? [parsed.request.discount ? "خصم" : "", parsed.request.schedule ? "تعديل جدول الدفعات" : ""].filter(Boolean).join(" و")
          : [parsed.request.discount ? "a discount" : "", parsed.request.schedule ? "a different payment schedule" : ""].filter(Boolean).join(" and ");
        await addEvent(env, lead.lead_id, lead.status, quote.lang === "ar"
          ? `استلمنا طلبك لمراجعة العرض (${what})، وسنرسل لك العرض المحدّث بالبريد.`
          : `We received your request to revise the proposal (${what}) and will e-mail you the revised proposal.`);
        await mail(env, env.SALES_EMAIL ?? "sales@selorin.co", staffEmail("change", {
          leadId: lead.lead_id, quoteId: quote.quote_id, company: lead.company ?? "", title: quote.title, change: parsed.request,
          adminUrl: `${site}/ar/admin/quotes/?lead=${encodeURIComponent(lead.lead_id)}`,
        })).catch((e) => console.error("staff change email failed", e));
        return json(200, { ok: true });
      }

      if (path === "/api/quote/accept") {
        if (quote.status === "sent") {
          if (quote.valid_until < today()) return json(410, { ok: false, error: "expired" });
          // Only the request that actually flips the status records the approval and tells the team.
          const won = await env.DB.prepare(`UPDATE quotes SET status = 'accepted', accepted_at = datetime('now') WHERE quote_id = ?1 AND status = 'sent' RETURNING quote_id`).bind(quote.quote_id).first();
          quote.status = "accepted";
          if (won) {
            await env.DB.prepare(`UPDATE quote_milestones SET status = 'due', due_at = datetime('now') WHERE quote_id = ?1 AND trigger = 'acceptance' AND status = 'scheduled'`).bind(quote.quote_id).run();
            const note = quote.lang === "ar" ? "تمت الموافقة على العرض الفني والمالي." : "Proposal approved.";
            if (ms.some((m) => m.trigger === "acceptance")) await addEvent(env, lead.lead_id, lead.status, note);
            else await moveLeadToWork(env, lead, note);
            await mail(env, env.SALES_EMAIL ?? "sales@selorin.co", staffEmail("accepted", { leadId: lead.lead_id, quoteId: quote.quote_id, company: lead.company ?? "", title: quote.title }))
              .catch((e) => console.error("staff accept email failed", e));
          }
          ms = await milestonesOf(env, quote.quote_id);
        }
        const due = ms.find((m) => m.status === "due");
        const url = due ? await invoiceUrl(env, due, quote, lead, site) : null;
        return json(200, { ok: true, url });
      }

      const target = ms.find((m) => m.id === Number(body.ms));
      if (!target) return json(404, { ok: false, error: "not_found" });
      const url = await invoiceUrl(env, target, quote, lead, site);
      return json(200, { ok: true, url });
    }

    // Moyasar calls back when an invoice is paid. The body is ignored: the invoice is read back
    // from Moyasar, so a forged call can at most trigger a re-check.
    if (path === "/api/pay/callback") {
      const id = Number(new URL(request.url).searchParams.get("ms"));
      const ms = Number.isInteger(id) ? await env.DB.prepare(`SELECT * FROM quote_milestones WHERE id = ?1`).bind(id).first<MilestoneRow>() : null;
      if (ms) {
        const quote = await env.DB.prepare(`SELECT * FROM quotes WHERE quote_id = ?1`).bind(ms.quote_id).first<QuoteRow>();
        const lead = quote ? await leadOf(env, quote.lead_id) : null;
        if (quote && lead) await sync(env, ms, quote, lead, site);
      }
      return json(200, { ok: true });
    }

    if (path === "/api/pay/webhook" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { secret_token?: string; data?: { invoice_id?: string } };
      if (!env.MOYASAR_WEBHOOK_SECRET || body.secret_token !== env.MOYASAR_WEBHOOK_SECRET) return json(401, { ok: false });
      const invoiceId = body.data?.invoice_id;
      const ms = invoiceId ? await env.DB.prepare(`SELECT * FROM quote_milestones WHERE invoice_id = ?1`).bind(invoiceId).first<MilestoneRow>() : null;
      if (ms) {
        const quote = await env.DB.prepare(`SELECT * FROM quotes WHERE quote_id = ?1`).bind(ms.quote_id).first<QuoteRow>();
        const lead = quote ? await leadOf(env, quote.lead_id) : null;
        if (quote && lead) await sync(env, ms, quote, lead, site);
      }
      return json(200, { ok: true });
    }
    return json(404, { ok: false, error: "not_found" });
  } catch (e) {
    if (e instanceof PayError) return json(e.http, { ok: false, error: e.code });
    console.error("payments", path, e);
    return json(500, { ok: false, error: "server_error" });
  }
}

// ---------------------------------------------------------------- staff endpoints

export async function handlePaymentsAdmin(request: Request, env: PayEnv, path: string): Promise<Response> {
  const site = origin(request, env);
  try {
    if (path === "/api/admin/quotes" && request.method === "GET") {
      const lead = new URL(request.url).searchParams.get("lead")?.trim().toUpperCase() ?? "";
      const stmt = LEAD_ID.test(lead)
        ? env.DB!.prepare(`SELECT * FROM quotes WHERE lead_id = ?1 ORDER BY created_at DESC`).bind(lead)
        : env.DB!.prepare(`SELECT * FROM quotes ORDER BY created_at DESC LIMIT 50`);
      const quotes = (await stmt.all<QuoteRow>()).results ?? [];
      const out = [];
      for (const q of quotes) {
        const ms = await milestonesOf(env, q.quote_id);
        out.push({ ...q, token: undefined, link: quoteUrl(site, q.lang, q.token), milestones: ms });
      }
      return json(200, { ok: true, quotes: out, payments: keyAllowed(env.MOYASAR_SECRET_KEY, env.MOYASAR_ALLOW_LIVE) ? (env.MOYASAR_SECRET_KEY!.startsWith("sk_live_") ? "live" : "test") : "off" });
    }

    if (path === "/api/admin/quotes" && request.method === "POST") {
      const form = await request.formData();
      const leadId = String(form.get("leadId") ?? "").trim().toUpperCase();
      const title = String(form.get("title") ?? "").trim().slice(0, 160);
      const subtotal = sarToHalalas(String(form.get("subtotal") ?? ""));
      const validDays = Math.min(Math.max(Number(form.get("validDays")) || 30, 1), 180);
      const markedFinal = String(form.get("final") ?? "") === "1";
      let plan: PlanRow[] = [];
      try { plan = JSON.parse(String(form.get("plan") ?? "[]")); } catch { /* validated below */ }
      if (!LEAD_ID.test(leadId) || !title) return json(422, { ok: false, error: "validation" });
      const built = buildSchedule(subtotal, plan);
      if (!built.ok) return json(422, { ok: false, error: `plan_${built.error}` });
      const lead = await leadOf(env, leadId);
      if (!lead || !lead.email) return json(404, { ok: false, error: "lead_not_found" });
      const files = form.getAll("files").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
      const uploads = await checkUploads(files);
      if (!uploads.ok) return json(422, { ok: false, error: `files_${uploads.error}` });

      const count = await env.DB!.prepare(`SELECT COUNT(*) AS n FROM quotes WHERE lead_id = ?1`).bind(leadId).first<{ n: number }>();
      const quoteId = `${leadId}-Q${(count?.n ?? 0) + 1}`;
      const token = newToken();
      const lang = leadLang(lead);
      const validUntil = new Date(Date.now() + validDays * 86400_000).toISOString().slice(0, 10);
      const { schedule } = built;
      const url = quoteUrl(site, lang, token);
      const names = uploads.files.map((f) => f.name);
      // The client gets one revision round per request: once they have used it, every later proposal is final.
      const used = await env.DB!.prepare(`SELECT quote_id FROM quotes WHERE lead_id = ?1 AND change_requested_at IS NOT NULL ORDER BY change_requested_at DESC LIMIT 1`).bind(leadId).first<{ quote_id: string }>();
      const negotiable = !markedFinal && !used;
      const open = (await env.DB!.prepare(`SELECT quote_id FROM quotes WHERE lead_id = ?1 AND status IN ('sent', 'change_requested') ORDER BY created_at DESC`).bind(leadId).all<{ quote_id: string }>()).results ?? [];
      const replaces = used?.quote_id ?? open[0]?.quote_id ?? null;

      // E-mail first: a proposal the client never received should not exist in the system.
      try {
        await mail(env, lead.email, quoteEmail({ lang, name: lead.contact_name, leadId, title, url, total: schedule.total, milestones: schedule.milestones, validUntil, files: names, negotiable, revised: !!replaces }), uploads.files);
      } catch (e) {
        console.error("quote email failed", quoteId, e);
        return json(502, { ok: false, error: "email_failed" });
      }
      await env.DB!.batch([
        // One live proposal per request: an earlier open one can no longer be approved.
        env.DB!.prepare(`UPDATE quotes SET status = 'superseded' WHERE lead_id = ?1 AND status IN ('sent', 'change_requested')`).bind(leadId),
        env.DB!.prepare(`INSERT INTO quotes (quote_id, lead_id, token, lang, title, subtotal, vat, total, status, documents, valid_until, created_at, negotiable, replaces) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'sent', ?9, ?10, datetime('now'), ?11, ?12)`)
          .bind(quoteId, leadId, token, lang, title, schedule.subtotal, schedule.vat, schedule.total, JSON.stringify(names), validUntil, negotiable ? 1 : 0, replaces),
        ...schedule.milestones.map((m) => env.DB!.prepare(`INSERT INTO quote_milestones (quote_id, seq, label, trigger, percent, amount) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
          .bind(quoteId, m.seq, m.label, m.trigger, m.percent, m.amount)),
        env.DB!.prepare(`UPDATE leads SET status = 'quoted', status_updated_at = datetime('now') WHERE lead_id = ?1 AND status IN ('received', 'reviewing')`).bind(leadId),
        env.DB!.prepare(`INSERT INTO lead_events (lead_id, status, note, at, notified) VALUES (?1, 'quoted', ?2, datetime('now'), 1)`)
          .bind(leadId, replaces
            ? (lang === "ar" ? "أرسلنا لك العرض الفني والمالي المحدّث بالبريد الإلكتروني." : "We have e-mailed you our revised technical and financial proposal.")
            : (lang === "ar" ? "أرسلنا لك العرض الفني والمالي بالبريد الإلكتروني." : "We have e-mailed you our technical and financial proposal.")),
      ]);
      return json(200, { ok: true, quoteId, link: url, total: schedule.total, negotiable, replaces });
    }

    if (path === "/api/admin/milestone" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { id?: number; action?: string; reference?: string };
      const ms = await env.DB!.prepare(`SELECT * FROM quote_milestones WHERE id = ?1`).bind(Number(body.id)).first<MilestoneRow>();
      if (!ms) return json(404, { ok: false, error: "not_found" });
      const quote = await env.DB!.prepare(`SELECT * FROM quotes WHERE quote_id = ?1`).bind(ms.quote_id).first<QuoteRow>();
      const lead = quote ? await leadOf(env, quote.lead_id) : null;
      if (!quote || !lead) return json(404, { ok: false, error: "not_found" });

      if (body.action === "due") {
        if (ms.status !== "scheduled") return json(409, { ok: false, error: "not_scheduled" });
        if (quote.status !== "accepted") return json(409, { ok: false, error: "quote_not_accepted" });
        await env.DB!.prepare(`UPDATE quote_milestones SET status = 'due', due_at = datetime('now') WHERE id = ?1`).bind(ms.id).run();
        ms.status = "due";
        await addEvent(env, lead.lead_id, lead.status, quote.lang === "ar" ? `أنجزنا مرحلة «${ms.label}»، وأصبحت دفعتها مستحقة.` : `Stage "${ms.label}" is complete and its payment is due.`);
        const url = quoteUrl(site, quote.lang, quote.token);
        await mail(env, lead.email, dueEmail({ lang: quote.lang, name: lead.contact_name, leadId: lead.lead_id, title: quote.title, url, label: ms.label, amount: ms.amount }));
        return json(200, { ok: true });
      }
      if (body.action === "paid") {
        if (ms.status === "paid" || ms.status === "cancelled") return json(409, { ok: false, error: "closed" });
        const ref = String(body.reference ?? "").trim().slice(0, 80) || "manual";
        const recorded = await markPaid(env, ms, quote, lead, site, ref, "manual");
        // Paid outside Moyasar (e.g. bank transfer): close the online link so it cannot be paid twice.
        if (recorded && ms.invoice_id) await moyasar(env, "PUT", `/invoices/${encodeURIComponent(ms.invoice_id)}/cancel`).catch(() => undefined);
        return json(200, { ok: true });
      }
      if (body.action === "cancel") {
        if (ms.status === "paid") return json(409, { ok: false, error: "closed" });
        await env.DB!.prepare(`UPDATE quote_milestones SET status = 'cancelled' WHERE id = ?1`).bind(ms.id).run();
        if (ms.invoice_id) await moyasar(env, "PUT", `/invoices/${encodeURIComponent(ms.invoice_id)}/cancel`).catch(() => undefined);
        return json(200, { ok: true });
      }
      return json(422, { ok: false, error: "validation" });
    }

    if (path === "/api/admin/quotes/cancel" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { quoteId?: string };
      const quote = await env.DB!.prepare(`SELECT * FROM quotes WHERE quote_id = ?1`).bind(String(body.quoteId ?? "")).first<QuoteRow>();
      if (!quote) return json(404, { ok: false, error: "not_found" });
      const ms = await milestonesOf(env, quote.quote_id);
      await env.DB!.batch([
        env.DB!.prepare(`UPDATE quotes SET status = 'cancelled' WHERE quote_id = ?1`).bind(quote.quote_id),
        env.DB!.prepare(`UPDATE quote_milestones SET status = 'cancelled' WHERE quote_id = ?1 AND status != 'paid'`).bind(quote.quote_id),
      ]);
      for (const m of ms) if (m.invoice_id && m.status === "due") await moyasar(env, "PUT", `/invoices/${encodeURIComponent(m.invoice_id)}/cancel`).catch(() => undefined);
      return json(200, { ok: true });
    }
    return json(404, { ok: false, error: "not_found" });
  } catch (e) {
    if (e instanceof PayError) return json(e.http, { ok: false, error: e.code });
    console.error("payments admin", path, e);
    return json(500, { ok: false, error: "server_error" });
  }
}

// ---------------------------------------------------------------- cron

/** Every cron tick: up to two reminders for instalments left unpaid 3 days after falling due (re-checking Moyasar first, so a payment whose callback was missed is recorded instead of chased). */
export async function runPaymentCron(env: PayEnv, now: Date) {
  if (!env.DB || !keyAllowed(env.MOYASAR_SECRET_KEY, env.MOYASAR_ALLOW_LIVE)) return { skipped: true };
  const site = origin(null, env);
  const rows = (await env.DB.prepare(
    `SELECT * FROM quote_milestones WHERE status = 'due' AND reminders < 2 AND due_at <= datetime(?1, '-3 days')
       AND (last_reminder_at IS NULL OR last_reminder_at <= datetime(?1, '-4 days')) LIMIT 20`,
  ).bind(now.toISOString().slice(0, 19).replace("T", " ")).all<MilestoneRow>()).results ?? [];
  let reminded = 0;
  for (const ms of rows) {
    const quote = await env.DB.prepare(`SELECT * FROM quotes WHERE quote_id = ?1`).bind(ms.quote_id).first<QuoteRow>();
    const lead = quote ? await leadOf(env, quote.lead_id) : null;
    if (!quote || !lead || quote.status === "cancelled") continue;
    const synced = await sync(env, ms, quote, lead, site);
    if (synced.status === "paid") continue;
    try {
      await mail(env, lead.email, dueEmail({ lang: quote.lang, name: lead.contact_name, leadId: lead.lead_id, title: quote.title, url: quoteUrl(site, quote.lang, quote.token), label: ms.label, amount: ms.amount, reminder: true }));
      await env.DB.prepare(`UPDATE quote_milestones SET reminders = reminders + 1, last_reminder_at = datetime('now') WHERE id = ?1`).bind(ms.id).run();
      reminded++;
    } catch (e) {
      console.error("reminder failed", ms.id, e);
    }
  }
  return { checked: rows.length, reminded };
}
