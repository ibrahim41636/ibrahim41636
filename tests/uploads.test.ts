import { describe, expect, it } from "vitest";
import { checkUploads, safeName } from "../src/lib/uploads";

const file = (name: string, bytes: number[], size = bytes.length) => new File([new Uint8Array([...bytes, ...new Array(Math.max(0, size - bytes.length)).fill(0)])], name);
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

describe("uploads", () => {
  it("accepts a real PDF", async () => expect((await checkUploads([file("report.pdf", PDF)])).ok).toBe(true));
  it("rejects a disguised executable", async () => {
    const r = await checkUploads([file("invoice.pdf", [0x4d, 0x5a, 0x90, 0x00])]);
    expect(r).toMatchObject({ ok: false, error: "type" });
  });
  it("rejects disallowed extensions", async () => expect(await checkUploads([file("run.exe", PDF)])).toMatchObject({ ok: false, error: "type" }));
  it("enforces the total size limit", async () => expect(await checkUploads([file("a.pdf", PDF, 11 * 1024 * 1024)])).toMatchObject({ ok: false, error: "too_large" }));
  it("enforces the file count limit", async () => expect(await checkUploads(Array.from({ length: 6 }, (_, i) => file(`${i}.pdf`, PDF)))).toMatchObject({ ok: false, error: "too_many" }));
  it("sanitises file names", () => {
    expect(safeName("../../etc/passwd.pdf")).toBe("etc_passwd.pdf");
    expect(safeName("تقرير الموقع.pdf")).toBe("تقرير_الموقع.pdf");
  });
});
