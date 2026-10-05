// Post-build pass for Arabic pages: isolates Latin technical tokens with numeric ranges
// (e.g. "4–20 mA", "0–2000 ppm") in <bdi dir="ltr"> so the RTL bidi algorithm
// cannot reorder them to "mA 20–4". Only text nodes are touched — never tags, attributes,
// <script> or <style> contents.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN = /(\d+(?:[.,]\d+)?\s?[–-]\s?\d+(?:[.,]\d+)?(?:\s?(?:mA|ppm|ppb|µg\/m³|mg\/m³|dB\(A\)|dB|%|kHz|Hz|eV))?)/g;

export function isolate(html) {
  return html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<bdi[\s\S]*?<\/bdi>)/i).map((chunk, i) => {
    if (i % 2 === 1) return chunk;
    return chunk.replace(/>([^<]+)</g, (m, text) => `>${text.replace(TOKEN, '<bdi dir="ltr">$1</bdi>')}<`);
  }).join("");
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else if (p.endsWith(".html")) out.push(p);
  }
  return out;
}

export default function bidiIsolate() {
  return {
    name: "selorin-bidi-isolate",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const root = join(fileURLToPath(dir), "ar");
        let n = 0;
        for (const file of walk(root)) {
          const html = readFileSync(file, "utf8");
          const out = isolate(html);
          if (out !== html) { writeFileSync(file, out); n++; }
        }
        logger.info(`isolated LTR numeric tokens in ${n} Arabic pages`);
      },
    },
  };
}
