/* Google Consent Mode v2 (advanced) + GTM. Runs before anything else in <head>.
   GTM loads on every page, but all storage defaults to "denied": Google tags set no cookies and
   store no identifiers until the visitor accepts in the cookie banner (analytics.ts updates consent). */
(function () {
  var GTM_ID = "GTM-KBQP5SKQ";
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  var stored = null;
  try { stored = localStorage.getItem("selorin_consent"); } catch (e) {}
  gtag("consent", "default", {
    ad_storage: stored === "granted" ? "granted" : "denied",
    ad_user_data: stored === "granted" ? "granted" : "denied",
    ad_personalization: stored === "granted" ? "granted" : "denied",
    analytics_storage: stored === "granted" ? "granted" : "denied",
    wait_for_update: 500,
  });
  window.__loadGTM = function () {
    if (!GTM_ID || window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    document.head.appendChild(s);
  };
  window.__consentState = stored;
  window.__loadGTM();
})();
