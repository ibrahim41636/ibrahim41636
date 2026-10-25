// Renders Selorin-branded social images with headless Chromium (playwright-core).
//   npm run build && npm run social:images            → render any missing images
//   npm run social:images -- --force                   → re-render everything
//   npm run social:images -- --only dust-monitoring    → one article or campaign post
//   npm run social:images -- --profiles               → also the profile covers and avatar
// Inputs:  dist/social-feed.json (articles, from the build) and src/content/social/*.json (campaign posts).
// Outputs: public/social/{lang}/{slug}/{launch,takeaway,faq}.jpg · public/social/og/{lang}/{slug}.jpg
//          public/social/campaign/{id}-{lang}.jpg
// The feed and the article pages pick these files up on the next build.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { TEMPLATES } from "./templates.mjs";

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

const CATEGORY = {
  "regulatory-updates": { en: "Regulatory Updates", ar: "المستجدات التنظيمية" },
  "environmental-compliance": { en: "Environmental Compliance", ar: "الامتثال البيئي" },
  esg: { en: "ESG", ar: "الحوكمة البيئية والاجتماعية" },
  sustainability: { en: "Sustainability", ar: "الاستدامة" },
  "technical-articles": { en: "Technical Articles", ar: "مقالات فنية" },
  "industry-guides": { en: "Industry Guides", ar: "أدلة القطاعات" },
};

/** Local file URL for a site image (https://selorin.co/images/x.jpg → public/images/x.jpg). */
const localPhoto = (url) => {
  const path = resolve("public", new URL(url, "https://selorin.co").pathname.replace(/^\//, ""));
  return existsSync(path) ? pathToFileURL(path).href : pathToFileURL(resolve("public/images/og-default.jpg")).href;
};

const jobs = [];
const add = (out, template, lang, data, size) => {
  if (!force && existsSync(out)) return;
  jobs.push({ out, template, lang, data, size });
};

const feedPath = resolve("dist/social-feed.json");
if (!existsSync(feedPath)) { console.error("dist/social-feed.json not found — run `npm run build` first."); process.exit(1); }
const { articles } = JSON.parse(readFileSync(feedPath, "utf8"));
for (const a of articles) {
  if (only && a.slug !== only) continue;
  const dir = `public/social/${a.lang}/${a.slug}`;
  const category = CATEGORY[a.category]?.[a.lang] ?? a.category;
  const photo = localPhoto(a.image);
  add(`${dir}/launch.jpg`, "cover", a.lang, { title: a.title, category, photo });
  if (a.takeaways[0]) add(`${dir}/takeaway.jpg`, "takeaway", a.lang, { text: a.takeaways[0], title: a.title });
  if (a.faqs[0]) add(`${dir}/faq.jpg`, "faq", a.lang, { q: a.faqs[0].q, a: a.faqs[0].a });
  if (a.takeaways.length >= 3) add(`${dir}/checklist.jpg`, "checklist", a.lang, { title: a.title, items: a.takeaways, kicker: a.lang === "ar" ? "أهم النقاط" : "Key points" });
  add(`public/social/og/${a.lang}/${a.slug}.jpg`, "og", a.lang, { title: a.title, category, photo }, { width: 1200, height: 630 });
}

const campaignDir = "src/content/social";
if (existsSync(campaignDir)) {
  for (const f of readdirSync(campaignDir).filter((x) => x.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    if (only && id !== only) continue;
    const post = JSON.parse(readFileSync(join(campaignDir, f), "utf8"));
    for (const lang of ["ar", "en"]) {
      const img = post[lang]?.image;
      if (!img) continue;
      if (!TEMPLATES[img.template]) throw new Error(`${f}: unknown template "${img.template}"`);
      const data = { ...img, ...(img.photo ? { photo: localPhoto(img.photo) } : {}) };
      add(`public/social/campaign/${id}-${lang}.jpg`, img.template, lang, data);
    }
  }
}

// Profile images for every platform (uploaded by hand once): docs/marketing/brand-assets/.
if (argv.includes("--profiles")) {
  const out = "docs/marketing/brand-assets";
  const line = "تصاريح وامتثال · دراسات بيئية · رصد وقياس · استدامة · طاقة متجددة";
  const sizes = {
    "linkedin-cover-1128x191": [1128, 191, "end"], "x-header-1500x500": [1500, 500, "end"], "facebook-cover-1640x624": [1640, 624, "end"],
    "youtube-banner-2560x1440": [2560, 1440, "center"], "google-business-cover-1024x576": [1024, 576, "center"],
  };
  for (const [name, [width, height, align]] of Object.entries(sizes)) add(`${out}/${name}.png`, "banner", "ar", { width, height, line, align }, { width, height });
  add(`${out}/avatar-800.png`, "avatar", "ar", { size: 800 }, { width: 800, height: 800 });
}

if (!jobs.length) { console.log("All social images are up to date."); process.exit(0); }

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tmp = join(tmpdir(), `selorin-social-${process.pid}`);
mkdirSync(tmp, { recursive: true });
try {
  for (const [i, job] of jobs.entries()) {
    const size = job.size ?? { width: 1080, height: 1350 };
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    const html = join(tmp, `${i}.html`);
    writeFileSync(html, TEMPLATES[job.template](job.lang, job.data));
    await page.goto(pathToFileURL(html).href, { waitUntil: "load" });
    await page.evaluate(async () => { await document.fonts.ready; window.__fit(); });
    mkdirSync(dirname(job.out), { recursive: true });
    await page.screenshot(job.out.endsWith(".png") ? { path: job.out } : { path: job.out, type: "jpeg", quality: 80 });
    await page.close();
    console.log(`✓ ${job.out}`);
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`Rendered ${jobs.length} image(s).`);
