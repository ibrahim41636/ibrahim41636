# Phase 01 — Strategic foundation, sitemap & information architecture

Status: **complete** · Generated artefacts: `docs/page-inventory.md|csv`, `docs/roles-permissions.md`, `docs/redirects-v3.txt` · Source of truth: `src/data/catalog.ts`, `src/data/inventory.ts`, `src/data/platform.ts` · Guarded by `tests/architecture.test.ts`.

## 1. Positioning

**Selorin is an environmental consulting, solutions and innovation company that moves environmental solutions from evidence to deployment.** It combines four capabilities that are normally split across separate organisations:

| Capability | What it does | Who pays / benefits |
|---|---|---|
| Environmental consulting | Permitting, compliance, studies, monitoring, ESG and climate advisory | Corporates, developers, government — fee-based services |
| Environmental solutions | Renewable energy, waste, circular economy and water solutions advisory, design review and implementation support | Asset owners and operators |
| Research & innovation | Identify, assess and validate environmental technologies; design and run pilots | Researchers, universities, technology providers; corporates with challenges |
| Commercialisation & investment | Business cases, commercialisation strategy, investor matching and due-diligence facilitation | Technology owners, investors, industrial partners |

**Positioning line:** *From research to real-world impact.* Arabic: *من البحث العلمي إلى أثر ملموس على أرض الواقع.*

**Why the model is credible:** the consulting practice provides the field data, regulatory knowledge and industrial relationships that innovation platforms usually lack; the validation pipeline gives investors evidence that research platforms usually cannot.

### Value chain the platform operationalises

```
Researcher / scientist ─► Environmental technology ─► Scientific validation ─► Technical validation
      ─► Pilot (host site / corporate challenge) ─► Commercialisation ─► Investor ─► Market deployment
                                   ▲
Corporate environmental challenge ─┘ (demand pulls solutions into pilots)
```

### Business logic (non-negotiable)

Research ≠ validated technology · Patent ≠ market validation · Prototype ≠ commercial viability · Scientific paper ≠ business case.
A solution is promoted only through **gates with hard evidence requirements**; a score alone never promotes it (`src/data/platform.ts → GATES`):

| Gate | Min TRL | Min score | Evidence required |
|---|---|---|---|
| Scientific review | — | — | Complete submission, clear mechanism, ≥1 evidence document |
| Technical review | 3 | — | Scientific reviewer confirms mechanism and evidence |
| Commercial review | 4 | — | Technical reviewer confirms feasibility at next scale |
| Pilot candidate | 5 | 60 | Relevant-environment data, pilot KPIs, host site/challenge |
| Investment candidate | 6 | 70 | Independently monitored pilot results, verified IP position, unit economics, **investment committee approval** |
| Commercialisation candidate | 7 | 75 | Operational-environment demonstration, customers/offtake, regulatory pathway |

Assessment: 10 criteria scored 0–5 by the competent reviewer and weighted to 100 (scientific 15, technical 15, environmental 15, economic 10, market 10, scalability 10, TRL 10, IP 5, regulatory 5, implementation complexity 5). Outcomes: Rejected · More information · Scientific / Technical / Commercial review · Pilot / Investment / Commercialisation candidate.

TRL is never shown as a bare number: every display shows **current TRL + evidence held + next required stage** (`TRL` table, bilingual).

### Revenue model (for page objectives)

Consulting and monitoring fees · technology assessment and validation fees · pilot design/management fees · commercialisation advisory · investor-side due-diligence support · corporate open-innovation programmes · [COMPANY DATA REQUIRED: success-fee / equity arrangements, if any].

## 2. Risk & compliance flags that shape the architecture

1. **Capital markets regulation (decision required).** Presenting investment opportunities and arranging introductions can fall under securities-business activities regulated by the Capital Market Authority (CMA). Until Selorin obtains a legal opinion or licence, the investor platform is designed as **verified-investor introductions and due-diligence facilitation under NDA**: no public offers, no handling of funds, no investment advice to retail users, opportunity data tiered behind verification. `[COMPANY DATA REQUIRED: CMA position / licence]`
2. **IP & confidentiality.** Submissions are confidential by default; only the public tier (title, sector, problem, benefit, TRL band, validation status, stage, country) is ever shown publicly. NDA-gated tiers, watermarking and access logs protect technical and financial data.
3. **Personal data (PDPL).** Researcher, investor (KYC) and corporate data are personal/confidential; data minimisation, retention schedules and processor agreements apply. **Data residency decision required** for confidential IP and investor KYC (see §6).
4. **No invented claims.** Certifications, clients, projects, patents, approvals, revenue and partners appear only when supplied: `[COMPANY DATA REQUIRED]`.

## 3. Audiences, intents and primary CTAs

| Audience | Primary intent | Entry pages | CTA (never generic "Contact us") |
|---|---|---|---|
| Corporate / developer / government | Solve a compliance or environmental problem | Service pages, industries | **Request a Service**, **Talk to an Expert** |
| Corporate innovation / operations | Find a technology for a defined problem | /challenges, /innovation/solutions | **Submit a Challenge**, **Explore Solutions** |
| Researcher / university / tech provider | Validate and commercialise a technology | /innovation, /researchers | **Submit a Solution** |
| Investor | Access validated, de-risked opportunities | /investors | **Become an Investor**, **Explore Investment Opportunities**, **Request Due Diligence** |
| Partner (manufacturer, research centre…) | Collaborate | /partnerships | **Partner With Us** (type-specific) |
| Reviewer / committee / admin | Govern the pipeline | /app/review, /app/committee, /app/admin | — |

## 4. Navigation

**Utility bar:** Partnerships · Challenges · Knowledge · Contact · Sign in · EN | AR

**Main bar (desktop):** Services ▾ · Innovation ▾ · Investors ▾ · Industries ▾ · Projects ▾ · Knowledge · About ▾ · **[Request a Service]**

The suggested 10-item bar (Home … Contact) was restructured because ten top-level items plus a CTA do not fit an institutional header at 1280 px without crowding, and *Home* is the logo by convention. Partnerships and Contact move to the utility bar (still one click everywhere); Projects groups Projects + Case Studies.

| Mega menu | Columns | Side panel CTA |
|---|---|---|
| Services | 8 practice areas with their top sub-services (link to each hub for the full list) | Request a Service · "Not sure? Talk to an Expert" |
| Innovation | Platform (overview, how it works, TRL, assessment) · For researchers (submit, guidelines, IP) · For corporates (challenges, open challenges, pilots) · Directory | Submit a Solution · Explore Solutions |
| Investors | Overview, why invest, process · Opportunities · Strategic partnerships | Become an Investor |
| Industries | 18 industries in 3 columns | Talk to an Expert |
| Projects | Projects · Case studies · filter shortcuts by sector | Request a Service |
| About | Story, mission, vision, approach, expertise, leadership, partners, sustainability | — |

**Mobile:** drawer with accordion sections in the same order + sticky bottom bar (Call · WhatsApp · Request a Service). Signed-in users get a role switcher to their dashboard.

**Footer:** practice areas · innovation & investors · industries · company · knowledge · legal (privacy, terms, cookies, confidentiality & IP, platform terms, sitemap) · contact.

## 5. URL & routing conventions

- Public site: EN at `/…`, AR at `/ar/…` (hreflang pairs, identical slugs). Private platform: `/app/…` (never indexed, `noindex` + `Disallow`, no CDN caching of personalised responses).
- Services are **flat** under `/services/{slug}/` for both category hubs and sub-services (keeps v2 URLs stable, avoids duplicate URLs for services that belong to two categories, e.g. waste-to-energy). Hierarchy is expressed through breadcrumbs, BreadcrumbList schema and hub links, not the path.
- Requested `/researcher` is split into **`/researchers/`** (public, indexable landing) and **`/app/researcher/…`** (authenticated dashboard), so the security boundary is a path prefix enforced by middleware. Same pattern for investors (`/investors/` public, `/app/investor/` private) and corporates (`/challenges/` public, `/app/corporate/` private).
- v2 → v3 changes are 301-redirected (`docs/redirects-v3.txt`); `/insights/*` moves into the Knowledge Centre at `/knowledge/insights/*`.

## 6. Platform architecture decision (Phases 04–08)

| Layer | Decision | Why |
|---|---|---|
| Public site | Keep **Astro** static pages (current codebase) | Already scoring 99–100 Lighthouse; SEO-first |
| Platform (`/app`) | **Astro server routes on Cloudflare Workers** (`@astrojs/cloudflare`, hybrid output) | One codebase, shared design system and i18n; server-rendered, no SPA bloat |
| Database | Cloudflare **D1** (SQLite) behind a repository layer | Already used for leads; relational model fits pipeline/RBAC |
| Files | Cloudflare **R2** private bucket, signed short-lived URLs, server-side encryption, watermarking for data-room PDFs | Confidential documents never public |
| Auth | Session cookies (HttpOnly, Secure, SameSite=Lax), email + password (PBKDF2 via WebCrypto) or magic link; **TOTP MFA mandatory** for investors, reviewers, committee and admins | No third-party dependency; MFA where the risk is |
| Authorisation | RBAC from `src/data/platform.ts` + per-record rules (ownership, assignment, NDA signed) in middleware and every query | Defence in depth |
| NDA | Click-through NDA with identity, timestamp, IP hash and document hash in the audit log; optional e-signature integration `[DECISION REQUIRED]` | Fast access with evidential trail |
| Audit | Append-only audit table for every read of confidential data, download, status change and permission change | Required for IP protection and investor trust |
| Data residency | **[DECISION REQUIRED]** If confidential IP / KYC must stay in KSA, D1/R2 are swapped for a KSA-region database and object store behind the same repository interfaces | Keeps the option open without rework |

Alternative considered: Next.js + PostgreSQL. Rejected for now because it would split the codebase and duplicate the design system; the repository layer keeps a later move to PostgreSQL possible.

## 7. Page count (final for Phase 01)

| Category | Pages |
|---|---|
| A. Public website (home, about ×9, industries ×19, projects ×2, case studies ×2, partnerships ×9, contact, service request ×2, search, legal ×5, sitemap, 404) | 53 |
| B. Service pages (services hub + 8 category hubs) | 9 |
| C. Sub-service detail pages | 98 |
| D. Innovation platform | 12 |
| E. Researcher pages (incl. 7 shared auth pages) | 21 |
| F. Investor pages (8 public + 15 private) | 23 |
| G. Corporate pages (5 public + 14 private) | 19 |
| H. Knowledge pages (hub, 8 listings, 8 templates, author) | 18 |
| I. Admin pages (25 admin + 2 reviewer + 1 committee) | 28 |
| **Total page templates/routes** | **281** |

Counting rule: one row per distinct page (template counted once — e.g. one *Project Detail* template regardless of how many projects are published). 194 pages are public and indexable; each is also published in Arabic, i.e. **388 indexable URLs** at launch before any project/case-study/knowledge items are added.

Sub-services: 98 (12 consulting, 15 monitoring incl. the two approved v2 solution pages, 17 sustainability & climate incl. the two approved v2 building pages, 12 renewable energy, 15 waste, 9 circular economy, 10 water, 8 technology & innovation). Three requested items were merged because they share a search intent with an existing page: *solid waste*, *waste-to-value*, *upcycling* (reasons in `docs/page-inventory.md`).
