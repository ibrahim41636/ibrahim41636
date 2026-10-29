// QA for campaign posts (src/content/social/*.json) before they are rendered and published.
//   node scripts/validate-social.mjs            → checks every post
//   node scripts/validate-social.mjs <file>…    → checks the given files
// Checks: required fields, date/slot format, links to existing pages, sources for every post,
// X length, image fields per template (lengths that fit the design), banned hype wording.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/social";
const files = process.argv.slice(2).length ? process.argv.slice(2) : (existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => join(DIR, f)) : []);
const services = new Set(readdirSync("src/content/services").map((f) => f.replace(/\.json$/, "")));
// Equipment brands of the agencies and the acronym of the exclusive agent in KSA: never in Selorin content.
const AGENT_BRANDS = /\bCEMS\b|cemsplus|\b(DXG|Sabio|Nutech|CADABCO|ZWIN|Microvac)\b/i;
const BANNED = /\b(leading|world-class|best-in-class|number one|unmatched|cutting-edge|one-stop|passionate)\b|الأفضل|الرائدة|الرائد|الأول من نوعه|لا مثيل|!/i;

// [field, max length] per image template; arrays are checked item by item.
const IMAGE = {
  tip: { title: 80, text: 240 },
  myth: { myth: 130, fact: 280 },
  checklist: { title: 80, items: 95, kicker: 24 },
  faq: { q: 120, a: 400 },
  event: { date: 30, title: 80, text: 240 },
  stat: { value: 9, label: 90, context: 220, source: 60 },
  cover: { title: 90, category: 30, photo: 80 },
  takeaway: { text: 260, title: 90 },
};

// X counts URLs as 23 and most scripts as 1 (see src/lib/social.ts).
const xLength = (t) => [...t.replace(/https?:\/\/\S+/g, "")].length + (t.match(/https?:\/\/\S+/g) ?? []).length * 23;

const pageExists = (path) => {
  const clean = path.split(/[?#]/)[0].replace(/\/$/, "");
  const m = clean.match(/^(\/ar)?\/services\/([^/]+)$/);
  if (m) return services.has(m[2]) || existsSync(`src/content/services/${m[2]}.json`);
  return true; // other site paths are checked by the build
};

let bad = 0;
for (const f of files) {
  const errs = [];
  let p;
  try { p = JSON.parse(readFileSync(f, "utf8")); } catch (e) { errs.push(`invalid JSON: ${e.message}`); }
  if (p) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "")) errs.push("date must be YYYY-MM-DD");
    if (p.slot !== undefined && !(Number.isInteger(p.slot) && p.slot >= 0 && p.slot <= 5)) errs.push("slot must be 0–5");
    if (!p.pillar) errs.push("pillar missing");
    if (!["awareness", "consideration", "conversion"].includes(p.stage)) errs.push("stage must be awareness | consideration | conversion");
    if (!Array.isArray(p.sources) || !p.sources.length) errs.push("sources: list where each fact comes from (at least the service page)");
    if (!p.ar) errs.push("ar version missing");
    for (const lang of ["ar", "en"]) {
      const v = p[lang];
      if (!v) continue;
      if (!v.text || v.text.length < 20) errs.push(`${lang}.text too short`);
      if ((v.text ?? "").length > 2900) errs.push(`${lang}.text over 2900 characters`);
      if (BANNED.test(v.text ?? "") || BANNED.test(v.x ?? "") || BANNED.test(JSON.stringify(v.image ?? {}))) errs.push(`${lang}: banned hype wording or exclamation mark`);
      if (AGENT_BRANDS.test(JSON.stringify(v))) errs.push(`${lang}: names an equipment manufacturer or agent (or the acronym CEMS); write the device type in full`);
      if (v.x && xLength(v.x) > 255) errs.push(`${lang}.x is ${xLength(v.x)} characters (max 255 before the link)`);
      if (v.link && (!/^\/[^\s]*$/.test(v.link) || !pageExists(v.link))) errs.push(`${lang}.link "${v.link}" is not an existing site path`);
      if (v.link && lang === "ar" && !v.link.startsWith("/ar/")) errs.push("ar.link should point to the Arabic page (/ar/…)");
      if (v.image) {
        const spec = IMAGE[v.image.template];
        if (!spec) errs.push(`${lang}.image.template "${v.image.template}" unknown`);
        else for (const [k, max] of Object.entries(spec)) {
          const val = v.image[k];
          if (val === undefined) { if (!["kicker", "source", "photo", "category"].includes(k)) errs.push(`${lang}.image.${k} missing`); continue; }
          for (const item of Array.isArray(val) ? val : [val]) if ([...String(item)].length > max) errs.push(`${lang}.image.${k} longer than ${max}: "${String(item).slice(0, 40)}…"`);
          if (k === "items" && (val.length < 3 || val.length > 6)) errs.push(`${lang}.image.items needs 3–6 entries`);
          if (k === "photo" && !existsSync(`public${val}`)) errs.push(`${lang}.image.photo ${val} not found in public/`);
        }
      }
    }
  }
  if (errs.length) { bad++; console.log(`✗ ${f}\n  - ${errs.join("\n  - ")}`); }
  else console.log(`✓ ${f}`);
}
if (!files.length) console.log("No campaign posts yet.");
process.exit(bad ? 1 : 0);
