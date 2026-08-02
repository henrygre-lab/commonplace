// Data shapes — 01-design-spec.md § 2.

export type Bookmark = {
  id: number
  author: string
  handle: string
  /** "26 Jul" — a display string in the seed; becomes a real Date once ingest is live. */
  date: string
  tags: string[]
  /** THE EXTRACTED IDEA, as a claim. Never the post's first line. */
  title: string
  /** 2 sentences, ~40 words, the argument in the reader's own voice. */
  summary: string
  /** exactly 2, noun phrases */
  concepts: string[]
  /** exactly 2, imperative */
  actions: string[]
  /** the raw post, \n\n between paragraphs */
  original: string
  likes: string
  reposts: string
  reviewed: boolean
  /** starred; resurfaces more often, never expires */
  core: boolean
  initials: string
  note: string
}

export type Brief = {
  no: number
  dateLine: string
  shortDateLine: string
  dateShort: string
  mins: string
  shortMins: string
  headline: string
  lede: string
  paras: string[]
  closer: string
  sectionLabel: string
  /** MUST match sectionLabel's count word */
  itemIds: number[]
  resId: number
  resLabel: string
  resLabelShort: string
  promptQ: string
  promptA: string
  promptSourceId: number
  promptSource: string
}

/**
 * [relatedId, reason]. The reason is the product: it names WHY two saves
 * connect. "Related" is a failure; "Argues the opposite" is the feature.
 */
export type Relation = [relatedId: number, reason: string]

export type AskAnswer = {
  /** trigger keywords */
  keys: string[]
  label: string
  /** 2 paragraphs; the 2nd names a GAP in the library */
  paras: string[]
  /** cited sources */
  ids: number[]
}

export type Filter = 'all' | 'unreviewed' | 'core'
export type GroupBy = 'date' | 'theme' | 'none'

export type Settings = {
  time: string
  freq: 'Daily' | 'Weekdays' | 'Weekly'
  email: boolean
  push: boolean
  spaced: boolean
}
