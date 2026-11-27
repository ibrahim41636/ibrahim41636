/// <reference types="@cloudflare/workers-types" />
// Project engine shared by the payment handlers (payments.ts) and the client portal (portal.ts):
// data access, Moyasar invoices, recording payments, issuing the electronic contract, and moving
// the technical work stages forward as payments and the signed contract arrive.
//
// Order of a request: proposal (with meetings and one discount round) → approval → contract
// details and electronic acceptance → first payment → contract issued, signed and stamped by
// Selorin → client uploads the signed copy → technical stages, each opening only after the
// instalment due on the previous one is paid → completion.
import { sendEmail, type Env } from "./request";
import type { CheckedFile } from "../../src/lib/uploads";
import { SERVICES } from "../../src/lib/forms";
import {
  MOYASAR_API, TRIGGER_LABELS, dueEmail, formatSar, invoicePayload, isDeadInvoice, isPaidInvoice, keyAllowed, newToken, portalUrl,
  receiptEmail, staffEmail, type Lang, type MoyasarInvoice,
} from "../../src/lib/payments";
import {
  addHours, contractDocument, contractIssuedEmail, contractNumber, projectDoneEmail, projectStage, slaHours, stageDoneEmail, validImage, workGates,
  type ContractParty,
} from "../../src/lib/portal";
import { archive, htmlFile } from "./drive";

export interface ProjectEnv extends Env {
  MOYASAR_SECRET_KEY?: string;
  MOYASAR_WEBHOOK_SECRET?: string;
  MOYASAR_ALLOW_LIVE?: string; // "true" only in production
  ESCALATION_EMAIL?: string; // optional second recipient for overdue proposal alerts
}

export interface LeadRow {
  lead_id: string; kind: string; email: string; contact_name: string; company: string | null; phone: string | null; service: string | null; status: string;
  payload: string | null; submitted_at: string; portal_token: string | null; quote_due_at: string | null; drive_folder_id: string | null; drive_folder_url: string | null;
}
export interface QuoteRow {
  quote_id: string; lead_id: string; token: string; lang: Lang; title: string; subtotal: number; vat: number; total: number; status: string; documents: string | null;
  valid_until: string; created_at: string; accepted_at: string | null; negotiable: number; change_request: string | null; change_requested_at: string | null;
  replaces: string | null; revision_note: string | null;
}
export interface MilestoneRow {
  id: number; quote_id: string; seq: number; label: string; trigger: "acceptance" | "milestone"; percent: number; amount: number; status: string; due_at: string | null;
  paid_at: string | null; invoice_id: string | null; invoice_url: string | null; payment_id: string | null; paid_by: string | null; reminders: number;
  last_reminder_at: string | null; stage_seq: number | null;
}
export interface StageRow { id: number; quote_id: string; seq: number; title: string; status: string; started_at: string | null; completed_at: string | null; note: string | null }
export interface MeetingRow {
  id: number; lead_id: string; quote_id: string; mode: string; preferred: string; topics: string | null; status: string; requested_at: string; scheduled_at: string | null;
  location: string | null; outcome: string | null; needs_revision: number; held_at: string | null;
}
export interface ContractRow {
  id: number; contract_no: string; lead_id: string; quote_id: string; lang: Lang; legal_name: string; cr_number: string | null; address: string | null;
  signatory_name: string; signatory_title: string; signatory_phone: string; signatory_email: string; accepted_at: string; accept_ip_hash: string | null;
  accept_agent: string | null; status: string; issued_at: string | null; document: string | null; drive_file_id: string | null; countersigned_at: string | null;
  countersigned_file: string | null; start_override: number;
}

export class ProjectError extends Error { constructor(public code: string, public http = 400) { super(code); } }

export const siteOrigin = (request: Request | null, env: ProjectEnv) => env.SITE_URL || (request ? new URL(request.url).origin : "https://selorin.co");
export const today = () => new Date().toISOString().slice(0, 10);
/** Riyadh time (UTC+3, no daylight saving) as "YYYY-MM-DD HH:MM" for documents and e-mails. */
export const riyadh = (db: string) => addHours(db, 3).slice(0, 16);
export const salesEmail = (env: ProjectEnv) => env.SALES_EMAIL ?? "sales@selorin.co";
const PAID = (m: { status: string }) => m.status === "paid" || m.status === "cancelled";

export function leadLang(lead: Pick<LeadRow, "payload">): Lang {
  try { return JSON.parse(lead.payload ?? "{}").lang === "en" ? "en" : "ar"; } catch { return "ar"; }
}
export function leadPayload(lead: Pick<LeadRow, "payload">): Record<string, unknown> {
  try { return JSON.parse(lead.payload ?? "{}"); } catch { return {}; }
}
/** The requested service in the client's language (or the given one), from the form's catalogue. */
export function serviceName(lead: Pick<LeadRow, "payload" | "service">, lang?: Lang) {
  const l = lang ?? leadLang(lead);
  const known = lead.service ? SERVICES[lead.service] : undefined;
  if (known) return known[l];
  if (lead.service === "other") return l === "ar" ? "أخرى" : "Other";
  const s = leadPayload(lead).service as { name?: string } | undefined;
  return s?.name || lead.service || "";
}

// ---------------------------------------------------------------- data

const LEAD_COLS = `lead_id, kind, email, contact_name, company, phone, service, status, payload, submitted_at, portal_token, quote_due_at, drive_folder_id, drive_folder_url`;
export const leadOf = (env: ProjectEnv, id: string) => env.DB!.prepare(`SELECT ${LEAD_COLS} FROM leads WHERE lead_id = ?1`).bind(id).first<LeadRow>();
export const leadByPortal = (env: ProjectEnv, token: string) => env.DB!.prepare(`SELECT ${LEAD_COLS} FROM leads WHERE portal_token = ?1`).bind(token).first<LeadRow>();
export const quoteOf = (env: ProjectEnv, id: string) => env.DB!.prepare(`SELECT * FROM quotes WHERE quote_id = ?1`).bind(id).first<QuoteRow>();
export const quotesOf = async (env: ProjectEnv, leadId: string) => (await env.DB!.prepare(`SELECT * FROM quotes WHERE lead_id = ?1 ORDER BY created_at DESC, quote_id DESC`).bind(leadId).all<QuoteRow>()).results ?? [];
export const milestonesOf = async (env: ProjectEnv, quoteId: string) => (await env.DB!.prepare(`SELECT * FROM quote_milestones WHERE quote_id = ?1 ORDER BY seq`).bind(quoteId).all<MilestoneRow>()).results ?? [];
export const stagesOf = async (env: ProjectEnv, quoteId: string) => (await env.DB!.prepare(`SELECT * FROM work_stages WHERE quote_id = ?1 ORDER BY seq`).bind(quoteId).all<StageRow>()).results ?? [];
export const contractOf = (env: ProjectEnv, quoteId: string) => env.DB!.prepare(`SELECT * FROM contracts WHERE quote_id = ?1`).bind(quoteId).first<ContractRow>();
export const meetingsOf = async (env: ProjectEnv, leadId: string) => (await env.DB!.prepare(`SELECT * FROM meetings WHERE lead_id = ?1 ORDER BY requested_at DESC, id DESC`).bind(leadId).all<MeetingRow>()).results ?? [];
export const historyOf = async (env: ProjectEnv, leadId: string) =>
  (await env.DB!.prepare(`SELECT status, note, at FROM lead_events WHERE lead_id = ?1 ORDER BY at ASC, id ASC`).bind(leadId).all<{ status: string; note: string | null; at: string }>()).results ?? [];

/** The proposal the client is acting on: the newest one that is not superseded or cancelled. */
export const liveQuote = (quotes: QuoteRow[]) => quotes.find((q) => ["sent", "change_requested", "accepted", "paid"].includes(q.status)) ?? null;

export async function getSetting(env: ProjectEnv, key: string) {
  return (await env.DB!.prepare(`SELECT value FROM settings WHERE key = ?1`).bind(key).first<{ value: string }>())?.value ?? null;
}
export async function setSetting(env: ProjectEnv, key: string, value: string) {
  await env.DB!.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')`).bind(key, value).run();
}

export async function ensurePortalToken(env: ProjectEnv, lead: LeadRow) {
  if (lead.portal_token) return lead.portal_token;
  const token = newToken();
  await env.DB!.prepare(`UPDATE leads SET portal_token = ?2 WHERE lead_id = ?1 AND portal_token IS NULL`).bind(lead.lead_id, token).run();
  lead.portal_token = (await env.DB!.prepare(`SELECT portal_token FROM leads WHERE lead_id = ?1`).bind(lead.lead_id).first<{ portal_token: string }>())?.portal_token ?? token;
  return lead.portal_token;
}
export const portalLink = async (env: ProjectEnv, site: string, lead: LeadRow) => portalUrl(site, leadLang(lead), await ensurePortalToken(env, lead));

export async function mail(env: ProjectEnv, to: string, m: { subject: string; text: string; html?: string }, files?: CheckedFile[]) {
  await sendEmail(env, { to, subject: m.subject, text: m.text, html: m.html, replyTo: salesEmail(env), files });
}
export const quietly = (p: Promise<unknown>, what: string) => p.catch((e) => console.error(what, e));

export async function addEvent(env: ProjectEnv, leadId: string, status: string, note: string) {
  await env.DB!.prepare(`INSERT INTO lead_events (lead_id, status, note, at, notified) VALUES (?1, ?2, ?3, datetime('now'), 1)`).bind(leadId, status, note).run();
}
export async function setLeadStatus(env: ProjectEnv, lead: LeadRow, status: string) {
  if (lead.status === status) return;
  await env.DB!.prepare(`UPDATE leads SET status = ?2, status_updated_at = datetime('now') WHERE lead_id = ?1`).bind(lead.lead_id, status).run();
  lead.status = status;
}

// ---------------------------------------------------------------- Moyasar

export async function moyasar<T>(env: ProjectEnv, method: string, path: string, body?: unknown): Promise<T> {
  if (!keyAllowed(env.MOYASAR_SECRET_KEY, env.MOYASAR_ALLOW_LIVE)) throw new ProjectError("payments_not_configured", 503);
  const res = await fetch(MOYASAR_API + path, {
    method,
    headers: { authorization: `Basic ${btoa(`${env.MOYASAR_SECRET_KEY}:`)}`, "content-type": "application/json", accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("moyasar", method, path, res.status, JSON.stringify(data).slice(0, 400));
    throw new ProjectError("gateway_error", 502);
  }
  return data as T;
}
export const paymentMode = (env: ProjectEnv) => (keyAllowed(env.MOYASAR_SECRET_KEY, env.MOYASAR_ALLOW_LIVE) ? (env.MOYASAR_SECRET_KEY!.startsWith("sk_live_") ? "live" : "test") : "off");

/** Records a payment once, then issues the contract or opens the next stage as needed. False for a duplicate. */
export async function markPaid(env: ProjectEnv, ms: MilestoneRow, quote: QuoteRow, lead: LeadRow, site: string, paymentId: string, by: "moyasar" | "manual") {
  const updated = await env.DB!.prepare(
    `UPDATE quote_milestones SET status = 'paid', paid_at = datetime('now'), payment_id = ?2, paid_by = ?3 WHERE id = ?1 AND status != 'paid' RETURNING id`,
  ).bind(ms.id, paymentId, by).first<{ id: number }>();
  if (!updated) return false;
  ms.status = "paid";

  const all = await milestonesOf(env, quote.quote_id);
  const remaining = all.filter((m) => !PAID(m)).reduce((n, m) => n + m.amount, 0);
  if (remaining === 0) {
    await env.DB!.prepare(`UPDATE quotes SET status = 'paid' WHERE quote_id = ?1 AND status IN ('accepted', 'paid')`).bind(quote.quote_id).run();
    quote.status = "paid";
  }
  const lang = quote.lang;
  await addEvent(env, lead.lead_id, lead.status, lang === "ar" ? `تم استلام دفعة «${ms.label}» بمبلغ ${formatSar(ms.amount, "ar")}.` : `Payment received: "${ms.label}", ${formatSar(ms.amount, "en")}.`);
  const url = await portalLink(env, site, lead);
  await quietly(mail(env, lead.email, receiptEmail({ lang, name: lead.contact_name, leadId: lead.lead_id, title: quote.title, url, label: ms.label, amount: ms.amount, paymentId, remaining })), "receipt email failed");
  await quietly(mail(env, salesEmail(env), staffEmail("paid", { leadId: lead.lead_id, quoteId: quote.quote_id, company: lead.company ?? "", title: quote.title, label: ms.label, amount: ms.amount, paymentId })), "staff payment email failed");

  if (ms.trigger === "acceptance") await issueContract(env, quote, lead, site);
  await advanceWork(env, quote, lead, site);
  return true;
}

/** Reads a due instalment's invoice back from Moyasar and records it if paid. */
export async function sync(env: ProjectEnv, ms: MilestoneRow, quote: QuoteRow, lead: LeadRow, site: string) {
  if (ms.status !== "due" || !ms.invoice_id) return ms;
  try {
    const inv = await moyasar<MoyasarInvoice>(env, "GET", `/invoices/${encodeURIComponent(ms.invoice_id)}`);
    if (isPaidInvoice(inv, ms.amount)) {
      const pay = inv.payments?.find((p) => p.status === "paid");
      await markPaid(env, ms, quote, lead, site, pay?.id ?? inv.id, "moyasar");
      return { ...ms, status: "paid" };
    }
  } catch (e) {
    console.error("invoice sync failed", ms.id, e);
  }
  return ms;
}

/** Payment link for a due instalment: reuses a live invoice or creates one. Null if it turned out paid. */
export async function invoiceUrl(env: ProjectEnv, ms: MilestoneRow, quote: QuoteRow, lead: LeadRow, site: string): Promise<string | null> {
  if (ms.status !== "due") throw new ProjectError("not_due", 409);
  if (ms.invoice_id) {
    const inv = await moyasar<MoyasarInvoice>(env, "GET", `/invoices/${encodeURIComponent(ms.invoice_id)}`);
    if (isPaidInvoice(inv, ms.amount)) {
      const pay = inv.payments?.find((p) => p.status === "paid");
      await markPaid(env, ms, quote, lead, site, pay?.id ?? inv.id, "moyasar");
      return null;
    }
    if (!isDeadInvoice(inv.status) && inv.amount === ms.amount && (inv.url || ms.invoice_url)) return inv.url ?? ms.invoice_url;
  }
  const page = await portalLink(env, site, lead);
  const inv = await moyasar<MoyasarInvoice>(env, "POST", "/invoices", invoicePayload({
    amount: ms.amount,
    description: `Selorin ${lead.lead_id}: ${ms.label}`,
    callbackUrl: `${site}/api/pay/callback?ms=${ms.id}`,
    successUrl: `${page}&paid=1`,
    backUrl: page,
    expiresAt: new Date(Date.now() + 30 * 86400_000),
    metadata: { lead_id: lead.lead_id, quote_id: quote.quote_id, milestone_id: String(ms.id) },
  }));
  if (!inv.url) throw new ProjectError("gateway_error", 502);
  // Two clicks at once must not leave two payable invoices: only the first one is kept.
  const kept = await env.DB!.prepare(`UPDATE quote_milestones SET invoice_id = ?2, invoice_url = ?3 WHERE id = ?1 AND invoice_id IS ?4 RETURNING id`)
    .bind(ms.id, inv.id, inv.url, ms.invoice_id).first<{ id: number }>();
  if (!kept) {
    await moyasar(env, "PUT", `/invoices/${encodeURIComponent(inv.id)}/cancel`).catch(() => undefined);
    return (await env.DB!.prepare(`SELECT invoice_url FROM quote_milestones WHERE id = ?1`).bind(ms.id).first<{ invoice_url: string | null }>())?.invoice_url ?? null;
  }
  return inv.url;
}

/** Marks instalments due and e-mails the client a payment link for each. */
export async function makeDue(env: ProjectEnv, rows: MilestoneRow[], quote: QuoteRow, lead: LeadRow, site: string) {
  if (!rows.length) return;
  const url = await portalLink(env, site, lead);
  const stages = rows.some((m) => m.stage_seq !== null) ? await stagesOf(env, quote.quote_id) : [];
  for (const m of rows) {
    const won = await env.DB!.prepare(`UPDATE quote_milestones SET status = 'due', due_at = datetime('now') WHERE id = ?1 AND status = 'scheduled' RETURNING id`).bind(m.id).first();
    if (!won) continue;
    m.status = "due";
    const stage = stages.find((s) => s.seq === m.stage_seq)?.title ?? null;
    await quietly(mail(env, lead.email, dueEmail({ lang: quote.lang, name: lead.contact_name, leadId: lead.lead_id, title: quote.title, url, label: m.label, amount: m.amount, advance: m.trigger === "acceptance", stage })), "due email failed");
  }
}

// ---------------------------------------------------------------- contract

function profileOf(raw: string | null, lang: Lang): ContractParty {
  let p: Record<string, string> = {};
  try { p = raw ? JSON.parse(raw) : {}; } catch { /* defaults below */ }
  return {
    legalName: p.legalName || (lang === "ar" ? "سيلورين للاستشارات والخدمات البيئية" : "Selorin Environmental Advisory & Services"),
    crNumber: p.crNumber || "", vatNumber: p.vatNumber || "", address: p.address || "",
    signatoryName: p.signatoryName || "", signatoryTitle: p.signatoryTitle || "",
    phone: p.phone || "+966 55 015 6887", email: p.email || "sales@selorin.co",
  };
}

/** The contract document: the frozen copy once issued, otherwise a preview from current data. */
export async function renderContract(env: ProjectEnv, quote: QuoteRow, lead: LeadRow, contract: ContractRow | null, issue: boolean) {
  if (contract?.document && !issue) return contract.document;
  const lang = quote.lang;
  const [ms, stages, profile] = await Promise.all([milestonesOf(env, quote.quote_id), stagesOf(env, quote.quote_id), getSetting(env, "contract_profile")]);
  const signature = issue ? await getSetting(env, "contract_signature") : null;
  const stamp = issue ? await getSetting(env, "contract_stamp") : null;
  const stageTitle = (seq: number | null) => stages.find((s) => s.seq === seq)?.title ?? "";
  const pending = lang === "ar" ? "يُستكمل من بيانات التعاقد" : "to be completed from the contract details";
  const client: ContractParty = contract
    ? { legalName: contract.legal_name, crNumber: contract.cr_number ?? "", address: contract.address ?? "", signatoryName: contract.signatory_name, signatoryTitle: contract.signatory_title, phone: contract.signatory_phone, email: contract.signatory_email }
    : { legalName: lead.company || pending, signatoryName: pending, signatoryTitle: pending };
  return contractDocument({
    lang,
    contractNo: contract?.contract_no ?? contractNumber(quote.quote_id),
    date: issue ? today() : (contract?.issued_at ?? today()).slice(0, 10),
    issued: issue,
    provider: profileOf(profile, lang),
    client,
    leadId: lead.lead_id, quoteId: quote.quote_id, title: quote.title,
    documents: JSON.parse(quote.documents ?? "[]"),
    subtotal: quote.subtotal, vat: quote.vat, total: quote.total,
    payments: ms.map((m) => ({
      label: m.label, amount: m.amount,
      when: m.trigger === "acceptance" ? TRIGGER_LABELS.acceptance[lang] : (lang === "ar" ? `عند إنجاز مرحلة «${stageTitle(m.stage_seq) || m.label}»` : `On completion of "${stageTitle(m.stage_seq) || m.label}"`),
    })),
    stages: stages.map((s) => s.title),
    acceptance: contract ? { at: riyadh(contract.accepted_at), name: contract.signatory_name, email: contract.signatory_email } : null,
    signature: validImage(signature) ? signature : null,
    stamp: validImage(stamp) ? stamp : null,
  });
}

/** Issues the contract once the client has accepted it electronically and any advance is paid. */
export async function issueContract(env: ProjectEnv, quote: QuoteRow, lead: LeadRow, site: string) {
  const contract = await contractOf(env, quote.quote_id);
  if (!contract || contract.status !== "details") return false;
  const ms = await milestonesOf(env, quote.quote_id);
  if (ms.some((m) => m.trigger === "acceptance" && !PAID(m))) return false;
  const doc = await renderContract(env, quote, lead, contract, true);
  const won = await env.DB!.prepare(`UPDATE contracts SET status = 'issued', issued_at = datetime('now'), document = ?2 WHERE id = ?1 AND status = 'details' RETURNING id`)
    .bind(contract.id, doc).first();
  if (!won) return false;
  await addEvent(env, lead.lead_id, lead.status, quote.lang === "ar"
    ? `أصدرنا العقد رقم ${contract.contract_no} موقعاً ومختوماً من سيلورين. حمّله ووقّعه واختمه ثم ارفع النسخة الموقعة من البوابة.`
    : `We issued contract ${contract.contract_no}, signed and stamped by Selorin. Download it, sign and stamp it, then upload the signed copy in the portal.`);
  const url = await portalLink(env, site, lead);
  await quietly(mail(env, lead.email, contractIssuedEmail({ lang: quote.lang, name: lead.contact_name, leadId: lead.lead_id, url, contractNo: contract.contract_no })), "contract email failed");
  await archive(env, { lead_id: lead.lead_id, company: lead.company, service: serviceName(lead), drive_folder_id: lead.drive_folder_id }, [htmlFile(`${contract.contract_no} | ${quote.lang === "ar" ? "العقد الصادر" : "issued contract"}.html`, doc)]);
  return true;
}

// ---------------------------------------------------------------- technical work

/** Whether the technical work may run: contract signed (or started by staff) and the advance paid. */
export function workReady(contract: ContractRow | null, ms: MilestoneRow[]) {
  const signed = !!contract && (contract.status === "countersigned" || (contract.status === "issued" && contract.start_override === 1));
  return signed && !ms.some((m) => m.trigger === "acceptance" && !PAID(m));
}

/** Starts the next stage when its gates are open, and closes the request when everything is done and paid. */
export async function advanceWork(env: ProjectEnv, quote: QuoteRow, lead: LeadRow, site: string): Promise<{ started: string | null; completed: boolean }> {
  const [contract, ms, stages] = await Promise.all([contractOf(env, quote.quote_id), milestonesOf(env, quote.quote_id), stagesOf(env, quote.quote_id)]);
  let started: string | null = null;
  const next = workGates(stages, ms, workReady(contract, ms)).find((g) => g.state === "ready");
  if (next) {
    const st = stages.find((s) => s.seq === next.seq)!;
    const won = await env.DB!.prepare(`UPDATE work_stages SET status = 'active', started_at = datetime('now') WHERE id = ?1 AND status = 'pending' RETURNING id`).bind(st.id).first();
    if (won) {
      st.status = "active";
      started = st.title;
      await setLeadStatus(env, lead, "in_progress");
      await addEvent(env, lead.lead_id, "in_progress", quote.lang === "ar" ? `بدأنا مرحلة «${st.title}» من التنفيذ الفني.` : `We started the "${st.title}" stage of the technical work.`);
    }
  }
  const completed = stages.length > 0 && stages.every((s) => s.status === "done") && ms.every(PAID);
  if (completed && lead.status !== "completed") {
    await setLeadStatus(env, lead, "completed");
    await env.DB!.prepare(`UPDATE quotes SET status = 'paid' WHERE quote_id = ?1`).bind(quote.quote_id).run();
    await addEvent(env, lead.lead_id, "completed", quote.lang === "ar" ? "اكتملت الأعمال وسُددت جميع الدفعات." : "The work is complete and all payments are settled.");
    await quietly(mail(env, lead.email, projectDoneEmail({ lang: quote.lang, name: lead.contact_name, leadId: lead.lead_id, url: await portalLink(env, site, lead), title: quote.title })), "completion email failed");
  }
  return { started, completed };
}

/** Staff completes the active stage: its instalments fall due, and the next stage opens if nothing is owed. */
export async function completeStage(env: ProjectEnv, stage: StageRow, quote: QuoteRow, lead: LeadRow, site: string, note: string) {
  const won = await env.DB!.prepare(`UPDATE work_stages SET status = 'done', completed_at = datetime('now'), note = COALESCE(NULLIF(?2, ''), note) WHERE id = ?1 AND status = 'active' RETURNING id`)
    .bind(stage.id, note).first();
  if (!won) throw new ProjectError("not_active", 409);
  const due = (await milestonesOf(env, quote.quote_id)).filter((m) => m.stage_seq === stage.seq && m.status === "scheduled");
  const ar = quote.lang === "ar";
  const owed = due.map((m) => (ar ? `«${m.label}» (${formatSar(m.amount, "ar")})` : `"${m.label}" (${formatSar(m.amount, "en")})`)).join(ar ? " و" : " and ");
  await addEvent(env, lead.lead_id, lead.status, ar
    ? `أنجزنا مرحلة «${stage.title}»${note ? `: ${note}` : "."}${owed ? ` وأصبحت دفعة ${owed} مستحقة، وتبدأ المرحلة التالية بعد سدادها.` : ""}`
    : `We completed the "${stage.title}" stage${note ? `: ${note}` : "."}${owed ? ` Payment ${owed} is now due, and the next stage starts once it is paid.` : ""}`);
  await makeDue(env, due, quote, lead, site);
  const { started } = await advanceWork(env, quote, lead, site);
  if (!due.length) {
    await quietly(mail(env, lead.email, stageDoneEmail({ lang: quote.lang, name: lead.contact_name, leadId: lead.lead_id, url: await portalLink(env, site, lead), title: quote.title, stage: stage.title, next: started })), "stage email failed");
  }
  return { due: due.length, started };
}

// ---------------------------------------------------------------- the client's view

/** Due dates for the team's next step, measured from the client's last step (the 3 hour timer). */
export function clientTimer(env: ProjectEnv, lead: LeadRow, quotes: QuoteRow[], meetings: MeetingRow[]) {
  const h = slaHours(env.QUOTE_SLA_HOURS);
  const live = liveQuote(quotes);
  if (!quotes.length && lead.quote_due_at && ["received", "reviewing"].includes(lead.status)) return { kind: "proposal", dueAt: lead.quote_due_at };
  if (live?.status === "change_requested" && live.change_requested_at) return { kind: "revision", dueAt: addHours(live.change_requested_at, h) };
  const open = meetings.find((m) => m.status === "requested");
  if (open) return { kind: "meeting", dueAt: addHours(open.requested_at, h) };
  const held = meetings.find((m) => m.status === "held" && m.needs_revision === 1 && m.held_at && !quotes.some((q) => q.quote_id !== m.quote_id && q.created_at >= m.held_at!));
  if (held) return { kind: "revision", dueAt: addHours(held.held_at!, h) };
  return null;
}

async function liveParts(env: ProjectEnv, live: QuoteRow | null): Promise<[MilestoneRow[], StageRow[], ContractRow | null]> {
  return live ? Promise.all([milestonesOf(env, live.quote_id), stagesOf(env, live.quote_id), contractOf(env, live.quote_id)]) : [[], [], null];
}
const stageIndex = (lead: Pick<LeadRow, "status">, live: QuoteRow | null, ms: MilestoneRow[], stages: StageRow[], contract: ContractRow | null) => projectStage({
  leadStatus: lead.status, quoteStatus: live?.status, contractStatus: contract?.status, advanceDue: ms.some((m) => m.trigger === "acceptance" && !PAID(m)),
  workStarted: stages.some((s) => s.status !== "pending"), completed: lead.status === "completed",
});

/** Index into STAGES for the tracking page (by request ID and e-mail). */
export async function stageFor(env: ProjectEnv, lead: Pick<LeadRow, "lead_id" | "status">) {
  const live = liveQuote(await quotesOf(env, lead.lead_id));
  const [ms, stages, contract] = await liveParts(env, live);
  return stageIndex(lead, live, ms, stages, contract);
}

export async function projectView(env: ProjectEnv, lead: LeadRow, site: string) {
  const [quotes, meetings, history] = await Promise.all([quotesOf(env, lead.lead_id), meetingsOf(env, lead.lead_id), historyOf(env, lead.lead_id)]);
  const live = liveQuote(quotes);
  const [ms, stages, contract] = await liveParts(env, live);
  const advanceDue = ms.some((m) => m.trigger === "acceptance" && !PAID(m));
  const gates = workGates(stages, ms, workReady(contract, ms));
  const expired = !!live && live.status === "sent" && live.valid_until < today();
  const quoteStatus = live ? (expired ? "expired" : live.status) : null;
  const stage = stageIndex(lead, live, ms, stages, contract);
  const timer = clientTimer(env, lead, quotes, meetings);
  const openMeeting = meetings.find((m) => m.status === "requested" || m.status === "scheduled") ?? null;
  const due = ms.find((m) => m.status === "due");

  let next = "in_progress";
  if (lead.status === "completed") next = "done";
  else if (lead.status === "closed") next = "closed";
  else if (!live) next = quotes.some((q) => q.status === "cancelled") && !quotes.some((q) => q.status === "superseded") ? "cancelled" : quotes.length ? "wait_revision" : "wait_proposal";
  else if (live.status === "change_requested" || timer?.kind === "revision") next = "wait_revision";
  else if (live.status === "sent") next = expired ? "expired" : openMeeting ? (openMeeting.status === "requested" ? "meeting_requested" : "meeting_scheduled") : "review";
  else if (!contract) next = "contract_details";
  else if (contract.status === "details") next = advanceDue ? "pay_advance" : "contract_issuing";
  else if (contract.status === "issued" && contract.start_override !== 1) next = "sign_contract";
  else if (due) next = "pay_due";

  const payload = leadPayload(lead);
  return {
    lead: {
      id: lead.lead_id, service: serviceName(lead), company: lead.company ?? "", name: lead.contact_name, submittedAt: lead.submitted_at, status: lead.status, lang: leadLang(lead),
      details: (payload.details as { label: string; value: string }[] | undefined)?.map((d) => ({ label: d.label, value: d.value })) ?? [],
      message: String(payload.message ?? ""),
      attachments: ((payload.attachments as { name: string }[] | undefined) ?? []).map((a) => a.name),
    },
    stage, next, timer, payments: paymentMode(env),
    quote: live ? {
      quoteId: live.quote_id, version: Number(live.quote_id.split("-Q")[1] ?? 1), title: live.title,
      subtotal: live.subtotal, vat: live.vat, total: live.total,
      paid: ms.filter((m) => m.status === "paid").reduce((n, m) => n + m.amount, 0),
      status: quoteStatus, validUntil: live.valid_until, createdAt: live.created_at, acceptedAt: live.accepted_at,
      documents: JSON.parse(live.documents ?? "[]") as string[],
      negotiable: live.negotiable === 1 && !live.change_requested_at, final: live.negotiable !== 1, revisionNote: live.revision_note,
      milestones: ms.map((m) => ({ id: m.id, seq: m.seq, label: m.label, trigger: m.trigger, percent: m.percent, amount: m.amount, status: m.status, dueAt: m.due_at, paidAt: m.paid_at, stageSeq: m.stage_seq })),
    } : null,
    versions: quotes.map((q) => {
      let change: unknown = null;
      try { change = q.change_request ? JSON.parse(q.change_request) : null; } catch { /* shown without details */ }
      return { quoteId: q.quote_id, createdAt: q.created_at, total: q.total, status: q.status, revisionNote: q.revision_note, final: q.negotiable !== 1, changeRequest: change, changeRequestedAt: q.change_requested_at };
    }),
    meetings: meetings.map((m) => ({ id: m.id, quoteId: m.quote_id, mode: m.mode, preferred: m.preferred, topics: m.topics, status: m.status, requestedAt: m.requested_at, scheduledAt: m.scheduled_at, location: m.location, outcome: m.outcome })),
    canMeet: !!live && live.status === "sent" && !expired && live.negotiable === 1 && !openMeeting,
    contract: contract ? {
      contractNo: contract.contract_no, status: contract.status, legalName: contract.legal_name, crNumber: contract.cr_number, address: contract.address,
      signatoryName: contract.signatory_name, signatoryTitle: contract.signatory_title, signatoryPhone: contract.signatory_phone, signatoryEmail: contract.signatory_email,
      acceptedAt: contract.accepted_at, issuedAt: contract.issued_at, countersignedAt: contract.countersigned_at, countersignedFile: contract.countersigned_file,
      started: contract.start_override === 1,
    } : null,
    prefill: { legalName: lead.company ?? "", signatoryName: lead.contact_name, signatoryTitle: String(payload.jobTitle ?? ""), signatoryPhone: lead.phone ?? "", signatoryEmail: lead.email },
    work: stages.map((s) => {
      const g = gates.find((x) => x.seq === s.seq);
      return { seq: s.seq, title: s.title, status: s.status, startedAt: s.started_at, completedAt: s.completed_at, note: s.note, state: g?.state ?? "upcoming", blockedBy: g?.blockedBy ? { label: g.blockedBy.label, amount: g.blockedBy.amount } : null };
    }),
    history,
  };
}
