'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, Eyebrow, Screen, SectionRule, TagChip } from '@/components/primitives'
import { SEED_RELATIONS } from '@/lib/seed'
import { useStore } from '@/lib/store'
import { reasonColour } from '@/lib/tags'
import { useKeydown } from '@/lib/useKeydown'

type NoteStatus = 'Saved automatically' | 'Saving…' | 'Saved just now'

// Keyed by id, so opening another idea remounts the screen. That is what resets
// origOpen, the note draft and the tag draft (02 § 5) without an effect.
export function Detail({ id }: { id: number }) {
  return <DetailBody key={id} id={id} />
}

function DetailBody({ id }: { id: number }) {
  const router = useRouter()
  const { items, byId, patchItem, toggleReviewed, toggleCore } = useStore()
  const item = byId(id)

  const [origOpen, setOrigOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState(item?.note ?? '')
  const [noteStatus, setNoteStatus] = useState<NoteStatus>('Saved automatically')
  const [tagDraft, setTagDraft] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  // ↑ ↓ step through the WHOLE corpus with wraparound, not the filtered subset.
  // Reading is browsing; the library's filters are for finding.
  const step = (dir: number) => {
    const i = items.findIndex((x) => x.id === id)
    if (i < 0) return
    router.push(`/idea/${items[(i + dir + items.length) % items.length].id}`)
  }

  useKeydown((e) => {
    if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); step(1) }
    else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); step(-1) }
    else if (e.key === 'Escape') { e.preventDefault(); router.push('/library') }
    else if (e.key === 'e') { e.preventDefault(); toggleReviewed(id) }
    else if (e.key === 'f') { e.preventDefault(); toggleCore(id) }
  })

  const related = useMemo(() => {
    const rows = SEED_RELATIONS[id] ?? []
    return rows
      .map(([relId, reason]) => ({ reason, item: items.find((x) => x.id === relId) }))
      .filter((r) => r.item)
  }, [id, items])

  if (!item) {
    return (
      <div className="mx-auto max-w-[660px] px-8 py-24">
        <p className="font-serif text-[22px] text-ink">That idea is not in your library.</p>
        <Link href="/library" className="mt-3 inline-block font-sans text-[13.5px] text-ochre">
          ← Library
        </Link>
      </div>
    )
  }

  // Note autosaves: every keystroke sets Saving…, a 600ms debounce then sets
  // Saved just now. There is never a Save button.
  const onNote = (v: string) => {
    setNoteDraft(v)
    setNoteStatus('Saving…')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      patchItem(id, { note: v })
      setNoteStatus('Saved just now')
    }, 600)
  }

  const commitTag = () => {
    const t = tagDraft.trim()
    if (!t || item.tags.includes(t)) { setTagDraft(''); return }
    patchItem(id, { tags: [...item.tags, t] })
    setTagDraft('')
  }

  return (
    <Screen top={34} bottom={100}>
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/library"
          className="font-sans text-[13px] text-muted-3 transition-colors duration-[160ms] hover:text-ink"
        >
          ← Library
        </Link>
        <div className="flex gap-[6px]">
          <NavSquare label="Previous idea" onClick={() => step(-1)}>↑</NavSquare>
          <NavSquare label="Next idea" onClick={() => step(1)}>↓</NavSquare>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-[56px] gap-y-12">
        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="min-w-[min(440px,100%)] max-w-[660px] flex-[1_1_440px]">
          <SectionRule
            label="The idea"
            accent
            trailing={
              <span className="font-sans text-[12px] text-faint">Saved {item.date}</span>
            }
          />

          <h1
            className="pretty mt-5 font-serif text-ink"
            style={{ fontSize: 39, lineHeight: 1.14, letterSpacing: '-0.022em' }}
          >
            {item.title}
          </h1>

          <p
            className="pretty mb-10 mt-5 font-serif text-ink-soft"
            style={{ fontSize: 20, lineHeight: 1.66 }}
          >
            {item.summary}
          </p>

          <div className="flex flex-wrap gap-x-[52px] gap-y-8">
            <div className="min-w-[220px] flex-1">
              <Eyebrow>Key concepts</Eyebrow>
              <ul className="mt-[14px] flex flex-col gap-[9px]">
                {item.concepts.map((c) => (
                  <li key={c} className="flex gap-[9px]">
                    <span className="text-ochre-line" aria-hidden>—</span>
                    <span className="font-sans text-ink-body" style={{ fontSize: 14, lineHeight: 1.45 }}>
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-[260px] flex-1">
              <Eyebrow>Actionable</Eyebrow>
              <ol className="mt-[14px] flex flex-col gap-[11px]">
                {item.actions.map((a, i) => (
                  <li key={a} className="flex gap-[11px]">
                    <span className="w-[12px] shrink-0 font-serif text-[13px] text-ochre">
                      {i + 1}
                    </span>
                    <span className="font-sans text-ink-body" style={{ fontSize: 14, lineHeight: 1.5 }}>
                      {a}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── The original post ─────────────────────────────────────────── */}
          <div className="mt-10 border-t border-line pt-5">
            <button
              onClick={() => setOrigOpen((o) => !o)}
              aria-expanded={origOpen}
              className="flex items-center gap-[9px] font-sans text-[13px] text-muted-3 transition-colors duration-[160ms] hover:text-ink"
            >
              <span aria-hidden>{origOpen ? '▾' : '▸'}</span>
              Show the original post
            </button>

            {origOpen && (
              <div className="cp-reveal mt-4 rounded-[14px] border border-line bg-surface px-[26px] py-6">
                <div className="flex items-center gap-3">
                  <Avatar initials={item.initials} size={34} />
                  <div>
                    <div className="font-sans text-[13px] font-medium text-ink">{item.author}</div>
                    <div className="font-sans text-[12px] text-faint">{item.handle}</div>
                  </div>
                </div>
                <p
                  className="pretty mt-4 whitespace-pre-line font-sans text-ink-soft"
                  style={{ fontSize: 15, lineHeight: 1.68 }}
                >
                  {item.original}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-line-faint pt-[14px]">
                  <span className="font-sans text-[12.5px] text-faint">
                    {item.likes} likes · {item.reposts} reposts
                  </span>
                  <span className="font-sans text-[12.5px] font-medium text-ochre">Open on X</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Connections — the reason is the product ───────────────────── */}
          {related.length > 0 && (
            <div className="mt-[46px]">
              <SectionRule
                label="Connections"
                accent
                trailing={
                  <span className="font-sans text-[12px] text-faint">
                    {related.length} of {items.length} ideas
                  </span>
                }
              />
              <div className="mt-2">
                {related.map(({ reason, item: r }) => (
                  <Link
                    key={r!.id}
                    href={`/idea/${r!.id}`}
                    className="flex gap-5 border-b border-line-row py-5 pr-[6px] transition-colors duration-[150ms] hover:bg-row-hover"
                  >
                    <span
                      className="w-[150px] shrink-0 pt-[3px] font-sans uppercase"
                      style={{ fontSize: 10.5, lineHeight: 1.4, letterSpacing: '0.14em', color: reasonColour(reason) }}
                    >
                      {reason}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="pretty block font-serif text-ink-soft"
                        style={{ fontSize: 17, lineHeight: 1.34 }}
                      >
                        {r!.title}
                      </span>
                      <span className="mt-[5px] block font-sans text-[12.5px] text-faint">
                        {r!.author} · saved {r!.date}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              {/* Seeds Ask with the item's first tag, phrased as a question,
                  and runs it on arrival. */}
              <Link
                href={`/ask?q=${encodeURIComponent(
                  `What have I saved about ${(item.tags[0] ?? '').toLowerCase()}?`,
                )}&run=1`}
                className="mt-5 inline-block border-b border-ochre-line-soft pb-[2px] font-sans text-[13px] font-medium text-ochre transition-colors duration-[160ms] hover:text-ochre-deep"
              >
                Ask your library about this →
              </Link>
            </div>
          )}
        </div>

        {/* ── Aside ───────────────────────────────────────────────────────── */}
        <aside className="min-w-[268px] max-w-[340px] flex-[1_1_268px]">
          <div className="mb-4 rounded-[14px] border border-line bg-surface p-5">
            <Eyebrow>Tags</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-[6px]">
              {item.tags.map((t) => (
                <TagChip
                  key={t}
                  name={t}
                  detail
                  onRemove={() => patchItem(id, { tags: item.tags.filter((x) => x !== t) })}
                />
              ))}
            </div>
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitTag() } }}
              placeholder="Add a tag ⏎"
              aria-label="Add a tag"
              className="mt-3 w-full rounded-[7px] border border-line bg-surface-inset px-[11px] py-[8px] font-sans text-[13px] text-ink outline-none transition-colors duration-[150ms] placeholder:text-fainter focus:border-ochre-line"
            />
          </div>

          <div className="mb-4 rounded-[14px] border border-line bg-surface p-5">
            <Eyebrow>Your note</Eyebrow>
            <textarea
              value={noteDraft}
              onChange={(e) => onNote(e.target.value)}
              placeholder="What does this change for you?"
              aria-label="Your note"
              // Newsreader here — writing should feel like writing.
              className="mt-3 min-h-[96px] w-full rounded-[7px] border border-line bg-surface-inset px-[11px] py-[9px] font-serif text-ink outline-none transition-colors duration-[150ms] placeholder:text-fainter focus:border-ochre-line"
              style={{ fontSize: 13, lineHeight: 1.55 }}
            />
            <div className="mt-2 font-sans text-[11.5px] text-fainter" aria-live="polite">
              {noteStatus}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => toggleReviewed(id)}
              className={`w-full rounded-[9px] px-4 py-[10px] font-sans text-[13.5px] font-medium transition-colors duration-[180ms] ${
                item.reviewed
                  ? 'bg-ochre-tint text-ochre-deep'
                  : 'bg-ochre text-on-ochre hover:bg-ochre-deep'
              }`}
            >
              {item.reviewed ? 'Reviewed ✓' : 'Mark as reviewed'}
            </button>
            <button
              onClick={() => toggleCore(id)}
              className={`w-full rounded-[9px] border bg-surface px-4 py-[10px] font-sans text-[13.5px] font-medium transition-colors duration-[180ms] ${
                item.core
                  ? 'border-ochre-line-tint text-ochre'
                  : 'border-line text-muted hover:border-ochre-line'
              }`}
            >
              {item.core ? '✦ Core idea' : 'Mark as core'}
            </button>
          </div>
        </aside>
      </div>
    </Screen>
  )
}

function NavSquare({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-line bg-surface font-sans text-[13px] text-muted-3 transition-colors duration-[160ms] hover:border-ochre-line hover:text-ink"
    >
      {children}
    </button>
  )
}
