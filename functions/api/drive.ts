/// <reference types="@cloudflare/workers-types" />
// Google Drive archive: one folder per request (named "SEL-2026-000123 | company | service") inside
// a root folder, holding the request summary and attachments, proposal files, the issued contract
// and the client's signed copy.
//
// Uses an OAuth refresh token for the company Google account with the drive.file scope, so the
// Worker can only see the folders and files it created itself. Secrets: DRIVE_CLIENT_ID,
// DRIVE_CLIENT_SECRET, DRIVE_REFRESH_TOKEN. The root folder is created on first use and remembered in
// the settings table; it can then be moved or shared in Drive freely. DRIVE_ROOT_FOLDER_ID is only
// for a folder this same app created (drive.file cannot write into folders made by hand). Archiving
// never blocks the client: failures are logged and the request carries on. Setup: docs/payments-ar.md.

export interface DriveEnv {
  DB?: D1Database;
  DRIVE_CLIENT_ID?: string;
  DRIVE_CLIENT_SECRET?: string;
  DRIVE_REFRESH_TOKEN?: string;
  DRIVE_ROOT_FOLDER_ID?: string;
}

export interface DriveFile { name: string; type: string; bytes: Uint8Array }
export interface DriveLead { lead_id: string; company?: string | null; service?: string | null; drive_folder_id?: string | null }

export const driveConfigured = (env: DriveEnv) => !!(env.DRIVE_CLIENT_ID && env.DRIVE_CLIENT_SECRET && env.DRIVE_REFRESH_TOKEN);
export const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;
/** Readable, safe names: no control characters or slashes, single spaces, bounded length. */
export const safeName = (s: string) => s.replace(/[\u0000-\u001F\u007F/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 150) || "file";

const FILES = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true";

let cached: { token: string; until: number } | null = null;
export const resetDriveToken = () => { cached = null; };

async function accessToken(env: DriveEnv) {
  if (cached && cached.until > Date.now()) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: env.DRIVE_CLIENT_ID!, client_secret: env.DRIVE_CLIENT_SECRET!, refresh_token: env.DRIVE_REFRESH_TOKEN!, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`Drive token ${res.status}`);
  const t = (await res.json()) as { access_token: string; expires_in?: number };
  cached = { token: t.access_token, until: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
  return cached.token;
}

async function call<T>(env: DriveEnv, url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), authorization: `Bearer ${await accessToken(env)}` } });
  if (!res.ok) throw new Error(`Drive ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

/** multipart/related body for a Drive upload: JSON metadata part, then the file bytes. */
export function multipartBody(meta: Record<string, unknown>, mime: string, bytes: Uint8Array, boundary: string) {
  const enc = new TextEncoder();
  const head = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`);
  const tail = enc.encode(`\r\n--${boundary}--`);
  const out = new Uint8Array(head.length + bytes.length + tail.length);
  out.set(head, 0);
  out.set(bytes, head.length);
  out.set(tail, head.length + bytes.length);
  return out;
}

export async function createFolder(env: DriveEnv, name: string, parent?: string) {
  return call<{ id: string }>(env, `${FILES}?fields=id&supportsAllDrives=true`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: safeName(name), mimeType: "application/vnd.google-apps.folder", ...(parent ? { parents: [parent] } : {}) }),
  });
}

export async function uploadFile(env: DriveEnv, folderId: string, file: DriveFile) {
  const boundary = `selorin${crypto.randomUUID().replace(/-/g, "")}`;
  return call<{ id: string }>(env, UPLOAD, {
    method: "POST",
    headers: { "content-type": `multipart/related; boundary=${boundary}` },
    body: multipartBody({ name: safeName(file.name), parents: [folderId] }, file.type || "application/octet-stream", file.bytes, boundary),
  });
}

async function rootFolder(env: DriveEnv) {
  if (env.DRIVE_ROOT_FOLDER_ID) return env.DRIVE_ROOT_FOLDER_ID;
  const row = await env.DB?.prepare(`SELECT value FROM settings WHERE key = 'drive_root_id'`).first<{ value: string }>();
  if (row?.value) return row.value;
  const { id } = await createFolder(env, "Selorin Requests | طلبات سيلورين");
  await env.DB?.prepare(`INSERT INTO settings (key, value, updated_at) VALUES ('drive_root_id', ?1, datetime('now')) ON CONFLICT(key) DO NOTHING`).bind(id).run();
  const kept = await env.DB?.prepare(`SELECT value FROM settings WHERE key = 'drive_root_id'`).first<{ value: string }>();
  return kept?.value ?? id;
}

/** The request's archive folder, created on first use and stored on the request. */
export async function leadFolder(env: DriveEnv, lead: DriveLead) {
  if (lead.drive_folder_id) return lead.drive_folder_id;
  const { id } = await createFolder(env, [lead.lead_id, lead.company, lead.service].filter(Boolean).join(" | "), await rootFolder(env));
  // Two archive calls at once keep the first folder.
  const won = await env.DB?.prepare(`UPDATE leads SET drive_folder_id = ?2, drive_folder_url = ?3 WHERE lead_id = ?1 AND drive_folder_id IS NULL RETURNING drive_folder_id`)
    .bind(lead.lead_id, id, folderUrl(id)).first<{ drive_folder_id: string }>();
  if (!won && env.DB) {
    const row = await env.DB.prepare(`SELECT drive_folder_id FROM leads WHERE lead_id = ?1`).bind(lead.lead_id).first<{ drive_folder_id: string | null }>();
    lead.drive_folder_id = row?.drive_folder_id ?? id;
  } else {
    lead.drive_folder_id = id;
  }
  return lead.drive_folder_id;
}

/** Copies files into the request's folder. Returns the folder id, or null when Drive is off or fails. */
export async function archive(env: DriveEnv, lead: DriveLead, files: DriveFile[]) {
  if (!driveConfigured(env)) return null;
  try {
    const folder = await leadFolder(env, lead);
    for (const f of files) await uploadFile(env, folder, f);
    return folder;
  } catch (e) {
    console.error("drive archive failed", lead.lead_id, e);
    return null;
  }
}

export const textFile = (name: string, content: string): DriveFile => ({ name, type: "text/plain; charset=utf-8", bytes: new TextEncoder().encode(content) });
export const htmlFile = (name: string, content: string): DriveFile => ({ name, type: "text/html; charset=utf-8", bytes: new TextEncoder().encode(content) });
