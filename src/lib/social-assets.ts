// Branded social images rendered by scripts/social-images/render.mjs into public/social/.
// Build-time only (reads the file system), so pages and the social feed only reference images that exist.
import { existsSync } from "node:fs";

/** The site path if the file exists under public/, otherwise undefined. */
export const socialAsset = (path: string) => (existsSync(`public${path}`) ? path : undefined);
