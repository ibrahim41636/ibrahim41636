// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

/** Highlights [CONTENT REQUIRED: …] markers in Markdown so placeholders can never pass as final copy. */
function remarkContentRequired() {
  const RE = /(\[CONTENT REQUIRED[^\]]*\])/;
  /** @param {any} node */
  const walk = (node) => {
    if (!node.children) return;
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
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en", ar: "ar-SA" } },
      // Utility and placeholder pages are noindex and stay out of the sitemap.
      filter: (page) => !/\/(request\/received|projects\/case-study-template)\//.test(page),
    }),
  ],
});
