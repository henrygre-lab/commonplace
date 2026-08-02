import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Postgres is wired but not yet the read path: the screens still render from the
 * seed via lib/store. Phase 1 swaps the store's source for queries against this
 * client once DATABASE_URL points at a real database.
 */
let client: ReturnType<typeof postgres> | null = null

export function db() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  client ??= postgres(url, { prepare: false })
  return drizzle(client, { schema })
}

export { schema }
