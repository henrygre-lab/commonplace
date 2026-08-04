'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Avatar, Eyebrow, Screen } from '@/components/primitives'
import { ASK_SUGGESTIONS, resolveAsk, type Answer } from '@/lib/ask'
import { claimFocus, type FocusTarget } from '@/lib/focusIntent'
import { useStore } from '@/lib/store'

// Keyed by the seeded query so arriving from a different idea's "Ask your
// library about this" starts a fresh ask rather than mutating the open one.
export function Ask() {
  const params = useSearchParams()
  const seed = params.get('q') ?? ''
  const autoRun = params.get('run') === '1' && seed !== ''
  return <AskBody key={`${seed}|${autoRun}`} seed={seed} autoRun={autoRun} />
}

function AskBody({ seed, autoRun }: { seed: string; autoRun: boolean }) {
  const { items } = useStore()

  const [query, setQuery] = useState(seed)
  // Arriving with ?run=1 lands directly in the thinking state, so the 900ms
  // retrieval beat is the same whether the query was typed or seeded.
  const [busy, setBusy] = useState(autoRun)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = useCallback(
    (text: string) => {
      const q = text.trim()
      if (!q) return
      if (timer.current) clearTimeout(timer.current)
      setQuery(q)
      setBusy(true)
      setAnswer(null)
      // The 900ms beat survives — the retrieval phase keeps its thinking state
      // even once the answer itself streams (03 § 4.5).
      timer.current = setTimeout(() => {
        setAnswer(resolveAsk(q, items))
        setBusy(false)
      }, 900)
    },
    [items],
  )

  // Resolve the seeded query. The effect only schedules a timer; the state
  // change happens later, in its callback.
  useEffect(() => {
    if (!autoRun) return
    const t = setTimeout(() => {
      setAnswer(resolveAsk(seed, items))
      setBusy(false)
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, seed])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  useEffect(() => {
    const focus = () => inputRef.current?.focus()
    if (claimFocus('ask')) setTimeout(focus, 60)
    const onIntent = (e: Event) => {
      if ((e as CustomEvent<FocusTarget>).detail === 'ask' && claimFocus('ask')) {
        setTimeout(focus, 60)
      }
    }
    window.addEventListener('cp:focus', onIntent)
    return () => window.removeEventListener('cp:focus', onIntent)
  }, [])

  const sources = answer ? answer.ids.map((id) => items.find((x) => x.id === id)).filter(Boolean) : []

  return (
    <Screen maxWidth={680} top={64} bottom={110}>
      <Eyebrow className="mb-[14px] block">Ask your library</Eyebrow>
      <h1
        className="pretty mb-[26px] font-serif text-ink"
        style={{ fontSize: 38, lineHeight: 1.15, letterSpacing: '-0.022em' }}
      >
        Six years of saves. Ask it something.
      </h1>

      <div className="mb-4 flex gap-[10px]">
        {/* Newsreader here — asking is writing. */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(e.currentTarget.value) }}
          placeholder="What have I saved about…"
          aria-label="Ask your library"
          className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-4 py-[13px] font-serif text-[17px] text-ink outline-none transition-colors duration-[150ms] placeholder:text-fainter focus:border-ochre-line"
        />
        <button
          onClick={() => run(query)}
          className="shrink-0 rounded-[10px] bg-ink px-[22px] font-sans text-[14px] font-medium text-on-dark transition-colors duration-[180ms] hover:bg-dark-hover"
        >
          Ask
        </button>
      </div>

      <div className="mb-11 flex flex-wrap gap-[7px]">
        {ASK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => run(s)}
            className="rounded-full bg-chip px-3 py-[6px] font-sans text-[12.5px] text-muted transition-colors duration-[150ms] hover:bg-chip-hover"
          >
            {s}
          </button>
        ))}
      </div>

      {busy && (
        <div className="flex items-center gap-[11px] font-sans text-[13.5px] text-muted-3">
          <span className="cp-pulse h-[6px] w-[6px] rounded-full bg-ochre" />
          <span>Reading {items.length} summaries…</span>
        </div>
      )}

      {answer && !busy && (
        <div className="cp-rise-quick">
          <div className="mb-5 flex items-center gap-3">
            <Eyebrow accent size={10.5}>{answer.label}</Eyebrow>
            <span className="h-px flex-1 bg-line" />
          </div>

          {answer.paras.map((p, i) => (
            <p
              key={i}
              className="pretty mb-[18px] font-serif text-ink-soft"
              style={{ fontSize: 19, lineHeight: 1.7 }}
            >
              {p}
            </p>
          ))}

          {sources.length > 0 && (
            <>
              <div className="mt-8 border-b border-line pb-[10px]">
                <Eyebrow size={10.5}>
                  Drawn from {sources.length} {sources.length === 1 ? 'idea' : 'ideas'} you saved
                </Eyebrow>
              </div>
              {sources.map((s) => (
                <Link
                  key={s!.id}
                  href={`/idea/${s!.id}`}
                  className="flex items-start gap-[18px] border-b border-line-row py-[18px] pr-[6px] transition-colors duration-[150ms] hover:bg-row-hover"
                >
                  <Avatar initials={s!.initials} size={26} className="mt-[2px]" />
                  <div className="min-w-0 flex-1">
                    <div
                      className="pretty mb-1 font-serif text-ink"
                      style={{ fontSize: 16.5, lineHeight: 1.34 }}
                    >
                      {s!.title}
                    </div>
                    <div className="font-sans text-[12.5px] text-faint">
                      {s!.author} · saved {s!.date}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          <p className="mt-[26px] font-sans text-[12.5px] text-fainter">
            Answers are drawn only from what you saved. Nothing here is invented.
          </p>
        </div>
      )}
    </Screen>
  )
}
