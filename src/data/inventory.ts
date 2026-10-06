// Phase 01 — complete page inventory. One record per page template/route (EN; public pages are
// mirrored under /ar/). Service, industry and knowledge rows are generated from the catalogue so
// counts can never drift from the architecture. `npm run inventory` exports docs/page-inventory.*.
import { ABOUT_PAGES, CATEGORIES, INDUSTRIES, KNOWLEDGE_TYPES, PARTNERSHIP_TYPES, SUB_SERVICES } from "./catalog";

export type Group =
  | "A. Public Website" | "B. Service Pages" | "C. Sub-Service Detail Pages" | "D. Innovation Platform"
  | "E. Researcher Pages" | "F. Investor Pages" | "G. Corporate Pages" | "H. Knowledge Pages" | "I. Admin Pages";

export type PageType =
  | "Home" | "Hub" | "Content" | "Category Hub" | "Service Detail" | "Industry Detail" | "Listing" | "Detail Template"
  | "Form" | "Confirmation" | "Directory" | "Dashboard" | "App List" | "App Detail" | "Workspace" | "Settings" | "Auth" | "Legal" | "Utility";

export type Access = "public" | "auth" | "researcher" | "investor" | "investor+nda" | "corporate" | "reviewer" | "committee" | "admin" | "super-admin";

export interface PageSpec {
  id: string;
  group: Group;
  name: string;
  url: string;
  type: PageType;
  user: string;
  purpose: string;
  searchIntent: string; // "—" for non-indexable/private pages
  objective: string;
  parent: string; // parent page ID
  cta: string;
  priority: "P1" | "P2" | "P3";
  phase: string;
  access: Access;
  indexable: boolean;
}

const rows: PageSpec[] = [];
let counter: Record<string, number> = {};
function add(prefix: string, p: Omit<PageSpec, "id" | "indexable"> & { indexable?: boolean }) {
  counter[prefix] = (counter[prefix] ?? 0) + 1;
  const id = `${prefix}-${String(counter[prefix]).padStart(3, "0")}`;
  rows.push({ ...p, id, indexable: p.indexable ?? (p.access === "public" && !["Confirmation", "Form"].includes(p.type) ? true : false) });
  return id;
}
const NA = "—";
const PUB = "P03 Public Website";

/* ===================== A. PUBLIC WEBSITE ===================== */
const HOME = add("PUB", { group: "A. Public Website", name: "Home", url: "/", type: "Home", user: "All visitors", purpose: "Position Selorin across consulting, solutions, innovation and investment; route each audience", searchIntent: "environmental consulting and environmental technology company Saudi Arabia", objective: "Segment visitors into service, innovation, investor and challenge journeys", parent: NA, cta: "Request a Service · Submit a Solution · Explore Investment Opportunities", priority: "P1", phase: PUB, access: "public" });
const ABOUT = add("PUB", { group: "A. Public Website", name: "About", url: "/about/", type: "Hub", user: "Clients, partners, investors", purpose: "Who Selorin is and how its consulting + innovation model works", searchIntent: "Selorin environmental company about", objective: "Build institutional trust", parent: HOME, cta: "Talk to an Expert", priority: "P1", phase: PUB, access: "public" });
const aboutPurpose: Record<string, [string, string, string]> = {
  "our-story": ["Origin and reason the company bridges research, technology and investment", "Selorin story", "Partner With Us"],
  mission: ["Mission statement and what it commits the company to", "Selorin mission environmental", "Talk to an Expert"],
  vision: ["Long-term vision for environmental technology deployment in the region", "Selorin vision", "Explore the Innovation Platform"],
  approach: ["Evidence-based method from assessment to deployment, incl. validation gates", "environmental consulting methodology", "Request a Service"],
  expertise: ["Disciplines and capability map across eight practice areas", "environmental expertise disciplines", "Talk to an Expert"],
  leadership: ["Leadership profiles and governance [COMPANY DATA REQUIRED]", "Selorin leadership", "Talk to an Expert"],
  partners: ["Partner ecosystem overview (links to Partnerships)", "Selorin partners", "Partner With Us"],
  sustainability: ["Selorin's own environmental commitments and reporting", "Selorin sustainability commitment", "Read Our Commitment"],
};
for (const a of ABOUT_PAGES) {
  const [purpose, intent, cta] = aboutPurpose[a.slug];
  add("PUB", { group: "A. Public Website", name: `About — ${a.name.en}`, url: `/about/${a.slug}/`, type: "Content", user: "Clients, partners, investors", purpose, searchIntent: intent, objective: "Trust and credibility", parent: ABOUT, cta, priority: a.slug === "leadership" ? "P2" : "P1", phase: PUB, access: "public" });
}
const INDUSTRIES_HUB = add("PUB", { group: "A. Public Website", name: "Industries", url: "/industries/", type: "Hub", user: "Sector decision makers", purpose: "Sector entry point to challenges, services and solutions", searchIntent: "environmental services by industry", objective: "Route by sector", parent: HOME, cta: "Talk to an Expert", priority: "P1", phase: PUB, access: "public" });
for (const i of INDUSTRIES) {
  add("PUB", { group: "A. Public Website", name: `Industry — ${i.name.en}`, url: `/industries/${i.slug}/`, type: "Industry Detail", user: `${i.name.en} HSE, operations and project leaders`, purpose: "Sector challenges, applicable services, solutions, case studies, regulatory considerations", searchIntent: `environmental services ${i.name.en.toLowerCase()} Saudi Arabia`, objective: "Sector-qualified service requests and challenge submissions", parent: INDUSTRIES_HUB, cta: "Request a Service · Submit a Challenge", priority: ["oil-gas", "industrial-manufacturing", "construction", "energy", "petrochemical"].includes(i.slug) ? "P1" : "P2", phase: PUB, access: "public" });
}
const PROJECTS = add("PUB", { group: "A. Public Website", name: "Projects", url: "/projects/", type: "Listing", user: "Prospective clients, investors", purpose: "Filterable portfolio (sector, service, location, type, year)", searchIntent: "environmental consulting projects Saudi Arabia", objective: "Proof of delivery", parent: HOME, cta: "Request a Service", priority: "P2", phase: PUB, access: "public" });
add("PUB", { group: "A. Public Website", name: "Project Detail (template)", url: "/projects/[slug]/", type: "Detail Template", user: "Prospective clients", purpose: "Challenge, scope, methodology, deliverables, results, impact, images, data", searchIntent: "per project", objective: "Proof of delivery", parent: PROJECTS, cta: "Discuss a Similar Project", priority: "P2", phase: PUB, access: "public" });
const CASES = add("PUB", { group: "A. Public Website", name: "Case Studies", url: "/case-studies/", type: "Listing", user: "Clients, investors", purpose: "Measured-outcome case studies", searchIntent: "environmental case studies", objective: "Evidence of impact", parent: HOME, cta: "Talk to an Expert", priority: "P2", phase: PUB, access: "public" });
add("PUB", { group: "A. Public Website", name: "Case Study (template)", url: "/case-studies/[slug]/", type: "Detail Template", user: "Clients, investors", purpose: "Challenge, baseline, solution, implementation, technology, results, environmental & economic impact, lessons", searchIntent: "per case study", objective: "Evidence of impact", parent: CASES, cta: "Request a Similar Solution", priority: "P2", phase: PUB, access: "public" });
const PARTNERS = add("PUB", { group: "A. Public Website", name: "Partnerships", url: "/partnerships/", type: "Hub", user: "Universities, technology firms, manufacturers, investors, industry", purpose: "Partnership models and how each partner type engages", searchIntent: "environmental technology partnership Saudi Arabia", objective: "Partner acquisition", parent: HOME, cta: "Partner With Us", priority: "P2", phase: PUB, access: "public" });
for (const p of PARTNERSHIP_TYPES) {
  add("PUB", { group: "A. Public Website", name: `Partnerships — ${p.name.en}`, url: `/partnerships/${p.slug}/`, type: "Content", user: p.name.en, purpose: `Value proposition, engagement model and process for ${p.name.en.toLowerCase()}`, searchIntent: `${p.name.en.toLowerCase()} environmental partnership`, objective: "Qualified partnership enquiries", parent: PARTNERS, cta: p.cta, priority: "P2", phase: PUB, access: "public" });
}
add("PUB", { group: "A. Public Website", name: "Partnership Enquiry", url: "/partnerships/apply/", type: "Form", user: "Prospective partners", purpose: "Structured partnership enquiry (type-specific fields)", searchIntent: NA, objective: "Partner pipeline", parent: PARTNERS, cta: "Submit Enquiry", priority: "P2", phase: PUB, access: "public" });
const CONTACT = add("PUB", { group: "A. Public Website", name: "Contact", url: "/contact/", type: "Form", user: "Anyone", purpose: "General enquiries with intent routing (service, solution, investor, challenge, media)", searchIntent: "contact Selorin", objective: "Catch-all conversion", parent: HOME, cta: "Send Inquiry", priority: "P1", phase: PUB, access: "public", indexable: true });
const REQ = add("PUB", { group: "A. Public Website", name: "Service Request", url: "/request/[service]/", type: "Form", user: "Clients", purpose: "Service-specific request (service, sub-service, industry, location, type, size, regulatory requirement, timeline, attachments) → Sales/BD", searchIntent: NA, objective: "Qualified service leads", parent: HOME, cta: "Submit Request", priority: "P1", phase: "P02 Services", access: "public" });
add("PUB", { group: "A. Public Website", name: "Service Request — Received", url: "/request/received/", type: "Confirmation", user: "Clients", purpose: "Request ID and next steps", searchIntent: NA, objective: "Reassurance", parent: REQ, cta: "Explore Knowledge", priority: "P1", phase: "P02 Services", access: "public" });
add("PUB", { group: "A. Public Website", name: "Global Search", url: "/search/", type: "Utility", user: "All visitors", purpose: "Search services, sub-services, solutions, projects, case studies, research, insights, opportunities with filters", searchIntent: NA, objective: "Findability", parent: HOME, cta: NA, priority: "P2", phase: "P09 SEO + Content", access: "public", indexable: false });
for (const [slug, name] of [["privacy", "Privacy Policy"], ["terms", "Terms & Conditions"], ["cookies", "Cookie Policy"], ["confidentiality", "Confidentiality & IP Policy"], ["platform-terms", "Platform Terms of Use"]] as const) {
  add("PUB", { group: "A. Public Website", name, url: `/legal/${slug}/`, type: "Legal", user: "All users", purpose: `${name} [COMPANY DATA REQUIRED: legal review]`, searchIntent: `Selorin ${name.toLowerCase()}`, objective: "Compliance (PDPL, IP protection)", parent: HOME, cta: NA, priority: slug === "privacy" || slug === "platform-terms" || slug === "confidentiality" ? "P1" : "P2", phase: PUB, access: "public" });
}
add("PUB", { group: "A. Public Website", name: "HTML Sitemap", url: "/sitemap/", type: "Utility", user: "Visitors, crawlers", purpose: "All public pages (noindex, follow)", searchIntent: NA, objective: "Crawlability", parent: HOME, cta: NA, priority: "P3", phase: "P09 SEO + Content", access: "public", indexable: false });
add("PUB", { group: "A. Public Website", name: "Not Found", url: "/404", type: "Utility", user: "Visitors", purpose: "Recovery routes", searchIntent: NA, objective: "Retention", parent: HOME, cta: "Request a Service", priority: "P2", phase: PUB, access: "public", indexable: false });

/* ===================== B. SERVICE PAGES ===================== */
const SERVICES = add("SRV", { group: "B. Service Pages", name: "Services", url: "/services/", type: "Hub", user: "Clients", purpose: "Eight practice areas with sub-service navigation", searchIntent: "environmental services Saudi Arabia", objective: "Route to the right practice area", parent: HOME, cta: "Request a Service", priority: "P1", phase: "P02 Services", access: "public" });
const catIds: Record<string, string> = {};
for (const c of CATEGORIES) {
  catIds[c.slug] = add("SRV", { group: "B. Service Pages", name: c.name.en, url: `/services/${c.slug}/`, type: "Category Hub", user: "Clients", purpose: `Practice-area overview, sub-service map, industries, case studies for ${c.name.en}`, searchIntent: c.intent, objective: "Category ranking + routing to sub-services", parent: SERVICES, cta: c.slug === "environmental-technology" ? "Submit a Solution · Request a Technology Assessment" : "Request a Service", priority: "P1", phase: "P02 Services", access: "public" });
}

/* ===================== C. SUB-SERVICE DETAIL PAGES ===================== */
for (const ss of SUB_SERVICES) {
  add("SVC", { group: "C. Sub-Service Detail Pages", name: ss.name.en, url: `/services/${ss.slug}/`, type: "Service Detail", user: "Clients (decision makers + technical leads)", purpose: ss.distinct, searchIntent: ss.intent, objective: "Qualified service requests", parent: catIds[ss.category], cta: "Request This Service", priority: ["environmental-permitting", "environmental-impact-assessment", "environmental-compliance", "dust-monitoring", "fuel-station-voc-monitoring", "air-quality-monitoring", "ghg-accounting", "esg-reporting", "hazardous-waste", "technology-assessment", "pilot-development", "technology-commercialization"].includes(ss.slug) ? "P1" : "P2", phase: "P02 Services", access: "public" });
}

/* ===================== D. INNOVATION PLATFORM ===================== */
const INN = add("INN", { group: "D. Innovation Platform", name: "Environmental Innovation Platform", url: "/innovation/", type: "Hub", user: "Researchers, technology providers, corporates, investors", purpose: "From Research to Real-World Impact — how Selorin identifies, validates, develops and commercialises technologies", searchIntent: "environmental innovation platform technology commercialization", objective: "Solution submissions, challenges, investor interest", parent: HOME, cta: "Submit a Solution · Explore Solutions", priority: "P1", phase: "P04 Innovation", access: "public" });
const innPages: [string, string, string, string, string, PageType, "P1" | "P2" | "P3"][] = [
  ["How It Works", "/innovation/how-it-works/", "Pipeline: research → validation → pilot → commercialisation → investment → deployment", "how environmental technology commercialization works", "Explore Solutions", "Content", "P1"],
  ["TRL Framework", "/innovation/trl-framework/", "TRL 1–9 explained with evidence required and next stage", "technology readiness level TRL environmental", "Submit a Solution", "Content", "P1"],
  ["Assessment Framework", "/innovation/assessment-framework/", "10-criteria, 100-point assessment and validation gates", "environmental technology assessment criteria", "Submit a Solution", "Content", "P1"],
  ["Submission Guidelines", "/innovation/submission-guidelines/", "Eligibility, required evidence, documents, timeline", "submit environmental technology", "Submit a Solution", "Content", "P1"],
  ["Confidentiality & IP Protection", "/innovation/confidentiality-ip/", "How submissions, IP and data are protected; NDA model", "technology submission confidentiality IP", "Submit a Solution", "Content", "P1"],
  ["Pilot Programme", "/innovation/pilots/", "How pilots are designed, hosted, monitored and reported", "environmental technology pilot programme", "Host a Pilot · Submit a Solution", "Content", "P2"],
  ["For Researchers & Universities", "/researchers/", "Value proposition and journey for researchers (entry to Researcher Platform)", "commercialize environmental research Saudi Arabia", "Submit a Solution · Create Researcher Account", "Content", "P1"],
];
for (const [name, url, purpose, intent, cta, type, pr] of innPages) add("INN", { group: "D. Innovation Platform", name, url, type, user: "Researchers, technology providers", purpose, searchIntent: intent, objective: "Qualified submissions", parent: INN, cta, priority: pr, phase: "P04 Innovation", access: "public" });
const SUBMIT = add("INN", { group: "D. Innovation Platform", name: "Submit Environmental Solution", url: "/innovation/submit-solution/", type: "Form", user: "Researchers, universities, technology providers", purpose: "12-step submission (account created at step 1; drafts saved): profile, problem, solution, evidence, TRL, prototype, performance, feasibility, market, IP, investment need, documents", searchIntent: "submit environmental solution", objective: "Solution pipeline", parent: INN, cta: "Submit Solution", priority: "P1", phase: "P04 Innovation", access: "public", indexable: true });
add("INN", { group: "D. Innovation Platform", name: "Submission Received", url: "/innovation/submit-solution/received/", type: "Confirmation", user: "Submitters", purpose: "Reference number, screening timeline, next steps", searchIntent: NA, objective: "Reassurance", parent: SUBMIT, cta: "Go to My Solutions", priority: "P1", phase: "P04 Innovation", access: "auth" });
const DIR = add("INN", { group: "D. Innovation Platform", name: "Solutions Directory", url: "/innovation/solutions/", type: "Directory", user: "Corporates, investors, partners", purpose: "Search + filters (sector, TRL, country, technology type, impact, validation status, commercial stage); public-tier data only", searchIntent: "environmental technology solutions directory", objective: "Demand for validated solutions", parent: INN, cta: "Explore Solutions · Submit a Challenge", priority: "P1", phase: "P04 Innovation", access: "public" });
add("INN", { group: "D. Innovation Platform", name: "Solution Profile (template)", url: "/innovation/solutions/[slug]/", type: "Detail Template", user: "Corporates, investors", purpose: "Public profile: problem, benefit, TRL + evidence + next stage, validation status; confidential tiers gated by verification/NDA", searchIntent: "per solution", objective: "Introductions, pilots, investment interest", parent: DIR, cta: "Request Introduction · Request Due Diligence", priority: "P1", phase: "P04 Innovation", access: "public" });

/* ===================== E. RESEARCHER PAGES ===================== */
const auth: [string, string, string][] = [
  ["Sign In", "/app/login/", "Email + password / magic link; MFA for privileged roles"],
  ["Create Account", "/app/register/", "Role selection: researcher, university, technology provider, corporate, investor"],
  ["Verify Email", "/app/verify/", "Email verification"],
  ["Forgot Password", "/app/forgot-password/", "Password reset request"],
  ["Reset Password", "/app/reset-password/", "Set new password"],
  ["Onboarding", "/app/onboarding/", "Role-specific profile completion and verification documents"],
  ["Access Denied", "/app/403/", "Explains missing permission / pending verification"],
];
let AUTH_ROOT = "";
for (const [name, url, purpose] of auth) {
  const id = add("RES", { group: "E. Researcher Pages", name: `Auth — ${name}`, url, type: "Auth", user: "All platform users", purpose, searchIntent: NA, objective: "Secure access (shared by all platforms)", parent: HOME, cta: NA, priority: "P1", phase: "P05 Researcher", access: "public", indexable: false });
  if (!AUTH_ROOT) AUTH_ROOT = id;
}
const RDASH = add("RES", { group: "E. Researcher Pages", name: "Researcher Dashboard", url: "/app/researcher/", type: "Dashboard", user: "Researcher / university / technology provider", purpose: "Solutions with status, TRL (current, evidence, next stage), tasks, review requests, meetings", searchIntent: NA, objective: "Engagement and progression", parent: AUTH_ROOT, cta: "Submit a Solution", priority: "P1", phase: "P05 Researcher", access: "researcher" });
const resPages: [string, string, string, PageType, "P1" | "P2"][] = [
  ["Profile", "/app/researcher/profile/", "Researcher/institution profile, expertise, verification status", "Settings", "P1"],
  ["My Solutions", "/app/researcher/solutions/", "List of submissions with status and TRL", "App List", "P1"],
  ["Solution Detail", "/app/researcher/solutions/[id]/", "Full record, TRL panel, assessment summary shared with submitter, history", "App Detail", "P1"],
  ["Edit Solution", "/app/researcher/solutions/[id]/edit/", "Edit drafts / respond to more-information requests", "Form", "P1"],
  ["Submission Status", "/app/researcher/solutions/[id]/status/", "Stage timeline through validation gates with required evidence", "App Detail", "P1"],
  ["Review Requests", "/app/researcher/reviews/", "Questions and evidence requests from reviewers", "App List", "P1"],
  ["Documents", "/app/researcher/documents/", "Secure document library with access log", "App List", "P1"],
  ["Messages", "/app/researcher/messages/", "Threaded messaging with Selorin team", "Workspace", "P2"],
  ["Meetings", "/app/researcher/meetings/", "Meeting requests and schedule", "App List", "P2"],
  ["Pilot", "/app/researcher/pilot/", "Pilot plan, KPIs, monitoring data, reports", "Workspace", "P2"],
  ["Commercialisation", "/app/researcher/commercialization/", "Commercialisation plan, investor interest (anonymised), next steps", "Workspace", "P2"],
  ["Notifications", "/app/researcher/notifications/", "Status changes and requests", "App List", "P2"],
  ["Account Settings", "/app/researcher/settings/", "Security, MFA, notification preferences", "Settings", "P2"],
];
for (const [name, url, purpose, type, pr] of resPages) add("RES", { group: "E. Researcher Pages", name: `Researcher — ${name}`, url, type, user: "Researcher / university / technology provider", purpose, searchIntent: NA, objective: "Move solutions through validation", parent: RDASH, cta: NA, priority: pr, phase: "P05 Researcher", access: "researcher" });

/* ===================== F. INVESTOR PAGES ===================== */
const INV = add("INV", { group: "F. Investor Pages", name: "Investors — Overview", url: "/investors/", type: "Hub", user: "Investors (VC, corporate venture, family offices, funds)", purpose: "Access to validated environmental technology opportunities", searchIntent: "environmental technology investment opportunities Saudi Arabia", objective: "Investor registrations", parent: HOME, cta: "Become an Investor · Explore Investment Opportunities", priority: "P1", phase: "P06 Investor", access: "public" });
const invPublic: [string, string, string, string, string, PageType][] = [
  ["Why Invest", "/investors/why-invest/", "Thesis: market drivers, validation-first pipeline, risk reduction", "why invest in environmental technology", "Become an Investor", "Content"],
  ["Investment Process", "/investors/investment-process/", "Registration → verification → matching → NDA → due diligence → committee → deal", "environmental technology investment process", "Become an Investor", "Content"],
  ["Investment Opportunities", "/investors/opportunities/", "Public teasers of investment candidates (no confidential data)", "environmental investment opportunities", "Request Investment Memorandum", "Listing"],
  ["Opportunity Teaser (template)", "/investors/opportunities/[slug]/", "Public-tier summary; full template behind verification + NDA", "per opportunity", "Request Investment Memorandum · Request Meeting", "Detail Template"],
  ["Strategic Partnerships", "/investors/strategic-partnerships/", "Co-investment, corporate venture and strategic partner models", "strategic partnerships environmental investment", "Partner With Us", "Content"],
];
for (const [name, url, purpose, intent, cta, type] of invPublic) add("INV", { group: "F. Investor Pages", name: `Investors — ${name}`, url, type, user: "Investors", purpose, searchIntent: intent, objective: "Investor acquisition", parent: INV, cta, priority: "P1", phase: "P06 Investor", access: "public" });
const INVREG = add("INV", { group: "F. Investor Pages", name: "Investor Registration & Qualification", url: "/investors/register/", type: "Form", user: "Investors", purpose: "Capacity, sectors, geography, risk profile, technology stage, horizon, strategic interests (feeds matching)", searchIntent: "register as environmental investor", objective: "Verified investor pipeline", parent: INV, cta: "Submit Registration", priority: "P1", phase: "P06 Investor", access: "public", indexable: true });
add("INV", { group: "F. Investor Pages", name: "Investor Registration — Received", url: "/investors/register/received/", type: "Confirmation", user: "Investors", purpose: "Verification steps and timeline", searchIntent: NA, objective: "Reassurance", parent: INVREG, cta: NA, priority: "P1", phase: "P06 Investor", access: "public" });
const IDASH = add("INV", { group: "F. Investor Pages", name: "Investor Dashboard", url: "/app/investor/", type: "Dashboard", user: "Verified investors", purpose: "Matches, saved, NDA status, due diligence, meetings", searchIntent: NA, objective: "Deal flow engagement", parent: AUTH_ROOT, cta: "Explore Recommended Opportunities", priority: "P1", phase: "P06 Investor", access: "investor" });
const invPrivate: [string, string, string, PageType, Access, "P1" | "P2"][] = [
  ["Recommended Opportunities", "/app/investor/recommended/", "Matching engine results (investor profile ↔ opportunity)", "App List", "investor", "P1"],
  ["All Opportunities", "/app/investor/opportunities/", "Browse investment candidates with filters", "App List", "investor", "P1"],
  ["Investment Opportunity (full template)", "/app/investor/opportunities/[id]/", "Overview, problem, solution, technology, TRL, validation, pilot results, market, competition, impact, CAPEX/OPEX, revenue model, ask, use of funds, IP, regulatory, risks, plan, structure, partners", "App Detail", "investor+nda", "P1"],
  ["Saved Opportunities", "/app/investor/saved/", "Watchlist", "App List", "investor", "P2"],
  ["Due Diligence", "/app/investor/due-diligence/", "DD requests and status per opportunity", "App List", "investor", "P1"],
  ["Data Room", "/app/investor/due-diligence/[id]/", "Opportunity data room (watermarked, access-logged)", "Workspace", "investor+nda", "P1"],
  ["Documents", "/app/investor/documents/", "Memoranda, reports, signed documents", "App List", "investor", "P2"],
  ["NDAs", "/app/investor/ndas/", "NDA requests, signing, status", "App List", "investor", "P1"],
  ["Meetings", "/app/investor/meetings/", "Meeting requests and schedule", "App List", "investor", "P2"],
  ["Portfolio", "/app/investor/portfolio/", "Opportunities progressed to investment and their milestones", "App List", "investor", "P2"],
  ["Messages", "/app/investor/messages/", "Threaded messaging", "Workspace", "investor", "P2"],
  ["Notifications", "/app/investor/notifications/", "New matches, NDA approvals, DD updates", "App List", "investor", "P2"],
  ["Investor Profile & Preferences", "/app/investor/profile/", "Qualification data and matching preferences", "Settings", "investor", "P1"],
  ["Account Settings", "/app/investor/settings/", "Security, MFA, notifications", "Settings", "investor", "P2"],
];
for (const [name, url, purpose, type, access, pr] of invPrivate) add("INV", { group: "F. Investor Pages", name: `Investor — ${name}`, url, type, user: "Verified investors", purpose, searchIntent: NA, objective: "Diligence-backed deal flow", parent: IDASH, cta: url.includes("[id]") && type === "App Detail" ? "Request Investment Memorandum · Request Due Diligence · Request Meeting" : NA, priority: pr, phase: "P06 Investor", access });

/* ===================== G. CORPORATE PAGES ===================== */
const CH = add("COR", { group: "G. Corporate Pages", name: "Environmental Challenges", url: "/challenges/", type: "Hub", user: "Corporates, government entities", purpose: "Submit an environmental problem; challenge → matching → assessment → proposal → pilot → deployment", searchIntent: "corporate environmental challenge open innovation", objective: "Corporate challenges (demand side)", parent: HOME, cta: "Submit a Challenge", priority: "P1", phase: "P07 Corporate", access: "public" });
const CHSUB = add("COR", { group: "G. Corporate Pages", name: "Submit an Environmental Challenge", url: "/challenges/submit/", type: "Form", user: "Corporates", purpose: "Problem, current situation, baseline, environmental & economic impact, outcome, budget, timeline, location, technical & regulatory requirements, documents", searchIntent: "submit environmental challenge", objective: "Challenge pipeline", parent: CH, cta: "Submit Challenge", priority: "P1", phase: "P07 Corporate", access: "public", indexable: true });
add("COR", { group: "G. Corporate Pages", name: "Challenge Received", url: "/challenges/submit/received/", type: "Confirmation", user: "Corporates", purpose: "Reference number, scoping call, next steps", searchIntent: NA, objective: "Reassurance", parent: CHSUB, cta: NA, priority: "P1", phase: "P07 Corporate", access: "public" });
const OPEN = add("COR", { group: "G. Corporate Pages", name: "Open Challenges", url: "/challenges/open/", type: "Listing", user: "Researchers, technology providers", purpose: "Anonymised published challenges seeking solutions", searchIntent: "environmental innovation challenges open call", objective: "Supply of solutions for corporate demand", parent: CH, cta: "Respond With a Solution", priority: "P2", phase: "P07 Corporate", access: "public" });
add("COR", { group: "G. Corporate Pages", name: "Challenge Brief (template)", url: "/challenges/open/[slug]/", type: "Detail Template", user: "Researchers, technology providers", purpose: "Anonymised brief, requirements, evaluation criteria, deadline", searchIntent: "per challenge", objective: "Solution responses", parent: OPEN, cta: "Respond With a Solution", priority: "P2", phase: "P07 Corporate", access: "public" });
const CDASH = add("COR", { group: "G. Corporate Pages", name: "Corporate Dashboard", url: "/app/corporate/", type: "Dashboard", user: "Corporate clients", purpose: "Challenges, matches, proposals, pilots, project status", searchIntent: NA, objective: "Account engagement → pilots → deployments", parent: AUTH_ROOT, cta: "Submit a Challenge", priority: "P1", phase: "P07 Corporate", access: "corporate" });
const corPages: [string, string, string, PageType, "P1" | "P2"][] = [
  ["My Challenges", "/app/corporate/challenges/", "Submitted challenges and stage", "App List", "P1"],
  ["Challenge Detail", "/app/corporate/challenges/[id]/", "Pipeline: scoping → matching → assessment → proposal → pilot → deployment", "App Detail", "P1"],
  ["Recommended Solutions", "/app/corporate/solutions/", "Matched solutions (tier-appropriate data)", "App List", "P1"],
  ["Technical Proposals", "/app/corporate/proposals/", "Proposals received", "App List", "P1"],
  ["Proposal Detail", "/app/corporate/proposals/[id]/", "Scope, technology, assessment, cost, schedule; accept/request changes", "App Detail", "P1"],
  ["Pilot Projects", "/app/corporate/pilots/", "Pilot KPIs, monitoring data, reports", "Workspace", "P1"],
  ["Consultants", "/app/corporate/consultants/", "Assigned Selorin team and contacts", "App List", "P2"],
  ["Reports", "/app/corporate/reports/", "Deliverable reports", "App List", "P2"],
  ["Documents", "/app/corporate/documents/", "Secure documents", "App List", "P2"],
  ["Project Status", "/app/corporate/projects/", "Active engagements, milestones", "App List", "P2"],
  ["Messages", "/app/corporate/messages/", "Threaded messaging", "Workspace", "P2"],
  ["Notifications", "/app/corporate/notifications/", "Updates", "App List", "P2"],
  ["Account Settings", "/app/corporate/settings/", "Team members, security, notifications", "Settings", "P2"],
];
for (const [name, url, purpose, type, pr] of corPages) add("COR", { group: "G. Corporate Pages", name: `Corporate — ${name}`, url, type, user: "Corporate clients", purpose, searchIntent: NA, objective: "Challenge-to-deployment conversion", parent: CDASH, cta: NA, priority: pr, phase: "P07 Corporate", access: "corporate" });

/* ===================== H. KNOWLEDGE PAGES ===================== */
const KN = add("KNW", { group: "H. Knowledge Pages", name: "Knowledge Centre", url: "/knowledge/", type: "Hub", user: "All audiences", purpose: "Research, reports, white papers, insights, technology reviews, market intelligence, regulatory updates, news", searchIntent: "environmental knowledge centre Saudi Arabia", objective: "Organic traffic, authority, AI-search citations", parent: HOME, cta: "Talk to an Expert", priority: "P1", phase: "P09 SEO + Content", access: "public" });
for (const k of KNOWLEDGE_TYPES) {
  const list = add("KNW", { group: "H. Knowledge Pages", name: `Knowledge — ${k.name.en}`, url: `/knowledge/${k.slug}/`, type: "Listing", user: "All audiences", purpose: `${k.name.en} listing with filters (topic, sector, service)`, searchIntent: `environmental ${k.name.en.toLowerCase()} Saudi Arabia`, objective: "Topical authority", parent: KN, cta: "Talk to an Expert", priority: ["insights", "regulatory-updates", "technology-reviews"].includes(k.slug) ? "P1" : "P2", phase: "P09 SEO + Content", access: "public" });
  add("KNW", { group: "H. Knowledge Pages", name: `${k.name.en} (template)`, url: `/knowledge/${k.slug}/[slug]/`, type: "Detail Template", user: "All audiences", purpose: k.template, searchIntent: "per item", objective: "Topical authority + service/solution leads", parent: list, cta: "Related service / solution CTA", priority: ["insights", "regulatory-updates", "technology-reviews"].includes(k.slug) ? "P1" : "P2", phase: "P09 SEO + Content", access: "public" });
}
add("KNW", { group: "H. Knowledge Pages", name: "Author Profile (template)", url: "/knowledge/authors/[slug]/", type: "Detail Template", user: "All audiences", purpose: "Author credentials and articles (E-E-A-T)", searchIntent: "per author", objective: "Trust", parent: KN, cta: NA, priority: "P2", phase: "P09 SEO + Content", access: "public" });

/* ===================== I. ADMIN PAGES ===================== */
const ADM = add("ADM", { group: "I. Admin Pages", name: "Admin Dashboard", url: "/app/admin/", type: "Dashboard", user: "Administrators", purpose: "Pipeline KPIs, queues, alerts", searchIntent: NA, objective: "Operational control", parent: AUTH_ROOT, cta: NA, priority: "P1", phase: "P08 Admin", access: "admin" });
const admPages: [string, string, string, PageType, Access, "P1" | "P2"][] = [
  ["Users", "/app/admin/users/", "All users, roles, status", "App List", "admin", "P1"],
  ["User Detail", "/app/admin/users/[id]/", "Profile, roles, verification, activity", "App Detail", "admin", "P1"],
  ["Researchers & Providers", "/app/admin/researchers/", "Verification queue and profiles", "App List", "admin", "P1"],
  ["Investors", "/app/admin/investors/", "Qualification and verification (KYC) queue", "App List", "admin", "P1"],
  ["Corporates", "/app/admin/corporates/", "Corporate accounts", "App List", "admin", "P1"],
  ["Solutions", "/app/admin/solutions/", "Pipeline board by status", "App List", "admin", "P1"],
  ["Solution Review", "/app/admin/solutions/[id]/", "Screening, reviewer assignment, gate decisions, TRL verification", "Workspace", "admin", "P1"],
  ["Challenges", "/app/admin/challenges/", "Challenge queue", "App List", "admin", "P1"],
  ["Challenge Matching", "/app/admin/challenges/[id]/", "Scoping, matching solutions, proposal preparation", "Workspace", "admin", "P1"],
  ["Reviews", "/app/admin/reviews/", "Reviewer assignments, SLAs, conflicts of interest", "App List", "admin", "P1"],
  ["Technology Assessments", "/app/admin/assessments/", "Scores (100-point), criteria breakdown, history", "App List", "admin", "P1"],
  ["Investment Opportunities", "/app/admin/opportunities/", "Opportunity records and publication tiers", "App List", "admin", "P1"],
  ["Opportunity Editor", "/app/admin/opportunities/[id]/", "Full template editor, disclosure tiers, data room", "Workspace", "admin", "P1"],
  ["Documents", "/app/admin/documents/", "All documents, classifications, access", "App List", "admin", "P1"],
  ["NDAs", "/app/admin/ndas/", "NDA templates, requests, signatures", "App List", "admin", "P1"],
  ["Pilots", "/app/admin/pilots/", "Pilot portfolio", "App List", "admin", "P2"],
  ["Projects & Case Studies", "/app/admin/projects/", "Projects/case studies publication", "App List", "admin", "P2"],
  ["Service Requests", "/app/admin/service-requests/", "Leads from service request forms (Sales/BD)", "App List", "admin", "P1"],
  ["Content", "/app/admin/content/", "Link-out to headless CMS + publishing status", "App List", "admin", "P2"],
  ["Analytics", "/app/admin/analytics/", "Funnel and conversion analytics", "Dashboard", "admin", "P2"],
  ["Notifications", "/app/admin/notifications/", "System notifications and templates", "App List", "admin", "P2"],
  ["Audit Log", "/app/admin/audit-log/", "Immutable access and change log", "App List", "admin", "P1"],
  ["Roles & Permissions", "/app/admin/roles/", "RBAC matrix (super admin only)", "Settings", "super-admin", "P1"],
  ["Settings", "/app/admin/settings/", "System settings, integrations (super admin only)", "Settings", "super-admin", "P2"],
];
for (const [name, url, purpose, type, access, pr] of admPages) add("ADM", { group: "I. Admin Pages", name: `Admin — ${name}`, url, type, user: access === "super-admin" ? "Super administrators" : "Administrators", purpose, searchIntent: NA, objective: "Governed pipeline operations", parent: ADM, cta: NA, priority: pr, phase: "P08 Admin", access });
const REV = add("ADM", { group: "I. Admin Pages", name: "Review Workspace — My Assignments", url: "/app/review/", type: "App List", user: "Scientific / technical / commercial reviewers", purpose: "Assigned reviews with deadlines and conflict-of-interest declaration", searchIntent: NA, objective: "Timely, independent reviews", parent: AUTH_ROOT, cta: NA, priority: "P1", phase: "P08 Admin", access: "reviewer" });
add("ADM", { group: "I. Admin Pages", name: "Review Workspace — Assessment Form", url: "/app/review/[id]/", type: "Workspace", user: "Reviewers", purpose: "Score assigned criteria 0–5 with evidence notes; recommendation", searchIntent: NA, objective: "Structured, auditable scoring", parent: REV, cta: NA, priority: "P1", phase: "P08 Admin", access: "reviewer" });
add("ADM", { group: "I. Admin Pages", name: "Investment Committee", url: "/app/committee/", type: "Workspace", user: "Investment committee", purpose: "Candidates for investment gate, scores, evidence, decisions, minutes", searchIntent: NA, objective: "Governed investment gate", parent: AUTH_ROOT, cta: NA, priority: "P1", phase: "P08 Admin", access: "committee" });

export const PAGES = rows;

export function summary() {
  const by = (k: keyof PageSpec) => rows.reduce<Record<string, number>>((m, r) => ((m[String(r[k])] = (m[String(r[k])] ?? 0) + 1), m), {});
  return { total: rows.length, byGroup: by("group"), byPhase: by("phase"), byAccess: by("access"), byPriority: by("priority"), indexable: rows.filter((r) => r.indexable).length };
}
