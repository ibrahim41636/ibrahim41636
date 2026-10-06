// RSS 2.0 feed for the Knowledge Centre (one feed per language), so readers, aggregators
// and search engines pick up each new article as soon as it is published.
import { getInsights, insightSlug } from "@/lib/content";
import { insightCategories } from "@/data/taxonomy";
import { site, type Lang } from "@/i18n/ui";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function insightsFeed(lang: Lang) {
  const posts = await getInsights(lang);
  const base = lang === "ar" ? `${site.url}/ar` : site.url;
  const self = `${base}/insights/rss.xml`;
  const items = posts.map((p) => {
    const url = `${base}/insights/${insightSlug(p)}/`;
    return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(p.data.description)}</description>
      <category>${esc(insightCategories[p.data.category][lang])}</category>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
    </item>`;
  });
  const title = lang === "ar" ? "مركز المعرفة — سيلورين" : "Selorin Knowledge Centre";
  const desc = lang === "ar" ? "أدلة ومقالات عملية حول التصاريح البيئية والامتثال والرصد والاستدامة في المملكة العربية السعودية." : "Practical guides and articles on environmental permits, compliance, monitoring and sustainability in Saudi Arabia.";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${base}/insights/</link>
    <description>${esc(desc)}</description>
    <language>${lang === "ar" ? "ar-SA" : "en"}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${posts[0] ? `    <lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>\n` : ""}${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
