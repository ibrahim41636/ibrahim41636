// Company facts supplied by Selorin: years of experience, technical team and the
// organisations / projects team members have worked on. Edit here; pages read from this file.
import type { Lang } from "@/i18n/ui";

type T = Record<Lang, string>;

export const COMPANY = {
  yearsExperience: 4,
};

export interface Member {
  id: string;
  initials: T;
  name: T;
  focus: T; // area of expertise (not a job title)
  bio: T;
}

export const TEAM: Member[] = [
  {
    id: "ibrahim-khalil",
    initials: { en: "IK", ar: "إ خ" },
    name: { en: "Ibrahim Khalil", ar: "إبراهيم خليل" },
    focus: { en: "Business development & project management", ar: "تطوير الأعمال وإدارة المشاريع" },
    bio: {
      en: "Nine years of experience in business development and in building and managing projects with local and international organisations, with a strong track record of results in both business growth and project delivery.",
      ar: "خبرة تمتد إلى تسع سنوات في تطوير الأعمال وبناء المشاريع وإدارتها مع جهات محلية وعالمية، وسجل حافل بالنجاحات في نمو الأعمال وإدارة المشاريع.",
    },
  },
  {
    id: "mohammed-khaled",
    initials: { en: "MK", ar: "م خ" },
    name: { en: "Eng. Mohammed Khaled", ar: "م. محمد خالد" },
    focus: { en: "Engineering & project delivery", ar: "الهندسة وتنفيذ المشاريع" },
    bio: {
      en: "Has worked with a number of prominent organisations on demanding, precision-critical projects in Saudi Arabia and Egypt, spanning airports, power generation, district cooling, healthcare, industry and food production.",
      ar: "شارك مع عدة جهات بارزة في مشاريع دقيقة في المملكة العربية السعودية ومصر، تشمل المطارات ومحطات توليد الطاقة وتبريد المناطق والرعاية الصحية والصناعة والإنتاج الغذائي.",
    },
  },
  {
    id: "sultan-alfadl",
    initials: { en: "SF", ar: "س ف" },
    name: { en: "Sultan Al-Fadl", ar: "أ. سلطان الفضل" },
    focus: { en: "Waste management", ar: "إدارة المخلفات" },
    bio: {
      en: "Ten years of experience in waste management. Owns several companies working in waste transport, disposal and recycling.",
      ar: "خبرة تمتد إلى عشر سنوات في مجال إدارة المخلفات، ويملك عدة شركات تعمل في نقل المخلفات والتخلص منها وإعادة تدويرها.",
    },
  },
  {
    id: "abdulaziz-alanqari",
    initials: { en: "AA", ar: "ع ع" },
    name: { en: "Eng. Abdulaziz Al-Anqari", ar: "م. عبدالعزيز العنقري" },
    focus: { en: "Renewable energy", ar: "الطاقة المتجددة" },
    bio: {
      en: "Electrical engineer and renewable-energy researcher, with two years of documented experience in the sector.",
      ar: "مهندس كهرباء وباحث في مجال الطاقة المتجددة، وله خبرة موثقة في هذا القطاع تمتد إلى سنتين.",
    },
  },
];

// Organisations and projects that Selorin team members have worked on (from team experience).
// Shown as text wordmarks: no third-party logo files are used until Selorin confirms the right to use them.
export const ORGANISATIONS: { en: string; ar: string }[] = [
  { en: "King Khalid International Airport", ar: "مطار الملك خالد الدولي" },
  { en: "Sports Boulevard", ar: "المسار الرياضي" },
  { en: "Rabigh Power Plant", ar: "محطة رابغ لتوليد الطاقة" },
  { en: "Saudi Tabreed", ar: "تبريد السعودية" },
  { en: "CEER Motors", ar: "سير للسيارات" },
  { en: "Amazon", ar: "أمازون" },
  { en: "TotalEnergies", ar: "توتال إنرجيز" },
  { en: "Hassan Allam", ar: "حسن علام" },
  { en: "NADEC", ar: "نادك" },
  { en: "Jazan University", ar: "جامعة جازان" },
  { en: "Al-Omair Contracting", ar: "العمير للمقاولات" },
  { en: "Sama Industrial City", ar: "مدينة سما الصناعية" },
  { en: "Cairo International Airport", ar: "مطار القاهرة الدولي" },
  { en: "Marsa Alam International Airport", ar: "مطار مرسى علم الدولي" },
  { en: "Al Hayat National Hospital", ar: "مستشفى الحياة الوطني" },
  { en: "Al Aziziyah Children's Hospital", ar: "مستشفى العزيزية للأطفال" },
  { en: "Mental Health Hospital", ar: "مستشفى الصحة النفسية" },
  { en: "Doha Poultry", ar: "الدوحة للدواجن" },
  { en: "Al-Khumasia Poultry", ar: "الخماسية للدواجن" },
];
