import { describe, expect, it } from "vitest";
import { LEAD_ID, isStatus, safeEqual, statusEmail } from "../src/lib/tracking";
import { handleTrack } from "../functions/api/track";
import { handleAdmin } from "../functions/api/admin";

// Minimal in-memory stand-in for the D1 queries the tracking endpoints run.
function fakeDb() {
  const leads = [{
    lead_id: "SEL-2026-000123", kind: "request", service: "environmental-permitting", company: "Acme", contact_name: "Sara",
    email: "Sara@Acme.sa", phone: "+966501234567", location: "Jubail", urgent: 0, submitted_at: "2026-10-12 09:00:00",
    status: "received", status_updated_at: null as string | null, payload: JSON.stringify({ lang: "ar", service: { name: "التصريح البيئي" } }),
  }];
  const events: { lead_id: string; status: string; note: string | null; at: string }[] = [
    { lead_id: "SEL-2026-000123", status: "received", note: null, at: "2026-10-12 09:00:00" },
  ];
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    first: async () => {
      if (sql.includes("FROM leads WHERE lead_id = ?1 AND lower(email)")) return leads.find((l) => l.lead_id === args[0] && l.email.toLowerCase() === args[1]) ?? null;
      if (sql.includes("FROM leads WHERE lead_id = ?1")) return leads.find((l) => l.lead_id === args[0]) ?? null;
      return null;
    },
    all: async () => {
      if (sql.includes("FROM lead_events")) return { results: events.filter((e) => e.lead_id === args[0]) };
      if (sql.includes("FROM leads")) return { results: leads };
      return { results: [] };
    },
    run: async () => {
      if (sql.startsWith("UPDATE leads")) { const l = leads.find((x) => x.lead_id === args[1])!; l.status = args[0] as string; l.status_updated_at = "now"; }
      if (sql.startsWith("INSERT INTO lead_events")) events.push({ lead_id: args[0] as string, status: args[1] as string, note: args[2] as string | null, at: "now" });
      return {};
    },
  });
  return { prepare: (sql: string) => stmt(sql), batch: async (list: { run: () => Promise<unknown> }[]) => { for (const s of list) await s.run(); return []; }, leads, events };
}

const env = (db = fakeDb()) => ({ DB: db as never, ADMIN_TOKEN: "s3cret-token", EMAIL_DRY_RUN: "true" });

describe("tracking helpers", () => {
  it("validates statuses and IDs", () => {
    expect(isStatus("quoted")).toBe(true);
    expect(isStatus("deleted")).toBe(false);
    expect(LEAD_ID.test("SEL-2026-000123")).toBe(true);
    expect(LEAD_ID.test("SEL-26-1")).toBe(false);
  });
  it("compares tokens safely", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("", "")).toBe(false);
  });
  it("writes the status e-mail in the client's language", () => {
    const ar = statusEmail({ lang: "ar", name: "سارة", leadId: "SEL-2026-000123", status: "quoted", note: "أرسلنا العرض", trackUrl: "https://selorin.co/ar/track/?id=SEL-2026-000123" });
    expect(ar.subject).toContain("تم إرسال العرض");
    expect(ar.text).toContain("أرسلنا العرض");
    expect(statusEmail({ lang: "en", name: "Sara", leadId: "X", status: "completed", trackUrl: "u" }).subject).toContain("Completed");
  });
});

describe("GET /api/track", () => {
  const url = (q: string) => new Request(`https://selorin.co/api/track?${q}`);
  it("returns the request when ID and e-mail match (case-insensitive)", async () => {
    const res = await handleTrack(url("id=sel-2026-000123&email=sara@acme.SA"), env());
    expect(res.status).toBe(200);
    const body = await res.json() as { request: { status: string; service: string; history: unknown[] } };
    expect(body.request.status).toBe("received");
    expect(body.request.service).toBe("التصريح البيئي");
    expect(body.request.history).toHaveLength(1);
  });
  it("does not reveal requests for a different e-mail", async () => {
    expect((await handleTrack(url("id=SEL-2026-000123&email=other@x.sa"), env())).status).toBe(404);
  });
  it("rejects malformed input and reports a missing database", async () => {
    expect((await handleTrack(url("id=123&email=a@b.c"), env())).status).toBe(400);
    expect((await handleTrack(url("id=SEL-2026-000123&email=a@b.c"), {})).status).toBe(503);
  });
});

describe("admin API", () => {
  const req = (path: string, init: RequestInit = {}, token = "s3cret-token") =>
    new Request(`https://selorin.co${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });

  it("rejects a wrong token", async () => {
    expect((await handleAdmin(req("/api/admin/leads", {}, "nope"), env(), "/api/admin/leads")).status).toBe(401);
  });
  it("lists requests", async () => {
    const res = await handleAdmin(req("/api/admin/leads"), env(), "/api/admin/leads");
    expect(res.status).toBe(200);
    expect(((await res.json()) as { leads: unknown[] }).leads).toHaveLength(1);
  });
  it("updates the status, records the timeline and notifies the client", async () => {
    const db = fakeDb();
    const res = await handleAdmin(req("/api/admin/status", { method: "POST", body: JSON.stringify({ leadId: "SEL-2026-000123", status: "quoted", note: "Proposal sent", notify: true }) }), env(db), "/api/admin/status");
    expect(res.status).toBe(200);
    expect(((await res.json()) as { notified: boolean }).notified).toBe(true);
    expect(db.leads[0].status).toBe("quoted");
    expect(db.events.at(-1)).toMatchObject({ status: "quoted", note: "Proposal sent" });
  });
  it("rejects unknown statuses", async () => {
    const res = await handleAdmin(req("/api/admin/status", { method: "POST", body: JSON.stringify({ leadId: "SEL-2026-000123", status: "deleted" }) }), env(), "/api/admin/status");
    expect(res.status).toBe(422);
  });
});
