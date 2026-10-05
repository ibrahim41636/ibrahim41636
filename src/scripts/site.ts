import { initClickTracking, initConsent, track } from "./analytics";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Header: hide on scroll down, show on scroll up */
const header = document.querySelector<HTMLElement>("[data-header]");
let lastY = scrollY;
addEventListener("scroll", () => {
  if (!header) return;
  const y = scrollY;
  header.classList.toggle("is-scrolled", y > 8);
  const menuOpen = document.querySelector("[data-nav].is-open") || document.querySelector("[data-mega][aria-expanded='true']");
  header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY);
  lastY = y;
}, { passive: true });

/* Mega menus (click to open; Esc / outside click to close) */
const megaButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-mega]")];
const closeMegas = (except?: HTMLButtonElement) => megaButtons.forEach((b) => {
  if (b === except) return;
  b.setAttribute("aria-expanded", "false");
  document.getElementById(b.getAttribute("aria-controls")!)!.hidden = true;
});
megaButtons.forEach((b) => b.addEventListener("click", () => {
  const open = b.getAttribute("aria-expanded") !== "true";
  closeMegas(b);
  b.setAttribute("aria-expanded", String(open));
  document.getElementById(b.getAttribute("aria-controls")!)!.hidden = !open;
}));
document.addEventListener("click", (e) => { if (!(e.target as HTMLElement).closest(".nav")) closeMegas(); });

/* Mobile menu */
const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const nav = document.querySelector<HTMLElement>("[data-nav]");
const openLabel = toggle?.getAttribute("aria-label") ?? "";
const setMenu = (open: boolean) => {
  if (!toggle || !nav) return;
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? toggle.dataset.labelClose! : openLabel);
  document.documentElement.style.overflow = open ? "hidden" : "";
  if (open) nav.querySelector<HTMLElement>("a, button")?.focus();
};
toggle?.addEventListener("click", () => setMenu(!nav?.classList.contains("is-open")));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const openMega = megaButtons.find((b) => b.getAttribute("aria-expanded") === "true");
  closeMegas();
  openMega?.focus();
  if (nav?.classList.contains("is-open")) { setMenu(false); toggle?.focus(); }
});

/* Reveal on scroll */
if (!reduced && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
}

/* Tabs (lifecycle navigator) — WAI-ARIA tabs pattern with arrow-key support */
document.querySelectorAll<HTMLElement>("[data-tabs]").forEach((root) => {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role='tab']")];
  const select = (tab: HTMLButtonElement, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")!)!.hidden = !on;
    });
    if (focus) tab.focus();
    track("lifecycle_select", { stage: tab.dataset.stage });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const rtl = document.dir === "rtl";
      const next = ["ArrowDown", rtl ? "ArrowLeft" : "ArrowRight"].includes(e.key);
      const prev = ["ArrowUp", rtl ? "ArrowRight" : "ArrowLeft"].includes(e.key);
      if (next || prev) { e.preventDefault(); select(tabs[(i + (next ? 1 : -1) + tabs.length) % tabs.length], true); }
    });
  });
});

/* Table of contents scroll-spy + sticky CTA on long pages */
const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>(".toc a[href^=\"#\"]")];
if (tocLinks.length && "IntersectionObserver" in window) {
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    tocLinks.forEach((a) => a.classList.toggle("is-active", a.hash === `#${en.target.id}`));
  }), { rootMargin: "-30% 0px -60% 0px" });
  tocLinks.forEach((a) => { const t = document.querySelector(a.hash); if (t) spy.observe(t); });
}
const sticky = document.querySelector<HTMLElement>("[data-sticky-cta]");
const heroEnd = document.querySelector(".page-hero");
if (sticky && heroEnd && "IntersectionObserver" in window) {
  new IntersectionObserver(([en]) => sticky.classList.toggle("is-visible", !en.isIntersecting)).observe(heroEnd);
}

/* Insight category filter */
document.querySelectorAll<HTMLElement>("[data-filter-group]").forEach((group) => {
  group.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.addEventListener("click", () => {
    group.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    document.querySelectorAll<HTMLElement>("[data-cat]").forEach((card) => { card.hidden = b.dataset.value !== "all" && card.dataset.cat !== b.dataset.value; });
  }));
});

/* Page-type view events (service / industry) for conversion analysis */
const ctx = document.body.dataset;
if (ctx.service) track("service_view", { service_slug: ctx.service, service_category: ctx.category });
if (ctx.industry) track("industry_view", { industry_slug: ctx.industry });

/* First-touch attribution: keep UTM parameters for the session so forms can attach them to the lead. */
try {
  const q = new URLSearchParams(location.search);
  if ([...q.keys()].some((k) => k.startsWith("utm_")) && !sessionStorage.getItem("selorin_utm")) {
    sessionStorage.setItem("selorin_utm", JSON.stringify(Object.fromEntries([...q].filter(([k]) => k.startsWith("utm_")))));
  }
  if (!sessionStorage.getItem("selorin_referrer")) sessionStorage.setItem("selorin_referrer", document.referrer || "direct");
} catch {}

initClickTracking();
initConsent();
