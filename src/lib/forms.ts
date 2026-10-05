// Smart service-request form definition.
// Shared by the browser (rendering + client-side validation) and the Cloudflare Function
// (authoritative server-side validation), so both always agree on fields and rules.

export type FormLang = "en" | "ar";
export type Family = "permitting" | "studies" | "monitoring" | "waste" | "sustainability" | "buildings";
type L = { en: string; ar: string };

export interface Option { value: string; en: string; ar: string }
export interface Field {
  name: string;
  type: "text" | "email" | "tel" | "number" | "date" | "select" | "multi" | "textarea";
  label: L;
  hint?: L;
  required?: boolean;
  options?: Option[];
  min?: number;
  max?: number;
  maxLength?: number;
  /** Only shown (and only validated) when another field has one of these values. */
  showIf?: { field: string; in: string[] };
  autocomplete?: string;
}

const o = (value: string, en: string, ar: string): Option => ({ value, en, ar });

/** Service slug → English name (used in email subjects and CRM payloads). Kept in sync with content by a test. */
export const SERVICES: Record<string, { en: string; ar: string; family: Family }> = {
  "environmental-permitting": { en: "Environmental Permitting", ar: "التصاريح البيئية", family: "permitting" },
  "environmental-compliance": { en: "Environmental Compliance", ar: "الامتثال البيئي", family: "permitting" },
  "environmental-records": { en: "Environmental Records & Reporting", ar: "السجلات والتقارير البيئية", family: "permitting" },
  "environmental-audits": { en: "Environmental Audits", ar: "التدقيق البيئي", family: "permitting" },
  "environmental-due-diligence": { en: "Environmental Due Diligence", ar: "الفحص البيئي النافي للجهالة", family: "permitting" },
  "environmental-impact-assessment": { en: "Environmental Impact Assessment", ar: "تقييم الأثر البيئي", family: "studies" },
  "environmental-management-plans": { en: "Environmental Management Plans", ar: "خطط الإدارة البيئية", family: "studies" },
  "environmental-monitoring": { en: "Environmental Monitoring", ar: "الرصد البيئي", family: "monitoring" },
  "air-quality-monitoring": { en: "Air Quality & Emissions Monitoring", ar: "رصد جودة الهواء والانبعاثات", family: "monitoring" },
  "dust-monitoring": { en: "Dust Monitoring", ar: "رصد الغبار", family: "monitoring" },
  "fuel-station-voc-monitoring": { en: "Fuel Station VOC Monitoring", ar: "رصد المركبات العضوية المتطايرة في محطات الوقود", family: "monitoring" },
  "noise-monitoring": { en: "Noise & Vibration Monitoring", ar: "رصد الضوضاء والاهتزاز", family: "monitoring" },
  "water-quality-monitoring": { en: "Water & Wastewater Quality Monitoring", ar: "رصد جودة المياه ومياه الصرف", family: "monitoring" },
  "waste-management": { en: "Waste Management", ar: "إدارة النفايات", family: "waste" },
  "circular-economy": { en: "Circular Economy", ar: "الاقتصاد الدائري", family: "waste" },
  "esg-advisory": { en: "ESG Advisory", ar: "استشارات الحوكمة البيئية والاجتماعية والمؤسسية", family: "sustainability" },
  "ghg-carbon-accounting": { en: "GHG & Carbon Accounting", ar: "حصر انبعاثات غازات الاحتباس الحراري", family: "sustainability" },
  "net-zero-advisory": { en: "Net Zero Advisory", ar: "استشارات الحياد الصفري", family: "sustainability" },
  "sustainability-advisory": { en: "Sustainability Advisory", ar: "استشارات الاستدامة", family: "sustainability" },
  "life-cycle-assessment": { en: "Life Cycle Assessment", ar: "تقييم دورة الحياة", family: "sustainability" },
  "sustainable-buildings": { en: "Sustainable Buildings", ar: "المباني المستدامة", family: "buildings" },
  "green-building-advisory": { en: "Green Building Advisory", ar: "استشارات المباني الخضراء", family: "buildings" },
};

export const INDUSTRIES: Option[] = [
  o("industrial-manufacturing", "Industrial & Manufacturing", "الصناعة والتصنيع"),
  o("construction", "Construction & Contracting", "البناء والمقاولات"),
  o("real-estate", "Real Estate Development", "التطوير العقاري"),
  o("infrastructure", "Infrastructure", "البنية التحتية"),
  o("energy", "Energy & Utilities", "الطاقة والمرافق"),
  o("oil-gas", "Oil & Gas", "النفط والغاز"),
  o("logistics-warehousing", "Logistics & Warehousing", "الخدمات اللوجستية والمستودعات"),
  o("food-beverage", "Food & Beverage", "الأغذية والمشروبات"),
  o("healthcare", "Healthcare", "الرعاية الصحية"),
  o("hospitality", "Hospitality & Tourism", "الضيافة والسياحة"),
  o("mining-quarrying", "Mining & Quarrying", "التعدين والمحاجر"),
  o("waste-recycling", "Waste Management & Recycling", "إدارة النفايات وإعادة التدوير"),
  o("government-public-sector", "Government & Semi-Government", "الجهات الحكومية وشبه الحكومية"),
  o("commercial-facilities", "Commercial Facilities", "المنشآت التجارية"),
  o("other", "Other", "أخرى"),
];

const facilityType: Field = {
  name: "facilityType", type: "select", required: true,
  label: { en: "Facility / project type", ar: "نوع المنشأة أو المشروع" },
  options: [
    o("factory", "Factory / industrial plant", "مصنع / منشأة صناعية"),
    o("construction-site", "Construction project", "مشروع إنشائي"),
    o("real-estate", "Real estate development", "مشروع تطوير عقاري"),
    o("infrastructure", "Infrastructure project", "مشروع بنية تحتية"),
    o("fuel-station", "Fuel station", "محطة وقود"),
    o("warehouse", "Warehouse / logistics", "مستودع / مركز لوجستي"),
    o("commercial", "Commercial facility", "منشأة تجارية"),
    o("healthcare", "Healthcare facility", "منشأة صحية"),
    o("hospitality", "Hotel / hospitality", "فندق / منشأة ضيافة"),
    o("quarry", "Quarry / mine / crusher", "محجر / منجم / كسارة"),
    o("other", "Other", "أخرى"),
  ],
};

const projectStatus: Field = {
  name: "projectStatus", type: "select", required: true,
  label: { en: "Project status", ar: "حالة المشروع" },
  options: [
    o("planning", "Planning / feasibility", "تخطيط / دراسة جدوى"),
    o("design", "Design", "تصميم"),
    o("construction", "Under construction", "قيد الإنشاء"),
    o("operating", "Operating", "قيد التشغيل"),
    o("expansion", "Expansion or change of activity", "توسعة أو تغيير نشاط"),
  ],
};

const yesNo = (name: string, en: string, ar: string, required = false): Field => ({
  name, type: "select", required, label: { en, ar },
  options: [o("yes", "Yes", "نعم"), o("no", "No", "لا"), o("not-sure", "Not sure", "غير متأكد")],
});

const FAMILY_FIELDS: Record<Family, Field[]> = {
  permitting: [
    facilityType,
    projectStatus,
    {
      name: "permitType", type: "select", required: true,
      label: { en: "Environmental permit type", ar: "نوع التصريح البيئي" },
      options: [
        o("construction", "Construction permit", "تصريح إنشاء"),
        o("operation", "Operation permit", "تصريح تشغيل"),
        o("renewal", "Permit renewal", "تجديد تصريح"),
        o("modification", "Permit modification", "تعديل تصريح"),
        o("not-sure", "Not sure", "غير متأكد"),
      ],
    },
    {
      name: "permitStatus", type: "select", required: true,
      label: { en: "Current permit status", ar: "الوضع الحالي للتصريح" },
      options: [
        o("none", "No permit yet", "لا يوجد تصريح"),
        o("valid", "Valid", "ساري"),
        o("expiring", "Expiring soon", "يقترب من الانتهاء"),
        o("expired", "Expired", "منتهي"),
        o("notice", "Received a notice / violation", "وصلنا إشعار أو مخالفة"),
      ],
    },
    {
      name: "permitExpiry", type: "date",
      label: { en: "Permit expiry date", ar: "تاريخ انتهاء التصريح" },
      showIf: { field: "permitStatus", in: ["valid", "expiring", "expired"] },
    },
  ],
  studies: [
    facilityType,
    projectStatus,
    {
      name: "studyType", type: "select", required: true,
      label: { en: "Study required", ar: "الدراسة المطلوبة" },
      options: [
        o("eia", "Environmental impact assessment", "تقييم الأثر البيئي"),
        o("cemp", "Construction environmental management plan", "خطة الإدارة البيئية للإنشاء"),
        o("oemp", "Operational environmental management plan", "خطة الإدارة البيئية للتشغيل"),
        o("not-sure", "Not sure — need advice", "غير متأكد — أحتاج إلى استشارة"),
      ],
    },
    { name: "projectSize", type: "text", maxLength: 200, label: { en: "Project size or capacity", ar: "حجم المشروع أو طاقته" }, hint: { en: "e.g. site area, production capacity, number of units", ar: "مثل مساحة الموقع أو الطاقة الإنتاجية أو عدد الوحدات" } },
    yesNo("authorityRequest", "Has an authority requested the study?", "هل طلبت جهة مختصة إعداد الدراسة؟", true),
    { name: "targetDate", type: "date", label: { en: "Target submission date", ar: "التاريخ المستهدف للتقديم" } },
  ],
  monitoring: [
    facilityType,
    {
      name: "monitoringType", type: "multi", required: true,
      label: { en: "Monitoring type", ar: "نوع الرصد" },
      options: [
        o("ambient-air", "Ambient air quality", "جودة الهواء المحيط"),
        o("dust", "Dust / particulates (PM)", "الغبار والجسيمات (PM)"),
        o("voc", "VOC", "المركبات العضوية المتطايرة (VOC)"),
        o("stack", "Stack emissions", "انبعاثات المداخن"),
        o("noise", "Noise / vibration", "الضوضاء والاهتزاز"),
        o("water", "Water / wastewater", "المياه ومياه الصرف"),
        o("soil", "Soil / groundwater", "التربة والمياه الجوفية"),
      ],
    },
    { name: "monitoringPoints", type: "number", min: 1, max: 999, label: { en: "Number of monitoring points", ar: "عدد نقاط الرصد" }, hint: { en: "Leave blank if you need a recommendation", ar: "اتركه فارغاً إن كنت تحتاج توصية" } },
    { name: "parameters", type: "text", maxLength: 300, label: { en: "Required parameters", ar: "المعايير المطلوب قياسها" }, hint: { en: "e.g. PM10, PM2.5, NO2, noise levels, pH", ar: "مثل PM10 وPM2.5 وNO2 ومستويات الضوضاء وpH" } },
    {
      name: "duration", type: "select", required: true,
      label: { en: "Project duration", ar: "مدة الرصد" },
      options: [
        o("one-off", "One-off survey", "مسح لمرة واحدة"),
        o("short", "Less than 3 months", "أقل من 3 أشهر"),
        o("medium", "3–12 months", "من 3 إلى 12 شهراً"),
        o("continuous", "Continuous / long term", "مستمر / طويل الأمد"),
      ],
    },
    yesNo("existingData", "Do you have existing monitoring data?", "هل لديكم بيانات رصد سابقة؟"),
  ],
  waste: [
    facilityType,
    {
      name: "wasteTypes", type: "multi", required: true,
      label: { en: "Waste types", ar: "أنواع النفايات" },
      options: [
        o("general", "General / municipal", "عامة / بلدية"),
        o("hazardous", "Hazardous", "خطرة"),
        o("industrial", "Industrial non-hazardous", "صناعية غير خطرة"),
        o("cd", "Construction & demolition", "مخلفات البناء والهدم"),
        o("healthcare", "Healthcare", "نفايات الرعاية الصحية"),
        o("recyclables", "Recyclables", "قابلة لإعادة التدوير"),
      ],
    },
    { name: "volume", type: "text", maxLength: 120, label: { en: "Approximate monthly quantity", ar: "الكمية الشهرية التقريبية" } },
    {
      name: "wasteNeed", type: "multi", required: true,
      label: { en: "What do you need?", ar: "ما الذي تحتاجه؟" },
      options: [
        o("classification", "Waste classification", "تصنيف النفايات"),
        o("audit", "Waste audit", "تدقيق النفايات"),
        o("plan", "Waste management plan", "خطة إدارة النفايات"),
        o("reduction", "Waste reduction / circular economy", "تقليل النفايات / الاقتصاد الدائري"),
        o("compliance", "Compliance documentation", "مستندات الامتثال"),
      ],
    },
  ],
  sustainability: [
    {
      name: "organizationType", type: "select", required: true,
      label: { en: "Organisation type", ar: "نوع الجهة" },
      options: [
        o("listed", "Listed company", "شركة مدرجة"),
        o("private", "Private company", "شركة خاصة"),
        o("government", "Government / semi-government", "جهة حكومية أو شبه حكومية"),
        o("project", "Project / developer", "مشروع / مطوّر"),
      ],
    },
    {
      name: "sustainabilityNeed", type: "multi", required: true,
      label: { en: "Scope of support", ar: "نطاق الدعم المطلوب" },
      options: [
        o("esg-report", "ESG / sustainability report", "تقرير الحوكمة البيئية والاجتماعية / الاستدامة"),
        o("ghg", "GHG inventory / carbon footprint", "حصر الانبعاثات / البصمة الكربونية"),
        o("net-zero", "Net-zero targets and roadmap", "مستهدفات وخارطة الحياد الصفري"),
        o("strategy", "Sustainability strategy", "استراتيجية الاستدامة"),
        o("lca", "Life cycle assessment", "تقييم دورة الحياة"),
      ],
    },
    { name: "reportingYear", type: "text", maxLength: 40, label: { en: "Reporting year", ar: "سنة الإفصاح" } },
    { name: "frameworks", type: "text", maxLength: 200, label: { en: "Frameworks required (if known)", ar: "الأطر المطلوبة (إن وُجدت)" }, hint: { en: "e.g. GRI, IFRS S1/S2, GHG Protocol", ar: "مثل GRI وIFRS S1/S2 وGHG Protocol" } },
    { name: "sites", type: "number", min: 1, max: 9999, label: { en: "Number of sites / facilities", ar: "عدد المواقع أو المنشآت" } },
  ],
  buildings: [
    {
      name: "projectType", type: "select", required: true,
      label: { en: "Project type", ar: "نوع المشروع" },
      options: [
        o("commercial", "Commercial / office", "تجاري / مكتبي"),
        o("residential", "Residential", "سكني"),
        o("mixed-use", "Mixed-use", "متعدد الاستخدامات"),
        o("industrial", "Industrial / logistics", "صناعي / لوجستي"),
        o("hospitality", "Hospitality", "ضيافة"),
        o("healthcare", "Healthcare / education", "صحي / تعليمي"),
        o("infrastructure", "Infrastructure", "بنية تحتية"),
      ],
    },
    {
      name: "projectStage", type: "select", required: true,
      label: { en: "Project stage", ar: "مرحلة المشروع" },
      options: [o("concept", "Concept", "الفكرة"), o("design", "Design", "التصميم"), o("construction", "Construction", "الإنشاء"), o("operation", "Operation", "التشغيل")],
    },
    {
      name: "ratingSystem", type: "select", required: true,
      label: { en: "Rating system", ar: "نظام التقييم" },
      options: [o("leed", "LEED", "LEED"), o("mostadam", "Mostadam", "مستدام"), o("envision", "Envision", "Envision"), o("none", "No certification target", "لا يوجد هدف شهادة"), o("not-sure", "Not sure", "غير متأكد")],
    },
    { name: "grossArea", type: "text", maxLength: 80, label: { en: "Gross floor area / size", ar: "إجمالي المساحة أو الحجم" } },
  ],
};

/** Service-specific overrides: fields that replace or extend the family set. */
const SERVICE_FIELDS: Record<string, { replace?: string[]; add: Field[] }> = {
  "environmental-compliance": {
    replace: ["permitType", "permitExpiry"],
    add: [
      {
        name: "complianceNeed", type: "select", required: true,
        label: { en: "Main need", ar: "الاحتياج الرئيسي" },
        options: [
          o("inspection", "Preparing for an inspection", "الاستعداد لزيارة تفتيشية"),
          o("notice", "Responding to a notice or violation", "الرد على إشعار أو مخالفة"),
          o("ongoing", "Ongoing compliance support", "دعم مستمر للامتثال"),
          o("corrective", "Corrective action plan", "خطة إجراءات تصحيحية"),
        ],
      },
      { name: "inspectionDate", type: "date", label: { en: "Inspection or deadline date", ar: "تاريخ التفتيش أو المهلة" } },
    ],
  },
  "environmental-records": {
    replace: ["permitType", "permitExpiry"],
    add: [{
      name: "recordsScope", type: "multi", required: true,
      label: { en: "Scope", ar: "النطاق" },
      options: [
        o("registers", "Environmental registers and records", "السجلات البيئية"),
        o("reports", "Periodic environmental reports", "التقارير البيئية الدورية"),
        o("data", "Monitoring data management", "إدارة بيانات الرصد"),
        o("system", "Record-keeping system set-up", "إعداد نظام لحفظ السجلات"),
      ],
    }],
  },
  "environmental-audits": {
    replace: ["permitType", "permitStatus", "permitExpiry"],
    add: [
      {
        name: "auditType", type: "select", required: true,
        label: { en: "Audit type", ar: "نوع التدقيق" },
        options: [
          o("compliance", "Compliance audit", "تدقيق الامتثال"),
          o("gap", "Gap assessment", "تحليل الفجوات"),
          o("iso14001", "ISO 14001 internal audit", "تدقيق داخلي وفق ISO 14001"),
          o("pre-inspection", "Pre-inspection audit", "تدقيق ما قبل التفتيش"),
        ],
      },
      { name: "sites", type: "number", min: 1, max: 999, label: { en: "Number of sites", ar: "عدد المواقع" } },
    ],
  },
  "environmental-due-diligence": {
    replace: ["projectStatus", "permitType", "permitStatus", "permitExpiry"],
    add: [
      {
        name: "transactionType", type: "select", required: true,
        label: { en: "Transaction type", ar: "نوع الصفقة" },
        options: [
          o("acquisition", "Acquisition", "استحواذ"),
          o("investment", "Investment / financing", "استثمار / تمويل"),
          o("lease", "Lease", "استئجار"),
          o("land", "Land purchase", "شراء أرض"),
          o("divestment", "Divestment", "تخارج / بيع"),
        ],
      },
      { name: "deadline", type: "date", label: { en: "Transaction deadline", ar: "الموعد النهائي للصفقة" } },
    ],
  },
  "fuel-station-voc-monitoring": {
    replace: ["monitoringType", "monitoringPoints", "parameters", "duration"],
    add: [
      { name: "stations", type: "number", required: true, min: 1, max: 9999, label: { en: "Number of stations", ar: "عدد المحطات" } },
      { name: "dispensers", type: "number", min: 1, max: 999, label: { en: "Dispensers per station (approx.)", ar: "عدد المضخات في المحطة (تقريباً)" } },
      {
        name: "stationStatus", type: "select", required: true,
        label: { en: "Station status", ar: "حالة المحطة" },
        options: [
          o("operating", "Operating station", "محطة قائمة"),
          o("notice", "Received a notice from the authority", "وصلها إشعار من الجهة المختصة"),
          o("new", "New station under construction", "محطة جديدة قيد الإنشاء"),
          o("replacement", "Replacing an existing system", "استبدال نظام قائم"),
        ],
      },
    ],
  },
  "dust-monitoring": {
    replace: ["monitoringType", "parameters"],
    add: [{
      name: "procurement", type: "select", required: true,
      label: { en: "Preferred arrangement", ar: "طريقة التوريد المفضلة" },
      options: [o("purchase", "Purchase", "شراء"), o("rental", "Rental", "تأجير"), o("service", "Monitoring as a service", "خدمة رصد متكاملة"), o("not-sure", "Need advice", "أحتاج إلى استشارة")],
    }],
  },
};

export const COMMON = {
  service: { name: "service", type: "select", required: true, label: { en: "Service required", ar: "الخدمة المطلوبة" } } as Field,
  industry: { name: "industry", type: "select", required: true, label: { en: "Industry", ar: "القطاع" }, options: INDUSTRIES } as Field,
  location: { name: "location", type: "text", required: true, maxLength: 120, autocomplete: "address-level2", label: { en: "City / location", ar: "المدينة / الموقع" } } as Field,
  description: { name: "description", type: "textarea", required: true, maxLength: 4000, label: { en: "Project description", ar: "وصف المشروع" }, hint: { en: "Activities, site, timeline and what you need from us.", ar: "الأنشطة والموقع والجدول الزمني وما تحتاجه منا." } } as Field,
  company: { name: "company", type: "text", required: true, maxLength: 160, autocomplete: "organization", label: { en: "Company name", ar: "اسم الشركة" } } as Field,
  contactName: { name: "contactName", type: "text", required: true, maxLength: 120, autocomplete: "name", label: { en: "Contact person", ar: "اسم الشخص المسؤول" } } as Field,
  jobTitle: { name: "jobTitle", type: "text", maxLength: 120, autocomplete: "organization-title", label: { en: "Job title", ar: "المسمى الوظيفي" } } as Field,
  email: { name: "email", type: "email", required: true, maxLength: 160, autocomplete: "email", label: { en: "Work email", ar: "البريد الإلكتروني للعمل" } } as Field,
  phone: { name: "phone", type: "tel", required: true, maxLength: 30, autocomplete: "tel", label: { en: "Phone", ar: "رقم الجوال" } } as Field,
  preferredContact: {
    name: "preferredContact", type: "select", required: true, label: { en: "Preferred contact method", ar: "طريقة التواصل المفضلة" },
    options: [o("email", "Email", "البريد الإلكتروني"), o("phone", "Phone call", "اتصال هاتفي"), o("whatsapp", "WhatsApp", "واتساب")],
  } as Field,
  message: { name: "message", type: "textarea", required: true, maxLength: 4000, label: { en: "Message", ar: "رسالتك" } } as Field,
};

/** Service-specific fields for step 2 of the request form. */
export function serviceFields(serviceSlug: string): Field[] {
  const svc = SERVICES[serviceSlug];
  if (!svc) return [];
  const base = FAMILY_FIELDS[svc.family];
  const ov = SERVICE_FIELDS[serviceSlug];
  if (!ov) return base;
  return [...base.filter((f) => !ov.replace?.includes(f.name)), ...ov.add];
}

export const UPLOAD = {
  maxFiles: 5,
  maxTotalBytes: 10 * 1024 * 1024,
  extensions: ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "zip", "kmz"],
  accept: ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.kmz",
};

export type Values = Record<string, string | string[]>;
export type Errors = Record<string, "required" | "invalid" | "too_long" | "out_of_range">;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[0-9 ()\-]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isVisible(field: Field, values: Values): boolean {
  if (!field.showIf) return true;
  const v = values[field.showIf.field];
  return typeof v === "string" && field.showIf.in.includes(v);
}

export function validateField(field: Field, raw: string | string[] | undefined): Errors[string] | null {
  const empty = raw === undefined || (Array.isArray(raw) ? raw.length === 0 : raw.trim() === "");
  if (empty) return field.required ? "required" : null;
  if (field.type === "multi") {
    const list = Array.isArray(raw) ? raw : [raw!];
    return list.every((v) => field.options!.some((op) => op.value === v)) ? null : "invalid";
  }
  const v = (Array.isArray(raw) ? raw[0] : raw)!.trim();
  if (field.maxLength && v.length > field.maxLength) return "too_long";
  switch (field.type) {
    case "email": return EMAIL_RE.test(v) ? null : "invalid";
    case "tel": return PHONE_RE.test(v) ? null : "invalid";
    case "date": return DATE_RE.test(v) && !Number.isNaN(Date.parse(v)) ? null : "invalid";
    case "number": {
      if (!/^\d+$/.test(v)) return "invalid";
      const n = Number(v);
      return (field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max) ? "out_of_range" : null;
    }
    case "select": return field.options ? (field.options.some((op) => op.value === v) ? null : "invalid") : null;
    default: return null;
  }
}

export type FormKind = "request" | "contact";

/** Full field list for a submission, in display order. */
export function fieldsFor(kind: FormKind, serviceSlug: string | undefined): Field[] {
  const serviceField: Field = { ...COMMON.service, options: [...Object.entries(SERVICES).map(([v, s]) => o(v, s.en, s.ar)), o("other", "Other / not sure", "أخرى / غير متأكد")] };
  if (kind === "contact") {
    return [COMMON.contactName, COMMON.company, COMMON.email, COMMON.phone, { ...serviceField, required: false }, COMMON.message];
  }
  const specific = serviceSlug && SERVICES[serviceSlug] ? serviceFields(serviceSlug) : [];
  return [serviceField, COMMON.industry, COMMON.location, ...specific, COMMON.description, COMMON.company, COMMON.contactName, COMMON.jobTitle, COMMON.email, COMMON.phone, COMMON.preferredContact];
}

/** Authoritative validation (also run in the browser for instant feedback). */
export function validate(kind: FormKind, values: Values): { errors: Errors; fields: Field[] } {
  const svc = typeof values.service === "string" ? values.service : undefined;
  const fields = fieldsFor(kind, svc);
  const errors: Errors = {};
  for (const f of fields) {
    if (!isVisible(f, values)) continue;
    const e = validateField(f, values[f.name]);
    if (e) errors[f.name] = e;
  }
  if (values.consent !== "yes") errors.consent = "required";
  return { errors, fields };
}

export const ERROR_TEXT: Record<Errors[string], L> = {
  required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
  invalid: { en: "Please enter a valid value.", ar: "يرجى إدخال قيمة صحيحة." },
  too_long: { en: "This entry is too long.", ar: "النص المدخل أطول من المسموح." },
  out_of_range: { en: "Please enter a number in the allowed range.", ar: "يرجى إدخال رقم ضمن النطاق المسموح." },
};

/** Human-readable value for emails/CRM (option labels instead of codes). */
export function displayValue(field: Field, value: string | string[] | undefined, lang: FormLang = "en"): string {
  if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) return "—";
  const list = Array.isArray(value) ? value : [value];
  if (!field.options) return list.join(", ");
  return list.map((v) => field.options!.find((op) => op.value === v)?.[lang] ?? v).join(", ");
}
