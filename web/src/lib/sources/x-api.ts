import type { BookmarkSource, RawPost } from './index'

/**
 * Adapter 1 — the real thing, now live behind the sign-in allowlist.
 *
 * GET /2/users/:id/bookmarks with a USER access token (OAuth 2.0 Authorization
 * Code with PKCE), scopes: bookmark.read tweet.read users.read offline.access.
 *
 * 03 § 2 defers this on the assumption that bookmarks sit behind a ~$200/month
 * tier. That is out of date: the API is pay-per-usage, and Owned Reads — your
 * own data, bookmarks included — bill $0.001 per resource. Every page fetched
 * here costs money, which is what `maxPages` and the caller's allowlist exist
 * to bound. The endpoint still cannot filter by bookmark folder.
 */

const BASE = 'https://api.x.com/2'

const TWEET_FIELDS = 'created_at,author_id,public_metrics,note_tweet'
const USER_FIELDS = 'name,username,profile_image_url'

type ApiTweet = {
  id: string
  text: string
  created_at?: string
  author_id?: string
  public_metrics?: { like_count?: number; retweet_count?: number }
  note_tweet?: { text?: string }
}

type ApiUser = { id: string; name: string; username: string; profile_image_url?: string }

type ApiPage = {
  data?: ApiTweet[]
  includes?: { users?: ApiUser[] }
  meta?: { next_token?: string }
}

export type XApiOptions = {
  userId: string
  accessToken: string
  /** Persist this so an interrupted walk resumes instead of re-billing pages. */
  nextToken?: string
  onCursor?: (token: string | undefined) => void
  /**
   * Post ids already stored. Bookmarks come back in bookmark-order, not post
   * order, so a timestamp cannot tell us where the new ones stop — one old post
   * bookmarked yesterday would end the walk early and silently drop the rest.
   * A run of already-known ids is the only sound stop signal, which is why
   * `fetchNew`'s `since` argument is ignored by this adapter.
   */
  knownPostIds?: ReadonlySet<string>
  /**
   * Hard ceiling on pages fetched. Every page bills, so callers bound the spend
   * rather than trusting the cursor to run out.
   */
  maxPages?: number
  fetchImpl?: typeof fetch
}

export function xApiSource(opts: XApiOptions): BookmarkSource {
  const doFetch = opts.fetchImpl ?? fetch
  const known = opts.knownPostIds
  const maxPages = opts.maxPages ?? Infinity

  return {
    name: 'x-api',
    // `since` is deliberately unused — see `knownPostIds` above.
    async fetchNew() {
      const posts: RawPost[] = []
      let cursor = opts.nextToken
      let pages = 0
      let order = 0

      do {
        const url = new URL(`${BASE}/users/${opts.userId}/bookmarks`)
        url.searchParams.set('tweet.fields', TWEET_FIELDS)
        url.searchParams.set('expansions', 'author_id')
        url.searchParams.set('user.fields', USER_FIELDS)
        url.searchParams.set('max_results', '100')
        if (cursor) url.searchParams.set('pagination_token', cursor)

        const res = await doFetch(url, {
          headers: { Authorization: `Bearer ${opts.accessToken}` },
        })
        if (!res.ok) {
          // The response body can echo the request, including the bearer token
          // in some error shapes. It goes to the server log and never into the
          // thrown message, which callers may surface.
          console.error('[x-api] bookmarks request failed', res.status, await res.text())
          throw new Error(`X bookmarks request failed with status ${res.status}`)
        }

        const page = (await res.json()) as ApiPage
        const users = new Map((page.includes?.users ?? []).map((u) => [u.id, u]))
        pages++

        const rows = page.data ?? []
        // An incremental run stops at the first page that adds nothing new;
        // a backfill has no `knownPostIds` and walks to the end.
        let addedThisPage = 0

        for (const t of rows) {
          if (known?.has(t.id)) continue

          const u = t.author_id ? users.get(t.author_id) : undefined
          posts.push({
            postId: t.id,
            authorName: u?.name ?? 'Unknown',
            authorHandle: u ? `@${u.username}` : '@unknown',
            authorAvatar: u?.profile_image_url,
            postedAt: t.created_at ? new Date(t.created_at) : undefined,
            // No savedAt: X does not say when a post was bookmarked. Order is
            // the real signal, and it survives as bookmarkOrder.
            bookmarkOrder: order++,
            // note_tweet carries the untruncated body on long posts.
            original: t.note_tweet?.text ?? t.text,
            likes: t.public_metrics?.like_count,
            reposts: t.public_metrics?.retweet_count,
            url: u ? `https://x.com/${u.username}/status/${t.id}` : undefined,
          })
          addedThisPage++
        }

        const exhausted = known && rows.length > 0 && addedThisPage === 0
        cursor = exhausted || pages >= maxPages ? undefined : page.meta?.next_token
        opts.onCursor?.(cursor)
      } while (cursor)

      return posts
    },
  }
}
