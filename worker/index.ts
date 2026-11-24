/// <reference types="@cloudflare/workers-types" />
// Cloudflare Worker entry. The Worker runs first (run_worker_first in wrangler.toml) so that
// www.selorin.co can be redirected to the apex domain; everything else is handed to the assets
// layer (dist/), which still applies _headers, _redirects and 404.html.
import { handleRequestPost, methodNotAllowed, type Env } from "../functions/api/request";
import { handleTrack } from "../functions/api/track";
import { handleAdmin } from "../functions/api/admin";
import { runSocialCron, type SocialEnv } from "../functions/api/social";
import { handlePayments, runPaymentCron, type PayEnv } from "../functions/api/payments";

interface WorkerEnv extends Env, SocialEnv, PayEnv {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    if (pathname === "/api/request" || pathname === "/api/request/") {
      if (request.method !== "POST") return methodNotAllowed();
      return handleRequestPost(request, env, (p) => ctx.waitUntil(p));
    }
    if (pathname === "/api/track" || pathname === "/api/track/") {
      if (request.method !== "GET") return methodNotAllowed();
      return handleTrack(request, env);
    }
    if (pathname.startsWith("/api/admin/")) return handleAdmin(request, env, pathname.replace(/\/$/, ""));
    // Proposals and payments (functions/api/payments.ts): the client's quote page and Moyasar callbacks.
    if (pathname === "/api/quote" || pathname.startsWith("/api/quote/") || pathname.startsWith("/api/pay/")) {
      return handlePayments(request, env, pathname.replace(/\/$/, ""));
    }
    // IndexNow ownership file (only when the INDEXNOW_KEY secret is set).
    if (env.INDEXNOW_KEY && pathname === `/${env.INDEXNOW_KEY}.txt`) return new Response(env.INDEXNOW_KEY, { headers: { "content-type": "text/plain" } });
    return env.ASSETS.fetch(request);
  },
  // Cron (wrangler.toml [triggers]): queue posts for new articles and publish due posts to every connected account,
  // then remind clients about instalments that are still unpaid.
  async scheduled(controller, env, ctx) {
    const now = new Date(controller.scheduledTime);
    ctx.waitUntil(runSocialCron(env, now).then((r) => console.log("social cron", JSON.stringify(r))));
    ctx.waitUntil(runPaymentCron(env, now).then((r) => console.log("payment cron", JSON.stringify(r))).catch((e) => console.error("payment cron", e)));
  },
} satisfies ExportedHandler<WorkerEnv>;
