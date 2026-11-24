/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  buildSchedule, dueEmail, formatSar, invoicePayload, isPaidInvoice, keyAllowed, newToken, quoteEmail, quoteUrl, receiptEmail,
  sarToHalalas, staffEmail, TOKEN, vatOf,
} from "../src/lib/payments";
import { handlePayments, runPaymentCron, type PayEnv } from "../functions/api/payments";
import { handleAdmin } from "../functions/api/admin";

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

  it("makes unguessable link tokens", () => {
    const a = newToken();
    expect(a).toMatch(TOKEN);
    expect(a).not.toBe(newToken());
    expect(quoteUrl("https://selorin.co", "ar", a)).toBe(`https://selorin.co/ar/quote/?t=${a}`);
    expect(quoteUrl("https://selorin.co", "en", a)).toBe(`https://selorin.co/quote/?t=${a}`);
  });
});

describe("client e-mails", () => {
  const base = { name: "Sara", leadId: "SEL-2026-000123", title: "Environmental permit", url: "https://selorin.co/ar/quote/?t=x" };
  const ms = [{ label: "Advance", amount: 345000, trigger: "acceptance" as const }, { label: "Final", amount: 805000, trigger: "milestone" as const }];
  const all = (["ar", "en"] as const).flatMap((lang) => [
    quoteEmail({ ...base, lang, total: 1150000, milestones: ms, validUntil: "2026-12-24", files: ["offer.pdf"] }),
    quoteEmail({ ...base, lang, total: 1150000, milestones: ms.slice(1), validUntil: "2026-12-24", files: [] }),
    dueEmail({ ...base, lang, label: "Final", amount: 805000 }),
    dueEmail({ ...base, lang, label: "Final", amount: 805000, reminder: true }),
    receiptEmail({ ...base, lang, label: "Advance", amount: 345000, paymentId: "pay_1", remaining: 805000 }),
    receiptEmail({ ...base, lang, label: "Final", amount: 805000, paymentId: "pay_2", remaining: 0 }),
  ]);

  it("carry the link and the amounts, with no dashes", () => {
    for (const m of all) {
      expect(m.text).toContain(base.url);
      expect(m.html).toContain(base.url);
      expect(`${m.subject}\n${m.text}`).not.toMatch(/[–—]|\S - \S/);
    }
    expect(all[0].text).toContain("11,500.00 ريال");
    expect(all[0].text).toContain("offer.pdf");
    expect(all[3].subject.startsWith("تذكير")).toBe(true);
    expect(all[6].text).toContain("SAR 11,500.00");
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

// ---------------------------------------------------------------- end to end with a real SQLite database

/** D1 on top of node:sqlite, enough for the statements the Worker runs. */
function d1(db: DatabaseSync) {
  const stmt = (sql: string, args: unknown[] = []) => {
    const run = () => db.prepare(sql);
    const vals = () => args.map((a) => (a === undefined ? null : a)) as (string | number | null)[];
    return {
      bind: (...a: unknown[]) => stmt(sql, a),
      first: async () => (run().get(...vals()) as Record<string, unknown> | undefined) ?? null,
      all: async () => ({ results: run().all(...vals()) }),
      run: async () => { run().run(...vals()); return { success: true }; },
      _exec: () => run().run(...vals()),
    };
  };
  return {
    prepare: (sql: string) => stmt(sql),
    batch: async (list: ReturnType<typeof stmt>[]) => {
      db.exec("BEGIN");
      try { for (const s of list) s._exec(); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; }
      return [];
    },
  } as unknown as D1Database;
}

describe("quotes and payments", () => {
  let db: DatabaseSync;
  let env: PayEnv;
  let invoices: Map<string, { id: string; status: string; amount: number; currency: string; url: string; payments: { id: string; status: string }[] }>;
  let created: Record<string, unknown>[];
  let mails: string[];

  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  const admin = (path: string, init: RequestInit = {}) =>
    handleAdmin(new Request(`https://selorin.co${path}`, { ...init, headers: { authorization: "Bearer admintoken", ...(init.headers ?? {}) } }), env, path.split("?")[0]);
  const pub = (path: string, body?: unknown) =>
    handlePayments(new Request(`https://selorin.co${path}`, body === undefined ? {} : { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }), env, path.split("?")[0]);
  const milestones = () => db.prepare("SELECT * FROM quote_milestones ORDER BY seq").all() as Record<string, any>[];
  const leadStatus = () => (db.prepare("SELECT status FROM leads").get() as { status: string }).status;

  async function createQuote(plan: unknown, extra: Record<string, string> = {}) {
    const form = new FormData();
    form.set("leadId", "SEL-2026-000123");
    form.set("title", "Environmental permit for the Jubail plant");
    form.set("subtotal", "10,000");
    form.set("plan", JSON.stringify(plan));
    for (const [k, v] of Object.entries(extra)) form.set(k, v);
    form.append("files", new File([pdf], "Technical offer.pdf", { type: "application/pdf" }));
    const res = await admin("/api/admin/quotes", { method: "POST", body: form });
    const body = await res.json() as { ok: boolean; link: string; quoteId: string; error?: string };
    return { res, body, token: body.link ? new URL(body.link).searchParams.get("t")! : "" };
  }

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    for (const f of readdirSync("migrations").sort()) db.exec(readFileSync(`migrations/${f}`, "utf8"));
    db.prepare(`INSERT INTO leads (lead_id, kind, submitted_at, company, contact_name, email, payload) VALUES ('SEL-2026-000123', 'request', '2026-11-20 09:00:00', 'Acme', 'Sara', 'sara@acme.sa', ?1)`)
      .run(JSON.stringify({ lang: "ar" }));
    env = { DB: d1(db), ADMIN_TOKEN: "admintoken", EMAIL_DRY_RUN: "true", MOYASAR_SECRET_KEY: "sk_test_x", SITE_URL: "https://selorin.co" };
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

  it("sends a proposal, takes the advance on approval and the rest when each stage is done", async () => {
    const { res, body, token } = await createQuote([
      { label: "دفعة مقدمة", percent: 30, trigger: "acceptance" },
      { label: "تسليم التقرير النهائي", percent: 70, trigger: "milestone" },
    ]);
    expect(res.status).toBe(200);
    expect(body.quoteId).toBe("SEL-2026-000123-Q1");
    expect(token).toMatch(TOKEN);
    expect(mails[0]).toContain("to=sara@acme.sa");
    expect(mails[0]).toContain("attachments=Technical_offer.pdf");
    expect(mails[0]).toContain("11,500.00 ريال");
    expect(leadStatus()).toBe("quoted");

    // The client opens the link and sees the proposal.
    let q = await (await pub(`/api/quote?t=${token}`)).json() as any;
    expect(q.quote).toMatchObject({ status: "sent", subtotal: 1000000, vat: 150000, total: 1150000, paid: 0, documents: ["Technical_offer.pdf"] });
    expect(q.quote.milestones.map((m: any) => [m.amount, m.status])).toEqual([[345000, "scheduled"], [805000, "scheduled"]]);
    expect(JSON.stringify(q)).not.toContain("sara@acme.sa");

    // Approval returns Moyasar's payment page for the advance.
    const acc = await (await pub("/api/quote/accept", { t: token })).json() as any;
    expect(acc.url).toBe("https://checkout.moyasar.com/invoices/inv_1");
    expect(created[0]).toMatchObject({ amount: 345000, currency: "SAR", callback_url: `https://selorin.co/api/pay/callback?ms=${milestones()[0].id}`, success_url: `https://selorin.co/ar/quote/?t=${token}&paid=1` });
    expect(milestones()[0].status).toBe("due");

    // Paying again from the page reuses the same invoice.
    const again = await (await pub("/api/quote/pay", { t: token, ms: milestones()[0].id })).json() as any;
    expect(again.url).toBe(acc.url);
    expect(created).toHaveLength(1);

    // A callback before payment changes nothing.
    await pub(`/api/pay/callback?ms=${milestones()[0].id}`, {});
    expect(milestones()[0].status).toBe("due");

    // Moyasar reports it paid: recorded once, client and staff told, work starts.
    pay("inv_1");
    const sent = mails.length;
    await pub(`/api/pay/callback?ms=${milestones()[0].id}`, { status: "paid" });
    await pub(`/api/pay/callback?ms=${milestones()[0].id}`, { status: "paid" });
    expect(milestones()[0]).toMatchObject({ status: "paid", payment_id: "pay_inv_1", paid_by: "moyasar" });
    expect(mails.length - sent).toBe(2);
    expect(mails.at(-2)).toContain("تم استلام دفعتك");
    expect(mails.at(-1)).toContain("[Payment received] SEL-2026-000123 | SAR 3,450.00");
    expect(leadStatus()).toBe("in_progress");

    // The final payment cannot be paid before the team marks the stage complete.
    expect((await pub("/api/quote/pay", { t: token, ms: milestones()[1].id })).status).toBe(409);
    const due = await admin("/api/admin/milestone", { method: "POST", body: JSON.stringify({ id: milestones()[1].id, action: "due" }) });
    expect(due.status).toBe(200);
    expect(mails.at(-1)).toContain("دفعة مستحقة على طلبك SEL-2026-000123");
    const fin = await (await pub("/api/quote/pay", { t: token, ms: milestones()[1].id })).json() as any;
    expect(fin.url).toBe("https://checkout.moyasar.com/invoices/inv_2");

    // Paid while the callback was lost: opening the page picks it up.
    pay("inv_2");
    q = await (await pub(`/api/quote?t=${token}`)).json() as any;
    expect(q.quote).toMatchObject({ status: "paid", paid: 1150000, remaining: 0 });
    const events = db.prepare("SELECT note FROM lead_events WHERE note IS NOT NULL").all().map((e: any) => e.note);
    expect(events.some((n: string) => n.includes("تسليم التقرير النهائي"))).toBe(true);
  });

  it("keeps one invoice when the client clicks pay twice at once, and closes it when paid by transfer", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    const [a, b] = await Promise.all([pub("/api/quote/accept", { t: token }), pub("/api/quote/accept", { t: token })]);
    const urls = [(await a.json() as any).url, (await b.json() as any).url];
    expect(urls[0]).toBe(urls[1]);
    expect(mails.filter((m) => m.includes("[Quote approved]"))).toHaveLength(1);
    const live = [...invoices.values()].filter((i) => i.status === "initiated");
    expect(live).toHaveLength(1);
    expect(milestones()[0].invoice_id).toBe(live[0].id);
    await admin("/api/admin/milestone", { method: "POST", body: JSON.stringify({ id: milestones()[0].id, action: "paid", reference: "Transfer 9" }) });
    expect(invoices.get(live[0].id)!.status).toBe("canceled");
  });

  it("never records a payment for the wrong amount", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    await pub("/api/quote/accept", { t: token });
    pay("inv_1", 100);
    await pub(`/api/pay/callback?ms=${milestones()[0].id}`, {});
    expect(milestones()[0].status).toBe("due");
  });

  it("refuses unknown tokens, expired proposals and invalid plans", async () => {
    expect((await pub("/api/quote?t=short")).status).toBe(404);
    expect((await pub(`/api/quote?t=${newToken()}`)).status).toBe(404);
    const bad = await createQuote([{ label: "a", percent: 50, trigger: "milestone" }]);
    expect(bad.res.status).toBe(422);
    expect(bad.body.error).toBe("plan_sum");
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }]);
    db.prepare("UPDATE quotes SET valid_until = '2020-01-01'").run();
    expect((await pub("/api/quote/accept", { t: token })).status).toBe(410);
    expect((await (await pub(`/api/quote?t=${token}`)).json() as any).quote.status).toBe("expired");
  });

  it("needs the admin token for staff actions", async () => {
    const res = await handleAdmin(new Request("https://selorin.co/api/admin/quotes"), env, "/api/admin/quotes");
    expect(res.status).toBe(401);
  });

  it("records bank transfers by hand and lists quotes for staff", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "milestone" }]);
    await pub("/api/quote/accept", { t: token });
    expect(leadStatus()).toBe("in_progress");
    const res = await admin("/api/admin/milestone", { method: "POST", body: JSON.stringify({ id: milestones()[0].id, action: "paid", reference: "Bank transfer 4471" }) });
    expect(res.status).toBe(200);
    expect(milestones()[0]).toMatchObject({ status: "paid", paid_by: "manual", payment_id: "Bank transfer 4471" });
    const list = await (await admin("/api/admin/quotes?lead=SEL-2026-000123")).json() as any;
    expect(list.payments).toBe("test");
    expect(list.quotes[0]).toMatchObject({ quote_id: "SEL-2026-000123-Q1", status: "paid" });
    expect(list.quotes[0].token).toBeUndefined();
  });

  it("does not take live payments outside production", async () => {
    env.MOYASAR_SECRET_KEY = "sk_live_x";
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    const res = await pub("/api/quote/accept", { t: token });
    expect(res.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reminds twice at most, four days apart, and stops once paid", async () => {
    const { token } = await createQuote([{ label: "Full", percent: 100, trigger: "acceptance" }]);
    await pub("/api/quote/accept", { t: token });
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

    db.prepare("UPDATE quote_milestones SET reminders = 0").run();
    pay("inv_1");
    expect(await runPaymentCron(env, new Date())).toMatchObject({ reminded: 0 });
    expect(milestones()[0].status).toBe("paid");
  });
});
