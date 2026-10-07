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
  /** Sector sections on the hub: each with an optional photo (IMAGES key), key points and linked services. */
  sectors?: { id: string; icon: string; image?: string; title: L; lead: L; points: L[]; services: string[]; extra?: { title: L; items: { name: L; note: L }[] } }[];
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
    sectors: [
      {
        id: "residential", icon: "home", image: "renewHomeStorage",
        title: { en: "Residential units & villas", ar: "الوحدات السكنية والفلل" },
        lead: { en: "Generate your own electricity on your roof, store it for the evening and charge your car at home, with a system sized to your household's real consumption.", ar: "أنتج كهرباءك على سطح منزلك، وخزّنها للمساء، واشحن سيارتك في المنزل، بنظام مصمم على استهلاك أسرتك الفعلي." },
        points: [
          { en: "Rooftop solar sized from your electricity bills", ar: "طاقة شمسية على السطح بحجم يُحدَّد من فواتير الكهرباء" },
          { en: "Home batteries for backup during outages and evening use", ar: "بطاريات منزلية للطاقة الاحتياطية عند الانقطاع وللاستخدام المسائي" },
          { en: "Home EV charger connected to your solar system", ar: "شاحن منزلي للسيارة الكهربائية مرتبط بالنظام الشمسي" },
          { en: "Grid connection, metering and a clear savings estimate", ar: "ربط بالشبكة وعداد مناسب وتقدير واضح للوفر" },
        ],
        services: ["solar-energy-systems", "battery-energy-storage", "ev-charging-stations"],
      },
      {
        id: "compounds", icon: "compound", image: "renewVillaSolar",
        title: { en: "Residential compounds", ar: "الكمباوندات والمجمعات السكنية" },
        lead: { en: "One integrated energy plan for the whole compound: shared solar, solar carports, resident EV charging and a single team responsible for maintenance.", ar: "خطة طاقة متكاملة للكمباوند بالكامل: طاقة شمسية مشتركة، ومظلات مواقف شمسية، وشحن سيارات للسكان، وفريق واحد مسؤول عن الصيانة." },
        points: [
          { en: "Solar for common areas, clubhouses, pumps and street lighting", ar: "طاقة شمسية للمرافق المشتركة والنوادي والمضخات وإنارة الطرق" },
          { en: "Solar carports that shade parking and produce electricity", ar: "مظلات مواقف شمسية تظلل السيارات وتنتج الكهرباء" },
          { en: "Resident EV charging with fair allocation and billing", ar: "شحن سيارات للسكان مع توزيع عادل ومحاسبة واضحة" },
          { en: "One O&M contract with consolidated performance reports", ar: "عقد تشغيل وصيانة واحد مع تقارير أداء موحدة" },
        ],
        services: ["solar-energy-systems", "ev-charging-stations", "renewable-operations-maintenance"],
      },
      {
        id: "factories", icon: "factory", image: "renewFactory",
        title: { en: "Factories & industrial facilities", ar: "المصانع والمنشآت الصناعية" },
        lead: { en: "Cut energy costs and emissions with large solar systems matched to daytime production loads, storage that protects critical equipment and studies that stand up to lenders.", ar: "خفّض تكاليف الطاقة والانبعاثات بأنظمة شمسية كبيرة تتوافق مع أحمال الإنتاج النهارية، وتخزين يحمي المعدات الحرجة، ودراسات يعتمد عليها الممولون." },
        points: [
          { en: "Rooftop and ground-mounted solar on factory roofs and land", ar: "طاقة شمسية على أسطح المصانع وأراضيها" },
          { en: "Battery storage for peak reduction and critical loads", ar: "تخزين بالبطاريات لخفض الذروة وحماية الأحمال الحرجة" },
          { en: "Feasibility, yield and financial model before you invest", ar: "دراسة جدوى وتقدير إنتاج ونموذج مالي قبل الاستثمار" },
          { en: "Emission reductions that feed your ESG and net-zero reporting", ar: "خفض انبعاثات يدعم تقارير الحوكمة البيئية والحياد الصفري" },
        ],
        services: ["solar-energy-systems", "battery-energy-storage", "renewable-energy-feasibility"],
      },
      {
        id: "ev-charging", icon: "ev",
        title: { en: "EV charging stations", ar: "محطات شحن السيارات الكهربائية" },
        lead: { en: "Charging stations planned around your users and your electrical capacity, from home and workplace chargers to fast-charging hubs, with the option to run them on solar.", ar: "محطات شحن مخططة حول مستخدميك وقدرتك الكهربائية، من شواحن المنازل وأماكن العمل إلى مراكز الشحن السريع، مع إمكانية تشغيلها بالطاقة الشمسية." },
        points: [
          { en: "Load study before any charger is installed", ar: "دراسة الأحمال قبل تركيب أي شاحن" },
          { en: "Smart load management to avoid costly connection upgrades", ar: "إدارة ذكية للأحمال لتجنب ترقيات التوصيل المكلفة" },
          { en: "Solar carports and batteries to power charging", ar: "مظلات شمسية وبطاريات لتغذية الشحن" },
          { en: "Installation, commissioning, maintenance and usage reports", ar: "التركيب والتشغيل والصيانة وتقارير الاستخدام" },
        ],
        services: ["ev-charging-stations", "solar-energy-systems", "battery-energy-storage"],
        extra: {
          title: { en: "Charging types we deliver", ar: "أنواع الشحن التي ننفذها" },
          items: [
            { name: { en: "AC charging", ar: "الشحن المتناوب (AC)" }, note: { en: "Typically 7–22 kW. Homes, compounds, offices and hotels where cars stay for hours.", ar: "عادةً 7–22 كيلوواط. للمنازل والكمباوندات والمكاتب والفنادق حيث تبقى السيارة ساعات." } },
            { name: { en: "DC fast charging", ar: "الشحن السريع (DC)" }, note: { en: "Typically 50–150 kW. Malls, fleets and commercial sites with shorter stops.", ar: "عادةً 50–150 كيلوواط. للمراكز التجارية والأساطيل والمواقع التجارية ذات التوقف القصير." } },
            { name: { en: "Ultra-fast charging", ar: "الشحن فائق السرعة" }, note: { en: "Above 150 kW. Highway and city hubs where drivers recharge in minutes.", ar: "أكثر من 150 كيلوواط. لمراكز الطرق السريعة والمدن حيث يشحن السائق في دقائق." } },
          ],
        },
      },
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
