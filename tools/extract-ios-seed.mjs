// Generates ios/Commonplace/Resources/Seed.json from the design prototype.
//
//   node tools/extract-ios-seed.mjs
//
// Requires the design bundle, which is not part of this repository. The output
// is committed; regenerating it must produce no diff.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadContent, report, repoRoot } from './lib/prototype.mjs'

const content = loadContent()
report(content)

// `initials` is derived at decode time in Swift, so it is not stored.
const bookmarks = content.bookmarks.map(({ initials, ...rest }) => rest)

// relations() is keyed by number; JSON object keys are strings, which is what
// Swift decodes into [String: [Relation]].
const payload = {
  bookmarks,
  briefs: content.briefs,
  relations: content.relations,
  askCorpus: content.askCorpus,
}

const target = resolve(repoRoot, 'ios/Commonplace/Resources/Seed.json')
writeFileSync(target, JSON.stringify(payload, null, 2) + '\n')
console.error(`wrote ${target}`)
