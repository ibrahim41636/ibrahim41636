import { getCollection, type CollectionEntry } from "astro:content";
import { categories } from "@/data/taxonomy";
import type { Lang } from "@/i18n/ui";

export type Service = CollectionEntry<"services">;
export type Industry = CollectionEntry<"industries">;
export type Insight = CollectionEntry<"insights">;

const catIndex = (id: string) => categories.findIndex((c) => c.id === id);

export async function getServices() {
  const all = await getCollection("services");
  return all.sort((a, b) => catIndex(a.data.category) - catIndex(b.data.category) || a.data.order - b.data.order);
}

export async function getIndustries() {
  return (await getCollection("industries")).sort((a, b) => a.data.order - b.data.order);
}

export async function getInsights(lang: Lang) {
  const all = await getCollection("insights", (e) => e.id.startsWith(`${lang}/`) && !e.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Slug without the language folder (insights are stored as en/slug.md and ar/slug.md). */
export const insightSlug = (e: Insight) => e.id.replace(/^(en|ar)\//, "");

export function readingTime(body: string | undefined, lang: Lang) {
  const words = (body ?? "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / (lang === "ar" ? 180 : 220)));
}

/** Render [CONTENT REQUIRED: …] markers visibly so they are never mistaken for final copy. */
export function markRequired(text: string) {
  return text.replace(/\[CONTENT REQUIRED[^\]]*\]/g, (m) => `<mark class="content-required">${m.replace(/[<>&]/g, "")}</mark>`);
}
