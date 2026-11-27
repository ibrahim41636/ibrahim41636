/// <reference types="node" />
// D1 on top of node:sqlite, enough for the statements the Worker runs, with every migration applied.
// Shared by the payment and portal tests (not a test file itself).
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

export function d1(db: DatabaseSync) {
  const stmt = (sql: string, args: unknown[] = []) => {
    const run = () => db.prepare(sql);
    const vals = () => args.map((a) => (a === undefined ? null : a)) as (string | number | null)[];
    return {
      bind: (...a: unknown[]) => stmt(sql, a),
      first: async () => (run().get(...vals()) as Record<string, unknown> | undefined) ?? null,
      all: async () => ({ results: run().all(...vals()) }),
      run: async () => { run().run(...vals()); return { success: true }; },
      _exec: () => run().run(...vals()),
    };
  };
  return {
    prepare: (sql: string) => stmt(sql),
    batch: async (list: ReturnType<typeof stmt>[]) => {
      db.exec("BEGIN");
      try { for (const s of list) s._exec(); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; }
      return [];
    },
  } as unknown as D1Database;
}

/** A fresh in-memory database with every migration, in order. */
export function freshDb() {
  const db = new DatabaseSync(":memory:");
  for (const f of readdirSync("migrations").sort()) db.exec(readFileSync(`migrations/${f}`, "utf8"));
  return db;
}

export const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
/** Smallest valid PNG header, enough for the upload sniffing. */
export const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
