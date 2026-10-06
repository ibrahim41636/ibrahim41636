import type { APIRoute } from "astro";
import { insightsFeed } from "@/lib/rss";
export const GET: APIRoute = () => insightsFeed("ar");
