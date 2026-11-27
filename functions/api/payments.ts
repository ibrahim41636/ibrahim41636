/// <reference types="@cloudflare/workers-types" />
// Proposals (staff side) and payments through Moyasar (https://moyasar.com). The client side lives
// in the request portal (portal.ts); the shared engine is in projects.ts.
//
// Public:  POST /api/pay/callback?ms=ID       → Moyasar invoice callback
//          POST /api/pay/webhook              → Moyasar dashboard webhook (optional)
// Staff (ADMIN_TOKEN, via admin.ts):
//          GET  /api/admin/quotes?lead=ID     → proposals with instalments, stages, contract and meetings
//          POST /api/admin/quotes (multipart) → create and e-mail a proposal: offer files, payment
//                                              schedule and the methodology's work stages
//          POST /api/admin/milestone {id, action: due|paid|cancel, reference?}
//          POST /api/admin/quotes/cancel {quoteId}
//
// A payment is recorded only after this Worker reads the invoice back from Moyasar's API and sees
// it paid in SAR for the exact amount, so callbacks and webhooks cannot be forged into payments.
// Secrets: MOYASAR_SECRET_KEY, optional MOYASAR_WEBHOOK_SECRET. Live keys work only where
// MOYASAR_ALLOW_LIVE is "true" (production [vars] in wrangler.toml, never previews).
import { json } from "./request";
import { checkUploads } from "../../src/lib/uploads";
import { LEAD_ID } from "../../src/lib/tracking";
import { buildSchedule, dueEmail, formatSar, newToken, quoteEmail, sarToHalalas, type PlanRow } from "../../src/lib/payments";
import { planStages, workGates, type StagePlanError } from "../../src/lib/portal";
import { archive } from "./drive";
import {
  ProjectError, addEvent, advanceWork, contractOf, ensurePortalToken, leadLang, leadOf, mail, makeDue, markPaid, meetingsOf, milestonesOf, moyasar, paymentMode,
  portalLink, quoteOf, quotesOf, serviceName, siteOrigin, stagesOf, sync, workReady, type MilestoneRow, type ProjectEnv, type QuoteRow,
} from "./projects";

export async function handlePayCallbacks(request: Request, env: ProjectEnv, path: string): Promise<Response> {
  if (!env.DB) return json(503, { ok: false, error: "payments_unavailable" });
  const site = siteOrigin(request, env);
  try {
    // Moyasar calls back when an invoice is paid. The body is ignored: the invoice is read back
    // from Moyasar, so a forged call can at most trigger a re-check.
    if (path === "/api/pay/callback") {
      const id = Number(new URL(request.url).searchParams.get("ms"));
      const ms = Number.isInteger(id) ? await env.DB.prepare(`SELECT * FROM quote_milestones WHERE id = ?1`).bind(id).first<MilestoneRow>() : null;
      if (ms) {
        const quote = await quoteOf(env, ms.quote_id);
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
        const quote = await quoteOf(env, ms.quote_id);
        const lead = quote ? await leadOf(env, quote.lead_id) : null;
        if (quote && lead) await sync(env, ms, quote, lead, site);
      }
      return json(200, { ok: true });
    }
    return json(404, { ok: false, error: "not_found" });
  } catch (e) {
    if (e instanceof ProjectError) return json(e.http, { ok: false, error: e.code });
    console.error("payments", path, e);
    return json(500, { ok: false, error: "server_error" });
  }
}

export async function handlePaymentsAdmin(request: Request, env: ProjectEnv, path: string): Promise<Response> {
  const site = siteOrigin(request, env);
  try {
    if (path === "/api/admin/quotes" && request.method === "GET") {
      const leadId = new URL(request.url).searchParams.get("lead")?.trim().toUpperCase() ?? "";
      const stmt = LEAD_ID.test(leadId)
        ? env.DB!.prepare(`SELECT * FROM quotes WHERE lead_id = ?1 ORDER BY created_at DESC, quote_id DESC`).bind(leadId)
        : env.DB!.prepare(`SELECT * FROM quotes ORDER BY created_at DESC, quote_id DESC LIMIT 50`);
      const quotes = (await stmt.all<QuoteRow>()).results ?? [];
      const out = [];
      for (const q of quotes) {
        const lead = await leadOf(env, q.lead_id);
        const [ms, stages, contract, meetings] = await Promise.all([milestonesOf(env, q.quote_id), stagesOf(env, q.quote_id), contractOf(env, q.quote_id), lead ? meetingsOf(env, lead.lead_id) : Promise.resolve([])]);
        const gates = workGates(stages, ms, workReady(contract, ms));
        out.push({
          ...q, token: undefined, milestones: ms,
          stages: stages.map((s) => ({ ...s, state: gates.find((g) => g.seq === s.seq)?.state, blockedBy: gates.find((g) => g.seq === s.seq)?.blockedBy?.label ?? null })),
          contract: contract ? { ...contract, document: undefined, issued: !!contract.document } : null,
          meetings: meetings.filter((m) => m.quote_id === q.quote_id),
          lead: lead ? { company: lead.company, contact: lead.contact_name, email: lead.email, service: serviceName(lead, "ar"), portal: await portalLink(env, site, lead), drive: lead.drive_folder_url, status: lead.status } : null,
        });
      }
      return json(200, { ok: true, quotes: out, payments: paymentMode(env) });
    }

    if (path === "/api/admin/quotes" && request.method === "POST") {
      const form = await request.formData();
      const leadId = String(form.get("leadId") ?? "").trim().toUpperCase();
      const title = String(form.get("title") ?? "").trim().slice(0, 160);
      const subtotal = sarToHalalas(String(form.get("subtotal") ?? ""));
      const validDays = Math.min(Math.max(Number(form.get("validDays")) || 30, 1), 180);
      const markedFinal = String(form.get("final") ?? "") === "1";
      const revisionNote = String(form.get("revisionNote") ?? "").trim().slice(0, 1000);
      let plan: (PlanRow & { stage?: number | null })[] = [];
      let titles: string[] = [];
      try { plan = JSON.parse(String(form.get("plan") ?? "[]")); } catch { /* validated below */ }
      try { titles = JSON.parse(String(form.get("stages") ?? "[]")); } catch { /* validated below */ }
      if (!LEAD_ID.test(leadId) || !title || !Array.isArray(plan) || !Array.isArray(titles)) return json(422, { ok: false, error: "validation" });
      const built = buildSchedule(subtotal, plan);
      if (!built.ok) return json(422, { ok: false, error: `plan_${built.error}` });
      const lead = await leadOf(env, leadId);
      if (!lead || !lead.email) return json(404, { ok: false, error: "lead_not_found" });
      const lang = leadLang(lead);
      const staged = planStages(plan, titles, lang === "ar" ? "تنفيذ الأعمال وتسليم المخرجات" : "Delivery of the work");
      if (!staged.ok) return json(422, { ok: false, error: `plan_${staged.error satisfies StagePlanError}` });
      const files = form.getAll("files").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
      const uploads = await checkUploads(files);
      if (!uploads.ok) return json(422, { ok: false, error: `files_${uploads.error}` });

      const existing = await quotesOf(env, leadId);
      // An approved proposal stays the live one: cancel it first to replace it.
      if (existing.some((q) => q.status === "accepted" || q.status === "paid")) return json(409, { ok: false, error: "has_accepted" });
      const quoteId = `${leadId}-Q${existing.length + 1}`;
      const validUntil = new Date(Date.now() + validDays * 86400_000).toISOString().slice(0, 10);
      const { schedule } = built;
      const names = uploads.files.map((f) => f.name);
      // One discount round per request: once used, every later proposal is final.
      const used = existing.find((q) => q.change_requested_at);
      const negotiable = !markedFinal && !used;
      const open = existing.find((q) => q.status === "sent" || q.status === "change_requested");
      const replaces = used?.quote_id ?? open?.quote_id ?? existing[0]?.quote_id ?? null;
      const url = await portalLink(env, site, lead);

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
        env.DB!.prepare(`INSERT INTO quotes (quote_id, lead_id, token, lang, title, subtotal, vat, total, status, documents, valid_until, created_at, negotiable, replaces, revision_note) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'sent', ?9, ?10, datetime('now'), ?11, ?12, ?13)`)
          .bind(quoteId, leadId, newToken(), lang, title, schedule.subtotal, schedule.vat, schedule.total, JSON.stringify(names), validUntil, negotiable ? 1 : 0, replaces, revisionNote || null),
        ...schedule.milestones.map((m, i) => env.DB!.prepare(`INSERT INTO quote_milestones (quote_id, seq, label, trigger, percent, amount, stage_seq) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
          .bind(quoteId, m.seq, m.label, m.trigger, m.percent, m.amount, staged.links[i])),
        ...staged.stages.map((t, i) => env.DB!.prepare(`INSERT INTO work_stages (quote_id, seq, title) VALUES (?1, ?2, ?3)`).bind(quoteId, i + 1, t)),
        env.DB!.prepare(`UPDATE leads SET status = 'quoted', status_updated_at = datetime('now') WHERE lead_id = ?1 AND status IN ('received', 'reviewing')`).bind(leadId),
        env.DB!.prepare(`INSERT INTO lead_events (lead_id, status, note, at, notified) VALUES (?1, 'quoted', ?2, datetime('now'), 1)`)
          .bind(leadId, replaces
            ? (lang === "ar" ? `أرسلنا لك العرض الفني والمالي المحدّث (${quoteId}).${revisionNote ? ` التعديلات: ${revisionNote}` : ""}` : `We sent you the revised technical and financial proposal (${quoteId}).${revisionNote ? ` Changes: ${revisionNote}` : ""}`)
            : (lang === "ar" ? `أرسلنا لك العرض الفني والمالي (${quoteId}) بالبريد وفي بوابة الطلب.` : `We sent you the technical and financial proposal (${quoteId}) by e-mail and in your portal.`)),
      ]);
      await archive(env, { lead_id: leadId, company: lead.company, service: serviceName(lead), drive_folder_id: lead.drive_folder_id },
        uploads.files.map((f) => ({ name: `${quoteId} | ${f.name}`, type: f.type, bytes: f.bytes })));
      return json(200, { ok: true, quoteId, link: url, total: schedule.total, negotiable, replaces });
    }

    if (path === "/api/admin/milestone" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { id?: number; action?: string; reference?: string };
      const ms = await env.DB!.prepare(`SELECT * FROM quote_milestones WHERE id = ?1`).bind(Number(body.id)).first<MilestoneRow>();
      if (!ms) return json(404, { ok: false, error: "not_found" });
      const quote = await quoteOf(env, ms.quote_id);
      const lead = quote ? await leadOf(env, quote.lead_id) : null;
      if (!quote || !lead) return json(404, { ok: false, error: "not_found" });
      // Instalments of a replaced or cancelled proposal are history.
      if (quote.status === "superseded" || quote.status === "cancelled") return json(409, { ok: false, error: "quote_closed" });

      if (body.action === "due") {
        // Instalments tied to a stage fall due when the stage is completed; this is for the others.
        if (ms.status !== "scheduled") return json(409, { ok: false, error: "not_scheduled" });
        if (ms.stage_seq !== null) return json(409, { ok: false, error: "stage_linked" });
        if (quote.status !== "accepted") return json(409, { ok: false, error: "quote_not_accepted" });
        await addEvent(env, lead.lead_id, lead.status, quote.lang === "ar" ? `أصبحت دفعة «${ms.label}» مستحقة بمبلغ ${formatSar(ms.amount, "ar")}.` : `Payment "${ms.label}" of ${formatSar(ms.amount, "en")} is now due.`);
        await makeDue(env, [ms], quote, lead, site);
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
        await advanceWork(env, quote, lead, site);
        return json(200, { ok: true });
      }
      return json(422, { ok: false, error: "validation" });
    }

    if (path === "/api/admin/quotes/cancel" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { quoteId?: string };
      const quote = await quoteOf(env, String(body.quoteId ?? ""));
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
    if (e instanceof ProjectError) return json(e.http, { ok: false, error: e.code });
    console.error("payments admin", path, e);
    return json(500, { ok: false, error: "server_error" });
  }
}

/** Every cron tick: up to two reminders for instalments left unpaid 3 days after falling due (re-checking Moyasar first, so a payment whose callback was missed is recorded instead of chased). */
export async function runPaymentCron(env: ProjectEnv, now: Date) {
  if (!env.DB || paymentMode(env) === "off") return { skipped: true };
  const site = siteOrigin(null, env);
  const rows = (await env.DB.prepare(
    `SELECT * FROM quote_milestones WHERE status = 'due' AND reminders < 2 AND due_at <= datetime(?1, '-3 days')
       AND (last_reminder_at IS NULL OR last_reminder_at <= datetime(?1, '-4 days')) LIMIT 20`,
  ).bind(now.toISOString().slice(0, 19).replace("T", " ")).all<MilestoneRow>()).results ?? [];
  let reminded = 0;
  for (const ms of rows) {
    const quote = await quoteOf(env, ms.quote_id);
    const lead = quote ? await leadOf(env, quote.lead_id) : null;
    if (!quote || !lead || quote.status === "cancelled") continue;
    const synced = await sync(env, ms, quote, lead, site);
    if (synced.status === "paid") continue;
    try {
      await ensurePortalToken(env, lead);
      await mail(env, lead.email, dueEmail({ lang: quote.lang, name: lead.contact_name, leadId: lead.lead_id, title: quote.title, url: await portalLink(env, site, lead), label: ms.label, amount: ms.amount, reminder: true }));
      await env.DB.prepare(`UPDATE quote_milestones SET reminders = reminders + 1, last_reminder_at = datetime('now') WHERE id = ?1`).bind(ms.id).run();
      reminded++;
    } catch (e) {
      console.error("reminder failed", ms.id, e);
    }
  }
  return { checked: rows.length, reminded };
}
