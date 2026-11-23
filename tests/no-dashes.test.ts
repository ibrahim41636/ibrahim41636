// Site copy is written without em or en dashes: commas, colons, full stops or "to" read
// more naturally. This guards the content collections, the UI strings and the page views.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const FILES = [
  ...walk("src/content").filter((f) => /\.(md|json)$/.test(f)),
  ...walk("src/views").filter((f) => f.endsWith(".astro")),
  "src/i18n/ui.ts",
  "src/data/taxonomy.ts",
  "public/manifest-ar.webmanifest",
  "public/manifest-en.webmanifest",
];

describe("site copy", () => {
  it("has no em or en dashes", () => {
    const hits = FILES.flatMap((f) =>
      readFileSync(f, "utf8").split("\n").flatMap((line, i) => (/[–—]/.test(line) ? [`${f}:${i + 1}`] : [])),
    );
    expect(hits).toEqual([]);
  });

  it("does not use a spaced hyphen as a dash in content", () => {
    const content = FILES.filter((f) => f.startsWith("src/content/"));
    const hits = content.flatMap((f) =>
      readFileSync(f, "utf8").split("\n").flatMap((line, i) => (/\S - \S/.test(line) ? [`${f}:${i + 1}`] : [])),
    );
    expect(hits).toEqual([]);
  });
});
