// Equipment section (/equipment/): groups and offer modes shared by the content schema, the hub and the device pages.
type L = { en: string; ar: string };

export const EQUIPMENT_GROUPS = ["ambient-monitoring", "emissions-monitoring", "sampling", "emission-control"] as const;
export const EQUIPMENT_MODES = ["rental", "supply", "operation"] as const;
export type EquipmentGroup = (typeof EQUIPMENT_GROUPS)[number];
export type EquipmentMode = (typeof EQUIPMENT_MODES)[number];

export const GROUPS: Record<EquipmentGroup, { name: L; intro: L; icon: string }> = {
  "ambient-monitoring": {
    icon: "air",
    name: { en: "Ambient monitoring stations", ar: "محطات رصد الهواء المحيط" },
    intro: {
      en: "Stations that measure dust, gases, noise and weather around a site, connected to a live dashboard with alerts and periodic reports.",
      ar: "محطات تقيس الغبار والغازات والضوضاء والطقس حول الموقع، متصلة بلوحة بيانات مباشرة مع تنبيهات وتقارير دورية.",
    },
  },
  "emissions-monitoring": {
    icon: "factory",
    name: { en: "Stack emissions and VOC monitoring", ar: "رصد انبعاثات المداخن والمركبات العضوية المتطايرة" },
    intro: {
      en: "Continuous emissions monitoring systems for stacks, and VOC sampling and analysis for plants, tank farms and industrial parks.",
      ar: "أنظمة الرصد المستمر لانبعاثات المداخن، وأخذ عينات المركبات العضوية المتطايرة وتحليلها في المصانع ومستودعات الخزانات والمدن الصناعية.",
    },
  },
  sampling: {
    icon: "water",
    name: { en: "Soil, water and sediment sampling", ar: "أخذ عينات التربة والمياه والرواسب" },
    intro: {
      en: "Field sampling equipment for soil, soil gas, groundwater, surface water and sediment, for site investigations and monitoring programmes.",
      ar: "معدات ميدانية لأخذ عينات التربة وغازات التربة والمياه الجوفية والسطحية والرواسب، لدراسات المواقع وبرامج الرصد.",
    },
  },
  "emission-control": {
    icon: "wrench",
    name: { en: "Emission control systems", ar: "أنظمة التحكم في الانبعاثات" },
    intro: {
      en: "Systems that reduce what a site releases: fuel vapour recovery, dust collection and suppression, gas scrubbing and industrial ventilation.",
      ar: "أنظمة تخفض ما يطلقه الموقع: استرجاع أبخرة الوقود، وجمع الغبار وإخماده، وغسل الغازات، والتهوية الصناعية.",
    },
  },
};

export const MODES: Record<EquipmentMode, L> = {
  rental: { en: "Rental", ar: "تأجير" },
  supply: { en: "Supply and installation", ar: "توريد وتركيب" },
  operation: { en: "Operation and maintenance", ar: "تشغيل وصيانة" },
};
