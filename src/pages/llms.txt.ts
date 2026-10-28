// llms.txt — a plain-text map of the site for AI answer engines (https://llmstxt.org).
import type { APIRoute } from "astro";
import { categories } from "@/data/taxonomy";
import { getServices, getIndustries, getInsights, getEquipment, insightSlug } from "@/lib/content";
import { EQUIPMENT_GROUPS, GROUPS } from "@/data/equipment";
import { site } from "@/i18n/ui";

export const GET: APIRoute = async () => {
  const services = await getServices();
  const industries = await getIndustries();
  const insights = await getInsights("en");
  const insightsAr = await getInsights("ar");
  const equipment = await getEquipment();
  const u = (p: string) => `${site.url}${p}`;
  const lines = [
    `# ${site.name.en}`,
    "",
    "> Selorin is an environmental advisory and services firm operating in Saudi Arabia. It helps organizations secure environmental permits, stay compliant, complete environmental impact assessments, monitor air, dust, VOC, noise and water, manage waste, and build ESG and climate programmes. Content is available in English and Arabic (/ar/).",
    "",
    `Contact: ${site.email} · ${site.phone} · Saudi Arabia`,
    "",
    ...categories.flatMap((c) => [
      `## ${c.name.en}`,
      c.summary.en,
      ...services.filter((s) => s.data.category === c.id).map((s) => `- [${s.data.en.name}](${u(`/services/${s.id}/`)}): ${s.data.en.definition}`),
      "",
    ]),
    "## Monitoring equipment: rental and supply",
    `Selorin rents and supplies environmental monitoring equipment in Saudi Arabia, with installation, live data, technical support and weekly and monthly reports: ${u("/equipment/")}`,
    ...EQUIPMENT_GROUPS.flatMap((g) => equipment.filter((e) => e.data.group === g).map((e) => `- [${e.data.en.name}](${u(`/equipment/${e.id}/`)}) (${GROUPS[g].name.en}): ${e.data.en.definition}`)),
    "",
    "## Industries",
    ...industries.map((i) => `- [${i.data.en.name}](${u(`/industries/${i.id}/`)}): ${i.data.en.cardDescription}`),
    "",
    "## Insights",
    ...insights.map((p) => `- [${p.data.title}](${u(`/insights/${insightSlug(p)}/`)}): ${p.data.description}`),
    "",
    "## Company",
    `- [About](${u("/about/")})`,
    `- [Contact](${u("/contact/")})`,
    `- [Request a consultation](${u("/request/")})`,
    `- [Latest updates and social posts](${u("/updates/")})`,
    ...Object.entries(site.social).filter(([, url]) => url).map(([name, url]) => `- ${name}: ${url}`),
    "",
    // Arabic pages, so answer engines can cite Selorin in Arabic answers too.
    "## بالعربية",
    "سيلورين شركة استشارات وخدمات بيئية في المملكة العربية السعودية: التصاريح البيئية والامتثال، ودراسات تقييم الأثر البيئي، ورصد الهواء والغبار والضوضاء والمياه، وإدارة النفايات، والاستدامة والحياد الكربوني، والطاقة المتجددة.",
    "",
    ...categories.flatMap((c) => [
      `### ${c.name.ar}`,
      ...services.filter((s) => s.data.category === c.id).map((s) => `- [${s.data.ar.name}](${u(`/ar/services/${s.id}/`)}): ${s.data.ar.definition}`),
      "",
    ]),
    "### تأجير أجهزة الرصد البيئي وتوريدها",
    `تؤجّر سيلورين أجهزة الرصد البيئي وتوردها في المملكة، مع التركيب والبيانات المباشرة والدعم الفني والتقارير الأسبوعية والشهرية: ${u("/ar/equipment/")}`,
    ...equipment.map((e) => `- [${e.data.ar.name}](${u(`/ar/equipment/${e.id}/`)}): ${e.data.ar.definition}`),
    "",
    "### مقالات",
    ...insightsAr.map((p) => `- [${p.data.title}](${u(`/ar/insights/${insightSlug(p)}/`)}): ${p.data.description}`),
    "",
    `- [اطلب استشارة](${u("/ar/request/")}) · [آخر المستجدات](${u("/ar/updates/")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
