import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    // No DB configured (e.g. local dev) — throw so the per-query try/catch
    // in queries.ts triggers the JSON fallback instead of crashing the page.
    throw new Error('DATABASE_URL not set — using JSON fallback');
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

// Lazy proxy: importing this module never connects. The connection is
// created on first actual query, so pages without a DB still render.
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb();
    return Reflect.get(real, prop, receiver);
  },
}) as Db;
