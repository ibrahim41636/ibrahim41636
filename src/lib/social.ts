// Social publishing hub: the company's channels, how each article becomes a series of posts,
// UTM-tagged links (so every lead can be traced back to the channel that brought it) and the
// weekly posting slots. Pure functions — shared by the Worker cron (functions/api/social.ts),
// the staff page (/ar/admin/social/) and the unit tests.

export const CHANNELS = ["linkedin", "x", "facebook", "instagram", "google_business", "webhook", "tiktok", "youtube"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_INFO: Record<Channel, { ar: string; en: string; langs: ("ar" | "en")[]; utmSource: string }> = {
  // Every channel but Google posts in both languages (English first). LinkedIn is the main B2B
  // channel in the Kingdom and has many English-reading decision makers.
  linkedin: { ar: "لينكد إن", en: "LinkedIn", langs: ["ar", "en"], utmSource: "linkedin" },
  x: { ar: "إكس (تويتر)", en: "X", langs: ["ar", "en"], utmSource: "x" },
  facebook: { ar: "فيسبوك", en: "Facebook", langs: ["ar", "en"], utmSource: "facebook" },
  instagram: { ar: "إنستغرام", en: "Instagram", langs: ["ar", "en"], utmSource: "instagram" },
  // Google Business Profile posts appear in Maps and the local panel on Google Search.
  google_business: { ar: "ملف جوجل التجاري", en: "Google Business Profile", langs: ["ar"], utmSource: "google_business" },
  // Make / Zapier / n8n hook for channels without a direct API here (TikTok, Snapchat, WhatsApp channel…).
  webhook: { ar: "ربط خارجي (Make / Zapier)", en: "Automation webhook", langs: ["ar", "en"], utmSource: "social_webhook" },
  // Short vertical videos (scripts/social-images/video.mjs) and photo posts.
  tiktok: { ar: "تيك توك", en: "TikTok", langs: ["ar", "en"], utmSource: "tiktok" },
  // YouTube Shorts: only posts that have a video.
  youtube: { ar: "يوتيوب", en: "YouTube", langs: ["ar", "en"], utmSource: "youtube" },
};

export const isChannel = (v: unknown): v is Channel => typeof v === "string" && (CHANNELS as readonly string[]).includes(v);

/** Funnel stage each post variant serves: awareness → consideration → conversion. */
export const VARIANTS = ["launch", "takeaway", "faq", "evergreen", "campaign", "manual"] as const;
export type Variant = (typeof VARIANTS)[number];
export const VARIANT_INFO: Record<Variant, { ar: string; stage: "awareness" | "consideration" | "conversion"; dayOffset: number }> = {
  launch: { ar: "إطلاق المقال", stage: "awareness", dayOffset: 0 },
  takeaway: { ar: "أبرز نقطة", stage: "consideration", dayOffset: 3 },
  faq: { ar: "سؤال وجواب", stage: "conversion", dayOffset: 7 },
  evergreen: { ar: "إعادة نشر", stage: "awareness", dayOffset: 0 },
  campaign: { ar: "منشور الحملة", stage: "awareness", dayOffset: 0 },
  manual: { ar: "منشور يدوي", stage: "awareness", dayOffset: 0 },
};

export interface FeedArticle {
  slug: string;
  lang: "ar" | "en";
  title: string;
  description: string;
  url: string; // absolute
  image: string; // absolute, JPEG
  category: string;
  date: string; // ISO
  takeaways: string[];
  faqs: { q: string; a: string }[];
  /** Branded images rendered for this article (absolute URLs), by post variant. */
  images?: Partial<Record<"launch" | "takeaway" | "faq" | "checklist", string>>;
  /** Short vertical video for TikTok / YouTube Shorts (absolute URL), when rendered. */
  video?: string;
}

/** A campaign post from src/content/social/, as published in the feed (links and images absolute). */
export interface CampaignPost {
  id: string;
  date: string; // YYYY-MM-DD, Riyadh
  slot: number;
  stage: "awareness" | "consideration" | "conversion";
  pillar: string;
  channels?: Channel[];
  versions: { lang: "ar" | "en"; text: string; x?: string; title?: string; link?: string; image?: string; video?: string }[];
}

export interface PostDraft {
  sourceKey: string;
  channel: Channel;
  lang: "ar" | "en";
  variant: Variant;
  title: string;
  text: string;
  link: string;
  image: string;
  video?: string;
  scheduledAt: string; // "YYYY-MM-DD HH:MM:SS" UTC, same format as D1 datetime('now')
}

/** Channels that take a video when one exists (YouTube takes nothing else; the webhook passes it on to Make/Zapier). */
const VIDEO_CHANNELS: Channel[] = ["tiktok", "youtube", "webhook"];

/** Add UTM parameters so leads from this post are attributed to the channel in the lead log. */
export function utmLink(url: string, channel: Channel, campaign: string, content: string) {
  const u = new URL(url);
  u.searchParams.set("utm_source", CHANNEL_INFO[channel].utmSource);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  u.searchParams.set("utm_content", content);
  return u.toString();
}

const CATEGORY_TAGS: Record<string, { ar: string[]; en: string[] }> = {
  "regulatory-updates": { ar: ["#المركز_الوطني_للرقابة_على_الالتزام_البيئي", "#الأنظمة_البيئية"], en: ["#NCEC", "#EnvironmentalRegulation"] },
  "environmental-compliance": { ar: ["#الامتثال_البيئي", "#التصاريح_البيئية"], en: ["#EnvironmentalCompliance", "#Permitting"] },
  esg: { ar: ["#الحوكمة_البيئية_والاجتماعية", "#ESG"], en: ["#ESG", "#Sustainability"] },
  sustainability: { ar: ["#الاستدامة", "#رؤية_2030"], en: ["#Sustainability", "#Vision2030"] },
  "technical-articles": { ar: ["#الرصد_البيئي", "#جودة_الهواء"], en: ["#EnvironmentalMonitoring", "#AirQuality"] },
  "industry-guides": { ar: ["#البيئة", "#السعودية"], en: ["#SaudiArabia", "#Environment"] },
};
export const hashtags = (category: string, lang: "ar" | "en") =>
  [...(CATEGORY_TAGS[category]?.[lang] ?? []), lang === "ar" ? "#سيلورين" : "#Selorin"].join(" ");

const CTA = {
  ar: { read: "اقرأ الدليل كاملًا:", ask: "تحتاج دعمًا في مشروعك؟ اطلب استشارة:", bio: "الرابط في الحساب" },
  en: { read: "Read the full guide:", ask: "Need support on your project? Request a consultation:", bio: "Link in bio" },
};

// X counts every URL as 23 characters and most scripts (Latin, Arabic) as 1; others as 2.
const X_LIMIT = 280;
const X_URL = 23;
export function xLength(text: string) {
  let n = 0;
  const urls = text.match(/https?:\/\/\S+/g) ?? [];
  for (const ch of text.replace(/https?:\/\/\S+/g, "")) {
    const c = ch.codePointAt(0)!;
    n += c <= 0x10ff || (c >= 0x2000 && c <= 0x200d) || (c >= 0x2010 && c <= 0x201f) || (c >= 0x2032 && c <= 0x2037) ? 1 : 2;
  }
  return n + urls.length * X_URL;
}

const clip = (s: string, max: number) => {
  const chars = [...s];
  return chars.length <= max ? s : chars.slice(0, max - 1).join("").replace(/\s+\S*$/, "") + "…";
};

/** Write the text of one post for one channel. Links are added by the caller (already UTM-tagged). */
export function composeText(channel: Channel, a: FeedArticle, variant: Variant, link: string): string {
  const t = CTA[a.lang];
  const tags = hashtags(a.category, a.lang);
  let lead: string;
  let cta = t.read;
  if (variant === "takeaway" && a.takeaways[0]) lead = `${a.takeaways[0]}\n\n${a.title}`;
  else if (variant === "faq" && a.faqs[0]) { lead = `${a.faqs[0].q}\n\n${a.faqs[0].a}`; cta = t.ask; }
  else lead = `${a.title}\n\n${a.description}`;

  switch (channel) {
    case "x": {
      // Fit the 280 limit: shorten the lead, never the link or the hashtags.
      const tail = `\n\n${link}\n${tags}`;
      const head = variant === "faq" && a.faqs[0] ? a.faqs[0].q : variant === "takeaway" && a.takeaways[0] ? a.takeaways[0] : a.title;
      let body = head;
      while (xLength(body + tail) > X_LIMIT && body.length > 20) body = clip(body, [...body].length - 10);
      return body + tail;
    }
    case "instagram":
      // Links in captions are not clickable; the URL is still useful for people who copy it.
      return clip(`${lead}\n\n${t.bio} — ${link}\n\n${tags}`, 2200);
    case "google_business":
      // The link goes in the "Learn more" button; Google rejects posts with phone numbers in text.
      return clip(lead, 1450);
    case "tiktok":
      // Captions are not clickable either; people search TikTok, so keywords and hashtags matter.
      return clip(`${lead}\n\n${t.bio} — selorin.co\n\n${tags}`, 2100);
    case "youtube":
      // The video description (the title comes from the post title).
      return clip(`${lead}\n\n${cta}\n${link}\n\n${tags} #Shorts`, 4900);
    default:
      return clip(`${lead}\n\n${cta}\n${link}\n\n${tags}`, 2900);
  }
}

// Posting slots in Riyadh time (UTC+3, no daylight saving): working week Sunday–Thursday,
// morning, after lunch and evening — when B2B audiences in the Kingdom are most active.
// Friday and Saturday keep one evening slot, when Instagram, TikTok and YouTube are busiest.
export const SLOTS_RIYADH = ["09:30", "13:00", "20:30"];
export const WEEKEND_SLOTS_RIYADH = ["20:30"];
const WORK_DAYS = new Set([0, 1, 2, 3, 4]); // Sun..Thu
const RIYADH_OFFSET_MIN = 180;

/** Every post goes out in English first and in Arabic one slot later. */
const langSkip = (lang: "ar" | "en") => (lang === "ar" ? 1 : 0);

export const toDbTime = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
export const fromDbTime = (s: string) => new Date(s.replace(" ", "T") + "Z");

/** First posting slot at or after `from`; `skip` moves that many slots further on. */
export function nextSlot(from: Date, skip = 0): Date {
  const riyadh = new Date(from.getTime() + RIYADH_OFFSET_MIN * 60_000);
  for (let day = 0; day < 14; day++) {
    const d = new Date(Date.UTC(riyadh.getUTCFullYear(), riyadh.getUTCMonth(), riyadh.getUTCDate() + day));
    for (const slot of WORK_DAYS.has(d.getUTCDay()) ? SLOTS_RIYADH : WEEKEND_SLOTS_RIYADH) {
      const [h, m] = slot.split(":").map(Number);
      const local = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m);
      const utc = new Date(local - RIYADH_OFFSET_MIN * 60_000);
      if (utc.getTime() < from.getTime()) continue;
      if (skip-- > 0) continue;
      return utc;
    }
  }
  throw new Error("no slot found");
}

/**
 * The drip series for one article on the given channels: launch on the next slot, a key takeaway
 * three days later and an FAQ (with the consultation call to action) a week later. Each channel
 * gets its own slot offset so the accounts do not all post in the same minute.
 */
export function articleSeries(a: FeedArticle, channels: Channel[], now: Date, variants: Variant[] = ["launch", "takeaway", "faq"]): PostDraft[] {
  const out: PostDraft[] = [];
  for (const variant of variants) {
    if (variant === "takeaway" && !a.takeaways.length) continue;
    if (variant === "faq" && !a.faqs.length) continue;
    const base = new Date(now.getTime() + VARIANT_INFO[variant].dayOffset * 86_400_000);
    channels.forEach((channel) => {
      if (!CHANNEL_INFO[channel].langs.includes(a.lang)) return;
      if (channel === "instagram" && !a.image) return;
      const video = variant === "launch" && VIDEO_CHANNELS.includes(channel) ? a.video : undefined;
      if (channel === "youtube" && !video) return;
      const at = nextSlot(base, langSkip(a.lang));
      at.setUTCMinutes(at.getUTCMinutes() + CHANNELS.indexOf(channel) * 5);
      const campaign = `insight-${a.slug}`;
      const key = variant === "evergreen" ? `${variant}-${toDbTime(now).slice(0, 10)}` : variant;
      const link = utmLink(a.url, channel, campaign, key);
      const image = (variant === "takeaway" || variant === "faq" ? a.images?.[variant] : variant === "evergreen" ? a.images?.checklist ?? a.images?.launch : a.images?.launch) ?? a.image;
      out.push({
        sourceKey: `${a.lang}/${a.slug}:${key}:${channel}`,
        channel, lang: a.lang, variant, title: a.title,
        text: composeText(channel, a, variant, link), link, image, ...(video ? { video } : {}),
        scheduledAt: toDbTime(at),
      });
    });
  }
  return out;
}

/** Text of a campaign post for one channel (the link is already UTM-tagged). */
export function composeCampaignText(channel: Channel, v: CampaignPost["versions"][number], link: string): string {
  const t = CTA[v.lang];
  switch (channel) {
    case "x": {
      const tail = link ? `\n\n${link}` : "";
      let body = v.x ?? v.text;
      while (xLength(body + tail) > X_LIMIT && body.length > 20) body = clip(body, [...body].length - 10);
      return body + tail;
    }
    case "instagram":
      return clip(`${v.text}${link ? `\n\n${t.bio} — ${link}` : ""}`, 2200);
    case "tiktok":
      return clip(`${v.text}\n\n${t.bio} — selorin.co`, 2100);
    case "youtube":
      return clip(`${v.text}${link ? `\n\n${link}` : ""}\n\n#Shorts`, 4900);
    case "google_business":
      // Hashtags do nothing on Google; the link goes in the "Learn more" button.
      return clip(v.text.split("\n").filter((l) => !/^\s*(#\S+\s*)+$/.test(l)).join("\n").trim(), 1450);
    default:
      return clip(`${v.text}${link ? `\n\n${link}` : ""}`, 2900);
  }
}

/** Start of a Riyadh calendar day (YYYY-MM-DD) in UTC. */
const riyadhDayStart = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - RIYADH_OFFSET_MIN * 60_000);
};

/**
 * Drafts for a campaign post on its day, once it is within the queue window (from yesterday to
 * `aheadDays` ahead). Fridays and Saturdays use the evening slot; a slot already past is moved to the next one.
 */
export function campaignSeries(post: CampaignPost, channels: Channel[], now: Date, aheadDays = 21): PostDraft[] {
  const start = riyadhDayStart(post.date);
  if (start.getTime() > now.getTime() + aheadDays * 86_400_000 || start.getTime() < now.getTime() - 2 * 86_400_000) return [];
  const out: PostDraft[] = [];
  for (const v of post.versions) {
    channels.forEach((channel) => {
      if (post.channels && !post.channels.includes(channel)) return;
      if (!CHANNEL_INFO[channel].langs.includes(v.lang)) return;
      if ((channel === "instagram" || channel === "tiktok") && !v.image && !v.video) return;
      const video = VIDEO_CHANNELS.includes(channel) ? v.video : undefined;
      if (channel === "youtube" && !video) return;
      // The English version's slot (or the next one if it has passed); Arabic follows it.
      let first = nextSlot(start, post.slot);
      if (first.getTime() < now.getTime()) first = nextSlot(now);
      const at = nextSlot(first, langSkip(v.lang));
      at.setUTCMinutes(at.getUTCMinutes() + CHANNELS.indexOf(channel) * 5);
      const link = v.link ? utmLink(v.link, channel, `campaign-${post.id}`, post.stage) : "";
      out.push({
        sourceKey: `campaign/${post.id}:${v.lang}:${channel}`,
        channel, lang: v.lang, variant: "campaign", title: v.title ?? post.pillar,
        text: composeCampaignText(channel, v, link), link, image: v.image ?? "", ...(video ? { video } : {}),
        scheduledAt: toDbTime(at),
      });
    });
  }
  return out;
}

/** Which channels have their credentials set in the Worker environment. */
export function configuredChannels(env: Record<string, unknown>): Channel[] {
  const has = (...k: string[]) => k.every((x) => typeof env[x] === "string" && (env[x] as string).length > 0);
  return CHANNELS.filter((c) => ({
    linkedin: has("LINKEDIN_ACCESS_TOKEN", "LINKEDIN_ORG_ID"),
    x: has("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"),
    facebook: has("FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_TOKEN"),
    instagram: has("INSTAGRAM_USER_ID", "FACEBOOK_PAGE_TOKEN"),
    google_business: has("GBP_CLIENT_ID", "GBP_CLIENT_SECRET", "GBP_REFRESH_TOKEN", "GBP_ACCOUNT_ID", "GBP_LOCATION_ID"),
    webhook: has("SOCIAL_WEBHOOK_URL"),
    tiktok: has("TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REFRESH_TOKEN"),
    youtube: has("YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"),
  })[c]);
}
