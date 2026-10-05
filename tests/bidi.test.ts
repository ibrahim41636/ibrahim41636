import { describe, expect, it } from "vitest";
import { isolate } from "../integrations/bidi-isolate.mjs";

describe("bidi isolation", () => {
  it("wraps numeric ranges in text only", () => {
    const html = `<p>مخرجات 4–20 mA وModbus</p><script type="application/ld+json">{"a":"4–20 mA"}</script><a title="4–20 mA">x</a>`;
    const out = isolate(html);
    expect(out).toContain('<p>مخرجات <bdi dir="ltr">4–20 mA</bdi> وModbus</p>');
    expect(out).toContain('{"a":"4–20 mA"}');
    expect(out).toContain('title="4–20 mA"');
  });
});
