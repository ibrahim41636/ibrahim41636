// Quick shape check for content files, usable before `astro sync` (which needs every reference to exist).
// Usage: node scripts/validate-content.mjs services|industries [file ...]
import { readFileSync, readdirSync } from "node:fs";
import { z } from "zod";

const SERVICES = "environmental-permitting environmental-compliance environmental-records environmental-audits environmental-due-diligence environmental-impact-assessment environmental-management-plans environmental-monitoring air-quality-monitoring dust-monitoring fuel-station-voc-monitoring noise-monitoring water-quality-monitoring waste-management circular-economy esg-advisory ghg-carbon-accounting net-zero-advisory sustainability-advisory life-cycle-assessment sustainable-buildings green-building-advisory".split(" ");
const INDUSTRIES = "industrial-manufacturing construction real-estate infrastructure energy oil-gas logistics-warehousing food-beverage healthcare hospitality mining-quarrying waste-recycling government-public-sector commercial-facilities".split(" ");
const titled = z.object({ title: z.string().min(2), description: z.string().min(10) }).strict();
const faq = z.object({ q: z.string().min(5), a: z.string().min(30) }).strict();
const svcLoc = z.object({
  name: z.string(), seoTitle: z.string().max(70), metaDescription: z.string().min(80).max(170), valueProp: z.string(),
  cardDescription: z.string(), keyBenefit: z.string(), definition: z.string().min(150), overview: z.array(z.string()).min(3),
  whenYouNeed: z.array(z.string()).min(6), deliver: z.array(titled).min(6), approach: z.array(titled).min(5).max(6),
  deliverables: z.array(z.object({ item: z.string(), format: z.string(), timing: z.string() }).strict()).min(5).max(7),
  regulatoryContext: z.array(z.string()).min(3).max(5), faqs: z.array(faq).min(5),
}).strict();
const service = z.object({
  category: z.enum(["permitting-compliance","environmental-studies","monitoring-measurement","waste-circular-economy","sustainability-climate","sustainable-buildings"]),
  order: z.number(), formFamily: z.enum(["permitting","studies","monitoring","waste","sustainability","buildings"]),
  industries: z.array(z.enum(INDUSTRIES)).min(3), related: z.array(z.enum(SERVICES)).min(2).max(4), en: svcLoc, ar: svcLoc,
}).strict();
const indLoc = z.object({
  name: z.string(), seoTitle: z.string().max(70), metaDescription: z.string().min(80).max(170), cardDescription: z.string(),
  overview: z.array(z.string()).min(2), challenges: z.array(titled).min(5), requirements: z.array(z.string()).min(5),
  support: z.array(titled).min(4), faqs: z.array(faq).min(3),
}).strict();
const industry = z.object({ order: z.number(), services: z.array(z.enum(SERVICES)).min(4), en: indLoc, ar: indLoc }).strict();

const [kind, ...files] = process.argv.slice(2);
const schema = { services: service, industries: industry }[kind];
const dir = `src/content/${kind}`;
const list = files.length ? files : readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => `${dir}/${f}`);
let bad = 0;
for (const f of list) {
  const r = schema.safeParse(JSON.parse(readFileSync(f, "utf8")));
  const banned = /\b(leading|world-class|best-in-class|number one|unmatched|cutting-edge|one-stop)\b/i.test(readFileSync(f, "utf8"));
  if (!r.success || banned) { bad++; console.log(`✗ ${f}`); if (!r.success) console.log(z.prettifyError(r.error)); if (banned) console.log("  contains banned hype wording"); }
  else console.log(`✓ ${f}`);
}
process.exit(bad ? 1 : 0);
