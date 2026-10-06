// Page imagery: one photo per page, chosen by service, category or industry.
// Files live in /public/images (JPEG + generated WebP). Alt text is bilingual because
// the photo is shown as visible content in the page hero, not as decoration.
import type { Lang } from "@/i18n/ui";

export interface Img { src: string; width: number; height: number; alt: Record<Lang, string> }

const img = (src: string, width: number, height: number, en: string, ar: string): Img => ({ src: `/images/${src}`, width, height, alt: { en, ar } });

export const IMAGES = {
  windFarm: img("wind-farm.jpg", 735, 490, "Wind turbines across farmland at sunrise", "توربينات رياح فوق أراضٍ زراعية عند شروق الشمس"),
  windHills: img("wind-hills.jpg", 736, 414, "Wind turbines on green hills beside a road", "توربينات رياح على تلال خضراء بجانب طريق"),
  monitoringStation: img("monitoring-station.jpg", 736, 736, "Solar-powered environmental monitoring station with weather and air sensors", "محطة رصد بيئي تعمل بالطاقة الشمسية مزوّدة بحساسات للطقس وجودة الهواء"),
  openPitMine: img("open-pit-mine.jpg", 736, 1301, "Open-pit mine with haul trucks and drilling rigs", "منجم مفتوح تعمل فيه شاحنات النقل ومعدات الحفر"),
  refinery: img("refinery.jpg", 720, 1100, "Process columns of an industrial plant at dusk", "أبراج المعالجة في منشأة صناعية عند الغروب"),
  construction: img("construction.jpg", 1600, 900, "Construction site hoarding with Selorin branding", "سياج موقع إنشائي يحمل هوية سيلورين"),
  engineer: img("engineer.jpg", 800, 900, "Environmental engineer in a hard hat and safety glasses", "مهندسة بيئية بخوذة ونظارات سلامة"),
  fieldTeam: img("field-team.jpg", 612, 390, "Selorin field team on site", "فريق سيلورين الميداني في الموقع"),
  fields: img("fields.jpg", 1600, 900, "Aerial view of farmland", "منظر جوي لأراضٍ زراعية"),
  handheld: img("handheld.jpg", 800, 900, "Handheld gas analyser showing compliant readings", "جهاز تحليل غازات محمول يعرض قراءات ضمن الحدود"),
  hq: img("hq.jpg", 800, 900, "Selorin office building at sunset", "مبنى مكتب سيلورين عند الغروب"),
  landscape: img("landscape-logo.jpg", 1600, 900, "Aerial landscape at sunrise", "منظر جوي لطبيعة خضراء عند الشروق"),
  office: img("office.jpg", 800, 900, "Selorin reception area", "منطقة الاستقبال في مكتب سيلورين"),
  river: img("river.jpg", 444, 524, "River winding through farmland", "نهر يتعرج بين الأراضي الزراعية"),
  signage: img("signage.jpg", 1600, 900, "Selorin sign on a building facade", "لوحة سيلورين على واجهة مبنى"),
  sky: img("sky.jpg", 1600, 900, "Sun in a clear sky seen through trees", "الشمس في سماء صافية بين الأشجار"),
  station: img("station.jpg", 800, 900, "Fixed gas detector installed outdoors", "كاشف غاز ثابت مركّب في موقع خارجي"),
  water: img("water.jpg", 1600, 900, "Clear water surface", "سطح ماء صافٍ"),
} satisfies Record<string, Img>;

type Key = keyof typeof IMAGES;

const CATEGORY: Record<string, Key> = {
  "permitting-compliance": "signage",
  "environmental-studies": "fields",
  "monitoring-measurement": "monitoringStation",
  "waste-circular-economy": "landscape",
  "sustainability-climate": "windFarm",
  "sustainable-buildings": "hq",
};

const SERVICE: Record<string, Key> = {
  "dust-monitoring": "openPitMine",
  "fuel-station-voc-monitoring": "station",
  "air-quality-monitoring": "monitoringStation",
  "noise-monitoring": "monitoringStation",
  "environmental-monitoring": "handheld",
  "water-quality-monitoring": "water",
  "environmental-permitting": "signage",
  "environmental-compliance": "engineer",
  "environmental-audits": "engineer",
  "environmental-records": "office",
  "environmental-impact-assessment": "fields",
  "environmental-due-diligence": "river",
  "environmental-management-plans": "fieldTeam",
  "waste-management": "construction",
  "circular-economy": "landscape",
  "net-zero-advisory": "windHills",
  "ghg-carbon-accounting": "sky",
  "life-cycle-assessment": "sky",
  "esg-advisory": "windFarm",
  "sustainability-advisory": "windFarm",
  "green-building-advisory": "hq",
  "sustainable-buildings": "hq",
};

const INDUSTRY: Record<string, Key> = {
  "oil-gas": "refinery",
  "mining-quarrying": "openPitMine",
  energy: "windFarm",
  construction: "construction",
  infrastructure: "windHills",
  "logistics-warehousing": "windHills",
  "industrial-manufacturing": "refinery",
  "waste-recycling": "landscape",
  "real-estate": "hq",
  "commercial-facilities": "office",
  hospitality: "office",
  healthcare: "engineer",
  "government-public-sector": "signage",
  "food-beverage": "fields",
};

const PAGE: Record<string, Key> = {
  services: "windFarm",
  industries: "refinery",
  insights: "monitoringStation",
  projects: "fieldTeam",
  contact: "office",
  request: "handheld",
  about: "hq",
};

export const categoryImage = (id: string) => IMAGES[CATEGORY[id] ?? "landscape"];
export const serviceImage = (id: string, category: string) => IMAGES[SERVICE[id] ?? CATEGORY[category] ?? "landscape"];
export const industryImage = (id: string) => IMAGES[INDUSTRY[id] ?? "landscape"];
export const pageImage = (page: keyof typeof PAGE) => IMAGES[PAGE[page]];
