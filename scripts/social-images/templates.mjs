// Selorin social graphics: HTML templates rendered to JPEG by render.mjs (headless Chromium).
// Brand system from src/styles/global.css — forest green, mint accent, paper neutrals,
// IBM Plex Sans Arabic / Inter, the sun·water·land mark and the topographic contour lines.
// Every template is 1080×1350 (4:5, the feed format for Instagram, LinkedIn, Facebook and X)
// except og() which is 1200×630 for link previews and search.

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const font = (p) => pathToFileURL(resolve("node_modules", p)).href;

export const C = {
  paper: "#f7f6f2", paper2: "#efece5", sand: "#e6dfd3", ink: "#121614", ink2: "#2a302d", muted: "#5d625f",
  forest: "#0b3b2a", forest2: "#135139", deep: "#052a1e", mint: "#cdefd3", mint2: "#a6e6b0",
};

const L = {
  ar: {
    brand: "سيلورين للاستشارات والخدمات البيئية", takeaway: "خلاصة من دليل سيلورين", faq: "سؤال يتكرر من العملاء",
    cta: "تحتاج دعمًا في مشروعك؟ اطلب استشارة", read: "اقرأ الدليل كاملًا على الموقع", from: "من دليل:",
    myth: "خرافة", fact: "الحقيقة", checklist: "قائمة تحقق", source: "المصدر:", tip: "نصيحة عملية", swipe: "التفاصيل في الرابط",
  },
  en: {
    brand: "Environmental Advisory & Services", takeaway: "Key takeaway from a Selorin guide", faq: "A question clients ask us",
    cta: "Need support on your project? Request a consultation", read: "Read the full guide on our website", from: "From the guide:",
    myth: "Myth", fact: "Fact", checklist: "Checklist", source: "Source:", tip: "Practical tip", swipe: "Details at the link",
  },
};

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MARK = (color, size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" stroke="${color}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"><defs><clipPath id="m${size}"><circle cx="50" cy="50" r="43.5"/></clipPath></defs><circle cx="50" cy="50" r="45.5"/><g clip-path="url(#m${size})"><path d="M50 30V2M36 33 22 6M64 33 78 6M25 39 0 18M75 39 100 18"/><path d="M6 46c12 0 20-4 28-11 9-8 23-8 32 0 8 7 16 11 28 11"/><path d="M4 59c9-6 17-6 25 0s16 6 22-1 15-8 23 0 14 6 22 0"/><path d="M50 98C46 82 30 72 2 71M50 98c4-16 20-26 48-27"/><path d="M36 98C32 88 20 83 2 83M64 98c4-10 16-15 34-15"/></g></svg>`;

/** The brand's topographic line texture (same construction as src/components/Contours.astro). */
function contours(color, opacity, seed = 1, w = 1080, h = 1350) {
  const lines = [];
  for (let i = 0; i < 22; i++) {
    const y = 30 + i * (h / 20);
    const a = 26 + ((i * 37 * seed) % 30);
    const p = (i * 53 * seed) % 400;
    lines.push(`<path d="M-60 ${y} C ${w * 0.25 + p / 4} ${y - a}, ${w * 0.45 - p / 3} ${y + a * 1.6}, ${w * 0.6} ${y - a / 2} S ${w * 0.85 + p / 5} ${y + a}, ${w + 80} ${y - a / 3}"/>`);
  }
  return `<svg class="contours" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.4">${lines.join("")}</svg>`;
}

function page(lang, w, h, body, extraCss = "") {
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;font-weight:400;src:url(${font("@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2")});unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:Plex;font-weight:500;src:url(${font("@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2")});unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:Plex;font-weight:600;src:url(${font("@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2")});unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:Plex;font-weight:700;src:url(${font("@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2")});unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:Inter;font-weight:100 900;src:url(${font("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:Inter,Plex,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
:lang(ar) body{font-family:Plex,Inter,sans-serif}
.card{position:relative;width:${w}px;height:${h}px;overflow:hidden}
.contours{position:absolute;inset:0;width:100%;height:100%}
.brandbar{position:absolute;inset-inline:64px;bottom:52px;display:flex;align-items:center;justify-content:space-between;gap:24px;z-index:3}
.brand{display:flex;align-items:center;gap:18px}
.brand b{font-family:Inter,sans-serif;font-size:40px;font-weight:600;letter-spacing:-.5px;line-height:1}
.brand small{display:block;font-size:19px;font-weight:500;opacity:.8;margin-top:6px}
.url{font-family:Inter,sans-serif;font-size:24px;font-weight:600;letter-spacing:.3px}
.chip{display:inline-block;padding:10px 22px;border-radius:999px;font-size:24px;font-weight:600;line-height:1.2}
[data-fit]{overflow:hidden}
.num{font-family:Inter,sans-serif;font-variant-numeric:tabular-nums}
${extraCss}
</style></head><body><div class="card">${body}</div>
<script>
// Shrink each [data-fit] block's font until its text fits its box.
window.__fit = () => document.querySelectorAll('[data-fit]').forEach((el) => {
  let size = parseFloat(getComputedStyle(el).fontSize); const min = Number(el.dataset.fit) || 20;
  while ((el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && size > min) { size -= 1; el.style.fontSize = size + 'px'; }
});
</script></body></html>`;
}

const brandbar = (lang, fg, accent) => `<div class="brandbar" style="color:${fg}">
  <div class="brand">${MARK(accent, 64)}<div><b>Selorin</b><small>${esc(L[lang].brand)}</small></div></div>
  <div class="url" style="color:${accent}">selorin.co</div></div>`;

/** Article launch post: hero photo, category, title. */
export function cover(lang, { title, category, photo }) {
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0 0 auto 0;height:820px;background:url('${photo}') center/cover"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,42,30,.05) 0%,rgba(5,42,30,.25) 35%,${C.deep} 62%)"></div>
  ${contours(C.mint, 0.10, 3)}
  <div style="position:absolute;inset-inline:64px;top:64px;z-index:2">${MARK(C.mint, 84)}</div>
  <div style="position:absolute;inset-inline:64px;top:520px;bottom:200px;display:flex;flex-direction:column;justify-content:flex-end;gap:30px;z-index:2">
    <span class="chip" style="align-self:flex-start;background:${C.mint};color:${C.deep}">${esc(category)}</span>
    <h1 data-fit="40" style="max-height:470px;color:#fff;font-size:80px;line-height:1.28;font-weight:700">${esc(title)}</h1>
  </div>
  <div style="position:absolute;inset-inline:0;bottom:150px;height:2px;background:${C.mint};opacity:.25;margin-inline:64px"></div>
  ${brandbar(lang, "#fff", C.mint)}`);
}

/** Key takeaway as a typographic quote card. */
export function takeaway(lang, { text, title }) {
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 85% 0%,${C.forest2} 0%,${C.forest} 40%,${C.deep} 100%)"></div>
  ${contours(C.mint, 0.12, 2)}
  <div style="position:absolute;inset-inline:72px;top:88px;bottom:200px;display:flex;flex-direction:column;z-index:2">
    <span class="chip" style="align-self:flex-start;background:rgba(205,239,211,.14);color:${C.mint};border:1.5px solid rgba(205,239,211,.4)">${esc(L[lang].takeaway)}</span>
    <div style="font-family:Inter,serif;font-size:220px;line-height:.9;color:${C.mint};margin-top:40px;height:150px">${lang === "ar" ? "”" : "“"}</div>
    <p data-fit="34" style="flex:1;color:#fff;font-size:66px;line-height:1.45;font-weight:600">${esc(text)}</p>
    <p style="color:${C.mint};font-size:28px;line-height:1.5;margin-top:28px;opacity:.9"><span style="opacity:.75">${esc(L[lang].from)}</span> ${esc(title)}</p>
  </div>
  ${brandbar(lang, "#fff", C.mint)}`);
}

/** FAQ card with the consultation call to action. */
export function faq(lang, { q, a }) {
  const short = a.length > 420 ? a.slice(0, 410).replace(/\s+\S*$/, "") + "…" : a;
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0;background:${C.paper}"></div>
  ${contours(C.forest, 0.06, 5)}
  <div style="position:absolute;inset-inline:72px;top:80px;bottom:330px;display:flex;flex-direction:column;gap:34px;z-index:2">
    <div style="display:flex;align-items:center;gap:22px">
      <div style="width:96px;height:96px;border-radius:24px;background:${C.forest};color:${C.mint};display:grid;place-items:center;font:700 60px Inter,sans-serif">?</div>
      <span style="font-size:30px;font-weight:600;color:${C.forest2}">${esc(L[lang].faq)}</span>
    </div>
    <h1 data-fit="34" style="max-height:330px;color:${C.forest};font-size:62px;line-height:1.35;font-weight:700">${esc(q)}</h1>
    <div style="width:120px;height:6px;border-radius:3px;background:${C.mint2}"></div>
    <p data-fit="24" style="flex:1;color:${C.ink2};font-size:36px;line-height:1.65">${esc(short)}</p>
  </div>
  <div style="position:absolute;inset:auto 0 0 0;height:290px;background:${C.forest}">${contours(C.mint, 0.10, 7, 1080, 290)}</div>
  <div style="position:absolute;inset-inline:72px;bottom:178px;color:#fff;font-size:34px;font-weight:600;z-index:3">${esc(L[lang].cta)}</div>
  ${brandbar(lang, "#fff", C.mint)}`);
}

/** Numbered checklist / step infographic (3–6 items). */
export function checklist(lang, { title, items, kicker }) {
  const list = items.slice(0, 6);
  const fs = list.length > 4 ? 34 : 40;
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0;background:${C.paper}"></div>
  <div style="position:absolute;inset:0 0 auto 0;height:400px;background:${C.forest}">${contours(C.mint, 0.12, 4, 1080, 400)}</div>
  <div style="position:absolute;inset-inline:72px;top:72px;height:280px;display:flex;flex-direction:column;gap:22px;z-index:2">
    <span class="chip" style="align-self:flex-start;background:${C.mint};color:${C.deep}">${esc(kicker || L[lang].checklist)}</span>
    <h1 data-fit="34" style="flex:1;color:#fff;font-size:58px;line-height:1.3;font-weight:700">${esc(title)}</h1>
  </div>
  <ol style="position:absolute;inset-inline:56px;top:430px;bottom:170px;list-style:none;display:flex;flex-direction:column;gap:18px;z-index:2">
    ${list.map((t, i) => `<li style="flex:1;display:flex;gap:24px;align-items:center;background:#fff;border:1.5px solid ${C.sand};border-radius:20px;padding:16px 26px;min-height:0">
      <span class="num" style="flex:none;width:68px;height:68px;border-radius:50%;background:${C.mint};color:${C.deep};display:grid;place-items:center;font-size:32px;font-weight:700">${i + 1}</span>
      <span data-fit="18" style="display:block;flex:1;max-height:100%;font-size:${fs}px;line-height:1.45;color:${C.ink2};font-weight:500">${esc(t)}</span></li>`).join("")}
  </ol>
  ${brandbar(lang, C.forest, C.forest2)}`);
}

/** One verified number with its context and source. */
export function stat(lang, { value, label, context, source }) {
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0;background:radial-gradient(110% 80% at 15% 10%,${C.forest2} 0%,${C.forest} 45%,${C.deep} 100%)"></div>
  ${contours(C.mint, 0.11, 6)}
  <div style="position:absolute;inset-inline:72px;top:110px;bottom:200px;display:flex;flex-direction:column;gap:30px;z-index:2">
    <div class="num" data-fit="90" dir="ltr" style="text-align:${lang === "ar" ? "right" : "left"};height:300px;color:${C.mint};font-size:240px;line-height:1.15;font-weight:700;letter-spacing:-6px;white-space:nowrap">${esc(value)}</div>
    <h1 data-fit="34" style="max-height:260px;color:#fff;font-size:60px;line-height:1.35;font-weight:700">${esc(label)}</h1>
    <p data-fit="22" style="flex:1;color:rgba(255,255,255,.86);font-size:36px;line-height:1.6">${esc(context)}</p>
    ${source ? `<p style="color:${C.mint};font-size:22px;opacity:.85">${esc(L[lang].source)} ${esc(source)}</p>` : ""}
  </div>
  ${brandbar(lang, "#fff", C.mint)}`);
}

/** Myth vs fact. */
export function myth(lang, { myth: m, fact }) {
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0;background:${C.paper}"></div>
  <div style="position:absolute;inset-inline:56px;top:64px;height:420px;border-radius:28px;background:${C.sand};padding:44px 48px;display:flex;flex-direction:column;gap:22px">
    <div style="display:flex;align-items:center;gap:18px"><span style="width:64px;height:64px;border-radius:50%;background:#b42318;color:#fff;display:grid;place-items:center;font:700 38px Inter">✕</span><span style="font-size:38px;font-weight:700;color:#8a1c12">${esc(L[lang].myth)}</span></div>
    <p data-fit="26" style="flex:1;font-size:46px;line-height:1.45;color:${C.ink2};font-weight:600">${esc(m)}</p>
  </div>
  <div style="position:absolute;inset-inline:56px;top:516px;bottom:170px;border-radius:28px;background:${C.forest};padding:44px 48px;display:flex;flex-direction:column;gap:22px;overflow:hidden">
    ${contours(C.mint, 0.10, 8, 968, 664)}
    <div style="display:flex;align-items:center;gap:18px;position:relative"><span style="width:64px;height:64px;border-radius:50%;background:${C.mint};color:${C.deep};display:grid;place-items:center;font:700 38px Inter">✓</span><span style="font-size:38px;font-weight:700;color:${C.mint}">${esc(L[lang].fact)}</span></div>
    <p data-fit="24" style="position:relative;flex:1;font-size:42px;line-height:1.55;color:#fff;font-weight:500">${esc(fact)}</p>
  </div>
  ${brandbar(lang, C.forest, C.forest2)}`);
}

/** Dated event / awareness day. */
export function event(lang, { date, title, text }) {
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0;background:${C.deep}"></div>
  ${contours(C.mint, 0.13, 9)}
  <div style="position:absolute;inset-inline:72px;top:96px;bottom:200px;display:flex;flex-direction:column;gap:40px;z-index:2">
    <div style="align-self:flex-start;border:2px solid ${C.mint};border-radius:24px;padding:22px 34px;color:${C.mint};font-size:44px;font-weight:700">${esc(date)}</div>
    <h1 data-fit="36" style="max-height:420px;color:#fff;font-size:78px;line-height:1.3;font-weight:700">${esc(title)}</h1>
    <p data-fit="22" style="flex:1;color:rgba(255,255,255,.86);font-size:38px;line-height:1.6">${esc(text)}</p>
  </div>
  ${brandbar(lang, "#fff", C.mint)}`);
}

/** Practical tip: short headline + supporting sentence on paper. */
export function tip(lang, { title, text }) {
  return page(lang, 1080, 1350, `
  <div style="position:absolute;inset:0;background:${C.mint}"></div>
  ${contours(C.forest, 0.10, 10)}
  <div style="position:absolute;inset-inline:72px;top:96px;bottom:200px;display:flex;flex-direction:column;gap:36px;z-index:2">
    <span class="chip" style="align-self:flex-start;background:${C.forest};color:${C.mint}">${esc(L[lang].tip)}</span>
    <h1 data-fit="36" style="max-height:520px;color:${C.deep};font-size:80px;line-height:1.28;font-weight:700">${esc(title)}</h1>
    <p data-fit="22" style="flex:1;color:${C.ink2};font-size:40px;line-height:1.6">${esc(text)}</p>
  </div>
  ${brandbar(lang, C.deep, C.forest)}`);
}

/** Link preview / Open Graph image (1200×630). */
export function og(lang, { title, category, photo }) {
  const ar = lang === "ar";
  return page(lang, 1200, 630, `
  <div style="position:absolute;inset:0;background:${C.deep}"></div>
  <div style="position:absolute;top:0;bottom:0;${ar ? "left" : "right"}:0;width:470px;background:url('${photo}') center/cover"></div>
  <div style="position:absolute;top:0;bottom:0;${ar ? "left" : "right"}:0;width:470px;background:linear-gradient(${ar ? "270deg" : "90deg"},${C.deep} 0%,rgba(5,42,30,0) 45%)"></div>
  ${contours(C.mint, 0.08, 3, 1200, 630)}
  <div style="position:absolute;top:56px;bottom:56px;${ar ? "right" : "left"}:60px;width:650px;display:flex;flex-direction:column;gap:22px;z-index:2">
    <span class="chip" style="align-self:flex-start;background:${C.mint};color:${C.deep};font-size:20px;padding:8px 18px">${esc(category)}</span>
    <h1 data-fit="28" style="flex:1;color:#fff;font-size:52px;line-height:1.3;font-weight:700">${esc(title)}</h1>
    <div style="display:flex;align-items:center;gap:14px;color:#fff">${MARK(C.mint, 48)}<b style="font:600 30px Inter">Selorin</b><span style="color:${C.mint};font:600 20px Inter;margin-inline-start:auto">selorin.co</span></div>
  </div>`);
}

/** Profile cover / header (any size): mark, wordmark, positioning line. Kept to the right by default, away
 *  from the profile photo that LinkedIn, X and Facebook overlay on the left. */
export function banner(lang, { width, height, line, safeInset = 0, align = "end" }) {
  const s = Math.min(height / 500, width / 1500) * 1.0;
  const mark = Math.round(150 * s);
  return page(lang, width, height, `
  <div style="position:absolute;inset:0;background:radial-gradient(120% 140% at 80% 0%,${C.forest2} 0%,${C.forest} 45%,${C.deep} 100%)"></div>
  ${contours(C.mint, 0.13, 3, width, height)}
  <div style="position:absolute;inset:0;padding-inline:${Math.round(width * 0.06) + safeInset}px;display:flex;align-items:center;justify-content:${align === "center" ? "center" : "flex-end"};gap:${Math.round(40 * s)}px;color:#fff;z-index:2" dir="ltr">
    ${MARK(C.mint, mark)}
    <div>
      <div style="font:600 ${Math.round(110 * s)}px Inter;letter-spacing:-2px;line-height:1">Selorin</div>
      <div style="font:600 ${Math.round(24 * s)}px Inter;letter-spacing:3px;color:${C.mint};margin-top:${Math.round(14 * s)}px">ENVIRONMENTAL ADVISORY &amp; SERVICES</div>
      <div dir="rtl" style="font:600 ${Math.round(34 * s)}px Plex;margin-top:${Math.round(18 * s)}px;opacity:.95;text-align:left">${esc(line || "سيلورين للاستشارات والخدمات البيئية")}</div>
    </div>
  </div>`);
}

/** Square avatar: the mark on forest green, centred for circular crops. */
export function avatar(lang, { size = 800 }) {
  return page(lang, size, size, `
  <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 35%,${C.forest2},${C.deep})"></div>
  <div style="position:absolute;inset:0;display:grid;place-items:center">${MARK(C.mint, Math.round(size * 0.58))}</div>`);
}

export const TEMPLATES = { cover, takeaway, faq, checklist, stat, myth, event, tip, og, banner, avatar };
