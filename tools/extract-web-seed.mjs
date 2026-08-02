// Generates web/src/lib/seed.ts from the design prototype.
//
//   node tools/extract-web-seed.mjs
//
// Requires the design bundle, which is not part of this repository. The output
// is committed; regenerating it must produce no diff.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadContent, report, repoRoot } from './lib/prototype.mjs'

const content = loadContent()
report(content)

const j = (v) => JSON.stringify(v, null, 2)

const out = `// GENERATED FROM prototype/Commonplace.dc.html — do not edit prose by hand.
//
// The 12 bookmarks, 6 briefs, connection graph and Ask answers below are
// written content, not filler. They are the seed for both the web and iOS apps
// and are ported verbatim. Regenerate with: node tools/extract-web-seed.mjs

import type { AskAnswer, Bookmark, Brief, Relation } from './types'

export const SEED_BOOKMARKS: Bookmark[] = ${j(content.bookmarks)}

export const SEED_BRIEFS: Brief[] = ${j(content.briefs)}

/** itemId → [[relatedId, reasonLabel], …] */
export const SEED_RELATIONS: Record<number, Relation[]> = ${j(content.relations)}

export const ASK_CORPUS: AskAnswer[] = ${j(content.askCorpus)}
`

const target = resolve(repoRoot, 'web/src/lib/seed.ts')
writeFileSync(target, out)
console.error(`wrote ${target}`)
