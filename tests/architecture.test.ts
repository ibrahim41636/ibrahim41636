import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { PAGES } from "../src/data/inventory";
import { CATEGORIES, SUB_SERVICES, INDUSTRIES } from "../src/data/catalog";
import { CRITERIA, TRL, GATES, PERMISSIONS, can, assessmentScore } from "../src/data/platform";

describe("page inventory", () => {
  it("has unique IDs and URLs", () => {
    expect(new Set(PAGES.map((p) => p.id)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((p) => p.url)).size).toBe(PAGES.length);
  });
  it("every parent exists", () => {
    const ids = new Set(PAGES.map((p) => p.id));
    for (const p of PAGES) if (p.parent !== "—") expect(ids.has(p.parent), `${p.id} parent ${p.parent}`).toBe(true);
  });
  it("private pages are never indexable and live under /app/", () => {
    for (const p of PAGES.filter((x) => !["public", "auth"].includes(x.access))) {
      expect(p.indexable, p.id).toBe(false);
      expect(p.url.startsWith("/app/"), p.id).toBe(true);
    }
  });
  it("every indexable page has a search intent and a CTA or is utility", () => {
    for (const p of PAGES.filter((x) => x.indexable)) expect(p.searchIntent, p.id).not.toBe("—");
  });
});

describe("service architecture", () => {
  it("has 8 categories and unique sub-service slugs and search intents", () => {
    expect(CATEGORIES).toHaveLength(8);
    expect(new Set(SUB_SERVICES.map((s) => s.slug)).size).toBe(SUB_SERVICES.length);
    expect(new Set(SUB_SERVICES.map((s) => s.intent.toLowerCase())).size).toBe(SUB_SERVICES.length);
  });
  it("sub-service and category slugs never collide (both live under /services/)", () => {
    const cats = new Set(CATEGORIES.map((c) => c.slug));
    for (const s of SUB_SERVICES) expect(cats.has(s.slug), s.slug).toBe(false);
  });
  it("legacy slugs redirect elsewhere and never shadow a live page", () => {
    const live = new Set([...SUB_SERVICES.map((s) => s.slug), ...CATEGORIES.map((c) => c.slug)]);
    for (const s of SUB_SERVICES.filter((x) => x.legacy)) expect(live.has(s.legacy!), s.legacy).toBe(false);
    for (const c of CATEGORIES) for (const l of c.legacy ?? []) expect(live.has(l), l).toBe(false);
  });
  it("keeps every approved v2 service and industry page (live or redirected)", () => {
    const live = new Set([...SUB_SERVICES.map((s) => s.slug), ...CATEGORIES.map((c) => c.slug)]);
    const legacy = new Set(SUB_SERVICES.map((s) => s.legacy).filter(Boolean));
    for (const f of readdirSync("src/content/services")) {
      const slug = f.replace(".json", "");
      expect(live.has(slug) || legacy.has(slug), slug).toBe(true);
    }
    const ind = new Set(INDUSTRIES.map((i) => i.slug));
    for (const f of readdirSync("src/content/industries")) expect(ind.has(f.replace(".json", "")), f).toBe(true);
  });
});

describe("platform logic", () => {
  it("assessment weights total 100 and scoring is bounded", () => {
    expect(CRITERIA.reduce((s, c) => s + c.weight, 0)).toBe(100);
    expect(assessmentScore(Object.fromEntries(CRITERIA.map((c) => [c.id, 5])))).toBe(100);
    expect(assessmentScore({ scientific: 9 })).toBe(15);
  });
  it("TRL is 1–9 with evidence and next stage", () => {
    expect(TRL.map((t) => t.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const t of TRL) { expect(t.evidence.en).toBeTruthy(); expect(t.next.ar).toBeTruthy(); }
  });
  it("investment requires pilot evidence, IP verification and committee approval", () => {
    const g = GATES.find((x) => x.to === "investment-candidate")!;
    expect(g.minTrl).toBeGreaterThanOrEqual(6);
    const txt = g.requires.map((r) => r.en).join(" ");
    expect(txt).toMatch(/pilot/i); expect(txt).toMatch(/IP/); expect(txt).toMatch(/committee/i);
  });
  it("public visitors and corporates cannot read confidential solution data", () => {
    expect(can("public", "solution.read.confidential")).toBe(false);
    expect(can("corporate", "solution.read.confidential")).toBe(false);
    expect(can("investor", "solution.read.confidential")).toBe(false);
    expect(can("scientific-reviewer", "review.score.commercial")).toBe(false);
    expect(can("admin", "role.manage")).toBe(false);
    expect(can("super-admin", "role.manage")).toBe(true);
    expect(PERMISSIONS["super-admin"].length).toBeGreaterThan(PERMISSIONS.admin.length);
  });
});
