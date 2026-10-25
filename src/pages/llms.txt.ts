// llms.txt — a plain-text map of the site for AI answer engines (https://llmstxt.org).
import type { APIRoute } from "astro";
import { categories } from "@/data/taxonomy";
import { getServices, getIndustries, getInsights, insightSlug } from "@/lib/content";
import { site } from "@/i18n/ui";

export const GET: APIRoute = async () => {
  const services = await getServices();
  const industries = await getIndustries();
  const insights = await getInsights("en");
  const insightsAr = await getInsights("ar");
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
    "### مقالات",
    ...insightsAr.map((p) => `- [${p.data.title}](${u(`/ar/insights/${insightSlug(p)}/`)}): ${p.data.description}`),
    "",
    `- [اطلب استشارة](${u("/ar/request/")}) · [آخر المستجدات](${u("/ar/updates/")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
