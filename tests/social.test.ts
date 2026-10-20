import { describe, expect, it, vi, afterEach } from "vitest";
import { articleSeries, campaignSeries, composeCampaignText, composeText, configuredChannels, nextSlot, toDbTime, utmLink, xLength, type CampaignPost, type FeedArticle } from "../src/lib/social";
import { oauth1Header, publishPost, runSocialCron, handleSocialAdmin, type QueuedPost, type SocialEnv } from "../functions/api/social";

const article: FeedArticle = {
  slug: "dust-monitoring", lang: "ar", title: "رصد الغبار في مواقع الإنشاء", description: "كيف تصمم برنامج رصد الغبار.",
  url: "https://selorin.co/ar/insights/dust-monitoring/", image: "https://selorin.co/images/construction.jpg",
  category: "technical-articles", date: "2026-10-18T00:00:00.000Z",
  takeaways: ["لا بد من شبكة تضم مواقع في اتجاه الرياح وعكسه.", "ب", "ج"],
  faqs: [{ q: "هل نرصد PM10 أم PM2.5؟", a: "في الغالب كليهما." }],
};

describe("social helpers", () => {
  it("tags links with UTM parameters per channel", () => {
    const u = new URL(utmLink(article.url, "linkedin", "insight-dust-monitoring", "launch"));
    expect(u.searchParams.get("utm_source")).toBe("linkedin");
    expect(u.searchParams.get("utm_medium")).toBe("social");
    expect(u.searchParams.get("utm_campaign")).toBe("insight-dust-monitoring");
  });

  it("counts X length with URLs as 23 and Arabic as 1", () => {
    expect(xLength("مرحبا https://selorin.co/a/very/long/path/that/is/long")).toBe(6 + 23);
    expect(xLength("日本")).toBe(4);
  });

  it("keeps X posts within 280 characters", () => {
    const long = { ...article, title: "عنوان طويل جدًا ".repeat(40) };
    const text = composeText("x", long, "launch", utmLink(long.url, "x", "c", "launch"));
    expect(xLength(text)).toBeLessThanOrEqual(280);
    expect(text).toContain("utm_source=x");
  });

  it("schedules on Riyadh working-day slots only", () => {
    // Friday 2026-10-23 10:00 UTC → next slot is Sunday 09:30 Riyadh = 06:30 UTC.
    expect(toDbTime(nextSlot(new Date("2026-10-23T10:00:00Z")))).toBe("2026-10-25 06:30:00");
    // Monday 05:00 UTC (08:00 Riyadh) → 09:30 Riyadh same day; skip 1 → 13:00 Riyadh.
    expect(toDbTime(nextSlot(new Date("2026-10-19T05:00:00Z")))).toBe("2026-10-19 06:30:00");
    expect(toDbTime(nextSlot(new Date("2026-10-19T05:00:00Z"), 1))).toBe("2026-10-19 10:00:00");
  });

  it("builds a launch → takeaway → FAQ series per channel and language", () => {
    const now = new Date("2026-10-19T05:00:00Z");
    const posts = articleSeries(article, ["linkedin", "x", "instagram"], now);
    expect(posts.map((p) => p.sourceKey)).toContain("ar/dust-monitoring:faq:x");
    expect(posts).toHaveLength(9);
    const faq = posts.find((p) => p.variant === "faq" && p.channel === "linkedin")!;
    expect(faq.text).toContain(article.faqs[0].q);
    expect(faq.scheduledAt > posts[0].scheduledAt).toBe(true);
    // English articles only go to channels that publish in English.
    expect(articleSeries({ ...article, lang: "en" }, ["x", "linkedin"], now).every((p) => p.channel === "linkedin")).toBe(true);
  });

  it("turns a channel on only when all its secrets are set", () => {
    expect(configuredChannels({ LINKEDIN_ACCESS_TOKEN: "t" })).toEqual([]);
    expect(configuredChannels({ LINKEDIN_ACCESS_TOKEN: "t", LINKEDIN_ORG_ID: "1", SOCIAL_WEBHOOK_URL: "https://h" })).toEqual(["linkedin", "webhook"]);
  });
});

describe("campaign posts and branded images", () => {
  const post: CampaignPost = {
    id: "2026-10-25-cbam", date: "2026-10-25", slot: 1, stage: "consideration", pillar: "Carbon",
    versions: [
      { lang: "ar", text: "نص المنشور العربي مع معلومة موثقة.\n\n#الاستدامة #سيلورين", x: "نسخة قصيرة لإكس", link: "https://selorin.co/ar/services/ghg-carbon-accounting/", image: "https://selorin.co/social/campaign/2026-10-25-cbam-ar.jpg" },
      { lang: "en", text: "English version of the post with a sourced fact.", link: "https://selorin.co/services/ghg-carbon-accounting/" },
    ],
  };

  it("uses the rendered image for each article variant", () => {
    const a = { ...article, images: { launch: "https://selorin.co/social/ar/d/launch.jpg", takeaway: "https://selorin.co/social/ar/d/takeaway.jpg", faq: "https://selorin.co/social/ar/d/faq.jpg" } };
    const posts = articleSeries(a, ["linkedin"], new Date("2026-10-19T05:00:00Z"));
    expect(posts.map((p) => p.image.split("/").pop())).toEqual(["launch.jpg", "takeaway.jpg", "faq.jpg"]);
  });

  it("schedules a campaign post on its day and slot, per language and channel", () => {
    const drafts = campaignSeries(post, ["linkedin", "x", "instagram", "google_business"], new Date("2026-10-20T05:00:00Z"));
    // Sunday 25 Oct, second slot (13:00 Riyadh = 10:00 UTC); English one slot later.
    expect(drafts.find((d) => d.channel === "linkedin" && d.lang === "ar")!.scheduledAt).toBe("2026-10-25 10:00:00");
    expect(drafts.find((d) => d.channel === "linkedin" && d.lang === "en")!.scheduledAt).toBe("2026-10-25 17:30:00");
    expect(drafts.some((d) => d.channel === "instagram" && d.lang === "ar")).toBe(true);
    expect(drafts.some((d) => d.lang === "en" && d.channel !== "linkedin")).toBe(false);
    const x = drafts.find((d) => d.channel === "x")!;
    expect(x.text.startsWith("نسخة قصيرة لإكس")).toBe(true);
    expect(x.link).toContain("utm_campaign=campaign-2026-10-25-cbam");
    expect(drafts.find((d) => d.channel === "google_business")!.text).not.toContain("#");
  });

  it("waits until a campaign post is within three weeks and drops stale ones", () => {
    expect(campaignSeries(post, ["linkedin"], new Date("2026-09-01T00:00:00Z"))).toEqual([]);
    expect(campaignSeries(post, ["linkedin"], new Date("2026-11-10T00:00:00Z"))).toEqual([]);
    // Same day but after the slot → next slot.
    const late = campaignSeries(post, ["linkedin"], new Date("2026-10-25T11:00:00Z"));
    expect(late[0].scheduledAt).toBe("2026-10-25 17:30:00");
  });

  it("keeps campaign X posts within the limit", () => {
    const long = { lang: "ar" as const, text: "أ".repeat(400) };
    expect(xLength(composeCampaignText("x", long, "https://selorin.co/ar/?utm_source=x"))).toBeLessThanOrEqual(280);
  });
});

describe("TikTok and YouTube", () => {
  afterEach(() => vi.unstubAllGlobals());
  const withVideo = { ...article, video: "https://selorin.co/social/video/ar/dust-monitoring.mp4", images: { launch: "https://selorin.co/l.jpg", takeaway: "https://selorin.co/t.jpg", faq: "https://selorin.co/f.jpg" } };
  const queued = (over: Partial<QueuedPost>): QueuedPost => ({
    id: 1, source_key: null, channel: "tiktok", lang: "ar", variant: "launch", title: "رصد الغبار", text: "نص", link: null, image: null, video: null,
    scheduled_at: "2026-10-19 05:00:00", status: "scheduled", attempts: 0, external_id: null, error: null, published_at: null, ...over,
  });

  it("sends the video to YouTube (launch only) and TikTok, and images for the other TikTok posts", () => {
    const posts = articleSeries(withVideo, ["tiktok", "youtube"], new Date("2026-10-19T05:00:00Z"));
    expect(posts.filter((p) => p.channel === "youtube").map((p) => p.variant)).toEqual(["launch"]);
    expect(posts.find((p) => p.channel === "youtube")!.video).toBe(withVideo.video);
    expect(posts.find((p) => p.channel === "youtube")!.text).toContain("#Shorts");
    const tk = posts.filter((p) => p.channel === "tiktok");
    expect(tk.map((p) => [p.variant, !!p.video])).toEqual([["launch", true], ["takeaway", false], ["faq", false]]);
    expect(articleSeries(article, ["youtube"], new Date("2026-10-19T05:00:00Z"))).toEqual([]);
  });

  it("posts a TikTok video with the privacy level the account allows and keeps the rotated refresh token", async () => {
    const db = fakeDb();
    db.posts.push(queued({ video: "https://selorin.co/v.mp4" }));
    const calls: { url: string; body: any }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const body = init?.body instanceof URLSearchParams ? Object.fromEntries(init.body) : init?.body ? JSON.parse(String(init.body)) : null;
      calls.push({ url, body });
      if (url.includes("oauth/token")) return Response.json({ access_token: "at1", refresh_token: "rt2", expires_in: 86400 });
      if (url.includes("creator_info")) return Response.json({ data: { privacy_level_options: ["FOLLOWER_OF_CREATOR", "SELF_ONLY"] }, error: { code: "ok" } });
      if (url.includes("video/init")) return Response.json({ data: { publish_id: "pub-1" }, error: { code: "ok" } });
      return new Response("unexpected", { status: 500 });
    });
    const env = { DB: db as unknown as D1Database, TIKTOK_CLIENT_KEY: "k", TIKTOK_CLIENT_SECRET: "s", TIKTOK_REFRESH_TOKEN: "rt1" } as SocialEnv;
    const r = await publishPost(env, db.posts[0] as QueuedPost, new Date("2026-10-19T05:00:00Z"));
    expect(r.ok).toBe(true);
    expect(db.posts[0].external_id).toBe("pub-1");
    expect(calls[0].body.refresh_token).toBe("rt1");
    const init = calls.find((c) => c.url.includes("video/init"))!.body;
    expect(init.post_info.privacy_level).toBe("FOLLOWER_OF_CREATOR");
    expect(init.source_info).toEqual({ source: "PULL_FROM_URL", video_url: "https://selorin.co/v.mp4" });
    expect(db.tokens.tiktok.refresh_token).toBe("rt2");
  });

  it("posts a TikTok photo when there is no video", async () => {
    const db = fakeDb();
    db.tokens.tiktok = { access_token: "cached", refresh_token: "rt", expires_at: "2099-01-01 00:00:00" };
    db.posts.push(queued({ image: "https://selorin.co/t.jpg", variant: "takeaway" }));
    const calls: string[] = [];
    let photo: any;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push(url);
      if (url.includes("creator_info")) return Response.json({ data: { privacy_level_options: ["PUBLIC_TO_EVERYONE", "SELF_ONLY"] }, error: { code: "ok" } });
      if (url.includes("content/init")) { photo = JSON.parse(String(init.body)); return Response.json({ data: { publish_id: "pub-2" }, error: { code: "ok" } }); }
      return new Response("unexpected", { status: 500 });
    });
    const env = { DB: db as unknown as D1Database, TIKTOK_CLIENT_KEY: "k", TIKTOK_CLIENT_SECRET: "s", TIKTOK_REFRESH_TOKEN: "rt1" } as SocialEnv;
    expect((await publishPost(env, db.posts[0] as QueuedPost, new Date("2026-10-19T05:00:00Z"))).ok).toBe(true);
    expect(calls.some((u) => u.includes("oauth"))).toBe(false); // cached token reused
    expect(photo.media_type).toBe("PHOTO");
    expect(photo.post_info.privacy_level).toBe("PUBLIC_TO_EVERYONE");
    expect(photo.source_info.photo_images).toEqual(["https://selorin.co/t.jpg"]);
  });

  it("uploads a YouTube Short with a resumable upload", async () => {
    const db = fakeDb();
    db.posts.push(queued({ channel: "youtube", video: "https://selorin.co/v.mp4", text: "وصف\n\n#Shorts" }));
    let meta: any; let put: RequestInit | undefined;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      if (url.includes("oauth2.googleapis.com")) return Response.json({ access_token: "g1" });
      if (url === "https://selorin.co/v.mp4") return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "video/mp4" } });
      if (url.includes("uploadType=resumable")) { meta = JSON.parse(String(init.body)); return new Response(null, { status: 200, headers: { location: "https://upload.example/session" } }); }
      if (url === "https://upload.example/session") { put = init; return Response.json({ id: "yt-1" }); }
      return new Response("unexpected", { status: 500 });
    });
    const env = { DB: db as unknown as D1Database, YOUTUBE_CLIENT_ID: "c", YOUTUBE_CLIENT_SECRET: "s", YOUTUBE_REFRESH_TOKEN: "r" } as SocialEnv;
    expect((await publishPost(env, db.posts[0] as QueuedPost, new Date())).ok).toBe(true);
    expect(db.posts[0].external_id).toBe("yt-1");
    expect(meta.snippet.title).toBe("رصد الغبار");
    expect(meta.status.privacyStatus).toBe("public");
    expect(put?.method).toBe("PUT");
  });
});

describe("X OAuth 1.0a", () => {
  it("signs the request as specified (independent signature check)", async () => {
    const keys = { key: "xvz1evFS4wEEPTGEFPHBog", secret: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw", token: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", tokenSecret: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE" };
    const h = await oauth1Header("POST", "https://api.x.com/2/tweets", keys, "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg", "1318622958");
    const params = `oauth_consumer_key=${keys.key}&oauth_nonce=kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1318622958&oauth_token=${keys.token}&oauth_version=1.0`;
    const base = `POST&${encodeURIComponent("https://api.x.com/2/tweets")}&${encodeURIComponent(params)}`;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${keys.secret}&${keys.tokenSecret}`), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base)))));
    expect(h).toContain(`oauth_signature="${encodeURIComponent(sig)}"`);
    expect(h.startsWith('OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog", oauth_nonce=')).toBe(true);
  });
});

// In-memory stand-in for the social_posts queries.
function fakeDb() {
  type Row = Record<string, any>;
  const posts: Row[] = [];
  const tokens: Row = {};
  let id = 0;
  const run = (sql: string, a: unknown[]) => {
    if (sql.startsWith("INSERT OR IGNORE INTO social_posts")) {
      if (posts.some((p) => p.source_key === a[0])) return 0;
      posts.push({ id: ++id, source_key: a[0], channel: a[1], lang: a[2], variant: a[3], title: a[4], text: a[5], link: a[6], image: a[7], video: a[8], scheduled_at: a[9], status: "scheduled", attempts: 0, created_at: "2026-10-19 05:00:00" });
      return 1;
    }
    if (sql.startsWith("INSERT INTO social_posts")) {
      posts.push({ id: ++id, source_key: null, channel: a[0], lang: a[1], variant: "manual", title: a[2], text: a[3], link: a[4], image: a[5], scheduled_at: a[6], status: "scheduled", attempts: 0 });
      return 1;
    }
    if (sql.includes("SET status = 'publishing'")) { const p = posts.find((x) => x.id === a[0] && x.status === "scheduled"); if (!p) return 0; p.status = "publishing"; p.attempts++; return 1; }
    if (sql.includes("SET status = 'published'")) { const p = posts.find((x) => x.id === a[2])!; Object.assign(p, { status: "published", external_id: a[0], published_at: a[1] }); return 1; }
    if (sql.includes("SET status = ?1, error = ?2")) { const p = posts.find((x) => x.id === a[3])!; Object.assign(p, { status: a[0], error: a[1] }); if (a[0] === "scheduled") p.scheduled_at = a[2]; return 1; }
    if (sql.includes("SET status = 'cancelled'")) { posts.find((x) => x.id === a[0])!.status = "cancelled"; return 1; }
    if (sql.startsWith("INSERT INTO social_tokens")) { tokens.tiktok = { access_token: a[0], refresh_token: a[1], expires_at: a[2] }; return 1; }
    return 0;
  };
  const stmt = (sql: string, args: unknown[] = []): any => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    run: async () => ({ meta: { changes: run(sql, args) } }),
    first: async () => {
      if (sql.includes("COUNT(*) AS n FROM social_posts")) return { n: posts.filter((p) => p.variant === "evergreen").length };
      if (sql.includes("FROM social_tokens")) return tokens.tiktok ?? null;
      if (sql.includes("FROM social_posts WHERE id = ?1")) { const p = posts.find((x) => x.id === args[0]); return p ? { ...p } : null; }
      return null;
    },
    all: async () => {
      if (sql.includes("WHERE status = 'scheduled' AND scheduled_at <= ?1")) return { results: posts.filter((p) => p.status === "scheduled" && p.scheduled_at <= (args[0] as string)).slice(0, 10).map((p) => ({ ...p })) };
      if (sql.includes("FROM social_posts")) return { results: posts };
      return { results: [] };
    },
  });
  return { posts, tokens, prepare: (sql: string) => stmt(sql), batch: async (list: any[]) => Promise.all(list.map((s) => s.run())) };
}

describe("social cron", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("queues each article once and publishes due posts through the webhook", async () => {
    const db = fakeDb();
    const sent: any[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => { sent.push({ url, body: JSON.parse(String(init.body)) }); return new Response("{}", { status: 200 }); });
    const env = { DB: db as unknown as D1Database, SOCIAL_WEBHOOK_URL: "https://hook.example/x" } as SocialEnv;
    const old = { ...article, slug: "old-guide", date: "2025-01-01T00:00:00.000Z" };

    const first = await runSocialCron(env, new Date("2026-10-19T05:00:00Z"), { articles: [article, old] });
    expect(first.queued).toBe(4); // launch + takeaway + faq + one evergreen re-share
    expect(first.published).toBe(0); // first slot is 09:30 Riyadh (+25 min offset for the webhook channel)

    const again = await runSocialCron(env, new Date("2026-10-19T07:00:00Z"), { articles: [article, old] });
    expect(again.queued).toBe(0);
    expect(again.published).toBe(2); // launch + evergreen
    expect(sent.map((s) => s.body.variant).sort()).toEqual(["evergreen", "launch"]);
    expect(sent[0].body.link).toContain("utm_source=social_webhook");

    // A campaign post for that day is queued once, alongside the article series.
    const camp = { id: "c1", date: "2026-10-21", slot: 0, stage: "awareness" as const, pillar: "p", versions: [{ lang: "ar" as const, text: "نص حملة طويل بما يكفي للاختبار" }] };
    const third = await runSocialCron(env, new Date("2026-10-19T07:05:00Z"), { articles: [article, old], campaign: [camp] });
    expect(third.queued).toBe(1);
    expect(db.posts.some((p) => p.source_key === "campaign/c1:ar:webhook")).toBe(true);
  });

  it("retries a failed post and gives up after three attempts", async () => {
    const db = fakeDb();
    vi.stubGlobal("fetch", async () => new Response("boom", { status: 500 }));
    const env = { DB: db as unknown as D1Database, SOCIAL_WEBHOOK_URL: "https://hook.example/x", SOCIAL_AUTOPOST: "false" } as SocialEnv;
    db.posts.push({ id: 99, channel: "webhook", lang: "ar", variant: "manual", text: "t", scheduled_at: "2026-10-19 05:00:00", status: "scheduled", attempts: 0 });
    let t = new Date("2026-10-19T05:00:00Z");
    for (let i = 0; i < 3; i++) { await runSocialCron(env, t, { articles: [] }); t = new Date(t.getTime() + 31 * 60_000); }
    expect(db.posts[0].status).toBe("failed");
    expect(db.posts[0].attempts).toBe(3);
    expect(db.posts[0].error).toContain("500");
  });

  it("rejects manual X posts over 280 characters and tags site links", async () => {
    const db = fakeDb();
    const env = { DB: db as unknown as D1Database, SOCIAL_WEBHOOK_URL: "https://hook" } as SocialEnv;
    const post = (body: unknown) => handleSocialAdmin(new Request("https://selorin.co/api/admin/social/posts", { method: "POST", body: JSON.stringify(body) }), env, "/api/admin/social/posts");
    expect((await post({ channels: ["x"], text: "a".repeat(281) })).status).toBe(422);
    const ok = await post({ channels: ["linkedin", "x"], text: "خبر", link: "https://selorin.co/ar/services/x/" });
    expect(ok.status).toBe(200);
    expect(db.posts.map((p) => new URL(p.link).searchParams.get("utm_source"))).toEqual(["linkedin", "x"]);
  });
});
