/* Google Consent Mode v2 defaults + lazy GTM. Runs before anything else in <head>.
   Set the container ID below to enable GTM; nothing loads until analytics consent is granted. */
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
  if (stored === "granted") window.__loadGTM();
})();
