/// <reference types="@cloudflare/workers-types" />
// Cloudflare Worker entry. The Worker runs first (run_worker_first in wrangler.toml) so that
// www.selorin.co can be redirected to the apex domain; everything else is handed to the assets
// layer (dist/), which still applies _headers, _redirects and 404.html.
import { handleRequestPost, methodNotAllowed, type Env } from "../functions/api/request";
import { handleTrack } from "../functions/api/track";
import { handleAdmin } from "../functions/api/admin";

interface WorkerEnv extends Env {
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
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
