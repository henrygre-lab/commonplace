// Shared loader for the design prototype's content.
//
// `prototype/Commonplace.dc.html` is the design handoff and is NOT part of this
// repository — see the README. These generators only run if you have the bundle
// locally. The seed files they produce ARE committed, so both apps build from a
// clean clone without it.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
export const repoRoot = resolve(here, '../..')

const PROTOTYPE = resolve(repoRoot, 'prototype/Commonplace.dc.html')

/**
 * The four content methods live in one contiguous block of the prototype's
 * logic class. Rather than transcribe 12 bookmarks and 6 briefs of prose by
 * hand — and silently mangle an em dash or a Sørensen along the way — the block
 * is evaluated and its return values are serialised.
 */
export function loadContent() {
  let source
  try {
    source = readFileSync(PROTOTYPE, 'utf8')
  } catch {
    console.error(
      `Cannot find ${PROTOTYPE}\n\n` +
      'The design bundle is not part of this repository. The generated seed is\n' +
      'already committed, so you only need the bundle to regenerate it.',
    )
    process.exit(1)
  }

  const lines = source.split('\n')
  const start = lines.findIndex((l) => l.trimStart().startsWith('seed() {'))
  const end = lines.findIndex((l) => l.trimStart().startsWith('set(patch)'))
  if (start < 0 || end < 0) {
    console.error('The prototype no longer has the expected seed()…askCorpus() block.')
    process.exit(1)
  }

  const Content = new Function(`return class { ${lines.slice(start, end).join('\n')} }`)()
  const c = new Content()

  return {
    bookmarks: c.seed(),
    briefs: c.briefs(),
    relations: c.relations(),
    askCorpus: c.askCorpus(),
  }
}

/** Both generators report the same shape so a bad extraction is obvious. */
export function report(content) {
  const { bookmarks, briefs, relations, askCorpus } = content
  console.error(
    `bookmarks ${bookmarks.length} · briefs ${briefs.length} · ` +
    `relations ${Object.keys(relations).length} · ask ${askCorpus.length}`,
  )
}
