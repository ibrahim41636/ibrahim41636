/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  addHours, contractDocument, contractNumber, dbTime, fromDb, meetingScheduledEmail, parseContractDetails, parseMeetingRequest, planStages, portalLinkEmail,
  projectStage, slaHours, staffNote, contractIssuedEmail, stageDoneEmail, projectDoneEmail, validImage, workGates, type ContractInput,
} from "../src/lib/portal";
import { STAGES, stageOf } from "../src/lib/tracking";
import { multipartBody, safeName, archive, resetDriveToken } from "../functions/api/drive";
import { handlePortal, openTasks, runSlaCron } from "../functions/api/portal";
import { handleAdmin } from "../functions/api/admin";
import { handleTrack } from "../functions/api/track";
import { handleRequestPost } from "../functions/api/request";
import { d1, freshDb, PDF, PNG } from "./d1";

const NO_DASH = /[–—]|\S - \S/;

describe("request stages", () => {
  it("has eight stages in both languages", () => {
    expect(STAGES).toHaveLength(8);
    for (const s of STAGES) expect(s.ar && s.en).toBeTruthy();
  });

  it("falls back to the request status alone", () => {
    expect(stageOf("received")).toBe(1);
    expect(stageOf("quoted")).toBe(2);
    expect(stageOf("in_progress")).toBe(6);
    expect(stageOf("completed")).toBe(7);
  });

  it("follows the proposal, contract, payment and work", () => {
    expect(projectStage({ leadStatus: "received" })).toBe(1);
    expect(projectStage({ leadStatus: "quoted", quoteStatus: "sent" })).toBe(2);
    expect(projectStage({ leadStatus: "quoted", quoteStatus: "change_requested" })).toBe(2);
    expect(projectStage({ leadStatus: "quoted", quoteStatus: "accepted" })).toBe(3);
    expect(projectStage({ leadStatus: "quoted", quoteStatus: "accepted", contractStatus: "details", advanceDue: true })).toBe(4);
    expect(projectStage({ leadStatus: "quoted", quoteStatus: "accepted", contractStatus: "issued" })).toBe(5);
    expect(projectStage({ leadStatus: "quoted", quoteStatus: "accepted", contractStatus: "countersigned" })).toBe(6);
    expect(projectStage({ leadStatus: "in_progress", quoteStatus: "paid", contractStatus: "issued", workStarted: true })).toBe(6);
    expect(projectStage({ leadStatus: "completed" })).toBe(7);
  });
});

describe("work stages and payment gates", () => {
  const pay = (id: number, stage_seq: number | null, status = "scheduled", trigger = "milestone") => ({ id, label: `P${id}`, amount: 100, trigger, status, stage_seq });
  const st = (seq: number, status = "pending") => ({ seq, status });

  it("waits for the signed contract and the advance", () => {
    expect(workGates([st(1), st(2)], [], false).map((g) => g.state)).toEqual(["waiting", "waiting"]);
  });

  it("runs one stage at a time and locks the next until the last stage's payment is in", () => {
    expect(workGates([st(1), st(2)], [pay(1, 1)], true).map((g) => g.state)).toEqual(["ready", "upcoming"]);
    expect(workGates([st(1, "active"), st(2)], [pay(1, 1)], true).map((g) => g.state)).toEqual(["active", "upcoming"]);
    const locked = workGates([st(1, "done"), st(2), st(3)], [pay(1, 1, "due"), pay(2, 2)], true);
    expect(locked.map((g) => g.state)).toEqual(["done", "locked", "upcoming"]);
    expect(locked[1].blockedBy?.id).toBe(1);
    expect(workGates([st(1, "done"), st(2)], [pay(1, 1, "paid"), pay(2, 2)], true).map((g) => g.state)).toEqual(["done", "ready"]);
    expect(workGates([st(1, "done"), st(2)], [pay(1, 1, "cancelled")], true)[1].state).toBe("ready");
  });

  it("builds stages from the methodology, or one per stage payment", () => {
    const rows = [{ trigger: "acceptance" as const, label: "Advance" }, { trigger: "milestone" as const, label: "Fieldwork", stage: 1 }, { trigger: "milestone" as const, label: "Report", stage: 3 }];
    expect(planStages(rows, ["Field", "Lab", "Report"], "x")).toEqual({ ok: true, stages: ["Field", "Lab", "Report"], links: [null, 1, 3] });
    expect(planStages(rows, [], "x")).toEqual({ ok: true, stages: ["Fieldwork", "Report"], links: [null, 1, 2] });
    expect(planStages([{ trigger: "acceptance", label: "All" }], [], "Delivery")).toEqual({ ok: true, stages: ["Delivery"], links: [null] });
    expect(planStages(rows, ["Field"], "x")).toEqual({ ok: false, error: "stage_link" });
    expect(planStages(rows, Array.from({ length: 13 }, (_, i) => `S${i}`), "x")).toEqual({ ok: false, error: "too_many_stages" });
    expect(planStages(rows, ["x".repeat(161), "b", "c"], "x")).toEqual({ ok: false, error: "stage_title" });
  });
});

describe("client input", () => {
  it("reads a meeting request as written", () => {
    expect(parseMeetingRequest({ mode: "site", preferred: " Sunday 10am ", topics: "Sampling points" })).toEqual({ ok: true, request: { mode: "site", preferred: "Sunday 10am", topics: "Sampling points" } });
    expect(parseMeetingRequest({ mode: "zoom", preferred: "any" })).toEqual({ ok: false, error: "mode" });
    expect(parseMeetingRequest({ mode: "online", preferred: "a" })).toEqual({ ok: false, error: "preferred" });
  });

  it("checks the contract details and reads Arabic digits", () => {
    const ok = parseContractDetails({ legalName: "شركة أكمي", crNumber: "٢٠٥٠٠١٢٣٤٥", signatoryName: "سارة الحربي", signatoryTitle: "الرئيس التنفيذي", signatoryPhone: "+٩٦٦ (55) 123-4567", signatoryEmail: " Sara@Acme.SA ", agree: true });
    expect(ok).toEqual({ ok: true, details: { legalName: "شركة أكمي", crNumber: "2050012345", address: "", signatoryName: "سارة الحربي", signatoryTitle: "الرئيس التنفيذي", signatoryPhone: "+966551234567", signatoryEmail: "sara@acme.sa" } });
    const bad = parseContractDetails({ legalName: "x", crNumber: "12", signatoryName: "ab", signatoryTitle: "", signatoryPhone: "123", signatoryEmail: "nope", agree: "yes" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["agree", "crNumber", "legalName", "signatoryEmail", "signatoryName", "signatoryPhone", "signatoryTitle"]);
  });

  it("numbers contracts after their proposal", () => {
    expect(contractNumber("SEL-2026-000123-Q3")).toBe("SEL-2026-000123-C3");
  });

  it("accepts only small PNG or JPEG images for the signature and stamp", () => {
    expect(validImage("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    expect(validImage("data:image/jpeg;base64,/9j/4AAQ")).toBe(true);
    expect(validImage("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
    expect(validImage("data:image/png;base64,abc\"onerror=alert(1)")).toBe(false);
    expect(validImage(`data:image/png;base64,${"A".repeat(1_600_000)}`)).toBe(false);
    expect(validImage(null)).toBe(false);
  });

  it("keeps the timer in hours, three by default", () => {
    expect(slaHours(undefined)).toBe(3);
    expect(slaHours("5")).toBe(5);
    for (const bad of ["0", "-1", "abc", "100"]) expect(slaHours(bad)).toBe(3);
    expect(dbTime(new Date("2026-11-27T07:00:00.123Z"))).toBe("2026-11-27 07:00:00");
    expect(fromDb("2026-11-27 07:00:00").toISOString()).toBe("2026-11-27T07:00:00.000Z");
    expect(addHours("2026-11-27 22:30:00", 3)).toBe("2026-11-28 01:30:00");
  });
});

describe("the contract document", () => {
  const input: ContractInput = {
    lang: "ar", contractNo: "SEL-2026-000123-C1", date: "2026-11-27", issued: false,
    provider: { legalName: "سيلورين", crNumber: "7000000000", signatoryName: "المدير", signatoryTitle: "المدير العام", phone: "+966 55 015 6887", email: "sales@selorin.co" },
    client: { legalName: "شركة <b>أكمي</b>", crNumber: "2050012345", signatoryName: "سارة", signatoryTitle: "الرئيس التنفيذي", phone: "+966551234567", email: "sara@acme.sa" },
    leadId: "SEL-2026-000123", quoteId: "SEL-2026-000123-Q1", title: "تصريح بيئي", documents: ["offer.pdf"],
    subtotal: 1000000, vat: 150000, total: 1150000,
    payments: [{ label: "دفعة مقدمة", amount: 345000, when: "عند الموافقة" }, { label: "التقرير", amount: 805000, when: "عند إنجاز مرحلة «التقرير»" }],
    stages: ["الأعمال الميدانية", "التقرير"],
    acceptance: { at: "2026-11-27 10:15", name: "سارة", email: "sara@acme.sa" },
    signature: "data:image/png;base64,iVBORw0KGgo=", stamp: "data:image/png;base64,iVBORw0KGgo=",
  };

  it("is a preview without signature or stamp until issued", () => {
    const html = contractDocument(input);
    expect(html).toContain('class="draft"');
    expect(html).not.toContain("data:image/png");
    expect(html).toContain("&lt;b&gt;أكمي&lt;/b&gt;");
    expect(html).not.toContain("<b>أكمي</b>");
  });

  it("carries Selorin's signature and stamp, the payment table and the stage gate once issued", () => {
    const html = contractDocument({ ...input, issued: true });
    expect(html).not.toContain('class="draft"');
    expect(html.match(/<img class="(sig|stamp)" src="data:image\/png/g)).toHaveLength(2);
    expect(html).toContain("11,500.00 ريال");
    expect(html).toContain("ولا تبدأ أي مرحلة لاحقة من الأعمال قبل سداد الدفعة المستحقة عن المرحلة السابقة لها");
    expect(html).toContain("نظام التعاملات الإلكترونية");
    expect(html).toContain("سجل القبول الإلكتروني");
    expect(html).not.toMatch(NO_DASH);
  });

  it("keeps dates, numbers and e-mails in order inside Arabic text", () => {
    const html = contractDocument({ ...input, issued: true });
    for (const token of ["2026-11-27", "+966551234567", "sara@acme.sa", "SEL-2026-000123-C1", "2050012345", "2026-11-27 10:15"]) {
      expect(html).toContain(`<span dir="ltr">${token}</span>`);
    }
  });

  it("is written in English for English requests", () => {
    const html = contractDocument({ ...input, lang: "en", issued: true });
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("Environmental Services Contract");
    expect(html).toContain("Electronic Transactions Law");
  });
});

describe("portal e-mails", () => {
  const base = { name: "Sara", leadId: "SEL-2026-000123", url: "https://selorin.co/ar/portal/?t=x" };
  it("carry the portal link, with no dashes", () => {
    for (const lang of ["ar", "en"] as const) {
      for (const m of [
        portalLinkEmail({ ...base, lang, service: "Permitting" }),
        meetingScheduledEmail({ ...base, lang, when: "2026-12-01 10:30", mode: "Online", location: "Teams" }),
        contractIssuedEmail({ ...base, lang, contractNo: "SEL-2026-000123-C1" }),
        stageDoneEmail({ ...base, lang, title: "Permit", stage: "Fieldwork", next: "Report" }),
        projectDoneEmail({ ...base, lang, title: "Permit" }),
      ]) {
        expect(m.text).toContain(base.url);
        expect(m.html).toContain(base.url);
        expect(`${m.subject}\n${m.text}`).not.toMatch(NO_DASH);
      }
    }
    expect(meetingScheduledEmail({ ...base, lang: "ar", when: "2026-12-01 10:30", mode: "x", location: "" }).text).toContain("⁦2026-12-01 10:30⁩");
  });

  it("tell the team what to do and by when", () => {
    expect(staffNote("sla_late", { leadId: "SEL-2026-000123", company: "Acme", adminUrl: "https://s/a", due: "2026-11-27 10:00:00", detail: "First proposal" }).subject).toBe("[Overdue] SEL-2026-000123 | Acme | First proposal");
    expect(staffNote("meeting", { leadId: "SEL-2026-000123", adminUrl: "https://s/a", detail: "Mode: Online", due: "x" }).text).toContain("Schedule it within the proposal timer");
  });
});

// ---------------------------------------------------------------- Google Drive archive

describe("Google Drive archive", () => {
  let db: DatabaseSync;
  let calls: { url: string; init: RequestInit }[];
  const env = () => ({ DB: d1(db), DRIVE_CLIENT_ID: "cid", DRIVE_CLIENT_SECRET: "secret", DRIVE_REFRESH_TOKEN: "refresh" });

  beforeEach(() => {
    db = freshDb();
    db.prepare(`INSERT INTO leads (lead_id, kind, submitted_at, email, contact_name) VALUES ('SEL-2026-000123', 'request', '2026-11-27 07:00:00', 'a@b.sa', 'A')`).run();
    calls = [];
    resetDriveToken();
    vi.spyOn(console, "error").mockImplementation(() => {});
    let n = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      if (url === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "at_1", expires_in: 3600 });
      return Response.json({ id: `f${++n}` });
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("builds a multipart upload: metadata, then the bytes", () => {
    const body = multipartBody({ name: "a.pdf", parents: ["p"] }, "application/pdf", PDF, "BB");
    const text = new TextDecoder().decode(body);
    expect(text.startsWith('--BB\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{"name":"a.pdf","parents":["p"]}\r\n--BB\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.7')).toBe(true);
    expect(text.endsWith("\r\n--BB--")).toBe(true);
    expect(safeName("  a/b\\c\u0000  d ")).toBe("a b c d");
    expect(safeName("")).toBe("file");
  });

  it("does nothing until the Drive secrets are set", async () => {
    expect(await archive({ DB: d1(db) }, { lead_id: "SEL-2026-000123" }, [{ name: "a.pdf", type: "application/pdf", bytes: PDF }])).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("creates the root and request folders once, then uploads into the request folder", async () => {
    const lead = { lead_id: "SEL-2026-000123", company: "Acme", service: "Permitting" };
    expect(await archive(env(), lead, [{ name: "a.pdf", type: "application/pdf", bytes: PDF }])).toBe("f2");
    expect(calls.map((c) => c.url.split("?")[0])).toEqual([
      "https://oauth2.googleapis.com/token",
      "https://www.googleapis.com/drive/v3/files", // root folder
      "https://www.googleapis.com/drive/v3/files", // request folder
      "https://www.googleapis.com/upload/drive/v3/files",
    ]);
    expect(String(calls[0].init.body)).toContain("grant_type=refresh_token");
    expect(JSON.parse(String(calls[2].init.body))).toEqual({ name: "SEL-2026-000123 | Acme | Permitting", mimeType: "application/vnd.google-apps.folder", parents: ["f1"] });
    expect((calls[3].init.headers as Record<string, string>).authorization).toBe("Bearer at_1");
    expect(db.prepare("SELECT drive_folder_id, drive_folder_url FROM leads").get()).toEqual({ drive_folder_id: "f2", drive_folder_url: "https://drive.google.com/drive/folders/f2" });
    expect(db.prepare("SELECT value FROM settings WHERE key = 'drive_root_id'").get()).toEqual({ value: "f1" });

    // Later files reuse the folders and the access token.
    calls = [];
    expect(await archive(env(), { ...lead, drive_folder_id: "f2" }, [{ name: "b.pdf", type: "application/pdf", bytes: PDF }])).toBe("f2");
    expect(calls.map((c) => c.url.split("?")[0])).toEqual(["https://www.googleapis.com/upload/drive/v3/files"]);
  });

  it("never fails the request when Drive is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    expect(await archive(env(), { lead_id: "SEL-2026-000123" }, [{ name: "a.pdf", type: "application/pdf", bytes: PDF }])).toBeNull();
  });
});

// ---------------------------------------------------------------- the request lifecycle on a real SQLite database

describe("the request portal", () => {
  let db: DatabaseSync;
  let env: Parameters<typeof handleAdmin>[1];
  let mails: string[];
  const T = "tok_portal_0123456789abcdefghij";
  const LEAD = "SEL-2026-000123";

  const admin = (path: string, init: RequestInit = {}) =>
    handleAdmin(new Request(`https://selorin.co${path}`, { ...init, headers: { authorization: "Bearer admintoken", ...(init.headers ?? {}) } }), env, path.split("?")[0]);
  const adminPost = (path: string, body: unknown) => admin(path, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
  const portal = (path: string, body?: unknown) =>
    handlePortal(body === undefined ? new Request(`https://selorin.co${path}`) : new Request(`https://selorin.co${path}`, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body), headers: body instanceof FormData ? {} : { "content-type": "application/json" } }), env, path.split("?")[0]);
  const view = async () => ((await (await portal(`/api/portal?t=${T}`)).json()) as any).portal;
  const tasks = async () => ((await (await admin("/api/admin/tasks")).json()) as any).tasks as any[];
  const mailsTo = (to: string) => mails.filter((m) => m.startsWith(`[dry-run email] to=${to} `));
  const stageRows = () => db.prepare("SELECT * FROM work_stages ORDER BY quote_id, seq").all() as any[];
  const msRows = () => db.prepare("SELECT * FROM quote_milestones ORDER BY quote_id, seq").all() as any[];
  const plan = [
    { label: "دفعة مقدمة", percent: 30, trigger: "acceptance" },
    { label: "بعد الأعمال الميدانية", percent: 40, trigger: "milestone", stage: 1 },
    { label: "عند تسليم التقرير", percent: 30, trigger: "milestone", stage: 2 },
  ];
  async function sendQuote(extra: Record<string, string> = {}) {
    const form = new FormData();
    form.set("leadId", LEAD); form.set("title", "التصريح البيئي لمصنع الجبيل"); form.set("subtotal", "40000");
    form.set("plan", JSON.stringify(plan)); form.set("stages", JSON.stringify(["الأعمال الميدانية", "التقرير النهائي"]));
    for (const [k, v] of Object.entries(extra)) form.set(k, v);
    return (await (await admin("/api/admin/quotes", { method: "POST", body: form })).json()) as any;
  }
  const upload = (path: string, field: string, name: string, bytes: Uint8Array, type: string) => {
    const f = new FormData();
    f.set("t", T);
    f.append(field, new File([bytes], name, { type }));
    return portal(path, f);
  };

  beforeEach(() => {
    db = freshDb();
    const payload = { lang: "ar", service: { slug: "environmental-permitting", name: "Environmental Permitting" }, details: [{ label: "الموقع", value: "الجبيل" }], message: "تشغيل مصنع جديد", attachments: [{ name: "site.pdf" }] };
    db.prepare(`INSERT INTO leads (lead_id, kind, submitted_at, service, company, contact_name, email, phone, payload, portal_token, quote_due_at)
      VALUES (?1, 'request', datetime('now'), 'environmental-permitting', 'Acme', 'سارة', 'sara@acme.sa', '+966551234567', ?2, ?3, datetime('now', '+3 hours'))`).run(LEAD, JSON.stringify(payload), T);
    db.prepare(`INSERT INTO lead_events (lead_id, status, at) VALUES (?1, 'received', datetime('now'))`).run(LEAD);
    env = { DB: d1(db), ADMIN_TOKEN: "admintoken", EMAIL_DRY_RUN: "true", SITE_URL: "https://selorin.co", ESCALATION_EMAIL: "boss@selorin.co" };
    mails = [];
    vi.spyOn(console, "log").mockImplementation((m: string) => { if (String(m).startsWith("[dry-run email]")) mails.push(String(m)); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("no network in this test"); }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("follows a request from submission to completion", async () => {
    // 1. Submitted: the proposal is being prepared, on a three hour timer.
    let p = await view();
    expect(p).toMatchObject({ stage: 1, next: "wait_proposal", timer: { kind: "proposal" }, payments: "off" });
    expect(p.lead).toMatchObject({ id: LEAD, service: "التصاريح البيئية", details: [{ label: "الموقع", value: "الجبيل" }], attachments: ["site.pdf"] });
    expect((await tasks()).map((t) => t.kind)).toEqual(["proposal"]);

    // 2. First proposal: the client can meet, ask once for a discount, or approve.
    const q1 = await sendQuote();
    expect(q1).toMatchObject({ ok: true, quoteId: `${LEAD}-Q1`, negotiable: true, link: `https://selorin.co/ar/portal/?t=${T}` });
    p = await view();
    expect(p).toMatchObject({ stage: 2, next: "review", canMeet: true, quote: { negotiable: true, final: false } });
    expect(p.work.map((w: any) => [w.title, w.state])).toEqual([["الأعمال الميدانية", "waiting"], ["التقرير النهائي", "waiting"]]);
    expect(await tasks()).toEqual([]);

    // 3. Meeting: requested as written, timed, scheduled, held; the team owes a revised proposal.
    expect((await portal("/api/portal/meeting", { t: T, mode: "zoom", preferred: "x" })).status).toBe(422);
    expect((await portal("/api/portal/meeting", { t: T, mode: "site", preferred: "الأحد 10 صباحاً", topics: "عدد نقاط الرصد" })).status).toBe(200);
    expect((await portal("/api/portal/meeting", { t: T, mode: "online", preferred: "اليوم" })).status).toBe(409);
    expect(mails.some((m) => m.includes(`[Meeting requested] ${LEAD} | Acme`) && m.includes("عدد نقاط الرصد"))).toBe(true);
    p = await view();
    expect(p).toMatchObject({ next: "meeting_requested", timer: { kind: "meeting" }, canMeet: false });
    const mt = (await tasks())[0];
    expect(mt).toMatchObject({ kind: "meeting", leadId: LEAD, detail: "في موقع المشروع: الأحد 10 صباحاً" });
    expect((await adminPost("/api/admin/meeting", { id: mt.meetingId, action: "schedule", when: "bad" })).status).toBe(422);
    expect((await adminPost("/api/admin/meeting", { id: mt.meetingId, action: "schedule", when: "2026-12-01T10:30", location: "موقع المصنع" })).status).toBe(200);
    expect(mailsTo("sara@acme.sa").at(-1)).toContain("2026-12-01 10:30");
    expect((await view()).next).toBe("meeting_scheduled");
    expect(await tasks()).toEqual([]);
    expect((await adminPost("/api/admin/meeting", { id: mt.meetingId, action: "held", outcome: "زيادة نقاط الرصد إلى 6", needsRevision: true })).status).toBe(200);
    p = await view();
    expect(p).toMatchObject({ next: "wait_revision", timer: { kind: "revision" } });
    expect(p.meetings[0]).toMatchObject({ status: "held", outcome: "زيادة نقاط الرصد إلى 6" });
    expect((await tasks()).map((t) => t.kind)).toEqual(["meeting_revision"]);

    // 4. Revised after the meeting (still negotiable), then the one discount request, then a final proposal.
    const q2 = await sendQuote({ revisionNote: "6 نقاط رصد" });
    expect(q2).toMatchObject({ quoteId: `${LEAD}-Q2`, negotiable: true, replaces: `${LEAD}-Q1` });
    expect(await tasks()).toEqual([]);
    expect((await portal("/api/portal/discount", { t: T, note: "أرخص" })).status).toBe(422);
    expect((await portal("/api/portal/discount", { t: T, discount: true, note: "خصم 10%" })).status).toBe(200);
    expect((await portal("/api/portal/discount", { t: T, discount: true })).status).toBe(409);
    expect((await portal("/api/portal/accept", { t: T })).status).toBe(409);
    p = await view();
    expect(p).toMatchObject({ next: "wait_revision", timer: { kind: "revision" }, quote: { status: "change_requested" } });
    expect((await tasks()).map((t) => [t.kind, t.detail])).toEqual([["discount", "خصم: خصم 10%"]]);
    const q3 = await sendQuote({ revisionNote: "خصم 9%" });
    expect(q3).toMatchObject({ quoteId: `${LEAD}-Q3`, negotiable: false });
    p = await view();
    expect(p).toMatchObject({ next: "review", canMeet: false, quote: { quoteId: `${LEAD}-Q3`, final: true, negotiable: false, revisionNote: "خصم 9%" } });
    expect(p.versions.map((v: any) => v.status)).toEqual(["sent", "superseded", "superseded"]);
    expect((await portal("/api/portal/discount", { t: T, discount: true })).status).toBe(409);
    expect((await portal("/api/portal/meeting", { t: T, mode: "online", preferred: "غداً" })).status).toBe(409);

    // 5. Approve, then the contract details. The preview has no signature or stamp.
    await admin("/api/admin/settings", { method: "POST", body: (() => {
      const f = new FormData();
      f.set("legalName", "سيلورين للاستشارات والخدمات البيئية"); f.set("crNumber", "7000000000");
      f.append("signature", new File([PNG], "sig.png", { type: "image/png" }));
      f.append("stamp", new File([PNG], "stamp.png", { type: "image/png" }));
      return f;
    })() });
    expect((await portal("/api/portal/accept", { t: T })).status).toBe(200);
    expect((await portal("/api/portal/accept", { t: T })).status).toBe(409);
    p = await view();
    expect(p).toMatchObject({ stage: 3, next: "contract_details", prefill: { legalName: "Acme", signatoryEmail: "sara@acme.sa", signatoryPhone: "+966551234567" } });
    const bad = await (await portal("/api/portal/contract", { t: T, legalName: "Acme" })).json() as any;
    expect(bad.error).toBe("validation");
    expect(Object.keys(bad.errors)).toContain("agree");
    const preview = await (await portal(`/api/portal/contract?t=${T}`)).text();
    expect(preview).toContain('class="draft"');
    expect(preview).not.toContain("data:image/png");
    const c = await (await portal("/api/portal/contract", { t: T, legalName: "شركة أكمي الصناعية", crNumber: "2050012345", signatoryName: "سارة الحربي", signatoryTitle: "الرئيس التنفيذي", signatoryPhone: "0551234567", signatoryEmail: "sara@acme.sa", agree: true })).json() as any;
    expect(c).toEqual({ ok: true, url: null }); // online payment is off here
    expect(mails.some((m) => m.includes(`[Contract details received] ${LEAD}`))).toBe(true);
    p = await view();
    expect(p).toMatchObject({ stage: 4, next: "pay_advance", contract: { status: "details", signatoryName: "سارة الحربي", contractNo: `${LEAD}-C3` } });
    expect(db.prepare("SELECT accept_ip_hash IS NOT NULL AS h FROM contracts").get()).toEqual({ h: 1 });

    // 6. First instalment paid (bank transfer recorded by staff): the contract is issued, signed and stamped.
    const adv = msRows().find((m) => m.quote_id.endsWith("Q3") && m.trigger === "acceptance");
    expect(adv.status).toBe("due");
    expect((await adminPost("/api/admin/milestone", { id: adv.id, action: "paid", reference: "تحويل 1" })).status).toBe(200);
    p = await view();
    expect(p).toMatchObject({ stage: 5, next: "sign_contract", contract: { status: "issued" } });
    expect(p.work.map((w: any) => w.state)).toEqual(["waiting", "waiting"]);
    const issued = await (await portal(`/api/portal/contract?t=${T}`)).text();
    expect(issued).not.toContain('class="draft"');
    expect(issued.match(/<img class="(sig|stamp)"/g)).toHaveLength(2);
    expect(issued).toContain("شركة أكمي الصناعية");
    expect(mailsTo("sara@acme.sa").some((m) => m.includes(`${LEAD}-C3`))).toBe(true);
    // Issued once: later settings do not change it.
    await admin("/api/admin/settings", { method: "POST", body: (() => { const f = new FormData(); f.set("legalName", "اسم آخر"); return f; })() });
    expect(await (await portal(`/api/portal/contract?t=${T}`)).text()).toBe(issued);

    // 7. The client's signed copy: PDF or image only. Then the first stage starts.
    expect((await upload("/api/portal/countersign", "file", "signed.exe", PDF, "application/pdf")).status).toBe(422);
    expect((await upload("/api/portal/countersign", "file", "signed.pdf", PDF, "application/pdf")).status).toBe(200);
    expect(mails.some((m) => m.includes(`[Signed contract received] ${LEAD}`) && m.includes("attachments="))).toBe(true);
    p = await view();
    expect(p).toMatchObject({ stage: 6, next: "in_progress", contract: { status: "countersigned" } });
    expect(p.work.map((w: any) => w.state)).toEqual(["active", "upcoming"]);

    // 8. Each stage's payment opens the next stage.
    const [s1, s2] = stageRows().filter((s) => s.quote_id.endsWith("Q3"));
    expect((await adminPost("/api/admin/stage", { id: s2.id })).status).toBe(409);
    const done1 = await (await adminPost("/api/admin/stage", { id: s1.id, note: "اكتملت الزيارات" })).json() as any;
    expect(done1).toMatchObject({ ok: true, due: 1, started: null });
    expect(mailsTo("sara@acme.sa").at(-1)).toContain("أنجزنا مرحلة «الأعمال الميدانية»");
    p = await view();
    expect(p.next).toBe("pay_due");
    expect(p.work[1]).toMatchObject({ state: "locked", blockedBy: { label: "بعد الأعمال الميدانية" } });
    const m2 = msRows().find((m) => m.quote_id.endsWith("Q3") && m.stage_seq === 1);
    expect((await adminPost("/api/admin/milestone", { id: m2.id, action: "due" })).status).toBe(409);
    expect((await adminPost("/api/admin/milestone", { id: m2.id, action: "paid", reference: "تحويل 2" })).status).toBe(200);
    expect((await view()).work.map((w: any) => w.state)).toEqual(["done", "active"]);
    expect((await adminPost("/api/admin/stage", { id: s2.id })).status).toBe(200);
    p = await view();
    expect(p.next).toBe("pay_due");
    expect(p.lead.status).toBe("in_progress");
    const m3 = msRows().find((m) => m.quote_id.endsWith("Q3") && m.stage_seq === 2);
    expect((await adminPost("/api/admin/milestone", { id: m3.id, action: "paid", reference: "تحويل 3" })).status).toBe(200);

    // 9. Everything done and paid: completed, and the client is told.
    p = await view();
    expect(p).toMatchObject({ stage: 7, next: "done", lead: { status: "completed" }, quote: { status: "paid" } });
    expect(p.quote.paid).toBe(p.quote.total);
    expect(mailsTo("sara@acme.sa").at(-1)).toContain(LEAD);
    expect((await upload("/api/portal/upload", "files", "late.pdf", PDF, "application/pdf")).status).toBe(409);

    // The timeline tells the story, and the tracking page shows the same stage.
    const notes = p.history.map((h: any) => h.note).filter(Boolean).join("\n");
    for (const s of ["طلبتَ اجتماعاً", "حددنا موعد الاجتماع", "عقدنا اجتماع", "طلبتَ خصم", "وافقتَ على العرض", "أصدرنا العقد", "استلمنا نسخة العقد", "بدأنا مرحلة «الأعمال الميدانية»", "أنجزنا مرحلة «التقرير النهائي»", "اكتملت الأعمال"]) {
      expect(notes).toContain(s);
    }
    const tr = await (await handleTrack(new Request(`https://selorin.co/api/track?id=${LEAD}&email=SARA@acme.sa`), env)).json() as any;
    expect(tr.request).toMatchObject({ stage: 7, portal: true });
  });

  it("times the team's steps and alerts once before and once after the deadline", async () => {
    const due = (db.prepare("SELECT quote_due_at FROM leads").get() as { quote_due_at: string }).quote_due_at;
    const at = (minutes: number) => new Date(fromDb(due).getTime() + minutes * 60_000);
    expect(await runSlaCron(env, at(-90))).toEqual({ open: 1, sent: 0 });
    expect(await runSlaCron(env, at(-20))).toEqual({ open: 1, sent: 1 });
    expect(await runSlaCron(env, at(-10))).toEqual({ open: 1, sent: 0 });
    expect(await runSlaCron(env, at(5))).toEqual({ open: 1, sent: 1 });
    expect(await runSlaCron(env, at(60))).toEqual({ open: 1, sent: 0 });
    for (const to of ["sales@selorin.co", "boss@selorin.co"]) {
      expect(mailsTo(to).filter((m) => m.includes(`[Due in 30 minutes] ${LEAD}`))).toHaveLength(1);
      expect(mailsTo(to).filter((m) => m.includes(`[Overdue] ${LEAD}`))).toHaveLength(1);
    }
    // The client sees the expected time, and nothing changes for them once it passes.
    expect((await view()).timer).toEqual({ kind: "proposal", dueAt: due });
    await sendQuote();
    expect((await openTasks(env)).length).toBe(0);
  });

  it("e-mails the portal link again at most once an hour, only to the request's address", async () => {
    const resend = (email: string) => handlePortal(new Request("https://selorin.co/api/portal/resend", { method: "POST", body: JSON.stringify({ id: LEAD, email }) }), env, "/api/portal/resend");
    for (const email of ["sara@acme.sa", "SARA@acme.sa", "other@x.sa"]) expect(((await (await resend(email)).json()) as any).ok).toBe(true);
    expect(mailsTo("sara@acme.sa")).toHaveLength(1);
    expect(mailsTo("sara@acme.sa")[0]).toContain(`https://selorin.co/ar/portal/?t=${T}`);
    expect(mailsTo("other@x.sa")).toHaveLength(0);
  });

  it("lets staff start the work before the signed copy, and adds documents to the request", async () => {
    await sendQuote({ final: "1" });
    await portal("/api/portal/accept", { t: T });
    await portal("/api/portal/contract", { t: T, legalName: "Acme", signatoryName: "Sara Harbi", signatoryTitle: "CEO", signatoryPhone: "0551234567", signatoryEmail: "sara@acme.sa", agree: true });
    const q = "SEL-2026-000123-Q1";
    expect((await adminPost("/api/admin/contract", { quoteId: q })).status).toBe(409); // not issued yet
    const adv = msRows().find((m) => m.trigger === "acceptance");
    await adminPost("/api/admin/milestone", { id: adv.id, action: "paid", reference: "x" });
    expect((await adminPost("/api/admin/contract", { quoteId: q })).status).toBe(200);
    const p = await view();
    expect(p).toMatchObject({ next: "in_progress", contract: { status: "issued", started: true } });
    expect(p.work[0].state).toBe("active");
    const doc = await admin(`/api/admin/contract-doc?quote=${q}`);
    expect(doc.headers.get("content-type")).toContain("text/html");
    expect(await doc.text()).toContain("Sara Harbi");

    const f = new FormData();
    f.set("t", T);
    f.set("note", "مخطط الموقع المحدث");
    f.append("files", new File([PDF], "plan.pdf", { type: "application/pdf" }));
    expect((await portal("/api/portal/upload", f)).status).toBe(200);
    expect(mails.some((m) => m.includes(`[Documents added] ${LEAD}`) && m.includes("attachments=plan.pdf"))).toBe(true);
    expect((await view()).history.at(-1).note).toContain("plan.pdf");
  });

  it("refuses the client's actions on a closed request and on unknown links", async () => {
    await sendQuote();
    db.prepare("UPDATE leads SET status = 'closed'").run();
    expect((await portal("/api/portal/accept", { t: T })).status).toBe(409);
    expect((await view()).next).toBe("closed");
    expect((await portal("/api/portal/accept", { t: "x".repeat(32) })).status).toBe(404);
    expect((await portal(`/api/portal/contract?t=${T}`)).status).toBe(404); // nothing approved
  });

  it("validates the signature and stamp files", async () => {
    const f = new FormData();
    f.append("signature", new File([PDF], "sig.pdf", { type: "application/pdf" }));
    const res = await admin("/api/admin/settings", { method: "POST", body: f });
    expect(res.status).toBe(422);
    expect(((await res.json()) as any).error).toBe("signature_file");
    const s = (await (await admin("/api/admin/settings")).json()) as any;
    expect(s).toMatchObject({ signature: null, stamp: null, drive: { configured: false }, payments: "off", slaHours: 3 });
  });
});

// ---------------------------------------------------------------- the form opens the portal

describe("submitting a request", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  async function submit(db: DatabaseSync) {
    const mails: string[] = [];
    vi.spyOn(console, "log").mockImplementation((m: string) => { if (String(m).startsWith("[dry-run email]")) mails.push(String(m)); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const f = new FormData();
    const fields: Record<string, string> = {
      kind: "request", lang: "ar", service: "environmental-permitting", industry: "industrial-manufacturing", location: "الجبيل", facilityType: "factory",
      projectStatus: "planning", permitType: "operation", permitStatus: "none", description: "تصريح تشغيل لمصنع جديد", company: "Acme", contactName: "سارة",
      email: "sara@acme.sa", phone: "+966551234567", preferredContact: "email", consent: "yes", startedAt: String(Date.now() - 60_000),
    };
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    const pending: Promise<unknown>[] = [];
    const env = { DB: d1(db), EMAIL_DRY_RUN: "true", SEND_CONFIRMATION: "true", SITE_URL: "https://selorin.co" };
    const res = await handleRequestPost(new Request("https://selorin.co/api/request", { method: "POST", body: f, headers: { origin: "https://selorin.co", accept: "application/json" } }), env, (p) => pending.push(p));
    await Promise.all(pending);
    return { res: (await res.json()) as any, mails };
  }

  it("creates the portal link and the proposal timer, and e-mails the link", async () => {
    const db = freshDb();
    const { res, mails } = await submit(db);
    expect(res.ok).toBe(true);
    const lead = db.prepare("SELECT portal_token, quote_due_at, submitted_at FROM leads").get() as any;
    expect(lead.portal_token).toMatch(/^[A-Za-z0-9_-]{24,64}$/);
    expect(fromDb(lead.quote_due_at).getTime() - Date.now()).toBeGreaterThan(2.9 * 3600_000);
    expect(mails.find((m) => m.startsWith("[dry-run email] to=sara@acme.sa "))).toContain(`https://selorin.co/ar/portal/?t=${lead.portal_token}`);
  });

  it("still records the request on a database without the portal migration", async () => {
    const db = new DatabaseSync(":memory:");
    for (const f of readdirSync("migrations").sort().filter((x) => x < "0007")) db.exec(readFileSync(`migrations/${f}`, "utf8"));
    const { res, mails } = await submit(db);
    expect(res.ok).toBe(true);
    expect(db.prepare("SELECT COUNT(*) AS n FROM leads").get()).toEqual({ n: 1 });
    const confirmation = mails.find((m) => m.startsWith("[dry-run email] to=sara@acme.sa "))!;
    expect(confirmation).toBeTruthy();
    expect(confirmation).not.toContain("/portal/");
  });
});
