import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'

// Disposable Postgres with the Supabase role and UID interfaces used by this migration.
export async function sandbox() {
  const db = new PGlite()
  await db.exec('create role anon; create role authenticated; create role service_role;')
  await db.exec(
    await readFile(
      new URL('../../supabase/migrations/202611210002_recovery.sql', import.meta.url),
      'utf8',
    ),
  )
  return db
}
