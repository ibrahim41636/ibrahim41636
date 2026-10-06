/// <reference types="@cloudflare/workers-types" />
// Cloudflare Worker entry: static assets (dist/) are served by the assets layer, including
// _headers, _redirects and 404.html; only requests with no matching asset reach this handler.
import { handleRequestPost, methodNotAllowed, type Env } from "../functions/api/request";

interface WorkerEnv extends Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/request" || pathname === "/api/request/") {
      if (request.method !== "POST") return methodNotAllowed();
      return handleRequestPost(request, env, (p) => ctx.waitUntil(p));
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
