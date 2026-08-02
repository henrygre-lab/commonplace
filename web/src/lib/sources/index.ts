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
  savedAt: Date
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
