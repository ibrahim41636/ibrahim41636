// Articles in both languages, in the shape the social publishing cron needs (functions/api/social.ts
// reads this file from the static assets every run and queues posts for any article it has not seen).
import type { APIRoute } from "astro";
import { getInsights, insightSlug } from "@/lib/content";
import { site, LANGS } from "@/i18n/ui";
import type { FeedArticle } from "@/lib/social";

export const GET: APIRoute = async () => {
  const articles: FeedArticle[] = [];
  for (const lang of LANGS) {
    for (const p of await getInsights(lang)) {
      const slug = insightSlug(p);
      articles.push({
        slug, lang,
        title: p.data.title,
        description: p.data.description,
        url: `${site.url}${lang === "ar" ? "/ar" : ""}/insights/${slug}/`,
        image: p.data.heroImage.startsWith("http") ? p.data.heroImage : `${site.url}${p.data.heroImage}`,
        category: p.data.category,
        date: p.data.date.toISOString(),
        takeaways: p.data.keyTakeaways,
        faqs: p.data.faqs,
      });
    }
  }
  return new Response(JSON.stringify({ generated: new Date().toISOString(), articles }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
