import type { APIRoute } from "astro";
export const GET: APIRoute = ({ site }) => new Response(
`User-agent: *
Allow: /
Disallow: /api/
Disallow: /request/received/
Disallow: /ar/request/received/

# AI search crawlers are welcome to read public content.
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${new URL("sitemap-index.xml", site)}
`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
