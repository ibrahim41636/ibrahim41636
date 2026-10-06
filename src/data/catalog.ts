// Phase 01 — single source of truth for the service architecture and taxonomies.
// Drives page inventory, routing (Phase 02+), navigation, internal linking, search and schema.
// Every sub-service has its own search intent; overlaps are resolved explicitly (see `merges`).

type L = { en: string; ar: string };

export interface ServiceCategory {
  slug: string;
  name: L;
  /** Primary search intent the category hub targets. */
  intent: string;
  /** Legacy v2 category slugs that 301 to this hub. */
  legacy?: string[];
}

export interface SubService {
  slug: string;
  category: string;
  name: L;
  /** Primary search query (EN) — must be unique across the catalogue. */
  intent: string;
  /** What makes this page distinct from its nearest sibling. */
  distinct: string;
  /** v2 URL slug that now 301s here (approved pages are never dropped). */
  legacy?: string;
  /** Also listed (linked, not duplicated) under another category. */
  alsoIn?: string[];
}

export const CATEGORIES: ServiceCategory[] = [
  { slug: "environmental-consulting", name: { en: "Environmental Consulting", ar: "الاستشارات البيئية" }, intent: "environmental consulting Saudi Arabia", legacy: ["permitting-compliance"] },
  { slug: "environmental-monitoring", name: { en: "Environmental Monitoring", ar: "الرصد البيئي" }, intent: "environmental monitoring services Saudi Arabia", legacy: ["monitoring-measurement"] },
  { slug: "sustainability-climate", name: { en: "Sustainability & Climate", ar: "الاستدامة والمناخ" }, intent: "sustainability and climate consulting Saudi Arabia" },
  { slug: "renewable-energy", name: { en: "Renewable Energy", ar: "الطاقة المتجددة" }, intent: "renewable energy consulting Saudi Arabia" },
  { slug: "waste-management", name: { en: "Waste Management", ar: "إدارة النفايات" }, intent: "waste management consulting Saudi Arabia", legacy: ["waste-circular-economy"] },
  { slug: "circular-economy", name: { en: "Circular Economy", ar: "الاقتصاد الدائري" }, intent: "circular economy consulting Saudi Arabia" },
  { slug: "water-resource-efficiency", name: { en: "Water & Resource Efficiency", ar: "كفاءة المياه والموارد" }, intent: "water efficiency consulting Saudi Arabia" },
  { slug: "environmental-technology", name: { en: "Environmental Technology & Innovation", ar: "التقنيات البيئية والابتكار" }, intent: "environmental technology assessment and commercialization" },
];

const s = (category: string, slug: string, en: string, ar: string, intent: string, distinct: string, extra: Partial<SubService> = {}): SubService =>
  ({ slug, category, name: { en, ar }, intent, distinct, ...extra });

export const SUB_SERVICES: SubService[] = [
  // A. Environmental Consulting (12)
  s("environmental-consulting", "environmental-permitting", "Environmental Permitting", "التصاريح البيئية", "environmental permit Saudi Arabia", "Securing construction/operation permits, renewals and modifications."),
  s("environmental-consulting", "environmental-impact-assessment", "Environmental Impact Assessment", "تقييم الأثر البيئي", "environmental impact assessment Saudi Arabia", "Statutory EIA for project approval: screening to report and review responses."),
  s("environmental-consulting", "environmental-management-plans", "Environmental Management Plans", "خطط الإدارة البيئية", "environmental management plan CEMP OEMP", "Implementation plans (CEMP/OEMP) that turn approval conditions into site controls."),
  s("environmental-consulting", "environmental-compliance", "Environmental Compliance", "الامتثال البيئي", "environmental compliance services", "Ongoing obligation management, inspection readiness, responding to notices."),
  s("environmental-consulting", "environmental-auditing", "Environmental Auditing", "التدقيق البيئي", "environmental audit Saudi Arabia", "Independent point-in-time audits and gap assessments against requirements.", { legacy: "environmental-audits" }),
  s("environmental-consulting", "environmental-due-diligence", "Environmental Due Diligence", "الفحص البيئي النافي للجهالة", "environmental due diligence acquisition", "Liability and compliance findings for transactions, leases and land."),
  s("environmental-consulting", "environmental-risk-assessment", "Environmental Risk Assessment", "تقييم المخاطر البيئية", "environmental risk assessment", "Probability × consequence of environmental incidents and liabilities for operations."),
  s("environmental-consulting", "environmental-monitoring-programs", "Environmental Monitoring Programmes", "برامج الرصد البيئي", "environmental monitoring program design", "Designing multi-media monitoring programmes required by permits/EMPs.", { alsoIn: ["environmental-monitoring"] }),
  s("environmental-consulting", "environmental-remediation", "Environmental Remediation", "المعالجة البيئية للمواقع", "contaminated land remediation Saudi Arabia", "Site investigation, remediation options appraisal and closure verification."),
  s("environmental-consulting", "environmental-studies", "Specialist Environmental Studies", "الدراسات البيئية المتخصصة", "environmental baseline studies dispersion modelling", "Baseline, ecological, hydrogeological, dispersion and noise modelling studies."),
  s("environmental-consulting", "environmental-records", "Environmental Records & Reporting", "السجلات والتقارير البيئية", "environmental records and reporting", "Registers, periodic self-monitoring reports and inspection-ready record systems."),
  s("environmental-consulting", "environmental-regulatory-advisory", "Environmental Regulatory Advisory", "الاستشارات التنظيمية البيئية", "Saudi environmental regulations advisory", "Interpreting regulations and their impact on strategy, design and investment."),

  // B. Environmental Monitoring (15 — incl. two approved v2 solution pages)
  s("environmental-monitoring", "air-quality-monitoring", "Air Quality Monitoring", "رصد جودة الهواء", "air quality monitoring services", "Integrated air programmes combining ambient, workplace and source data."),
  s("environmental-monitoring", "ambient-air-monitoring", "Ambient Air Quality Monitoring Stations", "محطات رصد جودة الهواء المحيط", "ambient air quality monitoring station AAQMS", "Fixed continuous ambient stations (gases, PM, meteorology) and their operation."),
  s("environmental-monitoring", "stack-emission-monitoring", "Stack Emission Monitoring", "رصد انبعاثات المداخن", "stack emission testing CEMS", "Point-source emissions: periodic stack testing and CEMS."),
  s("environmental-monitoring", "dust-monitoring", "Dust Monitoring", "رصد الغبار", "dust monitoring PM10 PM2.5 construction", "Particulate fence-line networks for dusty sites with real-time alerts."),
  s("environmental-monitoring", "fuel-station-voc-monitoring", "Fuel Station VOC Monitoring", "رصد المركبات العضوية المتطايرة في محطات الوقود", "VOC monitoring fuel stations NCEC", "Fixed PID VOC systems for fuel stations (intrinsically safe, 4–20 mA/Modbus)."),
  s("environmental-monitoring", "noise-monitoring", "Noise Monitoring", "رصد الضوضاء", "environmental noise monitoring", "Environmental and occupational noise surveys and continuous terminals."),
  s("environmental-monitoring", "vibration-monitoring", "Vibration Monitoring", "رصد الاهتزازات", "construction vibration monitoring", "Ground/structural vibration from construction, blasting and piling."),
  s("environmental-monitoring", "water-quality-monitoring", "Water Quality Monitoring", "رصد جودة المياه", "water quality monitoring services", "Surface, ground and potable water quality against applicable standards."),
  s("environmental-monitoring", "wastewater-monitoring", "Wastewater Monitoring", "رصد مياه الصرف", "wastewater effluent monitoring", "Effluent and discharge compliance monitoring, online analysers and sampling."),
  s("environmental-monitoring", "soil-monitoring", "Soil Monitoring", "رصد التربة", "soil contamination testing", "Soil sampling and contamination screening at operating and closing sites."),
  s("environmental-monitoring", "sediment-monitoring", "Sediment Monitoring", "رصد الرواسب", "marine sediment sampling analysis", "Sediment quality for dredging, ports and outfalls."),
  s("environmental-monitoring", "marine-monitoring", "Marine Environmental Monitoring", "الرصد البيئي البحري", "marine environmental monitoring Red Sea Arabian Gulf", "Seawater, outfall plume, coral and habitat monitoring for coastal projects."),
  s("environmental-monitoring", "odor-monitoring", "Odour Monitoring", "رصد الروائح", "odour monitoring H2S wastewater plant", "Odour/H2S surveys and complaint investigation for STPs, landfills and plants."),
  s("environmental-monitoring", "meteorological-monitoring", "Meteorological Monitoring", "الرصد الجوي (الأرصاد)", "meteorological station wind monitoring", "Weather stations supporting dispersion modelling and dust/odour attribution."),
  s("environmental-monitoring", "environmental-data-management", "Environmental Data Management", "إدارة البيانات البيئية", "environmental data management platform", "Data platforms, QA/QC, dashboards and automated compliance reporting."),

  // C. Sustainability & Climate (17 — incl. two approved v2 building pages)
  s("sustainability-climate", "esg-strategy", "ESG Strategy", "استراتيجية الحوكمة البيئية والاجتماعية", "ESG strategy consulting Saudi Arabia", "Materiality, ESG priorities, governance and targets.", { legacy: "esg-advisory" }),
  s("sustainability-climate", "esg-reporting", "ESG Reporting", "إعداد تقارير الحوكمة البيئية والاجتماعية", "ESG reporting Tadawul ISSB", "Investor-facing disclosures (Saudi Exchange guidelines, IFRS S1/S2)."),
  s("sustainability-climate", "ghg-accounting", "GHG Accounting", "حصر انبعاثات غازات الاحتباس الحراري", "GHG inventory GHG Protocol ISO 14064", "Organisational GHG inventory: boundaries, methods, data system.", { legacy: "ghg-carbon-accounting" }),
  s("sustainability-climate", "scope-1-emissions", "Scope 1 Emissions", "انبعاثات النطاق الأول", "scope 1 emissions calculation", "Direct emissions: combustion, process, fugitive (refrigerants, methane)."),
  s("sustainability-climate", "scope-2-emissions", "Scope 2 Emissions", "انبعاثات النطاق الثاني", "scope 2 emissions location market based", "Purchased electricity/cooling: location- vs market-based methods."),
  s("sustainability-climate", "scope-3-emissions", "Scope 3 Emissions", "انبعاثات النطاق الثالث", "scope 3 emissions supply chain", "Value-chain emissions screening across the 15 categories and supplier data."),
  s("sustainability-climate", "carbon-footprint", "Carbon Footprint", "البصمة الكربونية", "carbon footprint calculation project event", "Footprints of projects, sites, events and services (outside full inventories)."),
  s("sustainability-climate", "net-zero-strategy", "Net Zero Strategy", "استراتيجية الحياد الصفري", "net zero strategy Saudi Arabia 2060", "Targets, pathway and governance for net zero.", { legacy: "net-zero-advisory" }),
  s("sustainability-climate", "decarbonization", "Decarbonisation", "خفض الانبعاثات الكربونية", "industrial decarbonization abatement", "Abatement options, MACC and implementation roadmap for assets."),
  s("sustainability-climate", "climate-risk", "Climate Risk Assessment", "تقييم المخاطر المناخية", "climate risk assessment TCFD physical transition", "Physical and transition risk analysis and scenario disclosure."),
  s("sustainability-climate", "climate-adaptation", "Climate Adaptation", "التكيّف المناخي", "climate adaptation heat flood resilience", "Resilience measures for heat, water stress, flooding and dust storms."),
  s("sustainability-climate", "life-cycle-assessment", "Life Cycle Assessment", "تقييم دورة الحياة", "life cycle assessment ISO 14040", "Cradle-to-grave LCA for products and design decisions."),
  s("sustainability-climate", "environmental-product-assessment", "Environmental Product Declarations", "إقرارات الأداء البيئي للمنتجات", "EPD environmental product declaration", "EPD preparation support and product environmental claims substantiation."),
  s("sustainability-climate", "sustainability-strategy", "Sustainability Strategy", "استراتيجية الاستدامة", "corporate sustainability strategy", "Strategy, policies, KPIs and roadmap beyond disclosure.", { legacy: "sustainability-advisory" }),
  s("sustainability-climate", "sustainability-reporting", "Sustainability Reporting", "تقارير الاستدامة", "sustainability report GRI", "Stakeholder sustainability reports (GRI-based), distinct from investor ESG disclosure."),
  s("sustainability-climate", "sustainable-buildings", "Sustainable Buildings", "المباني المستدامة", "sustainable building design advisory", "Design-stage environmental performance of buildings."),
  s("sustainability-climate", "green-building-advisory", "Green Building Certification", "شهادات المباني الخضراء", "LEED Mostadam certification consultant", "LEED / Mostadam / Envision certification support."),

  // D. Renewable Energy (12)
  s("renewable-energy", "solar-energy", "Solar Energy Advisory", "استشارات الطاقة الشمسية", "solar energy consultant Saudi Arabia", "Technology-neutral solar strategy (PV, thermal) for organisations."),
  s("renewable-energy", "solar-pv", "Solar PV Systems", "أنظمة الطاقة الشمسية الكهروضوئية", "rooftop solar PV commercial industrial", "Rooftop/ground-mount PV technical advisory, design review and owner's engineering."),
  s("renewable-energy", "solar-feasibility-studies", "Solar Feasibility Studies", "دراسات جدوى الطاقة الشمسية", "solar feasibility study", "Yield, sizing, grid, financial model and environmental screening."),
  s("renewable-energy", "solar-project-development", "Solar Project Development", "تطوير مشاريع الطاقة الشمسية", "solar project development permitting", "Development support: permitting, EIA, procurement and lender requirements."),
  s("renewable-energy", "energy-storage", "Energy Storage Advisory", "استشارات تخزين الطاقة", "energy storage consulting thermal storage", "Technology-neutral storage (thermal, electrochemical, hydrogen-ready) evaluation."),
  s("renewable-energy", "battery-energy-storage", "Battery Energy Storage Systems", "أنظمة تخزين الطاقة بالبطاريات", "BESS battery energy storage system", "BESS sizing, safety, environmental and end-of-life planning."),
  s("renewable-energy", "energy-efficiency", "Energy Efficiency", "كفاءة الطاقة", "industrial energy efficiency consulting", "Efficiency programmes and measures implementation."),
  s("renewable-energy", "energy-audits", "Energy Audits", "تدقيق الطاقة", "energy audit Saudi Arabia", "Measured audits identifying savings with payback analysis."),
  s("renewable-energy", "energy-management", "Energy Management Systems", "أنظمة إدارة الطاقة", "ISO 50001 energy management system", "EnMS (ISO 50001-aligned), metering and KPIs."),
  s("renewable-energy", "renewable-energy-integration", "Renewable Energy Integration", "دمج الطاقة المتجددة", "renewable energy integration grid industrial", "Integrating renewables into sites: grid, load, hybrid systems."),
  s("renewable-energy", "clean-energy-strategy", "Clean Energy Strategy", "استراتيجية الطاقة النظيفة", "clean energy transition strategy", "Organisation-level energy transition and procurement strategy."),
  s("renewable-energy", "waste-to-energy", "Waste-to-Energy", "تحويل النفايات إلى طاقة", "waste to energy feasibility Saudi Arabia", "WtE feasibility, technology selection and environmental permitting.", { alsoIn: ["waste-management"] }),

  // E. Waste Management (15) — "solid waste" merged (see merges)
  s("waste-management", "industrial-waste", "Industrial Waste Management", "إدارة النفايات الصناعية", "industrial waste management Saudi Arabia", "Process wastes from manufacturing: inventory, routes, compliance."),
  s("waste-management", "municipal-waste", "Municipal Solid Waste", "النفايات البلدية الصلبة", "municipal solid waste management", "MSW planning for municipalities, communities and large developments."),
  s("waste-management", "hazardous-waste", "Hazardous Waste Management", "إدارة النفايات الخطرة", "hazardous waste management MWAN", "Classification, storage, manifests and licensed hazardous routes."),
  s("waste-management", "non-hazardous-waste", "Non-Hazardous Waste Management", "إدارة النفايات غير الخطرة", "non hazardous waste management", "Commercial/industrial non-hazardous streams and diversion."),
  s("waste-management", "construction-demolition-waste", "Construction & Demolition Waste", "مخلفات البناء والهدم", "construction and demolition waste management", "C&D waste plans, segregation, recycling targets on site."),
  s("waste-management", "liquid-waste", "Liquid Waste Management", "إدارة النفايات السائلة", "liquid waste disposal management", "Sludges, oily water and liquid industrial wastes."),
  s("waste-management", "organic-waste", "Organic Waste Management", "إدارة النفايات العضوية", "organic waste composting anaerobic digestion", "Green/organic streams: composting, AD, soil amendment routes."),
  s("waste-management", "food-waste", "Food Waste Reduction", "تقليل هدر الطعام", "food waste reduction hotels restaurants", "Measurement and reduction programmes for F&B, hospitality and retail."),
  s("waste-management", "medical-waste", "Healthcare Waste Management", "إدارة نفايات الرعاية الصحية", "medical waste management Saudi Arabia", "Healthcare risk waste segregation, storage and treatment compliance."),
  s("waste-management", "waste-transportation", "Waste Transportation Compliance", "امتثال نقل النفايات", "licensed waste transportation", "Transporter licensing checks, manifests and chain of custody (advisory/oversight)."),
  s("waste-management", "waste-treatment", "Waste Treatment Advisory", "استشارات معالجة النفايات", "waste treatment technology selection", "Treatment technology options and facility design review."),
  s("waste-management", "waste-disposal", "Waste Disposal Compliance", "امتثال التخلص من النفايات", "waste disposal compliance landfill", "Disposal route verification and landfill/receiver compliance."),
  s("waste-management", "waste-tracking", "Waste Tracking", "تتبّع النفايات", "waste tracking system manifest", "Digital tracking, manifests and reporting across sites."),
  s("waste-management", "waste-auditing", "Waste Audits", "تدقيق النفايات", "waste audit composition study", "Waste composition and generation audits."),
  s("waste-management", "waste-minimization", "Waste Minimisation", "تقليل توليد النفايات", "waste minimization program", "Source reduction programmes and targets."),

  // F. Circular Economy (9) — waste-to-value and upcycling merged (see merges)
  s("circular-economy", "circular-economy-strategy", "Circular Economy Strategy", "استراتيجية الاقتصاد الدائري", "circular economy strategy", "Organisation-wide circular strategy and roadmap."),
  s("circular-economy", "resource-recovery", "Resource Recovery", "استرداد الموارد", "resource recovery energy water nutrients", "Recovering energy, water and nutrients from waste streams."),
  s("circular-economy", "material-recovery", "Material Recovery Facilities", "مرافق استرداد المواد", "material recovery facility MRF feasibility", "MRF feasibility, design review and offtake."),
  s("circular-economy", "recycling", "Recycling Programmes", "برامج إعادة التدوير", "recycling program companies", "Recycling schemes, contractors and performance tracking."),
  s("circular-economy", "waste-valorization", "Waste Valorisation & Waste-to-Value", "تثمين النفايات وتحويلها إلى قيمة", "waste valorization by-products", "Turning residues and by-products into saleable products."),
  s("circular-economy", "industrial-symbiosis", "Industrial Symbiosis", "التكافل الصناعي", "industrial symbiosis industrial city", "Matching wastes/by-products between facilities in industrial cities."),
  s("circular-economy", "reuse-upcycling", "Reuse & Upcycling", "إعادة الاستخدام والتدوير الإبداعي", "reuse and upcycling programs", "Keeping products/materials in use at higher value."),
  s("circular-economy", "circular-manufacturing", "Circular Manufacturing", "التصنيع الدائري", "circular manufacturing design for disassembly", "Design for circularity, remanufacturing and take-back."),
  s("circular-economy", "circular-supply-chain", "Circular Supply Chains", "سلاسل الإمداد الدائرية", "circular supply chain procurement", "Circular procurement and reverse logistics."),

  // G. Water & Resource Efficiency (10)
  s("water-resource-efficiency", "water-audits", "Water Audits", "تدقيق استهلاك المياه", "water audit facility", "Measured water balance and loss identification."),
  s("water-resource-efficiency", "water-efficiency", "Water Efficiency Programmes", "برامج كفاءة المياه", "water efficiency program industrial commercial", "Implementing and tracking water-saving measures."),
  s("water-resource-efficiency", "wastewater-management", "Wastewater Management", "إدارة مياه الصرف", "industrial wastewater management compliance", "Discharge compliance, pretreatment and operations.", { alsoIn: ["environmental-consulting"] }),
  s("water-resource-efficiency", "wastewater-treatment-advisory", "Wastewater Treatment Advisory", "استشارات معالجة مياه الصرف", "wastewater treatment plant design review", "Technology selection, design review and performance troubleshooting."),
  s("water-resource-efficiency", "water-reuse", "Water Reuse", "إعادة استخدام المياه", "treated wastewater reuse Saudi Arabia", "TSE reuse schemes: quality, permitting, end uses."),
  s("water-resource-efficiency", "industrial-water-solutions", "Industrial Water Solutions", "حلول المياه الصناعية", "industrial water treatment solutions", "Process water, cooling water and zero-liquid-discharge options."),
  s("water-resource-efficiency", "water-risk-assessment", "Water Risk Assessment", "تقييم المخاطر المائية", "water risk assessment water stress", "Site and portfolio water-stress and supply risk."),
  s("water-resource-efficiency", "water-footprint", "Water Footprint", "البصمة المائية", "water footprint assessment ISO 14046", "Product/organisation water footprint (ISO 14046)."),
  s("water-resource-efficiency", "desalination-advisory", "Desalination Advisory", "استشارات تحلية المياه", "desalination brine environmental", "Environmental aspects of desalination: brine, intake, energy."),
  s("water-resource-efficiency", "resource-efficiency", "Resource Efficiency", "كفاءة الموارد", "resource efficiency cleaner production", "Cleaner production across materials, energy and water."),

  // H. Environmental Technology & Innovation (8)
  s("environmental-technology", "technology-assessment", "Technology Assessment", "تقييم التقنيات", "environmental technology assessment", "Independent assessment of a technology's claims, fit and risks."),
  s("environmental-technology", "technology-validation", "Technology Validation", "التحقق من التقنيات", "environmental technology verification testing", "Test protocols and verification of performance claims."),
  s("environmental-technology", "environmental-technology-selection", "Environmental Technology Selection", "اختيار التقنيات البيئية", "environmental technology selection", "Comparing vendor technologies for a defined problem (buyer-side)."),
  s("environmental-technology", "pilot-development", "Pilot Development", "تطوير المشاريع التجريبية", "pilot project design environmental technology", "Designing pilots: objectives, KPIs, site, protocol."),
  s("environmental-technology", "pilot-management", "Pilot Management", "إدارة المشاريع التجريبية", "pilot project management", "Running pilots: monitoring, data, independent reporting."),
  s("environmental-technology", "technology-commercialization", "Technology Commercialisation", "تسويق التقنيات تجارياً", "technology commercialization environmental", "Market entry, business model and partner strategy for technologies."),
  s("environmental-technology", "environmental-innovation", "Corporate Environmental Innovation", "الابتكار البيئي للمؤسسات", "corporate open innovation environmental challenges", "Open-innovation programmes that source solutions for corporate challenges."),
  s("environmental-technology", "research-commercialization", "Research Commercialisation", "تحويل الأبحاث إلى منتجات تجارية", "research commercialization university technology transfer", "Taking university/lab research to a validated business case."),
];

/** Requested sub-services intentionally merged because they share one search intent. */
export const MERGES: { requested: string; into: string; reason: string }[] = [
  { requested: "solid-waste", into: "municipal-waste / non-hazardous-waste", reason: "\"Solid waste\" is a physical form, not a service line; searchers mean municipal or non-hazardous solid waste, which both have pages." },
  { requested: "waste-to-value", into: "waste-valorization", reason: "Same search intent and same deliverables as waste valorisation." },
  { requested: "upcycling", into: "reuse-upcycling", reason: "Low standalone B2B search demand; delivered within reuse programmes." },
];

export interface Industry { slug: string; name: L; legacy?: string }
export const INDUSTRIES: Industry[] = [
  { slug: "oil-gas", name: { en: "Oil & Gas", ar: "النفط والغاز" } },
  { slug: "petrochemical", name: { en: "Petrochemicals", ar: "البتروكيماويات" } },
  { slug: "industrial-manufacturing", name: { en: "Manufacturing", ar: "التصنيع" } },
  { slug: "industrial-facilities", name: { en: "Industrial Facilities & Industrial Cities", ar: "المنشآت والمدن الصناعية" } },
  { slug: "construction", name: { en: "Construction", ar: "البناء والمقاولات" } },
  { slug: "real-estate", name: { en: "Real Estate", ar: "التطوير العقاري" } },
  { slug: "hospitality", name: { en: "Hospitality & Tourism", ar: "الضيافة والسياحة" } },
  { slug: "healthcare", name: { en: "Healthcare", ar: "الرعاية الصحية" } },
  { slug: "food-beverage", name: { en: "Food & Beverage", ar: "الأغذية والمشروبات" } },
  { slug: "agriculture", name: { en: "Agriculture", ar: "الزراعة" } },
  { slug: "mining-quarrying", name: { en: "Mining & Quarrying", ar: "التعدين والمحاجر" } },
  { slug: "logistics-warehousing", name: { en: "Logistics & Warehousing", ar: "الخدمات اللوجستية والمستودعات" } },
  { slug: "transportation", name: { en: "Transportation", ar: "النقل" } },
  { slug: "energy", name: { en: "Energy & Utilities", ar: "الطاقة والمرافق" } },
  { slug: "government-public-sector", name: { en: "Government", ar: "القطاع الحكومي" } },
  { slug: "infrastructure", name: { en: "Infrastructure", ar: "البنية التحتية" } },
  { slug: "commercial-facilities", name: { en: "Retail & Commercial", ar: "التجزئة والمنشآت التجارية" } },
  { slug: "waste-recycling", name: { en: "Waste & Recycling Operators", ar: "مشغلو النفايات وإعادة التدوير" } },
];

export const KNOWLEDGE_TYPES: { slug: string; name: L; template: string }[] = [
  { slug: "research", name: { en: "Research", ar: "الأبحاث" }, template: "Research summary: question, method, findings, limitations, citation" },
  { slug: "reports", name: { en: "Reports", ar: "التقارير" }, template: "Report: executive summary, key findings, downloadable PDF (gated optional)" },
  { slug: "white-papers", name: { en: "White Papers", ar: "الأوراق البيضاء" }, template: "White paper: problem, analysis, recommendations, PDF" },
  { slug: "insights", name: { en: "Insights", ar: "رؤى ومقالات" }, template: "Article: answer-first summary, takeaways, FAQ, related services" },
  { slug: "technology-reviews", name: { en: "Technology Reviews", ar: "مراجعات التقنيات" }, template: "Review: technology, TRL, evidence, performance, fit, limits" },
  { slug: "market-intelligence", name: { en: "Market Intelligence", ar: "معلومات السوق" }, template: "Brief: market size drivers, regulation, opportunities, sources" },
  { slug: "regulatory-updates", name: { en: "Regulatory Updates", ar: "المستجدات التنظيمية" }, template: "Update: what changed, who is affected, effective date, actions" },
  { slug: "news", name: { en: "News", ar: "الأخبار" }, template: "News: dateline, announcement, quote, contact" },
];

export const PARTNERSHIP_TYPES: { slug: string; name: L; cta: string }[] = [
  { slug: "universities", name: { en: "Universities", ar: "الجامعات" }, cta: "Commercialise Your Research" },
  { slug: "research-centers", name: { en: "Research Centres", ar: "مراكز الأبحاث" }, cta: "Validate a Technology With Us" },
  { slug: "technology-partners", name: { en: "Technology Partners", ar: "شركاء التقنية" }, cta: "List Your Technology" },
  { slug: "manufacturers", name: { en: "Manufacturers", ar: "المصنّعون" }, cta: "Scale Production With Us" },
  { slug: "investors", name: { en: "Investment Partners", ar: "شركاء الاستثمار" }, cta: "Become an Investment Partner" },
  { slug: "industrial-partners", name: { en: "Industrial Partners", ar: "الشركاء الصناعيون" }, cta: "Host a Pilot" },
  { slug: "strategic-partners", name: { en: "Strategic Partners", ar: "الشركاء الاستراتيجيون" }, cta: "Partner With Us" },
];

export const ABOUT_PAGES: { slug: string; name: L }[] = [
  { slug: "our-story", name: { en: "Our Story", ar: "قصتنا" } },
  { slug: "mission", name: { en: "Mission", ar: "رسالتنا" } },
  { slug: "vision", name: { en: "Vision", ar: "رؤيتنا" } },
  { slug: "approach", name: { en: "Our Approach", ar: "منهجيتنا" } },
  { slug: "expertise", name: { en: "Expertise", ar: "خبراتنا" } },
  { slug: "leadership", name: { en: "Leadership", ar: "القيادة" } },
  { slug: "partners", name: { en: "Partners", ar: "شركاؤنا" } },
  { slug: "sustainability", name: { en: "Our Sustainability Commitment", ar: "التزامنا بالاستدامة" } },
];

export const subServicesOf = (category: string) => SUB_SERVICES.filter((x) => x.category === category);
