import type { Lang } from "@/i18n/ui";

type L = Record<Lang, string>;

export interface Category {
  id: string;
  icon: string;
  name: L;
  summary: L;
  benefit: L;
  intro: L;
  /** Optional richer hub content (rendered on the category page when present). */
  segments?: { icon: string; title: L; body: L }[];
  facts?: { value: string; label: L }[];
  process?: { title: L; body: L }[];
}

export const categories: Category[] = [
  {
    id: "permitting-compliance",
    icon: "permit",
    name: { en: "Permitting & Compliance", ar: "التصاريح والامتثال" },
    summary: {
      en: "Environmental permits, compliance management, records, audits and due diligence for facilities and projects.",
      ar: "التصاريح البيئية وإدارة الامتثال والسجلات والتدقيق والفحص النافي للجهالة للمنشآت والمشاريع.",
    },
    benefit: { en: "Operate with permits and records that stand up to inspection.", ar: "تشغيل بتصاريح وسجلات جاهزة للتفتيش." },
    intro: {
      en: "Environmental permits and day-to-day compliance determine whether a facility can build, operate and expand without disruption. We help you understand what applies to your activities, prepare the documentation authorities expect, and keep evidence of compliance current.",
      ar: "تحدد التصاريح البيئية والامتثال اليومي قدرة المنشأة على البناء والتشغيل والتوسع دون انقطاع. نساعدك على فهم ما ينطبق على أنشطتك، وإعداد المستندات التي تتوقعها الجهات المختصة، والمحافظة على أدلة امتثال محدّثة.",
    },
  },
  {
    id: "environmental-studies",
    icon: "eia",
    name: { en: "Environmental Studies", ar: "الدراسات البيئية" },
    summary: {
      en: "Environmental impact assessments and environmental management plans for new projects, expansions and changes.",
      ar: "دراسات تقييم الأثر البيئي وخطط الإدارة البيئية للمشاريع الجديدة والتوسعات والتغييرات.",
    },
    benefit: { en: "Approval-ready studies planned into your project schedule.", ar: "دراسات جاهزة للاعتماد ضمن الجدول الزمني لمشروعك." },
    intro: {
      en: "Environmental studies set the conditions a project will be built and operated under. We plan them early, base them on credible baseline data, and turn the findings into commitments your teams can implement.",
      ar: "تحدد الدراسات البيئية الاشتراطات التي سيُنشأ المشروع ويُشغَّل وفقها. نخطط لها مبكراً، ونبنيها على بيانات خط أساس موثوقة، ونحوّل نتائجها إلى التزامات قابلة للتنفيذ من فرقك.",
    },
  },
  {
    id: "monitoring-measurement",
    icon: "monitoring",
    name: { en: "Monitoring & Measurement", ar: "الرصد والقياس" },
    summary: {
      en: "Air, dust, VOC, noise and water monitoring — from programme design and field measurement to compliance reporting.",
      ar: "رصد الهواء والغبار والمركبات العضوية المتطايرة والضوضاء والمياه — من تصميم البرنامج والقياس الميداني إلى تقارير الامتثال.",
    },
    benefit: { en: "Measured evidence instead of assumptions.", ar: "أدلة مقاسة بدلاً من التقديرات." },
    intro: {
      en: "Monitoring turns environmental obligations into data you can act on. We design monitoring that answers the regulatory question, run it in the field, check data quality, and report results in a form decision makers and authorities can use.",
      ar: "يحوّل الرصد الالتزامات البيئية إلى بيانات يمكن العمل بها. نصمم برامج رصد تجيب عن السؤال التنظيمي، وننفذها ميدانياً، ونتحقق من جودة البيانات، ونقدّم النتائج بصيغة يستفيد منها صناع القرار والجهات المختصة.",
    },
  },
  {
    id: "waste-circular-economy",
    icon: "waste",
    name: { en: "Waste & Circular Economy", ar: "النفايات والاقتصاد الدائري" },
    summary: {
      en: "Waste classification, audits and management plans, and strategies that reduce waste and recover value.",
      ar: "تصنيف النفايات وتدقيقها وخطط إدارتها، واستراتيجيات تقلل النفايات وتستعيد قيمتها.",
    },
    benefit: { en: "Compliant waste streams and lower disposal costs.", ar: "مسارات نفايات ممتثلة وتكاليف تخلص أقل." },
    intro: {
      en: "Waste is both a compliance obligation and a cost. We help you classify and document waste correctly, manage it through compliant routes, and identify where reduction and reuse create value.",
      ar: "النفايات التزام تنظيمي وتكلفة تشغيلية في آن واحد. نساعدك على تصنيفها وتوثيقها بشكل صحيح، وإدارتها عبر مسارات ممتثلة، وتحديد فرص التقليل وإعادة الاستخدام التي تحقق قيمة.",
    },
  },
  {
    id: "sustainability-climate",
    icon: "esg",
    name: { en: "Sustainability, ESG & Climate", ar: "الاستدامة والحوكمة والمناخ" },
    summary: {
      en: "ESG advisory, GHG accounting, net-zero pathways, sustainability strategy and life cycle assessment.",
      ar: "استشارات الحوكمة البيئية والاجتماعية والمؤسسية، وحصر انبعاثات غازات الاحتباس الحراري، ومسارات الحياد الصفري، واستراتيجيات الاستدامة، وتقييم دورة الحياة.",
    },
    benefit: { en: "Credible data behind every sustainability commitment.", ar: "بيانات موثوقة خلف كل التزام بالاستدامة." },
    intro: {
      en: "Investors, lenders, customers and regulators increasingly ask for evidence behind sustainability claims. We build the data, methods and strategy that let you report with confidence and set targets you can deliver.",
      ar: "يطلب المستثمرون والممولون والعملاء والجهات التنظيمية بشكل متزايد أدلة تدعم ادعاءات الاستدامة. نبني البيانات والمنهجيات والاستراتيجية التي تمكّنك من الإفصاح بثقة ووضع مستهدفات قابلة للتحقيق.",
    },
  },
  {
    id: "sustainable-buildings",
    icon: "building",
    name: { en: "Sustainable Buildings & Infrastructure", ar: "المباني والبنية التحتية المستدامة" },
    summary: {
      en: "Design-stage environmental performance and support for green building and infrastructure rating systems.",
      ar: "الأداء البيئي في مرحلة التصميم، ودعم أنظمة تقييم المباني الخضراء والبنية التحتية.",
    },
    benefit: { en: "Better-performing assets, decided at design stage.", ar: "أصول أفضل أداءً، تُحسم من مرحلة التصميم." },
    intro: {
      en: "Most of a building's or asset's environmental performance is fixed by early design decisions. We bring environmental performance into design reviews and support certification under recognised rating systems.",
      ar: "يتحدد معظم الأداء البيئي للمبنى أو الأصل بقرارات التصميم المبكرة. ندمج الأداء البيئي في مراجعات التصميم، وندعم الحصول على الشهادات وفق أنظمة التقييم المعترف بها.",
    },
  },
  {
    id: "renewable-energy",
    icon: "solar",
    name: { en: "Renewable Energy", ar: "الطاقة المتجددة" },
    summary: {
      en: "Solar energy systems, EV charging stations, battery storage, operation and maintenance, and feasibility and environmental studies for renewable projects.",
      ar: "أنظمة الطاقة الشمسية، ومحطات شحن السيارات الكهربائية، وتخزين الطاقة، والتشغيل والصيانة، ودراسات الجدوى والدراسات البيئية لمشاريع الطاقة المتجددة.",
    },
    benefit: { en: "Clean energy that lowers your bills, from study to maintenance.", ar: "طاقة نظيفة تخفض فواتيرك، من الدراسة حتى الصيانة." },
    intro: {
      en: "We deliver solar, storage and EV charging projects for homes, residential compounds, factories and charging sites across Saudi Arabia, from the first consumption study and design to installation, grid connection, operation and maintenance, backed by our environmental expertise.",
      ar: "ننفّذ مشاريع الطاقة الشمسية وتخزين الطاقة وشحن السيارات الكهربائية للوحدات السكنية والكمباوندات والمصانع ومواقع الشحن في أنحاء المملكة، من أول دراسة للاستهلاك والتصميم إلى التركيب والربط بالشبكة والتشغيل والصيانة، مدعومين بخبرتنا البيئية.",
    },
    segments: [
      { icon: "home", title: { en: "Homes & residential units", ar: "الفلل والوحدات السكنية" }, body: { en: "Rooftop solar sized to household consumption, with optional batteries for backup and evening use, and home EV chargers.", ar: "طاقة شمسية على الأسطح بحجم استهلاك المنزل، مع بطاريات اختيارية للطاقة الاحتياطية والاستخدام المسائي، وشواحن منزلية للسيارات." } },
      { icon: "compound", title: { en: "Residential compounds", ar: "الكمباوندات والمجمعات السكنية" }, body: { en: "Shared solar for common areas and units, solar carports, resident EV charging and one maintenance plan for the whole compound.", ar: "طاقة شمسية مشتركة للمرافق والوحدات، ومظلات مواقف شمسية، وشحن سيارات للسكان، وخطة صيانة واحدة للكمباوند بالكامل." } },
      { icon: "factory", title: { en: "Factories & industrial facilities", ar: "المصانع والمنشآت الصناعية" }, body: { en: "Large rooftop and ground-mounted systems matched to daytime production loads, storage for peak reduction and critical equipment.", ar: "أنظمة كبيرة على الأسطح والأراضي تتوافق مع أحمال الإنتاج النهارية، وتخزين لخفض الذروة وحماية المعدات الحرجة." } },
      { icon: "ev", title: { en: "EV charging stations", ar: "محطات شحن السيارات الكهربائية" }, body: { en: "AC and fast DC charging for buildings, hotels, fleets and public sites, with load management and solar-powered carports.", ar: "شحن AC وشحن DC سريع للمباني والفنادق والأساطيل والمواقع العامة، مع إدارة الأحمال ومظلات مواقف تعمل بالطاقة الشمسية." } },
    ],
    facts: [
      { value: "2030", label: { en: "Vision 2030 makes renewables a central part of the Kingdom's electricity mix", ar: "تجعل رؤية 2030 الطاقة المتجددة جزءاً رئيساً من مزيج الكهرباء في المملكة" } },
      { value: "2060", label: { en: "The Kingdom's target year for net-zero emissions", ar: "العام المستهدف لوصول المملكة إلى الحياد الصفري" } },
      { value: "1", label: { en: "One accountable partner from study and design to operation and maintenance", ar: "شريك واحد مسؤول من الدراسة والتصميم حتى التشغيل والصيانة" } },
    ],
    process: [
      { title: { en: "Study", ar: "الدراسة" }, body: { en: "Bills, load profile and site survey define the right solution and size.", ar: "الفواتير ونمط الأحمال والمعاينة الميدانية تحدد الحل والحجم المناسبين." } },
      { title: { en: "Design", ar: "التصميم" }, body: { en: "Engineering design and production estimate, with clear costs and savings.", ar: "تصميم هندسي وتقدير للإنتاج، مع تكاليف ووفورات واضحة." } },
      { title: { en: "Approvals", ar: "الموافقات" }, body: { en: "Technical files, grid connection and the permits the project needs.", ar: "الملفات الفنية والربط بالشبكة والتصاريح التي يحتاجها المشروع." } },
      { title: { en: "Installation", ar: "التركيب" }, body: { en: "Conformant equipment installed, tested and handed over with full records.", ar: "معدات مطابقة للمواصفات تُركَّب وتُختبر وتُسلَّم بسجلات كاملة." } },
      { title: { en: "Operation & maintenance", ar: "التشغيل والصيانة" }, body: { en: "Monitoring, cleaning and maintenance that keep output at its best.", ar: "مراقبة وتنظيف وصيانة تبقي الإنتاج في أفضل مستوياته." } },
    ],
  },
];

export const categoryById = (id: string) => categories.find((c) => c.id === id)!;

export const insightCategories: Record<string, L> = {
  "regulatory-updates": { en: "Regulatory Updates", ar: "المستجدات التنظيمية" },
  "environmental-compliance": { en: "Environmental Compliance", ar: "الامتثال البيئي" },
  esg: { en: "ESG", ar: "الحوكمة البيئية والاجتماعية" },
  sustainability: { en: "Sustainability", ar: "الاستدامة" },
  "technical-articles": { en: "Technical Articles", ar: "مقالات فنية" },
  "industry-guides": { en: "Industry Guides", ar: "أدلة القطاعات" },
};

/** Project lifecycle navigator on the homepage: stage → recommended services. */
export const lifecycle: { id: string; name: L; question: L; services: string[] }[] = [
  {
    id: "planning",
    name: { en: "Planning", ar: "التخطيط" },
    question: { en: "Evaluating a site, investment or new project", ar: "تقييم موقع أو استثمار أو مشروع جديد" },
    services: ["environmental-due-diligence", "environmental-impact-assessment", "environmental-permitting"],
  },
  {
    id: "design",
    name: { en: "Design", ar: "التصميم" },
    question: { en: "Developing the design and securing approvals", ar: "تطوير التصميم والحصول على الموافقات" },
    services: ["environmental-impact-assessment", "sustainable-buildings", "green-building-advisory", "life-cycle-assessment"],
  },
  {
    id: "construction",
    name: { en: "Construction", ar: "الإنشاء" },
    question: { en: "Building on site and managing contractors", ar: "التنفيذ في الموقع وإدارة المقاولين" },
    services: ["environmental-management-plans", "dust-monitoring", "noise-monitoring", "waste-management"],
  },
  {
    id: "operation",
    name: { en: "Operation", ar: "التشغيل" },
    question: { en: "Running a facility and staying compliant", ar: "تشغيل منشأة والمحافظة على الامتثال" },
    services: ["environmental-compliance", "environmental-records", "environmental-monitoring", "environmental-audits", "fuel-station-voc-monitoring"],
  },
  {
    id: "expansion",
    name: { en: "Expansion", ar: "التوسعة" },
    question: { en: "Expanding capacity or changing activities", ar: "رفع الطاقة الإنتاجية أو تغيير الأنشطة" },
    services: ["environmental-permitting", "environmental-impact-assessment", "air-quality-monitoring"],
  },
  {
    id: "reporting",
    name: { en: "Reporting & strategy", ar: "الإفصاح والاستراتيجية" },
    question: { en: "Reporting ESG performance or setting climate targets", ar: "الإفصاح عن أداء الحوكمة البيئية والاجتماعية أو وضع أهداف مناخية" },
    services: ["esg-advisory", "ghg-carbon-accounting", "net-zero-advisory", "sustainability-advisory"],
  },
];

export const regulators: { name: L; role: L }[] = [
  { name: { en: "National Center for Environmental Compliance (NCEC)", ar: "المركز الوطني للرقابة على الالتزام البيئي" }, role: { en: "Environmental permits, compliance monitoring and inspection", ar: "التصاريح البيئية ومتابعة الالتزام والتفتيش" } },
  { name: { en: "Ministry of Environment, Water and Agriculture (MEWA)", ar: "وزارة البيئة والمياه والزراعة" }, role: { en: "Environmental policy and the Environmental Law", ar: "السياسات البيئية ونظام البيئة" } },
  { name: { en: "National Center for Waste Management (MWAN)", ar: "المركز الوطني لإدارة النفايات (موان)" }, role: { en: "Waste management regulation and licensing", ar: "تنظيم إدارة النفايات وترخيص أنشطتها" } },
  { name: { en: "Royal Commission for Jubail and Yanbu (RCJY)", ar: "الهيئة الملكية للجبيل وينبع" }, role: { en: "Environmental requirements within the Royal Commission cities", ar: "المتطلبات البيئية في مدن الهيئة الملكية" } },
  { name: { en: "MODON", ar: "هيئة المدن الصناعية ومناطق التقنية (مدن)" }, role: { en: "Requirements for facilities in industrial cities", ar: "متطلبات المنشآت في المدن الصناعية" } },
  { name: { en: "Saudi Green Initiative", ar: "مبادرة السعودية الخضراء" }, role: { en: "National climate and sustainability ambitions", ar: "المستهدفات الوطنية للمناخ والاستدامة" } },
];
