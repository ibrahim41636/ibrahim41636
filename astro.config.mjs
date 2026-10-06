// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import bidiIsolate from "./integrations/bidi-isolate.mjs";

/** Highlights [CONTENT REQUIRED: …] markers in Markdown so placeholders can never pass as final copy. */
function remarkContentRequired() {
  const RE = /(\[CONTENT REQUIRED[^\]]*\])/;
  /** @param {any} node */
  const walk = (node) => {
    if (!node.children) return;
    // GFM task lists render disabled, unlabeled checkboxes; publish them as plain list items.
    if (node.type === "list") node.children.forEach((/** @type {any} */ li) => { if (typeof li.checked === "boolean") li.checked = null; });
    node.children = node.children.flatMap((/** @type {any} */ child) => {
      if (child.type === "text" && RE.test(child.value)) {
        return child.value.split(RE).filter(Boolean).map((/** @type {string} */ part) =>
          RE.test(part) ? { type: "html", value: `<mark class="content-required">${part.replace(/[<>&]/g, "")}</mark>` } : { type: "text", value: part });
      }
      walk(child);
      return [child];
    });
  };
  return (/** @type {any} */ tree) => walk(tree);
}

export default defineConfig({
  markdown: { remarkPlugins: [remarkContentRequired] },
  site: "https://selorin.co",
  trailingSlash: "always",
  output: "static",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar"],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: "directory", inlineStylesheets: "auto" },
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
  integrations: [
    bidiIsolate(),
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en", ar: "ar-SA" } },
      // Utility and placeholder pages are noindex and stay out of the sitemap.
      filter: (page) => !/\/((request|careers)\/received|projects\/case-study-template)\//.test(page),
    }),
  ],
});
