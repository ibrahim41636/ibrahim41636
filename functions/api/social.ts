/// <reference types="@cloudflare/workers-types" />
// Social publishing hub: the Worker cron (every 15 minutes, wrangler.toml [triggers]) queues the
// post series for each new article and publishes posts that are due to every connected account.
// Staff endpoints (behind ADMIN_TOKEN, routed from admin.ts):
//   GET  /api/admin/social?status=          → channels (connected or not) + queue
//   POST /api/admin/social/posts            → {channels[], text, link?, image?, scheduledAt?, lang?} add a manual post
//   POST /api/admin/social/update           → {id, action: "cancel" | "publish_now" | "edit", text?, scheduledAt?}
//   POST /api/admin/social/run              → run the cron now (queue new articles + publish due posts)
//   GET  /api/admin/funnel?days=            → leads per source with progress through the sales stages
import { json, type Env } from "./request";
import {
  CHANNELS, CHANNEL_INFO, articleSeries, campaignSeries, configuredChannels, fromDbTime, isChannel, toDbTime, utmLink, xLength,
  type CampaignPost, type Channel, type FeedArticle, type PostDraft,
} from "../../src/lib/social";

export interface SocialEnv extends Env {
  ASSETS?: Fetcher;
  LINKEDIN_ACCESS_TOKEN?: string; LINKEDIN_ORG_ID?: string; LINKEDIN_API_VERSION?: string;
  X_API_KEY?: string; X_API_SECRET?: string; X_ACCESS_TOKEN?: string; X_ACCESS_SECRET?: string;
  FACEBOOK_PAGE_ID?: string; FACEBOOK_PAGE_TOKEN?: string; INSTAGRAM_USER_ID?: string; META_GRAPH_VERSION?: string;
  GBP_CLIENT_ID?: string; GBP_CLIENT_SECRET?: string; GBP_REFRESH_TOKEN?: string; GBP_ACCOUNT_ID?: string; GBP_LOCATION_ID?: string;
  SOCIAL_WEBHOOK_URL?: string; SOCIAL_WEBHOOK_SECRET?: string;
  TIKTOK_CLIENT_KEY?: string; TIKTOK_CLIENT_SECRET?: string; TIKTOK_REFRESH_TOKEN?: string; TIKTOK_PRIVACY?: string;
  YOUTUBE_CLIENT_ID?: string; YOUTUBE_CLIENT_SECRET?: string; YOUTUBE_REFRESH_TOKEN?: string; YOUTUBE_PRIVACY?: string;
  SOCIAL_AUTOPOST?: string; // "false" stops automatic queuing of article posts (manual posts still publish)
  SOCIAL_BACKFILL_DAYS?: string; // articles newer than this are queued (default 21)
  INDEXNOW_KEY?: string; // optional: notify Bing/Yandex of new articles (key served at /<key>.txt)
}

export interface QueuedPost {
  id: number; source_key: string | null; channel: Channel; lang: string; variant: string; title: string | null;
  text: string; link: string | null; image: string | null; video?: string | null; scheduled_at: string; status: string; attempts: number;
  external_id: string | null; error: string | null; published_at: string | null;
}

const MAX_ATTEMPTS = 3;
const PUBLISH_PER_RUN = 10;

// ---------- Publishers: one per platform. Each returns the platform's post id or throws. ----------

async function check(res: Response, what: string) {
  if (res.ok) return res;
  const body = (await res.text()).slice(0, 300);
  throw new Error(`${what} ${res.status}: ${body}`);
}

/** Image or video bytes for a post: the site's own files come straight from the static assets. */
async function mediaBlob(env: SocialEnv, url: string) {
  const res = env.ASSETS && /^https:\/\/(www\.)?selorin\.co\//.test(url) ? await env.ASSETS.fetch(new Request(url)) : await fetch(url);
  await check(res, "Media");
  return new Blob([await res.arrayBuffer()], { type: res.headers.get("content-type") ?? (url.endsWith(".mp4") ? "video/mp4" : "image/jpeg") });
}

async function publishLinkedIn(env: SocialEnv, p: QueuedPost) {
  const headers = {
    authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`, "content-type": "application/json",
    "LinkedIn-Version": env.LINKEDIN_API_VERSION ?? "202606", "X-Restli-Protocol-Version": "2.0.0",
  };
  const owner = `urn:li:organization:${env.LINKEDIN_ORG_ID}`;
  // Branded image posts (the link is in the text) reach further than bare link shares, and the
  // Posts API does not fetch link previews by itself.
  let content: Record<string, unknown> | undefined = p.link ? { article: { source: p.link, title: p.title ?? "" } } : undefined;
  if (p.image) {
    const init = await check(await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
      method: "POST", headers, body: JSON.stringify({ initializeUploadRequest: { owner } }),
    }), "LinkedIn image init");
    const { value } = (await init.json()) as { value: { uploadUrl: string; image: string } };
    await check(await fetch(value.uploadUrl, { method: "PUT", headers: { authorization: headers.authorization }, body: await mediaBlob(env, p.image) }), "LinkedIn image upload");
    content = { media: { id: value.image, altText: (p.title ?? "").slice(0, 300) } };
  }
  const res = await check(await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST", headers,
    body: JSON.stringify({
      author: owner,
      commentary: p.text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      ...(content ? { content } : {}),
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  }), "LinkedIn");
  return res.headers.get("x-restli-id") ?? "";
}

/** RFC 3986 percent-encoding, as OAuth 1.0a requires. */
const pct = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** OAuth 1.0a header for X (user context). Body params of a JSON request are not signed. */
export async function oauth1Header(method: string, url: string, keys: { key: string; secret: string; token: string; tokenSecret: string }, nonce: string, timestamp: string) {
  const params: Record<string, string> = {
    oauth_consumer_key: keys.key, oauth_nonce: nonce, oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp, oauth_token: keys.token, oauth_version: "1.0",
  };
  const paramString = Object.keys(params).sort().map((k) => `${pct(k)}=${pct(params[k])}`).join("&");
  const base = [method.toUpperCase(), pct(url), pct(paramString)].join("&");
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${pct(keys.secret)}&${pct(keys.tokenSecret)}`), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(base)));
  params.oauth_signature = btoa(String.fromCharCode(...sig));
  return "OAuth " + Object.keys(params).sort().map((k) => `${pct(k)}="${pct(params[k])}"`).join(", ");
}

const xKeys = (env: SocialEnv) => ({ key: env.X_API_KEY!, secret: env.X_API_SECRET!, token: env.X_ACCESS_TOKEN!, tokenSecret: env.X_ACCESS_SECRET! });
const nonce = () => [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
const xAuth = (env: SocialEnv, url: string) => oauth1Header("POST", url, xKeys(env), nonce(), String(Math.floor(Date.now() / 1000)));

async function publishX(env: SocialEnv, p: QueuedPost) {
  let mediaId: string | undefined;
  if (p.image) {
    // A failed image upload should not lose the post: fall back to text and link only.
    try {
      const url = "https://api.x.com/2/media/upload";
      const form = new FormData();
      form.append("media", await mediaBlob(env, p.image), "image.jpg");
      form.append("media_category", "tweet_image");
      const up = await check(await fetch(url, { method: "POST", headers: { authorization: await xAuth(env, url) }, body: form }), "X media");
      mediaId = ((await up.json()) as { data?: { id?: string } }).data?.id;
    } catch (err) {
      console.error("x media upload failed, posting without image", p.id, err);
    }
  }
  const url = "https://api.x.com/2/tweets";
  const res = await check(await fetch(url, {
    method: "POST", headers: { authorization: await xAuth(env, url), "content-type": "application/json" },
    body: JSON.stringify({ text: p.text, ...(mediaId ? { media: { media_ids: [mediaId] } } : {}) }),
  }), "X");
  return ((await res.json()) as { data?: { id?: string } }).data?.id ?? "";
}

const graph = (env: SocialEnv, path: string) => `https://graph.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/${path}`;

async function publishFacebook(env: SocialEnv, p: QueuedPost) {
  // With a branded image: a photo post (the link stays in the caption). Otherwise a link post.
  if (p.image) {
    const body = new URLSearchParams({ url: p.image, caption: p.text, access_token: env.FACEBOOK_PAGE_TOKEN! });
    const res = await check(await fetch(graph(env, `${env.FACEBOOK_PAGE_ID}/photos`), { method: "POST", body }), "Facebook photo");
    const r = (await res.json()) as { id?: string; post_id?: string };
    return r.post_id ?? r.id ?? "";
  }
  const body = new URLSearchParams({ message: p.text, access_token: env.FACEBOOK_PAGE_TOKEN! });
  if (p.link) body.set("link", p.link);
  const res = await check(await fetch(graph(env, `${env.FACEBOOK_PAGE_ID}/feed`), { method: "POST", body }), "Facebook");
  return ((await res.json()) as { id?: string }).id ?? "";
}

async function publishInstagram(env: SocialEnv, p: QueuedPost) {
  if (!p.image) throw new Error("Instagram needs an image");
  const token = env.FACEBOOK_PAGE_TOKEN!;
  const created = await check(await fetch(graph(env, `${env.INSTAGRAM_USER_ID}/media`), {
    method: "POST", body: new URLSearchParams({ image_url: p.image, caption: p.text, access_token: token }),
  }), "Instagram media");
  const { id } = (await created.json()) as { id: string };
  const res = await check(await fetch(graph(env, `${env.INSTAGRAM_USER_ID}/media_publish`), {
    method: "POST", body: new URLSearchParams({ creation_id: id, access_token: token }),
  }), "Instagram publish");
  return ((await res.json()) as { id?: string }).id ?? "";
}

async function googleAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const tok = await check(await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  }), "Google token");
  return ((await tok.json()) as { access_token: string }).access_token;
}

async function publishGoogleBusiness(env: SocialEnv, p: QueuedPost) {
  const access_token = await googleAccessToken(env.GBP_CLIENT_ID!, env.GBP_CLIENT_SECRET!, env.GBP_REFRESH_TOKEN!);
  const res = await check(await fetch(`https://mybusiness.googleapis.com/v4/accounts/${env.GBP_ACCOUNT_ID}/locations/${env.GBP_LOCATION_ID}/localPosts`, {
    method: "POST",
    headers: { authorization: `Bearer ${access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      languageCode: p.lang, summary: p.text, topicType: "STANDARD",
      ...(p.link ? { callToAction: { actionType: "LEARN_MORE", url: p.link } } : {}),
      ...(p.image ? { media: [{ mediaFormat: "PHOTO", sourceUrl: p.image }] } : {}),
    }),
  }), "Google Business");
  return ((await res.json()) as { name?: string }).name ?? "";
}

async function hmacHex(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function publishWebhook(env: SocialEnv, p: QueuedPost) {
  const body = JSON.stringify({ id: p.id, lang: p.lang, variant: p.variant, title: p.title, text: p.text, link: p.link, image: p.image });
  await check(await fetch(env.SOCIAL_WEBHOOK_URL!, {
    method: "POST",
    headers: { "content-type": "application/json", ...(env.SOCIAL_WEBHOOK_SECRET ? { "x-selorin-signature": await hmacHex(env.SOCIAL_WEBHOOK_SECRET, body) } : {}) },
    body,
  }), "Webhook");
  return `webhook-${p.id}`;
}

const clipText = (s: string, max: number) => ([...s].length <= max ? s : [...s].slice(0, max - 1).join("") + "…");

/**
 * TikTok access token. TikTok refresh tokens can rotate, so the newest one is kept in D1
 * (social_tokens); the TIKTOK_REFRESH_TOKEN secret is only the starting point.
 */
async function tiktokToken(env: SocialEnv, now = new Date()) {
  const db = env.DB!;
  const row = await db.prepare(`SELECT access_token, refresh_token, expires_at FROM social_tokens WHERE channel = 'tiktok'`)
    .first<{ access_token: string | null; refresh_token: string | null; expires_at: string | null }>();
  if (row?.access_token && row.expires_at && fromDbTime(row.expires_at).getTime() > now.getTime() + 5 * 60_000) return row.access_token;
  const res = await check(await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY!, client_secret: env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token", refresh_token: row?.refresh_token || env.TIKTOK_REFRESH_TOKEN!,
    }),
  }), "TikTok token");
  const t = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!t.access_token) throw new Error(`TikTok token: ${t.error ?? "no token"} ${t.error_description ?? ""}`.trim());
  await db.prepare(
    `INSERT INTO social_tokens (channel, access_token, refresh_token, expires_at) VALUES ('tiktok', ?1, ?2, ?3)
     ON CONFLICT(channel) DO UPDATE SET access_token = ?1, refresh_token = ?2, expires_at = ?3`,
  ).bind(t.access_token, t.refresh_token ?? row?.refresh_token ?? env.TIKTOK_REFRESH_TOKEN!, toDbTime(new Date(now.getTime() + (t.expires_in ?? 3600) * 1000))).run();
  return t.access_token;
}

async function tiktokCall(token: string, path: string, body: unknown) {
  const res = await check(await fetch(`https://open.tiktokapis.com/v2/${path}`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8" }, body: JSON.stringify(body),
  }), "TikTok");
  const r = (await res.json()) as { data?: Record<string, unknown>; error?: { code?: string; message?: string } };
  if (r.error?.code && r.error.code !== "ok") throw new Error(`TikTok ${r.error.code}: ${r.error.message ?? ""}`);
  return r.data ?? {};
}

async function publishTikTok(env: SocialEnv, p: QueuedPost) {
  if (!p.video && !p.image) throw new Error("TikTok needs a video or an image");
  const token = await tiktokToken(env);
  // Apps that TikTok has not audited yet may only post privately (SELF_ONLY); use what the account allows.
  const info = await tiktokCall(token, "post/publish/creator_info/query/", {});
  const options = (info.privacy_level_options as string[] | undefined) ?? [];
  const privacy = [env.TIKTOK_PRIVACY, "PUBLIC_TO_EVERYONE"].find((o) => o && options.includes(o)) ?? options[0] ?? "SELF_ONLY";
  // Media is pulled by TikTok from selorin.co, which must be verified in the TikTok developer portal.
  const data = p.video
    ? await tiktokCall(token, "post/publish/video/init/", {
        post_info: { title: clipText(p.text, 2200), privacy_level: privacy, disable_duet: false, disable_comment: false, disable_stitch: false },
        source_info: { source: "PULL_FROM_URL", video_url: p.video },
      })
    : await tiktokCall(token, "post/publish/content/init/", {
        post_info: { title: clipText(p.title ?? "", 90), description: clipText(p.text, 4000), privacy_level: privacy, disable_comment: false, auto_add_music: true },
        source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [p.image] },
        post_mode: "DIRECT_POST", media_type: "PHOTO",
      });
  return String(data.publish_id ?? "");
}

async function publishYouTube(env: SocialEnv, p: QueuedPost) {
  if (!p.video) throw new Error("YouTube needs a video");
  const token = await googleAccessToken(env.YOUTUBE_CLIENT_ID!, env.YOUTUBE_CLIENT_SECRET!, env.YOUTUBE_REFRESH_TOKEN!);
  const video = await mediaBlob(env, p.video);
  // Resumable upload: send the metadata, then the bytes to the session URL.
  const start = await check(await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8", "x-upload-content-type": "video/mp4", "x-upload-content-length": String(video.size) },
    body: JSON.stringify({
      snippet: { title: clipText(p.title || p.text.split("\n")[0], 100), description: clipText(p.text, 4900), categoryId: "28", defaultLanguage: p.lang, defaultAudioLanguage: p.lang },
      status: { privacyStatus: env.YOUTUBE_PRIVACY ?? "public", selfDeclaredMadeForKids: false },
    }),
  }), "YouTube init");
  const session = start.headers.get("location");
  if (!session) throw new Error("YouTube init: no upload URL");
  const res = await check(await fetch(session, { method: "PUT", headers: { authorization: `Bearer ${token}`, "content-type": "video/mp4" }, body: video }), "YouTube upload");
  return ((await res.json()) as { id?: string }).id ?? "";
}

const PUBLISHERS: Record<Channel, (env: SocialEnv, p: QueuedPost) => Promise<string>> = {
  linkedin: publishLinkedIn, x: publishX, facebook: publishFacebook, instagram: publishInstagram,
  google_business: publishGoogleBusiness, webhook: publishWebhook, tiktok: publishTikTok, youtube: publishYouTube,
};

// ---------- Queue ----------

function insertStmt(db: D1Database, d: PostDraft) {
  return db.prepare(
    `INSERT OR IGNORE INTO social_posts (source_key, channel, lang, variant, title, text, link, image, video, scheduled_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
  ).bind(d.sourceKey, d.channel, d.lang, d.variant, d.title, d.text, d.link, d.image, d.video ?? null, d.scheduledAt);
}

export interface Feed { articles: FeedArticle[]; campaign?: CampaignPost[] }

/**
 * Queue the post series for recent articles, one older article per week (evergreen rotation) and
 * the campaign posts whose day is coming up.
 */
export async function queueFeed(env: SocialEnv, { articles, campaign = [] }: Feed, now: Date) {
  const channels = configuredChannels(env as unknown as Record<string, unknown>);
  if (!env.DB || !channels.length || env.SOCIAL_AUTOPOST === "false") return { queued: 0, newArticles: [] as string[] };
  const backfill = Number(env.SOCIAL_BACKFILL_DAYS) || 21;
  const cutoff = now.getTime() - backfill * 86_400_000;
  const recent = articles.filter((a) => new Date(a.date).getTime() >= cutoff && new Date(a.date).getTime() <= now.getTime());
  // Several articles at once (a new channel, or a batch of articles) launch two days apart, newest first.
  const order = [...new Set([...recent].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)).map((a) => a.slug))];
  const drafts = [
    ...recent.flatMap((a) => articleSeries(a, channels, new Date(now.getTime() + order.indexOf(a.slug) * 2 * 86_400_000))),
    ...campaign.flatMap((c) => campaignSeries(c, channels, now)),
  ];

  // Evergreen: re-share an older Arabic article once a week, rotating through the archive.
  const older = articles.filter((a) => a.lang === "ar" && new Date(a.date).getTime() < cutoff).sort((a, b) => a.date.localeCompare(b.date));
  if (older.length) {
    const last = await env.DB.prepare(`SELECT COUNT(*) AS n FROM social_posts WHERE variant = 'evergreen' AND created_at > datetime(?1, '-7 days')`)
      .bind(toDbTime(now)).first<{ n: number }>();
    if (!last?.n) {
      const week = Math.floor(now.getTime() / (7 * 86_400_000));
      drafts.push(...articleSeries(older[week % older.length], channels, now, ["evergreen"]));
    }
  }
  if (!drafts.length) return { queued: 0, newArticles: [] };

  const results = await env.DB.batch(drafts.map((d) => insertStmt(env.DB!, d)));
  let queued = 0;
  const newArticles = new Set<string>();
  results.forEach((r, i) => {
    if (!r.meta?.changes) return;
    queued++;
    if (drafts[i].variant === "launch") newArticles.add(recent.find((a) => drafts[i].sourceKey.startsWith(`${a.lang}/${a.slug}:`))!.url);
  });
  return { queued, newArticles: [...newArticles] };
}

/** Tell IndexNow-enabled search engines (Bing, Yandex, Seznam…) about newly published URLs. */
async function pingIndexNow(env: SocialEnv, urls: string[]) {
  if (!env.INDEXNOW_KEY || !urls.length) return;
  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: "selorin.co", key: env.INDEXNOW_KEY, keyLocation: `https://selorin.co/${env.INDEXNOW_KEY}.txt`, urlList: urls }),
  }).catch((e) => console.error("indexnow failed", e));
}

/** Publish one post: claim it (so two runs never post it twice), call the platform, record the result. */
export async function publishPost(env: SocialEnv, p: QueuedPost, now: Date) {
  const db = env.DB!;
  const claim = await db.prepare(`UPDATE social_posts SET status = 'publishing', attempts = attempts + 1 WHERE id = ?1 AND status = 'scheduled'`).bind(p.id).run();
  if (!claim.meta?.changes) return { id: p.id, ok: false, error: "not_scheduled" };
  try {
    if (!configuredChannels(env as unknown as Record<string, unknown>).includes(p.channel)) throw new Error("channel_not_configured");
    const externalId = await PUBLISHERS[p.channel](env, p);
    await db.prepare(`UPDATE social_posts SET status = 'published', external_id = ?1, error = NULL, published_at = ?2 WHERE id = ?3`)
      .bind(externalId, toDbTime(now), p.id).run();
    return { id: p.id, ok: true };
  } catch (err) {
    const error = String(err instanceof Error ? err.message : err).slice(0, 500);
    console.error("social publish failed", p.id, p.channel, error);
    const giveUp = p.attempts + 1 >= MAX_ATTEMPTS || error === "channel_not_configured";
    const retryAt = toDbTime(new Date(now.getTime() + 30 * 60_000));
    await db.prepare(`UPDATE social_posts SET status = ?1, error = ?2, scheduled_at = CASE WHEN ?1 = 'scheduled' THEN ?3 ELSE scheduled_at END WHERE id = ?4`)
      .bind(giveUp ? "failed" : "scheduled", error, retryAt, p.id).run();
    return { id: p.id, ok: false, error };
  }
}

export async function publishDue(env: SocialEnv, now: Date) {
  if (!env.DB) return [];
  const due = await env.DB.prepare(`SELECT * FROM social_posts WHERE status = 'scheduled' AND scheduled_at <= ?1 ORDER BY scheduled_at LIMIT ${PUBLISH_PER_RUN}`)
    .bind(toDbTime(now)).all<QueuedPost>();
  const out = [];
  for (const p of due.results ?? []) out.push(await publishPost(env, p, now));
  return out;
}

export async function loadFeed(env: SocialEnv): Promise<Feed> {
  if (!env.ASSETS) return { articles: [] };
  const res = await env.ASSETS.fetch(new Request("https://selorin.co/social-feed.json"));
  if (!res.ok) return { articles: [] };
  const feed = (await res.json()) as Feed;
  return { articles: feed.articles ?? [], campaign: feed.campaign ?? [] };
}

/** The cron job: queue new article posts, ping IndexNow for new articles, publish what is due. */
export async function runSocialCron(env: SocialEnv, now = new Date(), feed?: Feed) {
  if (!env.DB) return { queued: 0, published: 0, failed: 0 };
  const { queued, newArticles } = await queueFeed(env, feed ?? (await loadFeed(env)), now);
  await pingIndexNow(env, newArticles);
  const results = await publishDue(env, now);
  return { queued, published: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
}

// ---------- Staff endpoints ----------

const SELORIN = /^https:\/\/(www\.)?selorin\.co\//;

export async function handleSocialAdmin(request: Request, env: SocialEnv, path: string): Promise<Response> {
  const db = env.DB!;
  const configured = configuredChannels(env as unknown as Record<string, unknown>);

  if (path === "/api/admin/social" && request.method === "GET") {
    const status = new URL(request.url).searchParams.get("status");
    const filter = status && ["scheduled", "published", "failed", "cancelled"].includes(status) ? "WHERE status = ?1" : "";
    const stmt = db.prepare(
      `SELECT id, channel, lang, variant, title, text, link, image, video, scheduled_at, status, attempts, external_id, error, published_at
       FROM social_posts ${filter} ORDER BY CASE WHEN status IN ('scheduled','publishing') THEN 0 ELSE 1 END, scheduled_at ${filter ? "DESC" : "ASC"} LIMIT 150`,
    );
    const rows = await (filter ? stmt.bind(status) : stmt).all();
    return json(200, {
      ok: true,
      channels: CHANNELS.map((c) => ({ id: c, name: CHANNEL_INFO[c].ar, configured: configured.includes(c) })),
      posts: rows.results ?? [],
    });
  }

  if (path === "/api/admin/social/posts" && request.method === "POST") {
    let body: { channels?: unknown[]; text?: string; link?: string; image?: string; scheduledAt?: string; lang?: string; title?: string };
    try { body = await request.json(); } catch { return json(400, { ok: false, error: "bad_request" }); }
    const channels = (body.channels ?? []).filter(isChannel);
    const text = String(body.text ?? "").trim().slice(0, 2900);
    const lang = body.lang === "en" ? "en" : "ar";
    const at = body.scheduledAt ? new Date(body.scheduledAt) : new Date();
    const image = String(body.image ?? "").trim();
    if (!channels.length || !text || Number.isNaN(at.getTime())) return json(422, { ok: false, error: "validation" });
    if (image && !/^https:\/\//.test(image)) return json(422, { ok: false, error: "image_url" });
    if (channels.includes("instagram") && !image) return json(422, { ok: false, error: "instagram_needs_image" });
    const campaign = `manual-${toDbTime(at).slice(0, 10)}`;
    const stmts = [];
    for (const channel of channels) {
      const raw = String(body.link ?? "").trim();
      const link = raw && SELORIN.test(raw) ? utmLink(raw, channel, campaign, "manual") : raw;
      const full = channel === "google_business" || !link || text.includes(link) ? text : `${text}\n\n${link}`;
      if (channel === "x" && xLength(full) > 280) return json(422, { ok: false, error: "x_too_long", length: xLength(full) });
      stmts.push(db.prepare(
        `INSERT INTO social_posts (channel, lang, variant, title, text, link, image, scheduled_at) VALUES (?1, ?2, 'manual', ?3, ?4, ?5, ?6, ?7)`,
      ).bind(channel, lang, String(body.title ?? "").slice(0, 200) || null, full, link || null, image || null, toDbTime(at)));
    }
    await db.batch(stmts);
    return json(200, { ok: true, created: stmts.length });
  }

  if (path === "/api/admin/social/update" && request.method === "POST") {
    let body: { id?: number; action?: string; text?: string; scheduledAt?: string };
    try { body = await request.json(); } catch { return json(400, { ok: false, error: "bad_request" }); }
    const id = Number(body.id);
    const post = await db.prepare(`SELECT * FROM social_posts WHERE id = ?1`).bind(id).first<QueuedPost>();
    if (!post) return json(404, { ok: false, error: "not_found" });
    if (body.action === "cancel") {
      if (post.status !== "scheduled" && post.status !== "failed") return json(409, { ok: false, error: "not_cancellable" });
      await db.prepare(`UPDATE social_posts SET status = 'cancelled' WHERE id = ?1`).bind(id).run();
      return json(200, { ok: true });
    }
    if (body.action === "edit") {
      if (post.status !== "scheduled" && post.status !== "failed") return json(409, { ok: false, error: "not_editable" });
      const text = String(body.text ?? post.text).trim().slice(0, 2900);
      const at = body.scheduledAt ? new Date(body.scheduledAt) : fromDbTime(post.scheduled_at);
      if (!text || Number.isNaN(at.getTime())) return json(422, { ok: false, error: "validation" });
      if (post.channel === "x" && xLength(text) > 280) return json(422, { ok: false, error: "x_too_long", length: xLength(text) });
      await db.prepare(`UPDATE social_posts SET text = ?1, scheduled_at = ?2, status = 'scheduled', attempts = 0, error = NULL WHERE id = ?3`)
        .bind(text, toDbTime(at), id).run();
      return json(200, { ok: true });
    }
    if (body.action === "publish_now") {
      if (post.status === "failed") await db.prepare(`UPDATE social_posts SET status = 'scheduled', attempts = 0 WHERE id = ?1`).bind(id).run();
      else if (post.status !== "scheduled") return json(409, { ok: false, error: "not_publishable" });
      const result = await publishPost(env, { ...post, attempts: post.status === "failed" ? 0 : post.attempts }, new Date());
      return json(result.ok ? 200 : 502, { ok: result.ok, error: result.error });
    }
    return json(422, { ok: false, error: "validation" });
  }

  if (path === "/api/admin/social/run" && request.method === "POST") {
    return json(200, { ok: true, ...(await runSocialCron(env)) });
  }

  if (path === "/api/admin/funnel" && request.method === "GET") {
    const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get("days")) || 90, 7), 365);
    const since = `-${days} days`;
    const [sources, posts] = await db.batch([
      db.prepare(
        `SELECT COALESCE(NULLIF(utm_source, ''), '(direct)') AS source, COALESCE(NULLIF(utm_medium, ''), '') AS medium,
                COUNT(*) AS leads,
                SUM(CASE WHEN status IN ('quoted','in_progress','completed') THEN 1 ELSE 0 END) AS quoted,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS won
         FROM leads WHERE submitted_at > datetime('now', ?1) GROUP BY source, medium ORDER BY leads DESC`,
      ).bind(since),
      db.prepare(`SELECT channel, COUNT(*) AS published FROM social_posts WHERE status = 'published' AND published_at > datetime('now', ?1) GROUP BY channel`).bind(since),
    ]);
    return json(200, { ok: true, days, sources: sources.results ?? [], posts: posts.results ?? [] });
  }

  return json(404, { ok: false, error: "not_found" });
}
