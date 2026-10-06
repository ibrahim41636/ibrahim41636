# selorin.co — Selorin Environmental Advisory & Services

Bilingual (English / Arabic RTL) corporate website for Selorin, built as a fast static site with a secure serverless lead pipeline.

| | |
|---|---|
| Framework | [Astro](https://astro.build) 7 + TypeScript (static output, near-zero client JS) |
| Styling | Design tokens + component CSS in `src/styles/global.css` (logical properties → one stylesheet for LTR and RTL) |
| Fonts | Inter + IBM Plex Sans Arabic, self-hosted via Fontsource |
| Content | Typed content collections in `src/content/` (CMS-ready schema — see `docs/architecture.md`) |
| Forms backend | Cloudflare Pages Function `functions/api/request.ts` |
| Email | Resend API (swap-able adapter), optional client confirmation |
| Lead log | Cloudflare D1 (sequential Request IDs, rate limiting, CRM-ready record) |
| Hosting | Cloudflare Pages (CDN + HTTPS + WAF + Turnstile) |

## Commands

```bash
npm install
npm run dev            # local dev server (http://localhost:4321)
npm test               # unit tests (forms, lead email, uploads, RTL)
npm run build          # type-check + build to dist/
npx wrangler dev              # build + run the site WITH the /api/request endpoint locally
                              # (.dev.vars sets EMAIL_DRY_RUN=true → emails are printed, not sent)
node scripts/validate-content.mjs services     # content QA (schema, lengths, banned hype words)
```

## Structure

```
src/
  content/            services (22) · industries (14) · insights (en/ar) · projects · authors · legal (en/ar)
  content.config.ts   content schema (the contract a CMS must satisfy)
  data/taxonomy.ts    practice areas, lifecycle navigator, regulators list, insight categories
  i18n/ui.ts          UI strings (EN/AR), site constants (email, phone), URL helpers
  lib/forms.ts        smart-form definition — shared by browser and server validation
  lib/lead.ts         lead record + sales email formatting (pure, unit-tested)
  lib/uploads.ts      attachment allow-list + magic-byte sniffing
  lib/schema.ts       JSON-LD graph (Organization, Service, FAQPage, Article, BreadcrumbList…)
  views/              page templates (one per page type, rendered for both languages)
  pages/ , pages/ar/  thin route files (EN at /, AR at /ar/)
  scripts/            client JS: navigation, analytics layer, smart form
functions/api/request.ts   lead endpoint
migrations/                D1 schema
integrations/              build step that isolates "4–20 mA"-style tokens in Arabic pages
docs/                      content guide, architecture, launch checklist
```

## Editing content today

Every page is generated from the files in `src/content/`. To change a service, edit its JSON (both `en` and `ar` blocks) and push — CI validates and deploys. Writing rules (no invented claims, Arabic standards, lengths) are in `docs/content-guide.md`. Anything not yet confirmed is written as `[CONTENT REQUIRED: …]` and is highlighted in yellow on the site so it can't be mistaken for final copy.

See **`docs/architecture.md`** for the sitemap, CMS plan, form/email pipeline, security, SEO, analytics events and the launch checklist.
