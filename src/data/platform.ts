// Phase 01 — platform business logic: roles, permissions, TRL, assessment and validation gates.
// These definitions are the contract for the Innovation, Researcher, Investor, Corporate and Admin
// platforms (Phases 04–08). Server-side authorisation must read from here, never from the UI.

type L = { en: string; ar: string };

/* ----------------------------------------------------------------------------
   Roles & permissions (RBAC). Permissions are verbs on resources; "own" means
   records the user created or was explicitly granted (e.g. via an NDA).
---------------------------------------------------------------------------- */
export const ROLES = [
  "public", "researcher", "university", "technology-provider", "corporate", "investor",
  "scientific-reviewer", "technical-reviewer", "commercial-reviewer", "investment-committee",
  "admin", "super-admin",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, L> = {
  public: { en: "Public visitor", ar: "زائر" },
  researcher: { en: "Researcher / scientist", ar: "باحث / عالم" },
  university: { en: "University / research centre", ar: "جامعة / مركز أبحاث" },
  "technology-provider": { en: "Technology provider", ar: "مزوّد تقنية" },
  corporate: { en: "Corporate client", ar: "عميل مؤسسي" },
  investor: { en: "Investor", ar: "مستثمر" },
  "scientific-reviewer": { en: "Scientific reviewer", ar: "مراجع علمي" },
  "technical-reviewer": { en: "Technical reviewer", ar: "مراجع فني" },
  "commercial-reviewer": { en: "Commercial reviewer", ar: "مراجع تجاري" },
  "investment-committee": { en: "Investment committee", ar: "لجنة الاستثمار" },
  admin: { en: "Administrator", ar: "مسؤول النظام" },
  "super-admin": { en: "Super administrator", ar: "المسؤول الأعلى" },
};

export type Permission =
  | "public.read"
  | "service-request.create"
  | "solution.create" | "solution.read.own" | "solution.update.own" | "solution.read.public-profile" | "solution.read.confidential" | "solution.read.all"
  | "challenge.create" | "challenge.read.own" | "challenge.read.all"
  | "proposal.create" | "proposal.read.own"
  | "opportunity.read.teaser" | "opportunity.read.full" | "opportunity.save" | "opportunity.manage"
  | "nda.request" | "nda.sign" | "nda.manage"
  | "due-diligence.request" | "dataroom.read" | "dataroom.manage"
  | "meeting.request" | "message.send"
  | "review.read.assigned" | "review.score.scientific" | "review.score.technical" | "review.score.commercial"
  | "committee.decide"
  | "pilot.read.own" | "pilot.manage"
  | "user.verify" | "user.manage" | "role.manage"
  | "content.manage" | "analytics.read" | "audit.read" | "settings.manage";

const SUBMITTER: Permission[] = ["public.read", "service-request.create", "solution.create", "solution.read.own", "solution.update.own", "proposal.create", "proposal.read.own", "pilot.read.own", "meeting.request", "message.send", "nda.sign"];

export const PERMISSIONS: Record<Role, Permission[]> = {
  public: ["public.read", "service-request.create", "opportunity.read.teaser", "solution.read.public-profile"],
  researcher: [...SUBMITTER, "solution.read.public-profile"],
  university: [...SUBMITTER, "solution.read.public-profile"],
  "technology-provider": [...SUBMITTER, "solution.read.public-profile"],
  corporate: ["public.read", "service-request.create", "challenge.create", "challenge.read.own", "solution.read.public-profile", "pilot.read.own", "meeting.request", "message.send", "nda.request", "nda.sign"],
  // Full opportunity data only after verification AND a signed NDA for that opportunity (checked per record).
  investor: ["public.read", "opportunity.read.teaser", "opportunity.read.full", "opportunity.save", "nda.request", "nda.sign", "due-diligence.request", "dataroom.read", "meeting.request", "message.send"],
  "scientific-reviewer": ["public.read", "review.read.assigned", "review.score.scientific", "solution.read.confidential", "message.send"],
  "technical-reviewer": ["public.read", "review.read.assigned", "review.score.technical", "solution.read.confidential", "message.send"],
  "commercial-reviewer": ["public.read", "review.read.assigned", "review.score.commercial", "solution.read.confidential", "message.send"],
  "investment-committee": ["public.read", "review.read.assigned", "solution.read.confidential", "opportunity.read.full", "committee.decide", "message.send"],
  admin: ["public.read", "solution.read.all", "solution.read.confidential", "challenge.read.all", "opportunity.manage", "opportunity.read.full", "nda.manage", "dataroom.manage", "pilot.manage", "user.verify", "user.manage", "content.manage", "analytics.read", "audit.read", "message.send"],
  "super-admin": [], // filled below: everything
};
PERMISSIONS["super-admin"] = [...new Set(Object.values(PERMISSIONS).flat()), "role.manage", "settings.manage"] as Permission[];

export const can = (role: Role, p: Permission) => PERMISSIONS[role].includes(p);

/* ----------------------------------------------------------------------------
   Technology Readiness Levels — shown as level + evidence + next stage, never a bare number.
---------------------------------------------------------------------------- */
export interface TrlLevel { level: number; name: L; evidence: L; next: L; band: "research" | "development" | "demonstration" | "deployment" }
export const TRL: TrlLevel[] = [
  { level: 1, band: "research", name: { en: "Basic principles observed", ar: "رصد المبادئ الأساسية" }, evidence: { en: "Peer-reviewed or documented scientific observations", ar: "ملاحظات علمية موثقة أو منشورة ومحكّمة" }, next: { en: "Formulate the technology concept and application", ar: "صياغة مفهوم التقنية وتطبيقها" } },
  { level: 2, band: "research", name: { en: "Technology concept formulated", ar: "صياغة مفهوم التقنية" }, evidence: { en: "Concept description, analytical studies, literature review", ar: "وصف المفهوم ودراسات تحليلية ومراجعة أدبيات" }, next: { en: "Experimental proof of concept", ar: "إثبات المفهوم تجريبياً" } },
  { level: 3, band: "research", name: { en: "Experimental proof of concept", ar: "إثبات المفهوم تجريبياً" }, evidence: { en: "Laboratory results validating key functions", ar: "نتائج مخبرية تثبت الوظائف الرئيسية" }, next: { en: "Validate components in a laboratory environment", ar: "التحقق من المكونات في بيئة مخبرية" } },
  { level: 4, band: "development", name: { en: "Validated in the laboratory", ar: "تحقق مخبري" }, evidence: { en: "Integrated components tested in the lab with repeatable data", ar: "مكونات متكاملة مُختبرة مخبرياً ببيانات قابلة للتكرار" }, next: { en: "Validate in a relevant environment", ar: "التحقق في بيئة ذات صلة" } },
  { level: 5, band: "development", name: { en: "Validated in a relevant environment", ar: "تحقق في بيئة ذات صلة" }, evidence: { en: "Tests under realistic conditions (real feedstock, climate, matrix)", ar: "اختبارات في ظروف واقعية (مواد فعلية، مناخ، وسط حقيقي)" }, next: { en: "Demonstrate a prototype in a relevant environment (pilot)", ar: "عرض نموذج أولي في بيئة ذات صلة (مشروع تجريبي)" } },
  { level: 6, band: "demonstration", name: { en: "Prototype demonstrated in a relevant environment", ar: "عرض النموذج الأولي في بيئة ذات صلة" }, evidence: { en: "Pilot-scale prototype with independently monitored results", ar: "نموذج بحجم تجريبي بنتائج مرصودة بشكل مستقل" }, next: { en: "Demonstrate in an operational environment", ar: "العرض في بيئة تشغيلية" } },
  { level: 7, band: "demonstration", name: { en: "Demonstrated in an operational environment", ar: "العرض في بيئة تشغيلية" }, evidence: { en: "Near-full-scale system operating at a host site", ar: "نظام قريب من الحجم الكامل يعمل في موقع مستضيف" }, next: { en: "Complete and qualify the system", ar: "إكمال النظام وتأهيله" } },
  { level: 8, band: "deployment", name: { en: "System complete and qualified", ar: "اكتمال النظام وتأهيله" }, evidence: { en: "Qualification tests, certifications where applicable, O&M data", ar: "اختبارات التأهيل والشهادات حيث تنطبق وبيانات التشغيل والصيانة" }, next: { en: "Prove sustained operation in commercial deployment", ar: "إثبات التشغيل المستدام في نشر تجاري" } },
  { level: 9, band: "deployment", name: { en: "Proven in commercial operation", ar: "مثبت في التشغيل التجاري" }, evidence: { en: "Commercial deployments with performance and financial track record", ar: "عمليات نشر تجارية بسجل أداء ومالي" }, next: { en: "Scale deployment and replicate in new markets", ar: "توسيع النشر وتكراره في أسواق جديدة" } },
];

/* ----------------------------------------------------------------------------
   Technology assessment — 10 criteria, weighted to 100.
---------------------------------------------------------------------------- */
export interface Criterion { id: string; name: L; weight: number; reviewer: "scientific" | "technical" | "commercial" }
export const CRITERIA: Criterion[] = [
  { id: "scientific", name: { en: "Scientific validation", ar: "التحقق العلمي" }, weight: 15, reviewer: "scientific" },
  { id: "technical", name: { en: "Technical feasibility", ar: "الجدوى الفنية" }, weight: 15, reviewer: "technical" },
  { id: "environmental", name: { en: "Environmental impact", ar: "الأثر البيئي" }, weight: 15, reviewer: "scientific" },
  { id: "economic", name: { en: "Economic feasibility", ar: "الجدوى الاقتصادية" }, weight: 10, reviewer: "commercial" },
  { id: "market", name: { en: "Market potential", ar: "إمكانات السوق" }, weight: 10, reviewer: "commercial" },
  { id: "scalability", name: { en: "Scalability", ar: "قابلية التوسع" }, weight: 10, reviewer: "technical" },
  { id: "trl", name: { en: "Technology readiness (TRL)", ar: "جاهزية التقنية (TRL)" }, weight: 10, reviewer: "technical" },
  { id: "ip", name: { en: "Intellectual property", ar: "الملكية الفكرية" }, weight: 5, reviewer: "commercial" },
  { id: "regulatory", name: { en: "Regulatory pathway", ar: "المسار التنظيمي" }, weight: 5, reviewer: "technical" },
  { id: "complexity", name: { en: "Implementation complexity (inverse)", ar: "تعقيد التنفيذ (عكسي)" }, weight: 5, reviewer: "technical" },
];

/** Each criterion is scored 0–5 by its reviewer; the weighted total is 0–100. */
export function assessmentScore(scores: Record<string, number>) {
  return Math.round(CRITERIA.reduce((sum, c) => sum + (Math.min(5, Math.max(0, scores[c.id] ?? 0)) / 5) * c.weight, 0));
}

/* ----------------------------------------------------------------------------
   Solution pipeline. A score alone never promotes a solution: each gate has hard
   evidence requirements (research ≠ validated technology; patent ≠ market validation;
   prototype ≠ commercial viability; paper ≠ business case).
---------------------------------------------------------------------------- */
export const STATUSES = [
  "draft", "submitted", "rejected", "more-information", "scientific-review", "technical-review",
  "commercial-review", "pilot-candidate", "investment-candidate", "commercialization-candidate",
] as const;
export type SolutionStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<SolutionStatus, L> = {
  draft: { en: "Draft", ar: "مسودة" },
  submitted: { en: "Submitted — screening", ar: "مُقدَّم — قيد الفرز" },
  rejected: { en: "Not progressed", ar: "لم يُعتمد" },
  "more-information": { en: "More information required", ar: "مطلوب معلومات إضافية" },
  "scientific-review": { en: "Scientific review", ar: "المراجعة العلمية" },
  "technical-review": { en: "Technical review", ar: "المراجعة الفنية" },
  "commercial-review": { en: "Commercial review", ar: "المراجعة التجارية" },
  "pilot-candidate": { en: "Pilot candidate", ar: "مرشح لمشروع تجريبي" },
  "investment-candidate": { en: "Investment candidate", ar: "مرشح للاستثمار" },
  "commercialization-candidate": { en: "Commercialisation candidate", ar: "مرشح للتسويق التجاري" },
};

export interface Gate { to: SolutionStatus; minScore?: number; minTrl?: number; requires: L[] }
export const GATES: Gate[] = [
  { to: "scientific-review", requires: [{ en: "Complete submission; problem and mechanism clearly described; at least one evidence document", ar: "طلب مكتمل ووصف واضح للمشكلة وآلية الحل ووثيقة دليل واحدة على الأقل" }] },
  { to: "technical-review", minTrl: 3, requires: [{ en: "Scientific reviewer confirms the mechanism is sound and evidence is credible", ar: "تأكيد المراجع العلمي سلامة الآلية ومصداقية الأدلة" }] },
  { to: "commercial-review", minTrl: 4, requires: [{ en: "Technical reviewer confirms feasibility at the next scale and identifies key risks", ar: "تأكيد المراجع الفني الجدوى في المرحلة التالية وتحديد المخاطر الرئيسية" }] },
  { to: "pilot-candidate", minScore: 60, minTrl: 5, requires: [{ en: "Relevant-environment data; defined pilot KPIs; identified host site or challenge", ar: "بيانات من بيئة ذات صلة ومؤشرات أداء محددة للمشروع التجريبي وموقع مستضيف أو تحدٍّ محدد" }] },
  { to: "investment-candidate", minScore: 70, minTrl: 6, requires: [
    { en: "Independently monitored pilot results", ar: "نتائج مشروع تجريبي مرصودة بشكل مستقل" },
    { en: "IP position verified (ownership, filings, freedom to operate screened)", ar: "التحقق من وضع الملكية الفكرية (الملكية والإيداعات وفحص حرية التشغيل)" },
    { en: "Business case with unit economics (CAPEX, OPEX, revenue model)", ar: "دراسة جدوى بالاقتصاديات الأحادية (التكاليف الرأسمالية والتشغيلية ونموذج الإيرادات)" },
    { en: "Investment committee approval", ar: "موافقة لجنة الاستثمار" },
  ] },
  { to: "commercialization-candidate", minScore: 75, minTrl: 7, requires: [
    { en: "Operational-environment demonstration", ar: "عرض في بيئة تشغيلية" },
    { en: "Identified customers / offtake and regulatory pathway", ar: "عملاء أو اتفاقيات شراء محددة ومسار تنظيمي واضح" },
  ] },
];

/* ----------------------------------------------------------------------------
   Corporate challenge pipeline.
---------------------------------------------------------------------------- */
export const CHALLENGE_STAGES: { id: string; name: L }[] = [
  { id: "submitted", name: { en: "Submitted", ar: "مُقدَّم" } },
  { id: "scoping", name: { en: "Scoping & baseline", ar: "تحديد النطاق وخط الأساس" } },
  { id: "matching", name: { en: "Solution matching", ar: "مطابقة الحلول" } },
  { id: "assessment", name: { en: "Technical assessment", ar: "التقييم الفني" } },
  { id: "proposal", name: { en: "Proposal", ar: "العرض" } },
  { id: "pilot", name: { en: "Pilot", ar: "المشروع التجريبي" } },
  { id: "deployment", name: { en: "Deployment", ar: "التطبيق الكامل" } },
];

/* ----------------------------------------------------------------------------
   Confidentiality tiers — what each audience may see about a solution/opportunity.
---------------------------------------------------------------------------- */
export const DISCLOSURE: { tier: string; audience: L; fields: string[] }[] = [
  { tier: "public", audience: { en: "Anyone", ar: "الجميع" }, fields: ["title", "sector", "problem", "high-level benefit", "TRL band", "validation status", "commercial stage", "country"] },
  { tier: "registered", audience: { en: "Verified investors / corporates", ar: "المستثمرون والشركات الموثّقون" }, fields: ["teaser KPIs", "investment range", "use-of-funds summary", "team summary"] },
  { tier: "nda", audience: { en: "Verified + signed NDA for this record", ar: "موثّق مع اتفاقية سرية موقّعة لهذا السجل" }, fields: ["technical description", "pilot data", "financial model", "IP details", "data room"] },
  { tier: "internal", audience: { en: "Assigned reviewers, committee, admins", ar: "المراجعون المكلّفون واللجنة والمسؤولون" }, fields: ["review scores", "reviewer notes", "committee minutes", "audit log"] },
];
