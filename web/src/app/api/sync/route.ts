import { eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { getConnection } from '@/lib/db/connections'
import { xApiSource } from '@/lib/sources/x-api'

/**
 * Pull bookmarks from X into Postgres.
 *
 * Every page this walks bills — Owned Reads are $0.001 per resource — so the
 * route is guarded three ways: a session is required, that session's X id must
 * match X_ALLOWLIST_USER_ID, and pagination stops at SYNC_MAX_PAGES however
 * much the cursor has left.
 *
 * The first run is the backfill: with no rows stored, nothing is "already
 * known" and the walk runs to the end. Later runs stop at the first page that
 * adds nothing, so an unchanged library costs one page rather than fourteen.
 */

const DEFAULT_MAX_PAGES = 20
const CHUNK = 200

export async function POST() {
  const allowlisted = process.env.X_ALLOWLIST_USER_ID
  const session = await auth()

  if (!session?.xUserId) {
    return Response.json({ error: 'Not signed in.' }, { status: 401 })
  }
  // Fails closed, exactly as the sign-in callback does.
  if (!allowlisted || session.xUserId !== allowlisted) {
    return Response.json({ error: 'That account cannot sync.' }, { status: 403 })
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'No database configured.' }, { status: 503 })
  }

  const connection = await getConnection(session.xUserId)
  if (!connection) {
    return Response.json({ error: 'No stored connection. Sign in again.' }, { status: 409 })
  }
  // Access tokens last two hours. Refresh-token rotation is not wired up yet,
  // so an expired token asks for a fresh sign-in rather than failing mid-walk
  // with a 401 from X after already paying for pages.
  if (connection.expiresAt && connection.expiresAt.getTime() <= Date.now()) {
    return Response.json({ error: 'Connection expired. Sign in again.' }, { status: 409 })
  }

  const d = db()
  const stored = await d
    .select({ postId: schema.bookmarks.postId })
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, connection.userId))
  const knownPostIds = new Set(stored.map((r) => r.postId))

  const maxPages = Number(process.env.SYNC_MAX_PAGES) || DEFAULT_MAX_PAGES
  let cursor = connection.nextToken ?? undefined

  const source = xApiSource({
    userId: session.xUserId,
    accessToken: connection.accessToken,
    nextToken: connection.nextToken ?? undefined,
    knownPostIds,
    maxPages,
    onCursor: (token) => {
      cursor = token
    },
  })

  let posts
  try {
    posts = await source.fetchNew()
  } catch (e) {
    // The cursor is not advanced on failure, so a retry resumes rather than
    // paying for the same pages twice.
    return Response.json(
      { error: e instanceof Error ? e.message : 'Sync failed.' },
      { status: 502 },
    )
  }

  for (let i = 0; i < posts.length; i += CHUNK) {
    const rows = posts.slice(i, i + CHUNK).map((p) => ({
      userId: connection.userId,
      postId: p.postId,
      authorName: p.authorName,
      authorHandle: p.authorHandle,
      authorAvatar: p.authorAvatar,
      postedAt: p.postedAt,
      // X never says when a post was bookmarked. postedAt keeps the library's
      // date grouping meaningful; bookmarkOrder carries the real sequence.
      savedAt: p.savedAt ?? p.postedAt ?? new Date(),
      bookmarkOrder: p.bookmarkOrder,
      original: p.original,
      likes: p.likes,
      reposts: p.reposts,
      url: p.url,
    }))

    await d
      .insert(schema.bookmarks)
      .values(rows)
      .onConflictDoUpdate({
        target: [schema.bookmarks.userId, schema.bookmarks.postId],
        // Only source-of-truth fields are refreshed. reviewed, core, note and
        // everything the AI pass writes belong to the user, not to X.
        set: {
          authorName: sql`excluded.author_name`,
          authorHandle: sql`excluded.author_handle`,
          authorAvatar: sql`excluded.author_avatar`,
          original: sql`excluded.original`,
          likes: sql`excluded.likes`,
          reposts: sql`excluded.reposts`,
          url: sql`excluded.url`,
        },
      })
  }

  await d
    .update(schema.connections)
    .set({ lastSyncAt: new Date(), nextToken: cursor ?? null })
    .where(eq(schema.connections.userId, connection.userId))

  const [{ total }] = await d
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, connection.userId))

  return Response.json({
    fetched: posts.length,
    total,
    // Non-null means the walk hit maxPages with more to read; POST again.
    resumeToken: cursor ?? null,
  })
}
