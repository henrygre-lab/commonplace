'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Avatar, Eyebrow, Screen, Segmented, TagChip } from '@/components/primitives'
import { flattenIds, selectBuckets, selectVisible } from '@/lib/derive'
import { claimFocus, type FocusTarget } from '@/lib/focusIntent'
import { useCounts, useStore } from '@/lib/store'
import type { Bookmark, Filter, GroupBy } from '@/lib/types'
import { useKeydown } from '@/lib/useKeydown'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'core', label: 'Core' },
]

const GROUPS: { value: GroupBy; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'theme', label: 'Theme' },
  { value: 'none', label: 'None' },
]

/** A param at its default is dropped so the URL stays clean. Matched per key —
 *  searching for the word "all" must not clear the search. */
const DEFAULTS: Record<string, string> = { filter: 'all', group: 'date' }

/** `✦` — the core marker. stopPropagation so it never opens the row. */
function Star({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      aria-pressed={on}
      aria-label={on ? 'Remove from core' : 'Mark as core'}
      className="leading-none transition-colors duration-[160ms]"
      style={{ fontSize: 15, color: on ? '#A2731F' : '#D5CCB8' }}
    >
      ✦
    </button>
  )
}

function Row({
  item,
  focused,
  onStar,
}: {
  item: Bookmark
  focused: boolean
  onStar: () => void
}) {
  return (
    // The whole row is the target, but the link lives on the title and is
    // stretched over the row — nesting a real button inside a role="button"
    // container would be invalid and unreachable by keyboard.
    <div
      className={`relative grid items-start gap-6 border-b border-line-row pb-[26px] pl-[14px] pr-5 pt-[26px] transition-colors duration-[150ms] hover:bg-row-hover ${
        focused ? 'cp-rail bg-row-hover' : ''
      }`}
      style={{ gridTemplateColumns: 'minmax(108px,152px) minmax(240px,1fr) 84px' }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-[9px]">
          <Avatar initials={item.initials} size={26} />
          <span className="truncate font-sans text-[13px] font-medium text-ink">{item.author}</span>
        </div>
        <div className="pl-[35px] font-sans text-[12px] text-faint">{item.date}</div>
      </div>

      <div className="min-w-0">
        <h3
          className="pretty font-serif text-ink-soft"
          style={{ fontSize: 16.5, lineHeight: 1.36, letterSpacing: '-0.006em' }}
        >
          <Link href={`/idea/${item.id}`} className="before:absolute before:inset-0">
            {item.title}
          </Link>
        </h3>
        {/* The summary sits deliberately close in weight to the title — you scan
            the idea, not the headline. */}
        <p
          className="pretty mt-[7px] font-sans text-muted"
          style={{ fontSize: 14.5, lineHeight: 1.58 }}
        >
          {item.summary}
        </p>
        <div className="mt-[11px] flex flex-wrap gap-[6px]">
          {item.tags.map((t) => <TagChip key={t} name={t} />)}
        </div>
      </div>

      <div className="relative flex flex-col items-end gap-[9px]">
        <span
          className="font-sans uppercase"
          style={{
            fontSize: 10.5,
            letterSpacing: '0.1em',
            color: item.reviewed ? '#8C8272' : '#A2731F',
          }}
        >
          {item.reviewed ? 'Reviewed' : 'New'}
        </span>
        <Star on={item.core} onToggle={onStar} />
      </div>
    </div>
  )
}

export function Library() {
  const router = useRouter()
  const params = useSearchParams()
  const { items, toggleReviewed, toggleCore } = useStore()
  const counts = useCounts()
  const searchRef = useRef<HTMLInputElement>(null)

  // Filter state lives in the URL so a filtered view is linkable and the back
  // button works (03 § 5). focusIdx stays local.
  const query = params.get('q') ?? ''
  const filter = (params.get('filter') as Filter) || 'all'
  const activeTag = params.get('tag')
  const groupBy = (params.get('group') as GroupBy) || 'date'

  // Any change to query, filter, groupBy or activeTag resets focus. Deriving it
  // from a signature beats resetting in an effect — no extra render pass, and
  // focus can never be briefly stale against a freshly filtered list.
  const sig = `${query}|${filter}|${groupBy}|${activeTag ?? ''}`
  const [focus, setFocus] = useState({ sig, idx: -1 })
  const focusIdx = focus.sig === sig ? focus.idx : -1
  const setFocusIdx = useCallback(
    (next: number | ((prev: number) => number)) =>
      setFocus((f) => {
        const prev = f.sig === sig ? f.idx : -1
        return { sig, idx: typeof next === 'function' ? next(prev) : next }
      }),
    [sig],
  )

  const setParam = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '' || v === DEFAULTS[k]) next.delete(k)
        else next.set(k, v)
      }
      const qs = next.toString()
      router.replace(qs ? `/library?${qs}` : '/library', { scroll: false })
    },
    [params, router],
  )

  const visible = useMemo(
    () => selectVisible(items, { query, filter, activeTag }),
    [items, query, filter, activeTag],
  )
  const buckets = useMemo(() => selectBuckets(visible, groupBy), [visible, groupBy])
  const visibleIds = useMemo(() => flattenIds(buckets), [buckets])

  useEffect(() => {
    const focus = () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    }
    if (claimFocus('search')) setTimeout(focus, 40)
    const onIntent = (e: Event) => {
      if ((e as CustomEvent<FocusTarget>).detail === 'search' && claimFocus('search')) {
        setTimeout(focus, 40)
      }
    }
    window.addEventListener('cp:focus', onIntent)
    return () => window.removeEventListener('cp:focus', onIntent)
  }, [])

  useKeydown((e) => {
    const n = visibleIds.length
    if (!n) return
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault(); setFocusIdx((i) => Math.min(n - 1, i + 1))
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault(); setFocusIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault(); router.push(`/idea/${visibleIds[focusIdx]}`)
    } else if (e.key === 'e' && focusIdx >= 0) {
      e.preventDefault(); toggleReviewed(visibleIds[focusIdx])
    } else if (e.key === 'f' && focusIdx >= 0) {
      e.preventDefault(); toggleCore(visibleIds[focusIdx])
    }
  })

  const focusedId = visibleIds[focusIdx]

  return (
    <Screen maxWidth={1100} top={52} bottom={90}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-[38px] text-ink" style={{ letterSpacing: '-0.022em' }}>
            Library
          </h1>
          <p className="mt-[6px] font-sans text-[13.5px] text-muted-3">
            {counts.ideas} ideas · {counts.unreviewed} unreviewed · synced 6 min ago
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Eyebrow>Group</Eyebrow>
          <Segmented
            label="Group by"
            value={groupBy}
            options={GROUPS}
            onChange={(v) => setParam({ group: v })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setParam({ q: e.target.value })}
          placeholder="Search ideas — press / from anywhere"
          aria-label="Search ideas"
          className="min-w-[240px] flex-1 rounded-lg border border-line bg-surface px-[13px] py-[9px] font-sans text-[13.5px] text-ink transition-colors duration-[150ms] outline-none placeholder:text-fainter focus:border-ochre-line"
        />
        <Segmented
          label="Filter"
          value={filter}
          options={FILTERS}
          onChange={(v) => setParam({ filter: v })}
        />
      </div>

      {activeTag && (
        <div className="mt-4 flex items-center gap-[10px]">
          <span className="font-sans text-[12.5px] text-faint">Filtered by</span>
          <button
            onClick={() => setParam({ tag: null })}
            className="inline-flex items-center gap-[7px] rounded-full bg-ochre-tint px-[10px] py-[4px] font-sans text-[12px] text-ochre-deep transition-colors duration-[160ms] hover:bg-[#E7D8B8]"
          >
            {activeTag}
            <span aria-hidden>×</span>
            <span className="sr-only">Clear tag filter</span>
          </button>
        </div>
      )}

      {visibleIds.length === 0 ? (
        <div className="py-[70px] text-center">
          <p className="font-serif text-[22px] text-ink">Nothing here yet.</p>
          <p className="mt-[10px] font-sans text-[13.5px] text-muted-3">
            Try a broader search, or clear the filters.
          </p>
        </div>
      ) : (
        buckets.map((b) => (
          <section key={b.label || 'all'}>
            {groupBy !== 'none' && (
              <div className="flex items-baseline gap-4 pb-[10px] pt-[34px]">
                <h2 className="font-serif text-[15px] text-ink-body">{b.label}</h2>
                <span className="h-px flex-1 bg-line-row" />
                <span className="font-sans text-[11.5px] text-faintest">
                  {b.items.length} {b.items.length === 1 ? 'idea' : 'ideas'}
                </span>
              </div>
            )}
            {b.items.map((it) => (
              <Row
                key={it.id}
                item={it}
                focused={it.id === focusedId}
                onStar={() => toggleCore(it.id)}
              />
            ))}
          </section>
        ))
      )}

      <p className="mt-9 font-sans text-[12px] text-fainter">
        <Key>j</Key> / <Key>k</Key> move · <Key>⏎</Key> open · <Key>e</Key> mark reviewed ·{' '}
        <Key>f</Key> core · <Key>/</Key> search · <Key>g</Key> then <Key>b</Key> <Key>l</Key>{' '}
        <Key>a</Key> <Key>s</Key> jump
      </p>
    </Screen>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-3">{children}</span>
}
