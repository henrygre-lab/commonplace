import { ASK_CORPUS } from './seed'
import type { Bookmark } from './types'

export type Answer = { label: string; paras: string[]; ids: number[] }

/**
 * Resolves a query against the library. Phase 4 replaces this with embedding
 * search + streamed synthesis behind /api/ask; the contract stays the same.
 *
 * There is no error state and no empty-result illustration. A miss is framed as
 * information about the library rather than about the question (02 § 5).
 */
export function resolveAsk(query: string, items: Bookmark[]): Answer {
  const lower = query.trim().toLowerCase()

  const hit = ASK_CORPUS.find((c) => c.keys.some((k) => lower.includes(k)))
  if (hit) return { label: hit.label, paras: hit.paras, ids: hit.ids }

  const needle = lower.split(' ').filter((w) => w.length > 3)[0] || lower
  const matches = items
    .filter((it) =>
      `${it.title} ${it.summary} ${it.tags.join(' ')}`.toLowerCase().includes(needle),
    )
    .slice(0, 3)

  if (matches.length) {
    return {
      label: `Across ${matches.length} loosely related saves`,
      paras: [
        'Nothing in your library answers that directly. The closest saves are below — they touch the question without settling it.',
        'If this is a live question for you, it is worth saving deliberately rather than waiting for it to turn up.',
      ],
      ids: matches.map((m) => m.id),
    }
  }

  return {
    label: 'No matches',
    paras: [
      'Nothing you have saved speaks to that. That is useful information about the library rather than about the question.',
    ],
    ids: [],
  }
}

export const ASK_SUGGESTIONS = [
  'What have I saved about pricing strategy?',
  'What do my saves say about building in public?',
  'Everything on sleep and energy',
  'How do I decide faster?',
]
