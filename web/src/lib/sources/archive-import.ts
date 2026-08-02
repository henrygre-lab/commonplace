import type { BookmarkSource, RawPost } from './index'

/**
 * Adapter 2 — the Phase 1 source and a permanent fallback.
 *
 * The user requests their X data archive (Settings → Your account → Download an
 * archive), gets a .zip, and drops it on a dropzone. The bookmark/tweet JS files
 * are parsed client-side and the normalised rows POSTed.
 *
 * Zero API cost, full history, no rate limits.
 */

/** X archive files are JS assignments, not JSON: `window.YTD.x.part0 = [ … ]`. */
export function parseArchiveFile(source: string): unknown[] {
  const start = source.indexOf('=')
  if (start < 0) throw new Error('Not an X archive file: no assignment found')
  const payload = source.slice(start + 1).trim().replace(/;\s*$/, '')
  const parsed: unknown = JSON.parse(payload)
  if (!Array.isArray(parsed)) throw new Error('Not an X archive file: expected an array')
  return parsed
}

type ArchiveTweet = {
  id_str?: string
  full_text?: string
  text?: string
  created_at?: string
  favorite_count?: string | number
  retweet_count?: string | number
  user?: { name?: string; screen_name?: string; profile_image_url_https?: string }
}

function toNumber(v: string | number | undefined): number | undefined {
  if (v === undefined) return undefined
  const n = typeof v === 'number' ? v : parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

/** Normalises one archive entry. Entries are wrapped, e.g. `{ tweet: {…} }`. */
export function normaliseEntry(entry: unknown, savedAt = new Date()): RawPost | null {
  const record = entry as Record<string, unknown>
  const t = (record.tweet ?? record.bookmark ?? record) as ArchiveTweet
  const postId = t.id_str
  const original = t.full_text ?? t.text
  if (!postId || !original) return null

  const handle = t.user?.screen_name
  return {
    postId,
    authorName: t.user?.name ?? handle ?? 'Unknown',
    authorHandle: handle ? `@${handle}` : '@unknown',
    authorAvatar: t.user?.profile_image_url_https,
    postedAt: t.created_at ? new Date(t.created_at) : undefined,
    savedAt,
    original,
    likes: toNumber(t.favorite_count),
    reposts: toNumber(t.retweet_count),
    url: handle ? `https://x.com/${handle}/status/${postId}` : undefined,
  }
}

export function archiveImportSource(files: string[]): BookmarkSource {
  return {
    name: 'archive-import',
    async fetchNew(since?: Date) {
      const posts: RawPost[] = []
      for (const file of files) {
        for (const entry of parseArchiveFile(file)) {
          const p = normaliseEntry(entry)
          if (!p) continue
          if (since && p.postedAt && p.postedAt <= since) continue
          posts.push(p)
        }
      }
      // De-duplicate: an archive can list the same post in several files.
      const seen = new Set<string>()
      return posts.filter((p) => (seen.has(p.postId) ? false : (seen.add(p.postId), true)))
    },
  }
}
