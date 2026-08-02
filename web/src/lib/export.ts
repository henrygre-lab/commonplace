import type { Bookmark } from './types'

/** Markdown, one section per idea. Yours to keep. */
function toMarkdown(items: Bookmark[]): string {
  return items
    .map((it) => {
      const lines = [
        `# ${it.title}`,
        '',
        `${it.author} (${it.handle}) · saved ${it.date}`,
        it.tags.length ? `Tags: ${it.tags.join(', ')}` : '',
        '',
        it.summary,
        '',
        '## Key concepts',
        ...it.concepts.map((c) => `- ${c}`),
        '',
        '## Actionable',
        ...it.actions.map((a, i) => `${i + 1}. ${a}`),
        '',
        '## The original post',
        '',
        it.original,
        '',
      ]
      if (it.note.trim()) lines.push('## Your note', '', it.note, '')
      return lines.filter((l) => l !== null).join('\n')
    })
    .join('\n---\n\n')
}

export function exportMarkdown(items: Bookmark[]) {
  const blob = new Blob([toMarkdown(items)], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'commonplace.md'
  a.click()
  URL.revokeObjectURL(url)
}
