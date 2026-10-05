// Upload validation: extension allow-list + content sniffing (magic bytes), so a renamed
// executable or script cannot pass as a PDF/image. Pure function — unit tested.
import { UPLOAD } from "./forms";

export type UploadError = "too_many" | "too_large" | "type" | "empty";

const SIGNATURES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  png: [[0x89, 0x50, 0x4e, 0x47]],
  jpg: [[0xff, 0xd8, 0xff]],
  jpeg: [[0xff, 0xd8, 0xff]],
  zip: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]],
  kmz: [[0x50, 0x4b, 0x03, 0x04]],
  docx: [[0x50, 0x4b, 0x03, 0x04]],
  xlsx: [[0x50, 0x4b, 0x03, 0x04]],
  doc: [[0xd0, 0xcf, 0x11, 0xe0]], // OLE2
  xls: [[0xd0, 0xcf, 0x11, 0xe0]],
};

const MIME: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", zip: "application/zip",
  kmz: "application/vnd.google-earth.kmz", doc: "application/msword", xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function extensionOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

/** Safe filename for email attachments: keeps letters (incl. Arabic), digits, dot, dash, underscore. */
export function safeName(name: string) {
  const ext = extensionOf(name);
  const base = name.replace(/\.[^.]+$/, "").normalize("NFC").replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "attachment";
  return ext ? `${base}.${ext}` : base;
}

export function sniff(ext: string, head: Uint8Array) {
  const sigs = SIGNATURES[ext];
  return !!sigs && sigs.some((sig) => sig.every((b, i) => head[i] === b));
}

export interface CheckedFile { name: string; type: string; size: number; bytes: Uint8Array }

export async function checkUploads(files: File[]): Promise<{ ok: true; files: CheckedFile[] } | { ok: false; error: UploadError; file?: string }> {
  const real = files.filter((f) => f && f.size > 0);
  if (real.length > UPLOAD.maxFiles) return { ok: false, error: "too_many" };
  const total = real.reduce((n, f) => n + f.size, 0);
  if (total > UPLOAD.maxTotalBytes) return { ok: false, error: "too_large" };
  const out: CheckedFile[] = [];
  for (const f of real) {
    const ext = extensionOf(f.name);
    if (!UPLOAD.extensions.includes(ext)) return { ok: false, error: "type", file: f.name };
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (!sniff(ext, bytes.subarray(0, 8))) return { ok: false, error: "type", file: f.name };
    out.push({ name: safeName(f.name), type: MIME[ext], size: f.size, bytes });
  }
  return { ok: true, files: out };
}
