// Short vertical videos (1080×1920, ~16 s) for TikTok, YouTube Shorts and Instagram Reels, built from
// the branded cards that render.mjs already produced, with a closing call-to-action frame.
//   npm run build && npm run social:images && npm run social:videos
//   npm run social:videos -- --force | --only <slug-or-campaign-id> | --langs ar,en
// Outputs: public/social/video/{lang}/{slug}.mp4 (articles)
//          public/social/video/campaign/{id}-{lang}.mp4 (campaign posts with "video": true)
// Needs ffmpeg (libx264) on the PATH.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { story, endcard } from "./templates.mjs";

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const langs = (argv.includes("--langs") ? argv[argv.indexOf("--langs") + 1] : "ar").split(",");

const SLIDE = 3.6; // seconds per frame
const FADE = 0.5;

const feedPath = resolve("dist/social-feed.json");
if (!existsSync(feedPath)) { console.error("dist/social-feed.json not found — run `npm run build` first."); process.exit(1); }
const { articles } = JSON.parse(readFileSync(feedPath, "utf8"));

/** Videos to make: output path, the card images in order, and the closing line. */
const jobs = [];
for (const a of articles) {
  if (!langs.includes(a.lang) || (only && a.slug !== only)) continue;
  const dir = `public/social/${a.lang}/${a.slug}`;
  const cards = ["launch", "takeaway", "checklist", "faq"].map((k) => `${dir}/${k}.jpg`).filter(existsSync);
  if (cards.length < 2) continue;
  const out = `public/social/video/${a.lang}/${a.slug}.mp4`;
  if (force || !existsSync(out)) jobs.push({ out, lang: a.lang, cards, line: a.lang === "ar" ? "اقرأ الدليل كاملًا واطلب استشارة" : "Read the full guide and request a consultation" });
}
const campaignDir = "src/content/social";
if (existsSync(campaignDir)) {
  for (const f of readdirSync(campaignDir).filter((x) => x.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    if (only && id !== only) continue;
    const post = JSON.parse(readFileSync(join(campaignDir, f), "utf8"));
    for (const lang of langs) {
      const v = post[lang];
      const card = `public/social/campaign/${id}-${lang}.jpg`;
      if (!v?.video || !existsSync(card)) continue;
      const out = `public/social/video/campaign/${id}-${lang}.mp4`;
      // One card: hold it for two slide lengths so there is time to read it.
      if (force || !existsSync(out)) jobs.push({ out, lang, cards: [card, card], line: v.title });
    }
  }
}
if (!jobs.length) { console.log("All social videos are up to date."); process.exit(0); }

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tmp = join(tmpdir(), `selorin-video-${process.pid}`);
mkdirSync(tmp, { recursive: true });

async function frame(html, path) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const file = `${path}.html`;
  writeFileSync(file, html);
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await page.evaluate(async () => { await document.fonts.ready; window.__fit(); });
  await page.screenshot({ path, type: "png" });
  await page.close();
}

try {
  for (const [j, job] of jobs.entries()) {
    const frames = [];
    const steps = job.cards.length + 1;
    for (const [i, card] of job.cards.entries()) {
      const p = join(tmp, `${j}-${i}.png`);
      await frame(story(job.lang, { card: pathToFileURL(resolve(card)).href, step: i, steps }), p);
      frames.push(p);
    }
    const end = join(tmp, `${j}-end.png`);
    await frame(endcard(job.lang, { line: job.line }), end);
    frames.push(end);

    // Cross-fade the frames, add a silent audio track (some apps expect one), H.264 for every platform.
    const total = frames.length * SLIDE - (frames.length - 1) * FADE;
    const inputs = frames.flatMap((f) => ["-loop", "1", "-t", String(SLIDE), "-framerate", "30", "-i", f]);
    let chain = "";
    let last = "[0:v]";
    for (let i = 1; i < frames.length; i++) {
      const outLabel = i === frames.length - 1 ? "[v]" : `[x${i}]`;
      chain += `${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${(i * (SLIDE - FADE)).toFixed(2)}${outLabel};`;
      last = outLabel;
    }
    mkdirSync(dirname(job.out), { recursive: true });
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", ...inputs,
      "-f", "lavfi", "-t", total.toFixed(2), "-i", "anullsrc=r=44100:cl=stereo",
      "-filter_complex", chain.replace(/;$/, ""), "-map", "[v]", "-map", `${frames.length}:a`,
      "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p", "-r", "30",
      "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", "-shortest", job.out,
    ]);
    console.log(`✓ ${job.out} (${total.toFixed(1)} s)`);
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`Rendered ${jobs.length} video(s).`);
