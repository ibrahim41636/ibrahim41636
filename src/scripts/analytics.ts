// Analytics event layer. Every event goes to window.dataLayer with a consistent shape so GTM
// can forward them to GA4 (and later to ad platforms / CRM) without changing the site.
//   event names: cta_click, phone_click, email_click, whatsapp_click, file_download, language_switch,
//                service_view, industry_view, form_start, form_step, form_error, generate_lead
type Params = Record<string, string | number | boolean | undefined>;

declare global { interface Window { dataLayer: unknown[]; __loadGTM?: () => void; __consentState?: string | null; gtag?: (...a: unknown[]) => void } }

export function track(event: string, params: Params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export function initClickTracking() {
  document.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLAnchorElement | HTMLButtonElement>("a, button");
    if (!el) return;
    const text = (el.textContent ?? "").trim().slice(0, 80);
    const hrefAttr = el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? "" : "";
    const base = { link_text: text, link_url: hrefAttr, cta_id: el.dataset.cta, service_slug: el.dataset.service };
    if (hrefAttr.startsWith("tel:")) track("phone_click", base);
    else if (hrefAttr.startsWith("mailto:")) track("email_click", base);
    else if (/wa\.me|whatsapp/.test(hrefAttr)) track("whatsapp_click", base);
    else if (/\.(pdf|docx?|xlsx?|zip)$/i.test(hrefAttr)) track("file_download", { ...base, file_name: hrefAttr.split("/").pop() });
    if (el.dataset.track === "language_switch") track("language_switch", base);
    if (el.dataset.cta) track("cta_click", base);
  }, { capture: true });
}

export function initConsent() {
  const banner = document.getElementById("cookie-banner");
  const set = (state: "granted" | "denied") => {
    try { localStorage.setItem("selorin_consent", state); } catch {}
    window.__consentState = state;
    // One choice covers analytics and ad measurement (Google Ads conversions and remarketing).
    window.gtag?.("consent", "update", { analytics_storage: state, ad_storage: state, ad_user_data: state, ad_personalization: state });
    if (state === "granted") window.__loadGTM?.();
    if (banner) banner.hidden = true;
  };
  if (banner && !window.__consentState) banner.hidden = false;
  banner?.querySelectorAll<HTMLButtonElement>("[data-consent]").forEach((b) => b.addEventListener("click", () => set(b.dataset.consent as "granted" | "denied")));
  document.querySelectorAll("[data-cookie-settings]").forEach((b) => b.addEventListener("click", () => { if (banner) banner.hidden = false; }));
}
