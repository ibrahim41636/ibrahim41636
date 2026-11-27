/// <reference types="@cloudflare/workers-types" />
// The client's request portal and the staff tools that drive it. The portal token is created when
// the request is submitted and e-mailed to the client; it is the client's key to the request.
//
// Public (t = portal token):
//   GET  /api/portal?t=               everything the client sees for the request
//   POST /api/portal/meeting          ask for a meeting about the proposal and scope (kept as written)
//   POST /api/portal/discount         the one discount or schedule request; the next version is final
//   POST /api/portal/accept           approve the live proposal
//   POST /api/portal/contract         signatory details + electronic acceptance → advance payment link
//   GET  /api/portal/contract?t=      the contract: a preview, or the issued copy signed and stamped
//   POST /api/portal/pay {t, ms}      payment link for a due instalment
//   POST /api/portal/countersign      the client's signed and stamped copy (multipart: t, file)
//   POST /api/portal/upload           more documents for the request (multipart: t, files)
//   POST /api/portal/resend {id, email}  e-mail the portal link again (always answers ok)
// Staff (ADMIN_TOKEN, via admin.ts):
//   GET  /api/admin/tasks             proposal timers: new requests, discount requests, meetings
//   POST /api/admin/meeting {id, action: schedule|held|cancel, when?, location?, outcome?, needsRevision?}
//   POST /api/admin/stage {id, note?} complete the active technical stage
//   POST /api/admin/contract {quoteId} start the work before the signed copy arrives
//   GET  /api/admin/contract-doc?quote=ID   the contract as the client sees it
//   GET  /api/admin/settings, POST (multipart)  contract profile, signature and stamp images
import { json } from "./request";
import { checkUploads, extensionOf, safeName as uploadName, type CheckedFile } from "../../src/lib/uploads";
import { LEAD_ID, normalizeEmail } from "../../src/lib/tracking";
import { TOKEN, parseChangeRequest, staffEmail } from "../../src/lib/payments";
import {
  MEETING_MODE_LABELS, addHours, contractNumber, dbTime, fromDb, ltr, meetingScheduledEmail, parseContractDetails, parseMeetingRequest, portalLinkEmail, slaHours, staffNote,
  validImage, type MeetingMode,
} from "../../src/lib/portal";
import { archive, driveConfigured, folderUrl } from "./drive";
import {
  ProjectError, addEvent, advanceWork, completeStage, contractOf, ensurePortalToken, getSetting, invoiceUrl, issueContract, leadByPortal, leadLang, leadOf,
  liveQuote, mail, makeDue, meetingsOf, milestonesOf, paymentMode, portalLink, projectView, quietly, quoteOf, quotesOf, renderContract, salesEmail, serviceName,
  setSetting, siteOrigin, sync, today, type ContractRow, type LeadRow, type MeetingRow, type ProjectEnv, type QuoteRow, type StageRow,
} from "./projects";

const adminUrl = (site: string, leadId: string) => `${site}/ar/admin/quotes/?lead=${encodeURIComponent(leadId)}`;

async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer", "x-robots-tag": "noindex, nofollow", "x-frame-options": "DENY" },
  });
}

async function byToken(env: ProjectEnv, token: string) {
  if (!TOKEN.test(token)) return null;
  return leadByPortal(env, token);
}

/** The live proposal of the request, or a 409 when the client has nothing to act on. */
async function live(env: ProjectEnv, lead: LeadRow): Promise<QuoteRow> {
  if (lead.status === "closed") throw new ProjectError("closed", 409);
  const q = liveQuote(await quotesOf(env, lead.lead_id));
  if (!q) throw new ProjectError("no_proposal", 409);
  return q;
}

// ---------------------------------------------------------------- client

export async function handlePortal(request: Request, env: ProjectEnv, path: string): Promise<Response> {
  if (!env.DB) return json(503, { ok: false, error: "portal_unavailable" });
  const site = siteOrigin(request, env);
  try {
    const url = new URL(request.url);

    if (path === "/api/portal/resend" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { id?: string; email?: string };
      const id = String(body.id ?? "").trim().toUpperCase();
      const email = normalizeEmail(String(body.email ?? ""));
      if (LEAD_ID.test(id) && email.includes("@")) {
        const lead = await leadOf(env, id);
        // At most one resend an hour, and only to the address on the request.
        const key = `resend:${id}:${dbTime(new Date()).slice(0, 13)}`;
        if (lead && lead.kind === "request" && lead.email.toLowerCase() === email
          && await env.DB.prepare(`INSERT INTO sla_alerts (key, at) VALUES (?1, datetime('now')) ON CONFLICT(key) DO NOTHING RETURNING key`).bind(key).first()) {
          await quietly(mail(env, lead.email, portalLinkEmail({ lang: leadLang(lead), name: lead.contact_name, leadId: lead.lead_id, url: await portalLink(env, site, lead), service: serviceName(lead) })), "portal resend failed");
        }
      }
      return json(200, { ok: true });
    }

    if (path === "/api/portal/contract" && request.method === "GET") {
      const lead = await byToken(env, url.searchParams.get("t") ?? "");
      const quote = lead ? liveQuote(await quotesOf(env, lead.lead_id)) : null;
      if (!lead || !quote || !["accepted", "paid"].includes(quote.status)) return htmlResponse("<!doctype html><meta charset=utf-8><title>404</title><p>Not found</p>", 404);
      const contract = await contractOf(env, quote.quote_id);
      return htmlResponse(await renderContract(env, quote, lead, contract, false));
    }

    const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const form = multipart && request.method === "POST" ? await request.formData() : null;
    const body = form ? {} : request.method === "POST" ? ((await request.json().catch(() => ({}))) as Record<string, unknown>) : {};
    const token = String(form?.get("t") ?? (body as { t?: string }).t ?? url.searchParams.get("t") ?? "");
    const lead = await byToken(env, token);
    if (!lead) return json(404, { ok: false, error: "not_found" });
    const ar = leadLang(lead) === "ar";

    if (path === "/api/portal" && request.method === "GET") {
      // Pick up payments whose callback was missed before showing the state.
      const q = liveQuote(await quotesOf(env, lead.lead_id));
      if (q) for (const m of await milestonesOf(env, q.quote_id)) if (m.status === "due" && m.invoice_id) await sync(env, m, q, lead, site);
      const fresh = (await leadOf(env, lead.lead_id))!;
      return json(200, { ok: true, portal: { ...(await projectView(env, fresh, site)), contractUrl: `/api/portal/contract?t=${encodeURIComponent(token)}` } });
    }

    if (path === "/api/portal/meeting" && request.method === "POST") {
      const quote = await live(env, lead);
      if (quote.status !== "sent" || quote.valid_until < today() || quote.negotiable !== 1) return json(409, { ok: false, error: "not_open" });
      if ((await meetingsOf(env, lead.lead_id)).some((m) => m.status === "requested" || m.status === "scheduled")) return json(409, { ok: false, error: "meeting_open" });
      const parsed = parseMeetingRequest(body);
      if (!parsed.ok) return json(422, { ok: false, error: `meeting_${parsed.error}` });
      const { mode, preferred, topics } = parsed.request;
      const row = await env.DB.prepare(`INSERT INTO meetings (lead_id, quote_id, mode, preferred, topics, requested_at) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now')) RETURNING requested_at`)
        .bind(lead.lead_id, quote.quote_id, mode, preferred, topics || null).first<{ requested_at: string }>();
      await addEvent(env, lead.lead_id, lead.status, ar
        ? `طلبتَ اجتماعاً لمناقشة العرض ونطاق العمل (${MEETING_MODE_LABELS[mode].ar}). الأوقات المناسبة لك: ${preferred}.${topics ? ` المواضيع: ${topics}` : ""}`
        : `You asked for a meeting to discuss the proposal and scope (${MEETING_MODE_LABELS[mode].en}). Preferred times: ${preferred}.${topics ? ` Topics: ${topics}` : ""}`);
      await quietly(mail(env, salesEmail(env), staffNote("meeting", {
        leadId: lead.lead_id, company: lead.company ?? "", quoteId: quote.quote_id, adminUrl: adminUrl(site, lead.lead_id),
        detail: `Mode: ${MEETING_MODE_LABELS[mode].en}\nPreferred times: ${preferred}\nTopics: ${topics || "(none)"}`,
        due: addHours(row!.requested_at, slaHours(env.QUOTE_SLA_HOURS)),
      })), "meeting email failed");
      return json(200, { ok: true });
    }

    if (path === "/api/portal/discount" && request.method === "POST") {
      const quote = await live(env, lead);
      if (quote.status !== "sent") return json(409, { ok: false, error: "not_open" });
      if (quote.valid_until < today()) return json(410, { ok: false, error: "expired" });
      if (quote.negotiable !== 1) return json(409, { ok: false, error: "final" });
      const parsed = parseChangeRequest(body);
      if (!parsed.ok) return json(422, { ok: false, error: `change_${parsed.error}` });
      const won = await env.DB.prepare(
        `UPDATE quotes SET status = 'change_requested', change_request = ?2, change_requested_at = datetime('now') WHERE quote_id = ?1 AND status = 'sent' AND negotiable = 1 AND change_requested_at IS NULL RETURNING quote_id`,
      ).bind(quote.quote_id, JSON.stringify(parsed.request)).first();
      if (!won) return json(409, { ok: false, error: "not_open" });
      const what = ar
        ? [parsed.request.discount ? "خصم" : "", parsed.request.schedule ? "تعديل جدول الدفعات" : ""].filter(Boolean).join(" و")
        : [parsed.request.discount ? "a discount" : "", parsed.request.schedule ? "a different payment schedule" : ""].filter(Boolean).join(" and ");
      await addEvent(env, lead.lead_id, lead.status, ar
        ? `طلبتَ ${what}${parsed.request.note ? `: ${parsed.request.note}` : "."} سنرسل لك العرض المحدّث، ويكون نهائياً.`
        : `You asked for ${what}${parsed.request.note ? `: ${parsed.request.note}` : "."} We will send you the revised proposal, which will be final.`);
      await quietly(mail(env, salesEmail(env), staffEmail("change", { leadId: lead.lead_id, quoteId: quote.quote_id, company: lead.company ?? "", title: quote.title, change: parsed.request, adminUrl: adminUrl(site, lead.lead_id) })), "staff change email failed");
      return json(200, { ok: true });
    }

    if (path === "/api/portal/accept" && request.method === "POST") {
      const quote = await live(env, lead);
      if (quote.status !== "sent") return json(409, { ok: false, error: quote.status === "change_requested" ? "change_requested" : "not_open" });
      if (quote.valid_until < today()) return json(410, { ok: false, error: "expired" });
      // Only the request that actually flips the status records the approval and tells the team.
      const won = await env.DB.prepare(`UPDATE quotes SET status = 'accepted', accepted_at = datetime('now') WHERE quote_id = ?1 AND status = 'sent' RETURNING quote_id`).bind(quote.quote_id).first();
      if (won) {
        await addEvent(env, lead.lead_id, lead.status, ar ? `وافقتَ على العرض الفني والمالي (${quote.quote_id}). الخطوة التالية: بيانات التعاقد.` : `You approved the technical and financial proposal (${quote.quote_id}). Next step: the contract details.`);
        await quietly(mail(env, salesEmail(env), staffEmail("accepted", { leadId: lead.lead_id, quoteId: quote.quote_id, company: lead.company ?? "", title: quote.title })), "staff accept email failed");
      }
      return json(200, { ok: true });
    }

    if (path === "/api/portal/contract" && request.method === "POST") {
      const quote = await live(env, lead);
      if (quote.status !== "accepted" && quote.status !== "paid") return json(409, { ok: false, error: "not_accepted" });
      const existing = await contractOf(env, quote.quote_id);
      if (existing && existing.status !== "details") return json(409, { ok: false, error: "contract_issued" });
      const parsed = parseContractDetails(body);
      if (!parsed.ok) return json(422, { ok: false, error: "validation", errors: parsed.errors });
      const d = parsed.details;
      const ipHash = await sha256(`${request.headers.get("cf-connecting-ip") ?? ""}:selorin`);
      const agent = (request.headers.get("user-agent") ?? "").slice(0, 200);
      await env.DB.prepare(
        `INSERT INTO contracts (contract_no, lead_id, quote_id, lang, legal_name, cr_number, address, signatory_name, signatory_title, signatory_phone, signatory_email, accepted_at, accept_ip_hash, accept_agent)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, datetime('now'), ?12, ?13)
         ON CONFLICT(quote_id) DO UPDATE SET legal_name = ?5, cr_number = ?6, address = ?7, signatory_name = ?8, signatory_title = ?9, signatory_phone = ?10, signatory_email = ?11,
           accepted_at = datetime('now'), accept_ip_hash = ?12, accept_agent = ?13 WHERE contracts.status = 'details'`,
      ).bind(contractNumber(quote.quote_id), lead.lead_id, quote.quote_id, quote.lang, d.legalName, d.crNumber || null, d.address || null, d.signatoryName, d.signatoryTitle, d.signatoryPhone, d.signatoryEmail, ipHash, agent).run();
      if (!existing) {
        await addEvent(env, lead.lead_id, lead.status, ar
          ? `أُدخلت بيانات التعاقد ووافق ${d.signatoryName} (${d.signatoryTitle}) على العقد إلكترونياً.`
          : `The contract details were entered and ${d.signatoryName} (${d.signatoryTitle}) accepted the contract electronically.`);
        await quietly(mail(env, salesEmail(env), staffNote("contract_details", {
          leadId: lead.lead_id, company: lead.company ?? "", quoteId: quote.quote_id, adminUrl: adminUrl(site, lead.lead_id),
          detail: `Company: ${d.legalName}${d.crNumber ? ` (CR ${d.crNumber})` : ""}\nSignatory: ${d.signatoryName}, ${d.signatoryTitle}\n${d.signatoryPhone} · ${d.signatoryEmail}`,
        })), "contract details email failed");
      }
      const ms = await milestonesOf(env, quote.quote_id);
      const advance = ms.filter((m) => m.trigger === "acceptance" && m.status === "scheduled");
      await makeDue(env, advance, quote, lead, site);
      if (!ms.some((m) => m.trigger === "acceptance" && m.status !== "paid" && m.status !== "cancelled")) {
        await issueContract(env, quote, lead, site);
        return json(200, { ok: true, issued: true });
      }
      const due = (await milestonesOf(env, quote.quote_id)).find((m) => m.trigger === "acceptance" && m.status === "due");
      if (!due || paymentMode(env) === "off") return json(200, { ok: true, url: null });
      return json(200, { ok: true, url: await invoiceUrl(env, due, quote, lead, site) });
    }

    if (path === "/api/portal/pay" && request.method === "POST") {
      const quote = await live(env, lead);
      const ms = (await milestonesOf(env, quote.quote_id)).find((m) => m.id === Number((body as { ms?: number }).ms));
      if (!ms) return json(404, { ok: false, error: "not_found" });
      if (ms.trigger === "acceptance" && !(await contractOf(env, quote.quote_id))) return json(409, { ok: false, error: "contract_first" });
      return json(200, { ok: true, url: await invoiceUrl(env, ms, quote, lead, site) });
    }

    if (path === "/api/portal/countersign" && request.method === "POST" && form) {
      const quote = await live(env, lead);
      const contract = await contractOf(env, quote.quote_id);
      if (!contract || (contract.status !== "issued" && contract.status !== "countersigned")) return json(409, { ok: false, error: "not_issued" });
      const file = form.get("file");
      if (!file || typeof file === "string" || !["pdf", "png", "jpg", "jpeg"].includes(extensionOf((file as File).name))) return json(422, { ok: false, error: "file_type" });
      const checked = await checkUploads([file as File]);
      if (!checked.ok || !checked.files.length) return json(422, { ok: false, error: `file_${checked.ok ? "empty" : checked.error}` });
      const f = checked.files[0];
      const name = `${contract.contract_no} | ${ar ? "نسخة العميل الموقعة" : "client signed copy"}.${extensionOf(f.name)}`;
      await env.DB.prepare(`UPDATE contracts SET status = 'countersigned', countersigned_at = datetime('now'), countersigned_file = ?2 WHERE id = ?1`).bind(contract.id, name).run();
      await addEvent(env, lead.lead_id, lead.status, ar ? "استلمنا نسخة العقد الموقعة والمختومة من طرفكم." : "We received the contract signed and stamped on your side.");
      await quietly(mail(env, salesEmail(env), staffNote("countersigned", { leadId: lead.lead_id, company: lead.company ?? "", adminUrl: adminUrl(site, lead.lead_id) }), [{ ...f, name: uploadName(name) }]), "countersigned email failed");
      await archive(env, { lead_id: lead.lead_id, company: lead.company, service: serviceName(lead), drive_folder_id: lead.drive_folder_id }, [{ name, type: f.type, bytes: f.bytes }]);
      await advanceWork(env, quote, lead, site);
      return json(200, { ok: true });
    }

    if (path === "/api/portal/upload" && request.method === "POST" && form) {
      if (lead.status === "completed" || lead.status === "closed") return json(409, { ok: false, error: "closed" });
      const files = form.getAll("files").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
      const checked = await checkUploads(files);
      if (!checked.ok || !checked.files.length) return json(422, { ok: false, error: `files_${checked.ok ? "empty" : checked.error}` });
      const note = String(form.get("note") ?? "").trim().slice(0, 500);
      const names = checked.files.map((f) => f.name);
      await addEvent(env, lead.lead_id, lead.status, ar ? `أضفتَ مستندات إلى الطلب: ${names.join("، ")}.${note ? ` ${note}` : ""}` : `You added documents to the request: ${names.join(", ")}.${note ? ` ${note}` : ""}`);
      await quietly(mail(env, salesEmail(env), staffNote("documents", { leadId: lead.lead_id, company: lead.company ?? "", adminUrl: adminUrl(site, lead.lead_id), detail: note }), checked.files), "documents email failed");
      await archive(env, { lead_id: lead.lead_id, company: lead.company, service: serviceName(lead), drive_folder_id: lead.drive_folder_id },
        checked.files.map((f: CheckedFile) => ({ name: `${dbTime(new Date()).slice(0, 10)} | ${f.name}`, type: f.type, bytes: f.bytes })));
      return json(200, { ok: true });
    }

    return json(404, { ok: false, error: "not_found" });
  } catch (e) {
    if (e instanceof ProjectError) return json(e.http, { ok: false, error: e.code });
    console.error("portal", path, e);
    return json(500, { ok: false, error: "server_error" });
  }
}

// ---------------------------------------------------------------- staff

export interface Task { key: string; kind: "proposal" | "discount" | "meeting" | "meeting_revision"; leadId: string; company: string; service: string; quoteId: string | null; meetingId: number | null; since: string; dueAt: string; detail: string }

/** The team's open steps, each due a fixed number of hours (3 by default) after the client's step. */
export async function openTasks(env: ProjectEnv): Promise<Task[]> {
  const h = slaHours(env.QUOTE_SLA_HOURS);
  const db = env.DB!;
  const svc = (r: { payload: string | null; service: string | null }) => serviceName(r, "ar");
  type L = { lead_id: string; company: string | null; service: string | null; payload: string | null };
  const [fresh, discounts, meetings, held] = await Promise.all([
    db.prepare(`SELECT l.lead_id, l.company, l.service, l.payload, l.submitted_at, l.quote_due_at FROM leads l
      WHERE l.quote_due_at IS NOT NULL AND l.status IN ('received', 'reviewing') AND NOT EXISTS (SELECT 1 FROM quotes q WHERE q.lead_id = l.lead_id)`).all<L & { submitted_at: string; quote_due_at: string }>(),
    db.prepare(`SELECT q.quote_id, q.change_request, q.change_requested_at, l.lead_id, l.company, l.service, l.payload FROM quotes q JOIN leads l ON l.lead_id = q.lead_id
      WHERE q.status = 'change_requested'`).all<L & { quote_id: string; change_request: string | null; change_requested_at: string }>(),
    db.prepare(`SELECT m.id, m.quote_id, m.mode, m.preferred, m.requested_at, l.lead_id, l.company, l.service, l.payload FROM meetings m JOIN leads l ON l.lead_id = m.lead_id
      WHERE m.status = 'requested'`).all<L & { id: number; quote_id: string; mode: MeetingMode; preferred: string; requested_at: string }>(),
    db.prepare(`SELECT m.id, m.quote_id, m.outcome, m.held_at, l.lead_id, l.company, l.service, l.payload FROM meetings m JOIN leads l ON l.lead_id = m.lead_id
      WHERE m.status = 'held' AND m.needs_revision = 1 AND NOT EXISTS (SELECT 1 FROM quotes q WHERE q.lead_id = m.lead_id AND q.quote_id <> m.quote_id AND q.created_at >= m.held_at)`).all<L & { id: number; quote_id: string; outcome: string | null; held_at: string }>(),
  ]);
  const tasks: Task[] = [
    ...(fresh.results ?? []).map((r) => ({ key: `proposal:${r.lead_id}`, kind: "proposal" as const, leadId: r.lead_id, company: r.company ?? "", service: svc(r), quoteId: null, meetingId: null, since: r.submitted_at, dueAt: r.quote_due_at, detail: "" })),
    ...(discounts.results ?? []).map((r) => {
      let c: { discount?: boolean; schedule?: boolean; note?: string } = {};
      try { c = JSON.parse(r.change_request ?? "{}"); } catch { /* no details */ }
      return { key: `discount:${r.quote_id}`, kind: "discount" as const, leadId: r.lead_id, company: r.company ?? "", service: svc(r), quoteId: r.quote_id, meetingId: null, since: r.change_requested_at, dueAt: addHours(r.change_requested_at, h), detail: [c.discount ? "خصم" : "", c.schedule ? "تقسيم دفعات" : ""].filter(Boolean).join(" و") + (c.note ? `: ${c.note}` : "") };
    }),
    ...(meetings.results ?? []).map((r) => ({ key: `meeting:${r.id}`, kind: "meeting" as const, leadId: r.lead_id, company: r.company ?? "", service: svc(r), quoteId: r.quote_id, meetingId: r.id, since: r.requested_at, dueAt: addHours(r.requested_at, h), detail: `${MEETING_MODE_LABELS[r.mode]?.ar ?? r.mode}: ${r.preferred}` })),
    ...(held.results ?? []).map((r) => ({ key: `revision:${r.id}`, kind: "meeting_revision" as const, leadId: r.lead_id, company: r.company ?? "", service: svc(r), quoteId: r.quote_id, meetingId: r.id, since: r.held_at, dueAt: addHours(r.held_at, h), detail: r.outcome ?? "" })),
  ];
  return tasks.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

const TASK_EN: Record<Task["kind"], string> = { proposal: "First proposal", discount: "Revised proposal after a discount request", meeting: "Meeting time", meeting_revision: "Revised proposal after the meeting" };

/** Every cron tick: one alert 30 minutes before a team step is due and one when it is overdue. */
export async function runSlaCron(env: ProjectEnv, now: Date) {
  if (!env.DB) return { skipped: true };
  let tasks: Task[] = [];
  try { tasks = await openTasks(env); } catch (e) { console.error("sla tasks failed (is migration 0007 applied?)", e); return { skipped: true }; }
  const site = siteOrigin(null, env);
  const to = [salesEmail(env), env.ESCALATION_EMAIL].filter(Boolean) as string[];
  let sent = 0;
  for (const t of tasks) {
    const due = fromDb(t.dueAt).getTime();
    const late = now.getTime() >= due;
    if (!late && now.getTime() < due - 30 * 60_000) continue;
    const key = `${t.key}:${late ? "late" : "soon"}`;
    const fresh = await env.DB.prepare(`INSERT INTO sla_alerts (key, at) VALUES (?1, datetime('now')) ON CONFLICT(key) DO NOTHING RETURNING key`).bind(key).first();
    if (!fresh) continue;
    for (const addr of to) await quietly(mail(env, addr, staffNote(late ? "sla_late" : "sla_soon", { leadId: t.leadId, company: t.company, adminUrl: adminUrl(site, t.leadId), due: t.dueAt, detail: TASK_EN[t.kind] })), "sla alert failed");
    sent++;
  }
  return { open: tasks.length, sent };
}

const PROFILE_KEYS = ["legalName", "crNumber", "vatNumber", "address", "signatoryName", "signatoryTitle", "phone", "email"] as const;

export async function handlePortalAdmin(request: Request, env: ProjectEnv, path: string): Promise<Response> {
  const site = siteOrigin(request, env);
  try {
    if (path === "/api/admin/tasks" && request.method === "GET") {
      return json(200, { ok: true, tasks: await openTasks(env), now: dbTime(new Date()), slaHours: slaHours(env.QUOTE_SLA_HOURS) });
    }

    if (path === "/api/admin/meeting" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { id?: number; action?: string; when?: string; location?: string; outcome?: string; needsRevision?: boolean };
      const m = await env.DB!.prepare(`SELECT * FROM meetings WHERE id = ?1`).bind(Number(body.id)).first<MeetingRow>();
      const lead = m ? await leadOf(env, m.lead_id) : null;
      if (!m || !lead) return json(404, { ok: false, error: "not_found" });
      const ar = leadLang(lead) === "ar";
      const mode = MEETING_MODE_LABELS[m.mode as MeetingMode] ?? MEETING_MODE_LABELS.online;
      if (body.action === "schedule") {
        const when = String(body.when ?? "").replace("T", " ").slice(0, 16);
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(when) || m.status === "held" || m.status === "cancelled") return json(422, { ok: false, error: "validation" });
        const location = String(body.location ?? "").trim().slice(0, 300);
        await env.DB!.prepare(`UPDATE meetings SET status = 'scheduled', scheduled_at = ?2, location = ?3 WHERE id = ?1`).bind(m.id, when, location || null).run();
        await addEvent(env, lead.lead_id, lead.status, ar ? `حددنا موعد الاجتماع: ${ltr(when)} بتوقيت الرياض (${mode.ar}).` : `Meeting scheduled: ${when} Riyadh time (${mode.en}).`);
        await quietly(mail(env, lead.email, meetingScheduledEmail({ lang: leadLang(lead), name: lead.contact_name, leadId: lead.lead_id, url: await portalLink(env, site, lead), when, mode: ar ? mode.ar : mode.en, location })), "meeting email failed");
        return json(200, { ok: true });
      }
      if (body.action === "held") {
        const outcome = String(body.outcome ?? "").trim().slice(0, 1500);
        const needs = body.needsRevision === true;
        await env.DB!.prepare(`UPDATE meetings SET status = 'held', outcome = ?2, needs_revision = ?3, held_at = datetime('now') WHERE id = ?1`).bind(m.id, outcome || null, needs ? 1 : 0).run();
        await addEvent(env, lead.lead_id, lead.status, ar
          ? `عقدنا اجتماع مناقشة العرض.${outcome ? ` الخلاصة: ${outcome}` : ""}${needs ? " سنرسل لك العرض المعدّل بناءً على الاجتماع." : ""}`
          : `We held the proposal meeting.${outcome ? ` Summary: ${outcome}` : ""}${needs ? " We will send you a proposal revised after the meeting." : ""}`);
        return json(200, { ok: true });
      }
      if (body.action === "cancel") {
        await env.DB!.prepare(`UPDATE meetings SET status = 'cancelled' WHERE id = ?1`).bind(m.id).run();
        await addEvent(env, lead.lead_id, lead.status, ar ? "أُلغي طلب الاجتماع." : "The meeting request was cancelled.");
        return json(200, { ok: true });
      }
      return json(422, { ok: false, error: "validation" });
    }

    if (path === "/api/admin/stage" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { id?: number; note?: string };
      const stage = await env.DB!.prepare(`SELECT * FROM work_stages WHERE id = ?1`).bind(Number(body.id)).first<StageRow>();
      const quote = stage ? await quoteOf(env, stage.quote_id) : null;
      const lead = quote ? await leadOf(env, quote.lead_id) : null;
      if (!stage || !quote || !lead) return json(404, { ok: false, error: "not_found" });
      const r = await completeStage(env, stage, quote, lead, site, String(body.note ?? "").trim().slice(0, 1000));
      return json(200, { ok: true, ...r });
    }

    if (path === "/api/admin/contract" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { quoteId?: string };
      const quote = await quoteOf(env, String(body.quoteId ?? ""));
      const lead = quote ? await leadOf(env, quote.lead_id) : null;
      const contract = quote ? await contractOf(env, quote.quote_id) : null;
      if (!quote || !lead || !contract) return json(404, { ok: false, error: "not_found" });
      if (contract.status !== "issued") return json(409, { ok: false, error: "not_issued" });
      await env.DB!.prepare(`UPDATE contracts SET start_override = 1 WHERE id = ?1`).bind(contract.id).run();
      const r = await advanceWork(env, quote, lead, site);
      return json(200, { ok: true, ...r });
    }

    if (path === "/api/admin/contract-doc" && request.method === "GET") {
      const quote = await quoteOf(env, new URL(request.url).searchParams.get("quote") ?? "");
      const lead = quote ? await leadOf(env, quote.lead_id) : null;
      if (!quote || !lead) return json(404, { ok: false, error: "not_found" });
      return htmlResponse(await renderContract(env, quote, lead, await contractOf(env, quote.quote_id), false));
    }

    if (path === "/api/admin/settings" && request.method === "GET") {
      const [profile, signature, stamp, root] = await Promise.all([getSetting(env, "contract_profile"), getSetting(env, "contract_signature"), getSetting(env, "contract_stamp"), getSetting(env, "drive_root_id")]);
      let p: Record<string, string> = {};
      try { p = profile ? JSON.parse(profile) : {}; } catch { /* empty profile */ }
      const rootId = env.DRIVE_ROOT_FOLDER_ID || root;
      return json(200, {
        ok: true, profile: p, signature: validImage(signature) ? signature : null, stamp: validImage(stamp) ? stamp : null,
        drive: { configured: driveConfigured(env), root: rootId ? folderUrl(rootId) : null }, payments: paymentMode(env), slaHours: slaHours(env.QUOTE_SLA_HOURS),
      });
    }

    if (path === "/api/admin/settings" && request.method === "POST") {
      const form = await request.formData();
      const profile: Record<string, string> = {};
      for (const k of PROFILE_KEYS) profile[k] = String(form.get(k) ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 200);
      await setSetting(env, "contract_profile", JSON.stringify(profile));
      // Signature and stamp: PNG (transparent background) or JPEG, kept small so the contract stays light.
      for (const key of ["signature", "stamp"] as const) {
        const f = form.get(key);
        if (!f || typeof f === "string" || !(f as File).size) continue;
        const ext = extensionOf((f as File).name);
        if (!["png", "jpg", "jpeg"].includes(ext) || (f as File).size > 400_000) return json(422, { ok: false, error: `${key}_file` });
        const checked = await checkUploads([f as File]);
        if (!checked.ok) return json(422, { ok: false, error: `${key}_file` });
        let bin = "";
        for (const b of checked.files[0].bytes) bin += String.fromCharCode(b);
        await setSetting(env, `contract_${key}`, `data:image/${ext === "png" ? "png" : "jpeg"};base64,${btoa(bin)}`);
      }
      return json(200, { ok: true });
    }

    return json(404, { ok: false, error: "not_found" });
  } catch (e) {
    if (e instanceof ProjectError) return json(e.http, { ok: false, error: e.code });
    console.error("portal admin", path, e);
    return json(500, { ok: false, error: "server_error" });
  }
}

export type { ContractRow };
