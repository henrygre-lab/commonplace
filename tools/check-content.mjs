// Verifies the committed seed content.
//
//   node tools/check-content.mjs
//
// Unlike the extract scripts this needs no design bundle — it reads the two
// committed seeds, so it runs on a clean clone and in CI. It checks the content
// rules from the design spec, and that the web and iOS apps really do ship
// identical content, which is the one property a monorepo exists to protect.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { repoRoot } from './lib/prototype.mjs'

let failures = 0
const fail = (msg) => { console.error(`  FAIL  ${msg}`); failures++ }
const pass = (msg) => console.log(`  ok    ${msg}`)

// ── Load both seeds ────────────────────────────────────────────────────────

const ios = JSON.parse(readFileSync(resolve(repoRoot, 'ios/Commonplace/Resources/Seed.json'), 'utf8'))

const ts = readFileSync(resolve(repoRoot, 'web/src/lib/seed.ts'), 'utf8')
const grab = (name) => {
  const after = ts.split(new RegExp(`export const ${name}[^=]*= `))[1]
  if (!after) throw new Error(`${name} not found in web/src/lib/seed.ts`)
  return JSON.parse(after.split(/\n\n(?:\/\*\*|export)/)[0].trim())
}
const web = {
  bookmarks: grab('SEED_BOOKMARKS'),
  briefs: grab('SEED_BRIEFS'),
  relations: grab('SEED_RELATIONS'),
  askCorpus: grab('ASK_CORPUS'),
}

// ── The two platforms must ship the same content ───────────────────────────

// Swift derives `initials` at decode time, so it is the one legitimate
// difference between the files.
const stripped = web.bookmarks.map(({ initials, ...rest }) => rest)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

if (!same(stripped, ios.bookmarks)) fail('web and iOS bookmarks differ')
if (!same(web.briefs, ios.briefs)) fail('web and iOS briefs differ')
if (!same(web.relations, ios.relations)) fail('web and iOS relations differ')
if (!same(web.askCorpus, ios.askCorpus)) fail('web and iOS Ask answers differ')
if (!failures) pass('web and iOS ship byte-identical content')

// ── Content rules ──────────────────────────────────────────────────────────

const { bookmarks, briefs, relations, askCorpus } = web
const byId = new Map(bookmarks.map((b) => [b.id, b]))

const COUNT_WORD = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 }

for (const b of briefs) {
  // "Two decision rules" must mean exactly two ids.
  const word = b.sectionLabel.split(' ').map((w) => COUNT_WORD[w]).find(Boolean)
  if (word && word !== b.itemIds.length) {
    fail(`brief ${b.no}: "${b.sectionLabel}" but ${b.itemIds.length} ids`)
  }
  if (b.paras.length !== 2) fail(`brief ${b.no}: ${b.paras.length} paragraphs, expected 2`)
  for (const id of [...b.itemIds, b.resId, b.promptSourceId]) {
    if (!byId.has(id)) fail(`brief ${b.no} references missing bookmark ${id}`)
  }
}
pass('briefs: count words match itemIds, 2 paragraphs each, all ids resolve')

const edges = Object.values(relations).flat()
for (const [from, rows] of Object.entries(relations)) {
  for (const [to, reason] of rows) {
    if (!byId.has(to)) fail(`relation ${from}→${to} references a missing bookmark`)
    // "Related" is a failure; "Argues the opposite" is the feature.
    if (/^(related|similar)$/i.test(reason.trim())) {
      fail(`relation ${from}→${to}: "${reason}" is a non-reason and must be dropped`)
    }
  }
}
const disagreements = edges.filter(([, r]) => /opposite/i.test(r)).length
if (!disagreements) fail('no connection disagrees — disagreement is the point of the graph')
pass(`relations: ${edges.length} edges, no "Related"/"Similar", ${disagreements} disagreements`)

for (const it of bookmarks) {
  if (it.concepts.length !== 2) fail(`bookmark ${it.id}: ${it.concepts.length} concepts, expected 2`)
  if (it.actions.length !== 2) fail(`bookmark ${it.id}: ${it.actions.length} actions, expected 2`)
  // The title is the claim, rewritten to stand alone.
  if (!it.title.endsWith('.')) fail(`bookmark ${it.id}: title does not end in a full stop`)
}
pass('bookmarks: 2 concepts and 2 actions each, titles are standalone claims')

for (const a of askCorpus) {
  for (const id of a.ids) {
    if (!byId.has(id)) fail(`Ask "${a.label}" cites a missing bookmark ${id}`)
  }
  if (!a.paras.length) fail(`Ask "${a.label}" has no answer`)
}
pass('ask: every cited source resolves')

console.log(
  failures
    ? `\n${failures} failure${failures === 1 ? '' : 's'}.`
    : '\nAll content invariants hold.',
)
process.exit(failures ? 1 : 0)
