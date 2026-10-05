// Minimal static-site build: assembles src/pages/*.html with shared partials into dist/.
// Usage: node build.mjs            (one-off build)
//        node build.mjs --watch    (rebuild on change)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, watch } from "node:fs";
import { join } from "node:path";

const SRC = "src";
const OUT = "dist";
const config = JSON.parse(readFileSync("site.config.json", "utf8"));
const partial = (name) => readFileSync(join(SRC, "partials", `${name}.html`), "utf8");

function fill(html, vars) {
  return html.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? vars[key] : m));
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });

  const layout = partial("layout");
  const pages = readdirSync(join(SRC, "pages")).filter((f) => f.endsWith(".html"));
  const searchIndex = [];

  for (const file of pages) {
    const raw = readFileSync(join(SRC, "pages", file), "utf8");
    const match = raw.match(/^<!--\s*meta\s*(\{[\s\S]*?\})\s*-->\s*/);
    if (!match) throw new Error(`${file}: missing <!-- meta {...} --> block`);
    const meta = JSON.parse(match[1]);
    const body = raw.slice(match[0].length);

    let header = partial("header").replace(/\{\{active:(\w+)\}\}/g, (_, key) => (key === meta.nav ? "is-active" : ""));
    const vars = {
      ...config,
      title: meta.title,
      description: meta.description,
      canonical: `${config.siteUrl}/${file === "index.html" ? "" : file}`,
      ogImage: `${config.siteUrl}/assets/img/${meta.image || "landscape-logo.jpg"}`,
      bodyClass: meta.bodyClass || "",
      sprite: partial("sprite"),
      header,
      footer: partial("footer"),
      content: body,
    };
    // Two passes so placeholders inside partials (phone, email…) are resolved too.
    const html = fill(fill(layout, vars), vars);
    writeFileSync(join(OUT, file), html);
    searchIndex.push({ url: file, title: meta.title.split("|")[0].trim(), keywords: meta.keywords || "", description: meta.description });
  }

  writeFileSync(join(OUT, "assets", "js", "search-index.json"), JSON.stringify(searchIndex));
  writeFileSync(join(OUT, "assets", "js", "config.js"), `window.SELORIN = ${JSON.stringify({ formEndpoint: config.formEndpoint, email: config.email, whatsapp: config.whatsapp })};\n`);
  const urls = pages.map((p) => `  <url><loc>${config.siteUrl}/${p === "index.html" ? "" : p}</loc></url>`).join("\n");
  writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
  console.log(`Built ${pages.length} pages → ${OUT}/`);
}

build();
if (process.argv.includes("--watch")) {
  let t;
  watch(SRC, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { try { build(); } catch (e) { console.error(e.message); } }, 120); });
  console.log("Watching src/ …");
}
