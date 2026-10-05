# Selorin website — architecture & operations

## 1. Sitemap (every route exists in EN at `/` and AR at `/ar/`)

```
/                                   Home
/about/                             Who we are · Approach · Expertise · Values · Commitment · Saudi market · How we work
/services/                          Services hub (6 practice areas)
/services/{practice-area}/          permitting-compliance · environmental-studies · monitoring-measurement ·
                                    waste-circular-economy · sustainability-climate · sustainable-buildings
/services/{service}/                22 service pages (see §2)
/industries/  /industries/{slug}/   14 industry pages
/projects/    /projects/{slug}/     case studies (template entry is noindex until real data exists)
/insights/                          all articles
/insights/category/{slug}/          category listings
/insights/{slug}/                   article
/insights/authors/{slug}/           author / editorial profile
/contact/                           contact page + inquiry form (service dropdown)
/request/                           smart request form (service chosen in step 1)
/request/{service}/                 smart request form, service pre-filled (no re-selection)
/request/received/                  confirmation + Request ID (noindex)
/legal/privacy/ /legal/terms/ /legal/cookies/
/sitemap/                           HTML sitemap
/sitemap-index.xml  /robots.txt  /llms.txt  /404
```

Navigation: About · Services (mega menu by practice area) · Industries (mega menu) · Projects · Insights · Contact · EN|AR · **Request a Consultation**. Mobile: drawer menu + fixed bottom bar (Call · WhatsApp · Request).

## 2. Service architecture (22 pages, de-duplicated)

| Practice area | Services |
|---|---|
| Permitting & Compliance | environmental-permitting · environmental-compliance · environmental-records · environmental-audits · environmental-due-diligence |
| Environmental Studies | environmental-impact-assessment · environmental-management-plans |
| Monitoring & Measurement | environmental-monitoring · air-quality-monitoring · dust-monitoring · fuel-station-voc-monitoring · noise-monitoring · water-quality-monitoring |
| Waste & Circular Economy | waste-management · circular-economy |
| Sustainability, ESG & Climate | esg-advisory · ghg-carbon-accounting · net-zero-advisory · sustainability-advisory · life-cycle-assessment |
| Sustainable Buildings & Infrastructure | sustainable-buildings · green-building-advisory |

Service page template: Hero (+ Request This Service) → Overview (answer-first definition) → When you need this → What we deliver → Our approach → Deliverables table → Regulatory context → Industries served → FAQ (FAQPage schema) → Related services / insights → Final CTA, with a sticky CTA bar and an in-page table of contents.

## 3. Lead pipeline (forms → email → CRM)

```
Service page ─[Request This Service]→ /request/{service}/  (service fixed, never asked again)
Contact page ─────────────────────────→ /contact/            (service dropdown, single step)
                                            │  3-step smart form; step 2 fields depend on the service
                                            ▼
                      POST /api/request (Cloudflare Pages Function)
  origin check (CSRF) → body ≤ 12 MB → honeypot + 3-second time trap → Turnstile → rate limit (5 / 10 min / IP)
  → server-side validation (same rules as the browser, src/lib/forms.ts) → attachment checks
  (≤ 5 files, ≤ 10 MB, extension allow-list + magic-byte sniffing) → Request ID SEL-YYYY-NNNNNN (D1 counter)
                                            │
          ┌─────────────────────────────────┼──────────────────────────────────────┐
  Email to sales@selorin.co           Lead row in D1 (no files)          Optional webhook (LEAD_WEBHOOK_URL)
  subject "[New Service Request] –    for follow-up, reporting and       → CRM / Make / Zapier / WhatsApp
  {Service} – {Company}", reply-to    as a safety net if email fails     automation (signed header)
  = client, attachments included
          │
  Confirmation email to client with Request ID (SEL-…) → /request/received/?id=SEL-…
```

Each lead carries: Lead ID, date & time (Riyadh), service, industry, company, contact name, job title, email, phone, location, preferred contact method, service-specific details, message, attachments list, source page, referrer, UTM source / medium / campaign / term / content, urgency flag, language.

Form families (step 2 fields): permitting · studies · monitoring · waste · sustainability · buildings, with per-service overrides (e.g. fuel stations ask for number of stations and station status; audits ask for audit type). Add or change fields in `src/lib/forms.ts` only — browser rendering, validation, emails and CRM payload all follow.

### Configuration (Cloudflare Pages → Settings)

| Name | Type | Purpose |
|---|---|---|
| `RESEND_API_KEY` | secret | Transactional email API key (domain `selorin.co` verified in Resend: SPF, DKIM, DMARC) |
| `TURNSTILE_SECRET` | secret | Cloudflare Turnstile secret |
| `PUBLIC_TURNSTILE_SITE_KEY` | build var | Turnstile site key (renders the widget) |
| `SALES_EMAIL` | var | default `sales@selorin.co` |
| `MAIL_FROM` | var | e.g. `Selorin Website <website@selorin.co>` |
| `SEND_CONFIRMATION` | var | `true` to email clients their Request ID |
| `LEAD_WEBHOOK_URL` / `LEAD_WEBHOOK_SECRET` | secret | optional CRM / automation hand-off |
| `DB` | D1 binding | lead log + sequential IDs + rate limiting (`migrations/0001_leads.sql`) |

Email provider: Resend is used because it is a single HTTPS call from the edge. Postmark or Amazon SES can replace `sendEmail()` without touching anything else.

## 4. Security

- HTTPS + HSTS (preload), CSP, X-Frame-Options DENY, nosniff, strict referrer policy, permissions policy — `public/_headers`.
- No secrets or personal data in the frontend; leads only exist server-side.
- CSRF: requests accepted only from the site's own origins; Turnstile token bound to the session.
- Spam: honeypot, minimum completion time, Turnstile, per-IP rate limit (hashed IP, not stored raw). Add a Cloudflare WAF rate-limiting rule on `/api/request` as a second layer.
- Input: server-side allow-list validation for every field, length limits, option membership, CR/LF stripped from anything that reaches email headers, HTML-escaped email bodies.
- Uploads: count/size limits, extension allow-list, content sniffing (a renamed `.exe` is rejected), filename sanitisation; files are forwarded by email and never stored.

## 5. SEO, AEO & GEO

- Per page: unique title + meta description, one H1, logical H2/H3, canonical, hreflang (en, ar, x-default), Open Graph/Twitter cards, descriptive alt text, clean slugs.
- Structured data graph: Organization/ProfessionalService (single `@id`), WebSite, BreadcrumbList on every inner page, Service (+ audience = industries), FAQPage on service/industry/article pages, Article with author/publisher, CollectionPage lists, ContactPage, AboutPage.
- Entity clarity for AI search: every service starts with a one-paragraph definition; service ↔ industry ↔ insight relationships are explicit links and schema references; `/llms.txt` lists all services with definitions; robots allows AI search crawlers.
- `sitemap-index.xml` with EN/AR alternates; `robots.txt`; HTML sitemap; 301 redirects from the v1 URLs (`public/_redirects`).
- Arabic is written natively (not translated) and numeric/technical tokens are bidi-isolated at build time.

## 6. Analytics (GTM → GA4)

Consent Mode v2 defaults to denied; GTM loads only after the visitor accepts analytics (`public/js/consent.js` — set `GTM_ID`). Every page pushes `page_context` (page_type, page_language, service_slug, service_category, industry_slug).

| Event | When | Key parameters |
|---|---|---|
| `service_view` / `industry_view` | service / industry page load | service_slug, service_category / industry_slug |
| `cta_click` | any element with `data-cta` | cta_id, link_text, service_slug |
| `phone_click` · `email_click` · `whatsapp_click` | tel:, mailto:, wa.me links | cta_id |
| `file_download` | PDF/DOCX/XLSX/ZIP links | file_name |
| `language_switch` | EN↔AR | — |
| `lifecycle_select` | homepage navigator tab | stage |
| `form_start` · `form_step` · `form_error` | form interactions | form_kind, step, field, service_slug |
| `generate_lead` | successful submission | request_id, service_slug, industry, urgent, form_kind |

Answering the business questions in GA4 explorations: *which service gets most requests* → `generate_lead` by service_slug; *which page converts* → `generate_lead` by page_path / landing page; *which industry generates leads* → `generate_lead` by industry; *which CTA performs* → `cta_click` by cta_id ÷ page views. Mark `generate_lead` as a key event; register service_slug, industry, cta_id, form_kind as custom dimensions. The D1 lead table gives the same answers server-side, independent of consent.

## 7. CMS architecture

Content is already modelled as typed collections (`src/content.config.ts`): Service, PracticeArea (taxonomy), Industry, Insight, Author, Project, Legal page, FAQ (embedded). Recommended CMS: **Sanity** (hosted, no server to run, field-level validation, references, document-level i18n). Migration path:

1. Recreate the schema in Sanity Studio (1:1 with the zod schema; references stay references).
2. Import the current JSON/Markdown with a one-off script.
3. Replace the `glob()` loaders with a Sanity loader (Astro content layer) — templates do not change.
4. Sanity publish webhook → Cloudflare Pages deploy hook (site rebuilds in about a minute).

Editors will then manage services, service details, industries, projects, insights, FAQs, team/authors and contact details without code.

## 8. Performance & accessibility (measured on the production build)

- Lighthouse (mobile emulation): Home 99 / 100 / 100 / 100 (Perf / A11y / Best practices / SEO), LCP 1.8 s, CLS 0.025; Arabic service page 100 / 100 / 100 / 100.
- axe-core (WCAG 2.1 AA + best practices) on 21 key pages at 390 px and 1440 px: 0 violations.
- No horizontal overflow at 320, 375, 390, 430, 768, 1024, 1440, 1920 px.
- Static HTML, self-hosted subset fonts, WebP with JPEG fallback, lazy images, hashed immutable assets.

## 9. Launch checklist

**Content & legal (owner: Selorin)**
- [ ] Resolve every `[CONTENT REQUIRED]` (legal entity & CR number, credentials, team, case studies, legal reviews).
- [ ] Confirm the service list (remove anything not delivered in-house or via confirmed partners).
- [ ] Legal review of Privacy, Terms and Cookie policies (PDPL).
- [ ] Real photography to replace brand-deck imagery; LinkedIn / X URLs in `src/i18n/ui.ts`.

**Infrastructure**
- [ ] Cloudflare account → Pages project `selorin-website` connected to the GitHub repo (or deploy via CI with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`).
- [ ] Move `selorin.co` DNS to Cloudflare; add custom domains `selorin.co` and `www.selorin.co` (www → apex redirect).
- [ ] Create D1 `selorin-leads`, apply migrations, add binding in `wrangler.toml`.
- [ ] Resend: verify `selorin.co` (SPF/DKIM/DMARC records), set `RESEND_API_KEY`, `MAIL_FROM`.
- [ ] Turnstile widget for selorin.co → `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`.
- [ ] WAF rate-limit rule on `/api/request`.

**Measurement**
- [ ] GTM container + GA4 property; set `GTM_ID` in `public/js/consent.js`; configure the events in §6.
- [ ] Google Search Console (domain property), submit `sitemap-index.xml`; Bing Webmaster Tools.

**Go-live tests**
- [ ] Submit one request per form family on production; confirm email layout, attachments, Request ID, confirmation email, D1 row.
- [ ] Test the 301 redirects from v1 URLs; test 404; check hreflang pairs in Search Console.
- [ ] Re-run Lighthouse and axe on production.
