// Exports the page inventory to docs/page-inventory.csv and docs/page-inventory.md
import { writeFileSync } from "node:fs";
import { PAGES, summary } from "../src/data/inventory";
import { SUB_SERVICES, CATEGORIES, MERGES } from "../src/data/catalog";

const cols = ["id", "name", "url", "type", "user", "purpose", "searchIntent", "objective", "parent", "cta", "priority", "phase", "access", "indexable"] as const;
const csvCell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
writeFileSync("docs/page-inventory.csv", [cols.join(","), ...PAGES.map((p) => cols.map((c) => csvCell(p[c])).join(","))].join("\n") + "\n");

const s = summary();
const md: string[] = [
  "# Page inventory",
  "",
  "Generated from `src/data/inventory.ts` (`npm run inventory`). One row per page template/route in English; every public page is mirrored in Arabic under `/ar/`. Private platform pages (`/app/...`) are bilingual via the UI language switch.",
  "",
  `**TOTAL NUMBER OF PAGES: ${s.total}** (indexable public pages: ${s.indexable})`,
  "",
  "| Category | Pages |",
  "|---|---|",
  ...Object.entries(s.byGroup).map(([k, v]) => `| ${k} | ${v} |`),
  `| **Total** | **${s.total}** |`,
  "",
  "| Phase | Pages |",
  "|---|---|",
  ...Object.entries(s.byPhase).sort().map(([k, v]) => `| ${k} | ${v} |`),
  "",
  "| Priority | Pages |",
  "|---|---|",
  ...Object.entries(s.byPriority).sort().map(([k, v]) => `| ${k} | ${v} |`),
  "",
  "## Service architecture",
  "",
  "| Category | Sub-services |",
  "|---|---|",
  ...CATEGORIES.map((c) => `| ${c.name.en} (\`/services/${c.slug}/\`) | ${SUB_SERVICES.filter((x) => x.category === c.slug).length} |`),
  `| **Total sub-services** | **${SUB_SERVICES.length}** |`,
  "",
  "Requested items merged because they share a search intent:",
  "",
  ...MERGES.map((m) => `- **${m.requested}** → ${m.into}: ${m.reason}`),
  "",
  "## Full inventory",
  "",
  "| ID | Page | URL | Type | User | Purpose | Search intent | Business objective | Parent | CTA | Priority | Phase | Access |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...PAGES.map((p) => `| ${p.id} | ${p.name} | \`${p.url}\` | ${p.type} | ${p.user} | ${p.purpose} | ${p.searchIntent} | ${p.objective} | ${p.parent} | ${p.cta} | ${p.priority} | ${p.phase} | ${p.access} |`),
  "",
];
writeFileSync("docs/page-inventory.md", md.join("\n"));
console.log(JSON.stringify(s, null, 2));

// Roles × permissions matrix
import { ROLES, ROLE_LABELS, PERMISSIONS } from "../src/data/platform";
const allPerms = [...new Set(Object.values(PERMISSIONS).flat())].sort();
const short: Record<string, string> = { public: "Pub", researcher: "Res", university: "Uni", "technology-provider": "Tech", corporate: "Corp", investor: "Inv", "scientific-reviewer": "SciR", "technical-reviewer": "TecR", "commercial-reviewer": "ComR", "investment-committee": "IC", admin: "Adm", "super-admin": "SA" };
const roleMd = [
  "# Roles & permissions",
  "",
  "Generated from `src/data/platform.ts`. Enforced server-side on every request; per-record checks add ownership, assignment and NDA status (e.g. `opportunity.read.full` also requires a signed NDA for that opportunity).",
  "",
  ROLES.map((r) => `- **${short[r]}** = ${ROLE_LABELS[r].en} / ${ROLE_LABELS[r].ar}`).join("\n"),
  "",
  `| Permission | ${ROLES.map((r) => short[r]).join(" | ")} |`,
  `|---|${ROLES.map(() => ":-:").join("|")}|`,
  ...allPerms.map((p) => `| \`${p}\` | ${ROLES.map((r) => (PERMISSIONS[r].includes(p as never) ? "●" : "")).join(" | ")} |`),
  "",
];
writeFileSync("docs/roles-permissions.md", roleMd.join("\n"));

// Legacy (v2) → v3 redirects
const redirects = [
  ...SUB_SERVICES.filter((s) => s.legacy).map((s) => [`/services/${s.legacy}/`, `/services/${s.slug}/`]),
  ...CATEGORIES.flatMap((c) => (c.legacy ?? []).map((l) => [`/services/${l}/`, `/services/${c.slug}/`])),
  ["/insights/", "/knowledge/insights/"], ["/insights/:slug/", "/knowledge/insights/:slug/"], ["/insights/category/*", "/knowledge/"], ["/insights/authors/:slug/", "/knowledge/authors/:slug/"],
  ["/legal/privacy/", "/legal/privacy/"],
].filter(([a, b]) => a !== b);
writeFileSync("docs/redirects-v3.txt", redirects.flatMap(([a, b]) => [`${a} ${b} 301`, `/ar${a} /ar${b} 301`]).join("\n") + "\n");
