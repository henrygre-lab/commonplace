import type { BookmarkSource, RawPost } from './index'

/**
 * Adapter 1 — the real thing, for Phase 5 once paid access exists.
 *
 * GET /2/users/:id/bookmarks with a USER access token (OAuth 2.0 Authorization
 * Code with PKCE), scopes: bookmark.read tweet.read users.read offline.access.
 *
 * Bookmark reads count toward the monthly post cap and the endpoint cannot
 * filter by bookmark folder. Verify current tiers, quotas and the pagination cap
 * in the X developer console before relying on this (03 § 2).
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
  /** Persist this so incremental syncs resume where the last one stopped. */
  nextToken?: string
  onCursor?: (token: string | undefined) => void
  fetchImpl?: typeof fetch
}

export function xApiSource(opts: XApiOptions): BookmarkSource {
  const doFetch = opts.fetchImpl ?? fetch

  return {
    name: 'x-api',
    async fetchNew(since?: Date) {
      const posts: RawPost[] = []
      let cursor = opts.nextToken

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
          throw new Error(`X bookmarks request failed: ${res.status} ${await res.text()}`)
        }

        const page = (await res.json()) as ApiPage
        const users = new Map((page.includes?.users ?? []).map((u) => [u.id, u]))

        let reachedKnown = false
        for (const t of page.data ?? []) {
          const postedAt = t.created_at ? new Date(t.created_at) : undefined
          // Incremental sync: stop once we reach posts we already have.
          if (since && postedAt && postedAt <= since) { reachedKnown = true; break }

          const u = t.author_id ? users.get(t.author_id) : undefined
          posts.push({
            postId: t.id,
            authorName: u?.name ?? 'Unknown',
            authorHandle: u ? `@${u.username}` : '@unknown',
            authorAvatar: u?.profile_image_url,
            postedAt,
            savedAt: new Date(),
            // note_tweet carries the untruncated body on long posts.
            original: t.note_tweet?.text ?? t.text,
            likes: t.public_metrics?.like_count,
            reposts: t.public_metrics?.retweet_count,
            url: u ? `https://x.com/${u.username}/status/${t.id}` : undefined,
          })
        }

        cursor = reachedKnown ? undefined : page.meta?.next_token
        opts.onCursor?.(cursor)
      } while (cursor)

      return posts
    },
  }
}
