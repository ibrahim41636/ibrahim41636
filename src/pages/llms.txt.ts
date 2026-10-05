// llms.txt — a plain-text map of the site for AI answer engines (https://llmstxt.org).
import type { APIRoute } from "astro";
import { categories } from "@/data/taxonomy";
import { getServices, getIndustries, getInsights, insightSlug } from "@/lib/content";
import { site } from "@/i18n/ui";

export const GET: APIRoute = async () => {
  const services = await getServices();
  const industries = await getIndustries();
  const insights = await getInsights("en");
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
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
