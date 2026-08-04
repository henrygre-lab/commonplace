/**
 * The ingest layer is built so the source is swappable (03 § 2). Whichever
 * adapter runs, the pipeline downstream is identical — so Phase 5's move to paid
 * X API access is a one-line change here and nothing else.
 */

export type RawPost = {
  postId: string
  authorName: string
  authorHandle: string
  authorAvatar?: string
  postedAt?: Date
  /**
   * When the user saved the post — only where the source actually knows. X's
   * bookmarks endpoint returns no bookmark timestamp, so this is undefined for
   * an API backfill and the ingest falls back to `postedAt`. Stamping every
   * backfilled row with the sync time would collapse the library's date
   * grouping into a single bucket.
   */
  savedAt?: Date
  /**
   * Position in the source's own ordering, 0 = most recently saved. For the X
   * API this is the only ordering signal there is, which is why it is carried
   * through and persisted rather than inferred from a timestamp.
   */
  bookmarkOrder?: number
  /** full post text, \n\n between paragraphs */
  original: string
  likes?: number
  reposts?: number
  url?: string
}

export interface BookmarkSource {
  name: 'x-api' | 'archive-import' | 'paste'
  fetchNew(since?: Date): Promise<RawPost[]>
}

export { archiveImportSource } from './archive-import'
export { pasteSource } from './paste'
export { xApiSource } from './x-api'
