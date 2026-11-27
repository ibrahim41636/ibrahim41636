/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  buildSchedule, dueEmail, formatSar, invoicePayload, isPaidInvoice, keyAllowed, newToken, parseChangeRequest, portalUrl, quoteEmail, receiptEmail,
  sarToHalalas, staffEmail, TOKEN, vatOf,
} from "../src/lib/payments";
import { handlePayCallbacks, runPaymentCron } from "../functions/api/payments";
import { handlePortal } from "../functions/api/portal";
import { handleAdmin } from "../functions/api/admin";
import { d1, freshDb, PDF } from "./d1";

describe("amounts", () => {
  it("parses SAR into halalas", () => {
    expect(sarToHalalas("12,500.50")).toBe(1250050);
    expect(sarToHalalas("12500.5")).toBe(1250050);
    expect(sarToHalalas("١٢٠٠٠")).toBe(1200000);
    expect(sarToHalalas(" 99 ")).toBe(9900);
    for (const bad of ["", "abc", "-5", "1.234", "1e5", "12.5.1"]) expect(sarToHalalas(bad)).toBeNaN();
  });

  it("adds 15% VAT, rounded to the halala", () => {
    expect(vatOf(1000000)).toBe(150000);
    expect(vatOf(333)).toBe(50);
  });

  it("formats in both languages", () => {
    expect(formatSar(1150000, "ar")).toBe("11,500.00 ريال");
    expect(formatSar(1150000, "en")).toBe("SAR 11,500.00");
  });
});

describe("payment schedule", () => {
  it("splits the VAT inclusive total and the parts add up exactly", () => {
    const r = buildSchedule(1000001, [
      { label: "Advance", percent: 30, trigger: "acceptance" },
      { label: "Fieldwork", percent: 40, trigger: "milestone" },
      { label: "Final report", percent: 30, trigger: "milestone" },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const { subtotal, vat, total, milestones } = r.schedule;
    expect(total).toBe(subtotal + vat);
    expect(milestones.reduce((n, m) => n + m.amount, 0)).toBe(total);
    expect(milestones.map((m) => m.seq)).toEqual([1, 2, 3]);
    expect(milestones[0].amount).toBe(Math.round(total * 0.3));
  });

  it("handles thirds without losing a halala", () => {
    const r = buildSchedule(10000, [33.33, 33.33, 33.34].map((percent) => ({ label: "x", percent, trigger: "milestone" as const })));
    expect(r.ok && r.schedule.milestones.reduce((n, m) => n + m.amount, 0)).toBe(11500);
  });

  it("rejects bad plans", () => {
    const one = [{ label: "All", percent: 100, trigger: "acceptance" as const }];
    expect(buildSchedule(NaN, one)).toEqual({ ok: false, error: "amount" });
    expect(buildSchedule(50, one)).toEqual({ ok: false, error: "amount" });
    expect(buildSchedule(10000, [])).toEqual({ ok: false, error: "empty" });
    expect(buildSchedule(10000, Array.from({ length: 7 }, () => ({ label: "x", percent: 100 / 7, trigger: "milestone" as const })))).toEqual({ ok: false, error: "too_many" });
    expect(buildSchedule(10000, [{ label: " ", percent: 100, trigger: "milestone" }])).toEqual({ ok: false, error: "label" });
    expect(buildSchedule(10000, [{ label: "a", percent: 60, trigger: "milestone" }, { label: "b", percent: 30, trigger: "milestone" }])).toEqual({ ok: false, error: "sum" });
    expect(buildSchedule(10000, [{ label: "a", percent: 0, trigger: "milestone" }, { label: "b", percent: 100, trigger: "milestone" }])).toEqual({ ok: false, error: "percent" });
    expect(buildSchedule(10000, [{ label: "a", percent: 50, trigger: "milestone" }, { label: "b", percent: 50, trigger: "acceptance" }])).toEqual({ ok: false, error: "acceptance_order" });
    expect(buildSchedule(10000, [{ label: "a", percent: 100, trigger: "later" as never }])).toEqual({ ok: false, error: "label" });
  });
});

describe("Moyasar helpers", () => {
  it("counts an invoice as paid only for the exact amount in SAR", () => {
    expect(isPaidInvoice({ status: "paid", amount: 5000, currency: "SAR" }, 5000)).toBe(true);
    expect(isPaidInvoice({ status: "paid", amount: 4999, currency: "SAR" }, 5000)).toBe(false);
    expect(isPaidInvoice({ status: "paid", amount: 5000, currency: "USD" }, 5000)).toBe(false);
    expect(isPaidInvoice({ status: "initiated", amount: 5000, currency: "SAR" }, 5000)).toBe(false);
    expect(isPaidInvoice(null, 5000)).toBe(false);
  });

  it("allows live keys only where production says so", () => {
    expect(keyAllowed("sk_test_abc", undefined)).toBe(true);
    expect(keyAllowed("sk_live_abc", undefined)).toBe(false);
    expect(keyAllowed("sk_live_abc", "true")).toBe(true);
    expect(keyAllowed("pk_live_abc", "true")).toBe(false);
    expect(keyAllowed(undefined, "true")).toBe(false);
  });

  it("builds the invoice request", () => {
    const p = invoicePayload({ amount: 115000, description: "x".repeat(300), callbackUrl: "https://s/cb", successUrl: "https://s/ok", backUrl: "https://s/back", expiresAt: new Date("2026-12-01T00:00:00Z"), metadata: { quote_id: "Q" } });
    expect(p).toMatchObject({ amount: 115000, currency: "SAR", callback_url: "https://s/cb", success_url: "https://s/ok", back_url: "https://s/back", expired_at: "2026-12-01T00:00:00.000Z" });
    expect(p.description).toHaveLength(255);
  });

  it("makes unguessable portal links", () => {
    const a = newToken();
    expect(a).toMatch(TOKEN);
    expect(a).not.toBe(newToken());
    expect(portalUrl("https://selorin.co", "ar", a)).toBe(`https://selorin.co/ar/portal/?t=${a}`);
    expect(portalUrl("https://selorin.co", "en", a)).toBe(`https://selorin.co/portal/?t=${a}`);
  });
});

describe("client e-mails", () => {
  const base = { name: "Sara", leadId: "SEL-2026-000123", title: "Environmental permit", url: "https://selorin.co/ar/portal/?t=x" };
  const ms = [{ label: "Advance", amount: 345000, trigger: "acceptance" as const }, { label: "Final", amount: 805000, trigger: "milestone" as const }];
  const all = (["ar", "en"] as const).flatMap((lang) => [
    quoteEmail({ ...base, lang, total: 1150000, milestones: ms, validUntil: "2026-12-24", files: ["offer.pdf"] }),
    quoteEmail({ ...base, lang, total: 1150000, milestones: ms.slice(1), validUntil: "2026-12-24", files: [] }),
    dueEmail({ ...base, lang, label: "Final", amount: 805000, stage: "Reporting" }),
    dueEmail({ ...base, lang, label: "Final", amount: 805000, reminder: true }),
    receiptEmail({ ...base, lang, label: "Advance", amount: 345000, paymentId: "pay_1", remaining: 805000 }),
    receiptEmail({ ...base, lang, label: "Final", amount: 805000, paymentId: "pay_2", remaining: 0 }),
    dueEmail({ ...base, lang, label: "Advance", amount: 345000, advance: true }),
    dueEmail({ ...base, lang, label: "Extra", amount: 1000 }),
  ]);

  it("carry the portal link and the amounts, with no dashes", () => {
    for (const m of all) {
      expect(m.text).toContain(base.url);
      expect(m.html).toContain(base.url);
      expect(`${m.subject}\n${m.text}`).not.toMatch(/[–—]|\S - \S/);
    }
    expect(all[0].text).toContain("11,500.00 ريال");
    expect(all[0].text).toContain("offer.pdf");
    expect(all[3].subject.startsWith("تذكير")).toBe(true);
    expect(all[8].text).toContain("SAR 11,500.00");
  });

  it("say why a payment is due: the advance, a completed stage, or a plain request", () => {
    expect(all[2].text).toContain("أنجزنا مرحلة «Reporting»");
    expect(all[2].text).toContain("دفعة «Final» مستحقة");
    expect(all[6].text).toContain("الدفعة الأولى «Advance» مستحقة الآن، ويصدر العقد");
    expect(all[6].text).not.toContain("أنجزنا مرحلة");
    expect(all[7].text).toContain("أصبحت دفعة «Extra»");
    expect(all[14].text).toContain("the contract is issued, signed and stamped by Selorin, once it is paid");
  });

  it("escapes names in the HTML", () => {
    const m = dueEmail({ ...base, lang: "en", name: "<b>x</b>", label: "Final", amount: 1 });
    expect(m.html).not.toContain("<b>x</b>");
    expect(m.html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("tell staff about payments", () => {
    const s = staffEmail("paid", { leadId: "SEL-2026-000123", quoteId: "SEL-2026-000123-Q1", company: "Acme", title: "t", label: "Advance", amount: 345000, paymentId: "pay_1" });
    expect(s.subject).toBe("[Payment received] SEL-2026-000123 | SAR 3,450.00");
  });
});

describe("negotiation", () => {
  it("accepts a discount or schedule request with a short note", () => {
    expect(parseChangeRequest({ discount: true, note: "  10% please " })).toEqual({ ok: true, request: { discount: true, schedule: false, note: "10% please" } });
    expect(parseChangeRequest({ schedule: true })).toEqual({ ok: true, request: { discount: false, schedule: true, note: "" } });
    expect(parseChangeRequest({ note: "cheaper" })).toEqual({ ok: false, error: "empty" });
    expect(parseChangeRequest({ discount: "yes" })).toEqual({ ok: false, error: "empty" });
    expect(parseChangeRequest({ discount: true, note: "x".repeat(1001) })).toEqual({ ok: false, error: "note" });
  });

  it("tells the client whether they can still negotiate", () => {
    const base = { name: "Sara", leadId: "SEL-2026-000123", title: "t", url: "https://s/q", total: 100, milestones: [{ label: "All", amount: 100, trigger: "acceptance" as const }], validUntil: "2026-12-24", files: [] };
    expect(quoteEmail({ ...base, lang: "ar" }).text).toContain("مرة واحدة");
    expect(quoteEmail({ ...base, lang: "ar" }).text).toContain("طلب اجتماع");
    const fin = quoteEmail({ ...base, lang: "ar", negotiable: false, revised: true });
    expect(fin.subject).toBe("العرض المحدّث لطلبك SEL-2026-000123");
    expect(fin.text).toContain("هذا العرض نهائي");
    expect(quoteEmail({ ...base, lang: "en", negotiable: false }).text).toContain("This proposal is final");
    for (const m of [fin, quoteEmail({ ...base, lang: "en" })]) expect(`${m.subject}\n${m.text}`).not.toMatch(/[–—]|\S - \S/);
  });
});

// ---------------------------------------------------------------- payments through Moyasar, on a real SQLite database

describe("payments", () => {
  let db: DatabaseSync;
  let env: Parameters<typeof handleAdmin>[1];
  let invoices: Map<string, { id: string; status: string; amount: number; currency: string; url: string; payments: { id: string; status: string }[] }>;
  let created: Record<string, unknown>[];
  let mails: string[];

  const admin = (path: string, init: RequestInit = {}) =>
    handleAdmin(new Request(`https://selorin.co${path}`, { ...init, headers: { authorization: "Bearer admintoken", ...(init.headers ?? {}) } }), env, path.split("?")[0]);
  const post = (path: string, body: unknown) => new Request(`https://selorin.co${path}`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
  const portal = (path: string, body?: unknown) =>
    handlePortal(body === undefined ? new Request(`https://selorin.co${path}`) : post(path, body), env, path.split("?")[0]);
  const callback = (path: string, body: unknown = {}) => handlePayCallbacks(post(path, body), env, path.split("?")[0]);
  const milestones = () => db.prepare("SELECT * FROM quote_milestones ORDER BY quote_id, seq").all() as Record<string, any>[];
  const leadStatus = () => (db.prepare("SELECT status FROM leads").get() as { status: string }).status;
  const view = async (t: string) => ((await (await portal(`/api/portal?t=${t}`)).json()) as any).portal;
  const details = { legalName: "Acme Industrial Co.", crNumber: "2050012345", signatoryName: "Sara Al Harbi", signatoryTitle: "CEO", signatoryPhone: "+966 55 123 4567", signatoryEmail: "sara@acme.sa", agree: true };

  async function createQuote(plan: unknown, extra: Record<string, string> = {}) {
    const form = new FormData();
    form.set("leadId", "SEL-2026-000123");
    form.set("title", "Environmental permit for the Jubail plant");
    form.set("subtotal", "10,000");
    form.set("plan", JSON.stringify(plan));
    for (const [k, v] of Object.entries(extra)) form.set(k, v);
    form.append("files", new File([PDF], "Technical offer.pdf", { type: "application/pdf" }));
    const res = await admin("/api/admin/quotes", { method: "POST", body: form });
    const body = await res.json() as { ok: boolean; link: string; quoteId: string; error?: string; negotiable?: boolean; replaces?: string | null };
    return { res, body, token: body.link ? new URL(body.link).searchParams.get("t")! : "" };
  }
  /** Approve and send the contract details: returns Moyasar's page for the first instalment, if there is one. */
  async function approve(token: string) {
    expect((await portal("/api/portal/accept", { t: token })).status).toBe(200);
    return (await (await portal("/api/portal/contract", { t: token, ...details })).json()) as { ok: boolean; url?: string | null; issued?: boolean };
  }

  beforeEach(() => {
    db = freshDb();
    db.prepare(`INSERT INTO leads (lead_id, kind, submitted_at, service, company, contact_name, email, payload) VALUES ('SEL-2026-000123', 'request', '2026-11-20 09:00:00', 'environmental-permitting', 'Acme', 'Sara', 'sara@acme.sa', ?1)`)
      .run(JSON.stringify({ lang: "ar" }));
    env = { DB: d1(db), ADMIN_TOKEN: "admintoken", EMAIL_DRY_RUN: "true", MOYASAR_SECRET_KEY: "sk_test_x", MOYASAR_WEBHOOK_SECRET: "whsec", SITE_URL: "https://selorin.co" };
    invoices = new Map();
    created = [];
    mails = [];
    vi.spyOn(console, "log").mockImplementation((m: string) => { if (String(m).startsWith("[dry-run email]")) mails.push(String(m)); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
      expect(url.startsWith("https://api.moyasar.com/v1/")).toBe(true);
      expect((init.headers as Record<string, string>).authorization).toBe(`Basic ${btoa("sk_test_x:")}`);
      const path = url.slice("https://api.moyasar.com/v1".length);
      if (init.method === "POST" && path === "/invoices") {
        const body = JSON.parse(String(init.body));
        created.push(body);
        const id = `inv_${invoices.size + 1}`;
        invoices.set(id, { id, status: "initiated", amount: body.amount, currency: body.currency, url: `https://checkout.moyasar.com/invoices/${id}`, payments: [] });
        return Response.json(invoices.get(id));
      }
      const m = /^\/invoices\/([^/]+)(\/cancel)?$/.exec(path);
      const inv = m && invoices.get(m[1]);
      if (!inv) return Response.json({ message: "not found" }, { status: 404 });
      if (m![2]) inv.status = "canceled";
      return Response.json(inv);
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  const pay = (id: string, amount?: number) => {
    const inv = invoices.get(id)!;
    inv.status = "paid";
    if (amount !== undefined) inv.amount = amount;
    inv.payments = [{ id: `pay_${id}`, status: "paid" }];
  };

  it("takes the first instalment after the contract details, issues the contract, and collects each stage payment", async () => {
    const { res, body, token } = await createQuote([
      { label: "دفعة مقدمة", percent: 30, trigger: "acceptance" },
      { label: "تسليم التقرير النهائي", percent: 70, trigger: "milestone", stage: 1 },
    ], { stages: JSON.stringify(["إعداد الدراسة والتقرير النهائي"]) });
    expect(res.status).toBe(200);
    expect(body.quoteId).toBe("SEL-2026-000123-Q1");
    expect(token).toMatch(TOKEN);
    expect(body.link).toBe(`https://selorin.co/ar/portal/?t=${token}`);
    expect(mails[0]).toContain("to=sara@acme.sa");
    expect(mails[0]).toContain("attachments=Technical_offer.pdf");
    expect(mails[0]).toContain("11,500.00 ريال");
    expect(leadStatus()).toBe("quoted");

    // The client sees the proposal in the portal, without staff-only data.
    let p = await view(token);
    expect(p.quote).toMatchObject({ status: "sent", subtotal: 1000000, vat: 150000, total: 1150000, paid: 0, documents: ["Technical_offer.pdf"] });
    expect(p.quote.milestones.map((m: any) => [m.amount, m.status, m.stageSeq])).toEqual([[345000, "scheduled", null], [805000, "scheduled", 1]]);
    expect(JSON.stringify(p)).not.toContain(db.prepare("SELECT token FROM quotes").get()!.token as string);

    // The first instalment cannot be paid before the contract details.
    expect((await portal("/api/portal/accept", { t: token })).status).toBe(200);
    expect((await portal("/api/portal/pay", { t: token, ms: milestones()[0].id })).status).toBe(409);
    const c = await (await portal("/api/portal/contract", { t: token, ...details })).json() as any;
    expect(c.url).toBe("https://checkout.moyasar.com/invoices/inv_1");
    expect(created[0]).toMatchObject({ amount: 345000, currency: "SAR", callback_url: `https://selorin.co/api/pay/callback?ms=${milestones()[0].id}`, success_url: `https://selorin.co/ar/portal/?t=${token}&paid=1`, back_url: `https://selorin.co/ar/portal/?t=${token}` });
    expect(milestones()[0].status).toBe("due");
    expect(mails.some((m) => m.includes("الدفعة الأولى «دفعة مقدمة» مستحقة الآن"))).toBe(true);
    expect((await view(token)).next).toBe("pay_advance");

    // Paying again from the page reuses the same invoice; a callback before payment changes nothing.
    const again = await (await portal("/api/portal/pay", { t: token, ms: milestones()[0].id })).json() as any;
    expect(again.url).toBe(c.url);
    expect(created).toHaveLength(1);
    await callback(`/api/pay/callback?ms=${milestones()[0].id}`);
    expect(milestones()[0].status).toBe("due");

    // Moyasar reports it paid: recorded once, client and staff told, contract issued.
    pay("inv_1");
    await callback(`/api/pay/callback?ms=${milestones()[0].id}`, { status: "paid" });
    await callback(`/api/pay/callback?ms=${milestones()[0].id}`, { status: "paid" });
    expect(milestones()[0]).toMatchObject({ status: "paid", payment_id: "pay_inv_1", paid_by: "moyasar" });
    expect(mails.filter((m) => m.includes("[Payment received] SEL-2026-000123 | SAR 3,450.00"))).toHaveLength(1);
    expect(mails.some((m) => m.includes("تم استلام دفعتك"))).toBe(true);
    expect(db.prepare("SELECT status FROM contracts").get()).toEqual({ status: "issued" });
    p = await view(token);
    expect(p.next).toBe("sign_contract");
    expect(p.work[0].state).toBe("waiting");

    // Signed copy uploaded: the stage starts. Completing it makes the stage payment due.
    const form = new FormData();
    form.set("t", token);
    form.append("file", new File([PDF], "signed.pdf", { type: "application/pdf" }));
    expect((await handlePortal(new Request("https://selorin.co/api/portal/countersign", { method: "POST", body: form }), env, "/api/portal/countersign")).status).toBe(200);
    expect(leadStatus()).toBe("in_progress");
    const stage = db.prepare("SELECT id, status FROM work_stages").get() as { id: number; status: string };
    expect(stage.status).toBe("active");
    expect((await portal("/api/portal/pay", { t: token, ms: milestones()[1].id })).status).toBe(409);
    expect((await admin("/api/admin/stage", { method: "POST", body: JSON.stringify({ id: stage.id, note: "Delivered" }) })).status).toBe(200);
    expect(mails.at(-1)).toContain("أنجزنا مرحلة «إعداد الدراسة والتقرير النهائي»");
    const fin = await (await portal("/api/portal/pay", { t: token, ms: milestones()[1].id })).json() as any;
    expect(fin.url).toBe("https://checkout.moyasar.com/invoices/inv_2");

    // Paid while the callback was lost: opening the portal picks it up and closes the request.
    pay("inv_2");
    p = await view(token);
    expect(p.quote).toMatchObject({ status: "paid", paid: 1150000 });
    expect(p.next).toBe("done");
    expect(leadStatus()).toBe("completed");
  });

  it("keeps one invoice when the client clicks pay twice at once, and closes it when paid by transfer", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    const first = await approve(token);
    const ms = milestones()[0];
    db.prepare("UPDATE quote_milestones SET invoice_id = NULL, invoice_url = NULL").run();
    invoices.clear();
    const [a, b] = await Promise.all([portal("/api/portal/pay", { t: token, ms: ms.id }), portal("/api/portal/pay", { t: token, ms: ms.id })]);
    const urls = [(await a.json() as any).url, (await b.json() as any).url];
    expect(first.url).toBeTruthy();
    expect(urls[0]).toBe(urls[1]);
    const live = [...invoices.values()].filter((i) => i.status === "initiated");
    expect(live).toHaveLength(1);
    expect(milestones()[0].invoice_id).toBe(live[0].id);
    expect(mails.filter((m) => m.includes("[Quote approved]"))).toHaveLength(1);
    await admin("/api/admin/milestone", { method: "POST", body: JSON.stringify({ id: ms.id, action: "paid", reference: "Transfer 9" }) });
    expect(invoices.get(live[0].id)!.status).toBe("canceled");
  });

  it("never records a payment for the wrong amount", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    await approve(token);
    pay("inv_1", 100);
    await callback(`/api/pay/callback?ms=${milestones()[0].id}`);
    expect(milestones()[0].status).toBe("due");
    expect(db.prepare("SELECT status FROM contracts").get()).toEqual({ status: "details" });
  });

  it("accepts webhook events only with the secret", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    await approve(token);
    pay("inv_1");
    expect((await callback("/api/pay/webhook", { secret_token: "nope", data: { invoice_id: "inv_1" } })).status).toBe(401);
    expect(milestones()[0].status).toBe("due");
    expect((await callback("/api/pay/webhook", { secret_token: "whsec", data: { invoice_id: "inv_1" } })).status).toBe(200);
    expect(milestones()[0].status).toBe("paid");
  });

  it("refuses unknown tokens, expired proposals and invalid plans", async () => {
    expect((await portal("/api/portal?t=short")).status).toBe(404);
    expect((await portal(`/api/portal?t=${newToken()}`)).status).toBe(404);
    const bad = await createQuote([{ label: "a", percent: 50, trigger: "milestone" }]);
    expect(bad.res.status).toBe(422);
    expect(bad.body.error).toBe("plan_sum");
    const unlinked = await createQuote([{ label: "a", percent: 100, trigger: "milestone", stage: 3 }], { stages: JSON.stringify(["One"]) });
    expect(unlinked.body.error).toBe("plan_stage_link");
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }]);
    db.prepare("UPDATE quotes SET valid_until = '2020-01-01'").run();
    expect((await portal("/api/portal/accept", { t: token })).status).toBe(410);
    expect((await view(token)).quote.status).toBe("expired");
    expect((await view(token)).next).toBe("expired");
  });

  it("needs the admin token for staff actions", async () => {
    for (const path of ["/api/admin/quotes", "/api/admin/tasks", "/api/admin/settings"]) {
      const res = await handleAdmin(new Request(`https://selorin.co${path}`), env, path);
      expect(res.status).toBe(401);
    }
  });

  it("records bank transfers by hand, lists projects for staff, and leaves replaced proposals alone", async () => {
    const old = await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }]);
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }], { final: "1" });
    const oldMs = milestones().find((m) => m.quote_id.endsWith("Q1"))!;
    const res0 = await admin("/api/admin/milestone", { method: "POST", body: JSON.stringify({ id: oldMs.id, action: "paid", reference: "x" }) });
    expect(res0.status).toBe(409);
    expect(((await res0.json()) as any).error).toBe("quote_closed");
    expect(old.token).toBe(token); // one portal link per request

    expect((await approve(token)).issued).toBe(true); // nothing due on approval: the contract is issued at once
    const ms = milestones().find((m) => m.quote_id.endsWith("Q2"))!;
    const res = await admin("/api/admin/milestone", { method: "POST", body: JSON.stringify({ id: ms.id, action: "paid", reference: "Bank transfer 4471" }) });
    expect(res.status).toBe(200);
    expect(milestones().find((m) => m.id === ms.id)).toMatchObject({ status: "paid", paid_by: "manual", payment_id: "Bank transfer 4471" });
    const list = await (await admin("/api/admin/quotes?lead=SEL-2026-000123")).json() as any;
    expect(list.payments).toBe("test");
    expect(list.quotes.map((q: any) => [q.quote_id, q.status])).toEqual([["SEL-2026-000123-Q2", "paid"], ["SEL-2026-000123-Q1", "superseded"]]);
    expect(list.quotes[0].token).toBeUndefined();
    expect(list.quotes[0].contract.document).toBeUndefined();
    expect(list.quotes[0].lead.portal).toBe(`https://selorin.co/ar/portal/?t=${token}`);
  });

  it("keeps an approved proposal: a new one needs the old one cancelled first", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }]);
    await portal("/api/portal/accept", { t: token });
    const again = await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }]);
    expect(again.res.status).toBe(409);
    expect(again.body.error).toBe("has_accepted");
    expect((await admin("/api/admin/quotes/cancel", { method: "POST", body: JSON.stringify({ quoteId: "SEL-2026-000123-Q1" }) })).status).toBe(200);
    expect((await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }])).res.status).toBe(200);
  });

  it("does not take live payments outside production", async () => {
    env.MOYASAR_SECRET_KEY = "sk_live_x";
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    const c = await approve(token);
    expect(c).toMatchObject({ ok: true, url: null });
    expect((await portal("/api/portal/pay", { t: token, ms: milestones()[0].id })).status).toBe(503);
    expect((await view(token)).payments).toBe("off");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reminds twice at most, four days apart, and stops once paid", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    await approve(token);
    db.prepare("UPDATE quote_milestones SET due_at = '2026-11-01 08:00:00'").run();
    const count = () => mails.filter((m) => m.includes("تذكير: دفعة مستحقة")).length;
    expect(await runPaymentCron(env, new Date("2026-11-02T08:00:00Z"))).toMatchObject({ reminded: 0 });
    expect(await runPaymentCron(env, new Date())).toMatchObject({ reminded: 1 });
    expect(await runPaymentCron(env, new Date())).toMatchObject({ reminded: 0 });
    db.prepare("UPDATE quote_milestones SET last_reminder_at = '2026-11-05 08:00:00'").run();
    expect(await runPaymentCron(env, new Date())).toMatchObject({ reminded: 1 });
    db.prepare("UPDATE quote_milestones SET last_reminder_at = '2026-11-05 08:00:00'").run();
    expect(await runPaymentCron(env, new Date())).toMatchObject({ checked: 0 });
    expect(count()).toBe(2);
    expect(mails.filter((m) => m.includes("تذكير")).every((m) => m.includes("/ar/portal/?t="))).toBe(true);

    db.prepare("UPDATE quote_milestones SET reminders = 0").run();
    pay("inv_1");
    expect(await runPaymentCron(env, new Date())).toMatchObject({ reminded: 0 });
    expect(milestones()[0].status).toBe("paid");
  });
});
