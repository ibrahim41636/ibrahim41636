// Articles in both languages and the campaign posts (src/content/social/), in the shape the social
// publishing cron needs (functions/api/social.ts reads this file from the static assets every run and
// queues posts it has not seen). Branded images are included when they have been rendered.
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getInsights, insightSlug } from "@/lib/content";
import { socialAsset } from "@/lib/social-assets";
import { site, LANGS } from "@/i18n/ui";
import type { CampaignPost, FeedArticle } from "@/lib/social";

const abs = (path?: string) => (path ? new URL(path, site.url).toString() : undefined);

export const GET: APIRoute = async () => {
  const articles: FeedArticle[] = [];
  for (const lang of LANGS) {
    for (const p of await getInsights(lang)) {
      const slug = insightSlug(p);
      const img = (kind: string) => abs(socialAsset(`/social/${lang}/${slug}/${kind}.jpg`));
      articles.push({
        slug, lang,
        title: p.data.title,
        description: p.data.description,
        url: `${site.url}${lang === "ar" ? "/ar" : ""}/insights/${slug}/`,
        image: abs(p.data.heroImage)!,
        category: p.data.category,
        date: p.data.date.toISOString(),
        takeaways: p.data.keyTakeaways,
        faqs: p.data.faqs,
        images: { launch: img("launch"), takeaway: img("takeaway"), faq: img("faq"), checklist: img("checklist") },
        video: abs(socialAsset(`/social/video/${lang}/${slug}.mp4`)),
      });
    }
  }

  const campaign: CampaignPost[] = (await getCollection("social", (e) => !e.data.draft)).map((e) => ({
    id: e.id,
    date: e.data.date,
    slot: e.data.slot,
    stage: e.data.stage,
    pillar: e.data.pillar,
    ...(e.data.channels ? { channels: e.data.channels } : {}),
    versions: LANGS.flatMap((lang) => {
      const v = e.data[lang];
      if (!v) return [];
      return [{ lang, text: v.text, x: v.x, title: v.title, link: abs(v.link), image: abs(socialAsset(`/social/campaign/${e.id}-${lang}.jpg`)), video: abs(socialAsset(`/social/video/campaign/${e.id}-${lang}.mp4`)) }];
    }),
  }));

  return new Response(JSON.stringify({ generated: new Date().toISOString(), articles, campaign }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
