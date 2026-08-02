import { monthGroup, themeOf } from './tags'
import type { Bookmark, Filter, GroupBy } from './types'

export type Bucket = { label: string; items: Bookmark[] }

/**
 * `items` filtered by filter, then activeTag, then a case-insensitive substring
 * match of query against title + summary + author + tags (02 § 1).
 */
export function selectVisible(
  items: Bookmark[],
  opts: { query: string; filter: Filter; activeTag: string | null },
): Bookmark[] {
  const q = opts.query.trim().toLowerCase()
  return items.filter((it) => {
    if (opts.filter === 'unreviewed' && it.reviewed) return false
    if (opts.filter === 'core' && !it.core) return false
    if (opts.activeTag && !it.tags.includes(opts.activeTag)) return false
    if (!q) return true
    return `${it.title} ${it.summary} ${it.author} ${it.tags.join(' ')}`
      .toLowerCase()
      .includes(q)
  })
}

/** Theme buckets sort by descending size; `none` yields one unlabelled bucket. */
export function selectBuckets(visible: Bookmark[], groupBy: GroupBy): Bucket[] {
  if (groupBy === 'none') return visible.length ? [{ label: '', items: [...visible] }] : []

  const buckets: Bucket[] = []
  const push = (label: string, it: Bookmark) => {
    let b = buckets.find((x) => x.label === label)
    if (!b) { b = { label, items: [] }; buckets.push(b) }
    b.items.push(it)
  }

  for (const it of visible) {
    push(groupBy === 'date' ? monthGroup(it.date) : themeOf(it), it)
  }
  if (groupBy === 'theme') buckets.sort((a, b) => b.items.length - a.items.length)
  return buckets
}

/**
 * Buckets flattened to an ordered id list. focusIdx indexes THIS, so keyboard
 * focus follows the grouped visual order rather than the raw array.
 */
export function flattenIds(buckets: Bucket[]): number[] {
  return buckets.flatMap((b) => b.items.map((i) => i.id))
}
