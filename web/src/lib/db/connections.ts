import { eq } from 'drizzle-orm'
import { decryptToken, encryptToken } from './crypto'
import { db, schema } from './index'

/**
 * The X account behind a sign-in, persisted so ingest does not need a browser
 * session. Auth.js keeps the provider tokens in its encrypted JWT, but a JWT
 * only exists while someone is looking at the site — a scheduled sync has no
 * request to read it from. `connections` is where they live for real work.
 */

export type ConnectionInput = {
  xUserId: string
  handle: string
  displayName?: string | null
  avatarUrl?: string | null
  accessToken: string
  refreshToken?: string | null
  /** Seconds since epoch, as X returns it. */
  expiresAt?: number | null
  scopes?: string[]
}

/** Upserts the user and their connection. Returns the internal user id. */
export async function upsertConnection(input: ConnectionInput): Promise<string> {
  const d = db()

  // Encrypt before the values go anywhere near a query, so a thrown key error
  // aborts the write rather than leaving a half-written plaintext row.
  const accessToken = encryptToken(input.accessToken)
  const refreshToken = input.refreshToken ? encryptToken(input.refreshToken) : null

  const [user] = await d
    .insert(schema.users)
    .values({
      xUserId: input.xUserId,
      handle: input.handle,
      displayName: input.displayName ?? null,
      avatarUrl: input.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: schema.users.xUserId,
      set: {
        handle: input.handle,
        displayName: input.displayName ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
    })
    .returning({ id: schema.users.id })

  await d
    .insert(schema.connections)
    .values({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt: input.expiresAt ? new Date(input.expiresAt * 1000) : null,
      scopes: input.scopes,
      source: 'x-api',
    })
    .onConflictDoUpdate({
      target: schema.connections.userId,
      set: {
        accessToken,
        refreshToken,
        expiresAt: input.expiresAt ? new Date(input.expiresAt * 1000) : null,
        scopes: input.scopes,
        // lastSyncAt and nextToken are deliberately untouched: signing in again
        // must not make a half-finished backfill start from the top and re-bill
        // every page it already read.
      },
    })

  return user.id
}

/** The stored connection for an X user id, or null if they have never signed in. */
export async function getConnection(xUserId: string) {
  const d = db()
  const [row] = await d
    .select({
      userId: schema.users.id,
      accessToken: schema.connections.accessToken,
      expiresAt: schema.connections.expiresAt,
      nextToken: schema.connections.nextToken,
      lastSyncAt: schema.connections.lastSyncAt,
    })
    .from(schema.users)
    .innerJoin(schema.connections, eq(schema.connections.userId, schema.users.id))
    .where(eq(schema.users.xUserId, xUserId))
    .limit(1)

  if (!row) return null
  return { ...row, accessToken: decryptToken(row.accessToken) }
}
