import type { BookmarkSource, RawPost } from './index'

/**
 * Adapter 3 — paste a list of post URLs and hydrate them in one lookup.
 * Good for demos and for adding a single post without a full sync.
 */

const POST_URL = /(?:twitter|x)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/g

export function parsePostUrls(text: string): { handle: string; postId: string }[] {
  const out: { handle: string; postId: string }[] = []
  const seen = new Set<string>()
  for (const m of text.matchAll(POST_URL)) {
    const [, handle, postId] = m
    if (seen.has(postId)) continue
    seen.add(postId)
    out.push({ handle, postId })
  }
  return out
}

export function pasteSource(
  text: string,
  hydrate: (ids: string[]) => Promise<RawPost[]>,
): BookmarkSource {
  return {
    name: 'paste',
    async fetchNew() {
      const refs = parsePostUrls(text)
      if (!refs.length) return []
      // A single GET /2/tweets?ids= covers the whole paste.
      return hydrate(refs.map((r) => r.postId))
    },
  }
}
