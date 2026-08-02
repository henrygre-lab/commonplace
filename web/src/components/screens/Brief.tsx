'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, Eyebrow } from '@/components/primitives'
import { useStore } from '@/lib/store'
import type { Brief as BriefType } from '@/lib/types'

/**
 * The hero screen. It arrives as staggered blocks so it reads as a letter being
 * set down rather than a dashboard painting in — the one piece of ceremony in
 * the product (02 § 6).
 */
export function Brief({ no }: { no?: number }) {
  const { briefs } = useStore()
  const brief: BriefType | undefined = no === undefined ? briefs[0] : briefs.find((b) => b.no === no)

  if (!brief) {
    return (
      <div className="mx-auto max-w-[660px] px-8 py-24">
        <p className="font-serif text-[22px] text-ink">There is no brief with that number.</p>
        <Link href="/briefs" className="mt-3 inline-block font-sans text-[13.5px] text-ochre">
          All briefs
        </Link>
      </div>
    )
  }

  // Keyed by number so selecting another brief remounts it — that is what
  // guarantees the recall question is always closed on arrival (02 § 3).
  return <BriefBody key={brief.no} brief={brief} />
}

function BriefBody({ brief }: { brief: BriefType }) {
  const router = useRouter()
  const { briefsRead, settings, hydrate, byId, toggleBriefRead } = useStore()
  const [promptOpen, setPromptOpen] = useState(false)

  const items = hydrate(brief.itemIds)
  const resurfaced = byId(brief.resId)
  const read = !!briefsRead[brief.no]

  return (
    <article
      className="mx-auto w-full max-w-[660px] pb-[110px] pt-16 md:pt-[116px] lg:pt-16"
      style={{ paddingLeft: 'clamp(24px,4vw,56px)', paddingRight: 'clamp(24px,4vw,56px)' }}
    >
      {/* 1 — header rule */}
      <header className="cp-rise mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-line-strong pb-4">
        <div className="flex items-center gap-[10px]">
          <span className="h-[6px] w-[6px] rounded-full bg-ochre" />
          <span
            className="font-sans uppercase text-muted-3"
            style={{ fontSize: 11, letterSpacing: '0.14em' }}
          >
            {brief.dateLine}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="font-sans uppercase text-faintest"
            style={{ fontSize: 11, letterSpacing: '0.1em' }}
          >
            {brief.mins}
          </span>
          <Link
            href="/briefs"
            className="font-sans text-[12.5px] text-ochre transition-colors duration-[160ms] hover:text-ochre-deep"
          >
            All briefs
          </Link>
        </div>
      </header>

      {/* 2 + 3 — headline and prose */}
      <div className="cp-rise cp-d1">
        <h1
          className="pretty mb-7 font-serif text-ink"
          style={{ fontSize: 42, lineHeight: 1.14, letterSpacing: '-0.022em' }}
        >
          {brief.headline}
        </h1>
      </div>

      <div className="cp-rise cp-d2">
        {brief.paras.map((p, i) => (
          <p
            key={i}
            className="pretty mb-5 font-serif text-ink-soft"
            style={{ fontSize: 20, lineHeight: 1.72 }}
          >
            {p}
          </p>
        ))}
        <p
          className="pretty mb-[46px] font-serif italic text-muted"
          style={{ fontSize: 20, lineHeight: 1.72 }}
        >
          {brief.closer}
        </p>
      </div>

      {/* 4 — the grouped saves */}
      <div className="cp-rise cp-d3">
        <div className="flex items-center gap-4">
          <Eyebrow>{brief.sectionLabel}</Eyebrow>
          <span className="h-px flex-1 bg-line-row" />
        </div>
        {items.map((b) => (
          <Link
            key={b.id}
            href={`/idea/${b.id}`}
            className="flex gap-[22px] border-b border-line-row py-6 transition-colors duration-[150ms] hover:bg-row-hover"
          >
            <Avatar initials={b.initials} size={30} className="mt-[3px]" />
            <div className="min-w-0 flex-1">
              <div className="mb-[7px] flex flex-wrap items-center gap-[9px]">
                <span className="font-sans text-[13px] font-medium text-ink">{b.author}</span>
                <span className="font-sans text-[12px] text-faintest">
                  {b.handle} · {b.date}
                </span>
              </div>
              <div
                className="pretty mb-2 font-serif text-ink"
                style={{ fontSize: 20, lineHeight: 1.32, letterSpacing: '-0.01em' }}
              >
                {b.title}
              </div>
              <div className="pretty font-sans text-muted-2" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {b.summary}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 5 + 6 + 7 — resurfaced, recall prompt, footer */}
      <div className="cp-rise cp-d4">
        {resurfaced && (
          <div className="mt-11 rounded-2xl border border-line bg-surface px-[30px] py-7">
            <Eyebrow accent className="mb-4 block">{brief.resLabel}</Eyebrow>
            <div
              className="pretty mb-3 font-serif text-ink"
              style={{ fontSize: 24, lineHeight: 1.3, letterSpacing: '-0.014em' }}
            >
              {resurfaced.title}
            </div>
            <div
              className="pretty mb-[18px] font-sans"
              style={{ fontSize: 15, lineHeight: 1.65, color: '#4A443A' }}
            >
              {resurfaced.summary}
            </div>
            <div className="flex flex-wrap items-center gap-[18px]">
              <Link
                href={`/idea/${resurfaced.id}`}
                className="font-sans text-[13.5px] font-medium text-ochre transition-colors duration-[160ms] hover:text-ochre-deep"
              >
                Read the summary
              </Link>
              <span className="font-sans text-[13px] text-fainter">
                {resurfaced.author}, {resurfaced.date}
              </span>
            </div>
          </div>
        )}

        {/* The only dashed edge in the product: not content, an exercise. */}
        {settings.spaced && (
          <div
            className="mt-[22px] rounded-2xl px-[30px] py-7"
            style={{ border: '1px dashed #D8CEB8' }}
          >
            <Eyebrow className="mb-[14px] block">One question before you go</Eyebrow>
            <div
              className="pretty mb-[18px] font-serif text-ink"
              style={{ fontSize: 21, lineHeight: 1.44 }}
            >
              {brief.promptQ}
            </div>
            {promptOpen ? (
              <div className="cp-reveal">
                <p
                  className="pretty mb-3 font-sans text-ink-soft"
                  style={{ fontSize: 15, lineHeight: 1.68 }}
                >
                  {brief.promptA}
                </p>
                <Link
                  href={`/idea/${brief.promptSourceId}`}
                  className="font-sans text-[13.5px] font-medium text-ochre transition-colors duration-[160ms] hover:text-ochre-deep"
                >
                  {brief.promptSource}
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setPromptOpen(true)}
                className="border-b border-ochre-line-soft pb-[2px] font-sans text-[13.5px] font-medium text-ochre transition-colors duration-[160ms] hover:text-ochre-deep"
              >
                Show me the answer
              </button>
            )}
          </div>
        )}

        <footer className="mt-[46px] flex flex-wrap items-center justify-between gap-5 border-t border-line-strong pt-[26px]">
          <p className="font-sans text-[13px] text-faint">
            Next brief tomorrow at {settings.time} ·{' '}
            <button
              onClick={() => router.push('/settings')}
              className="text-ochre transition-colors duration-[160ms] hover:text-ochre-deep"
            >
              change
            </button>
          </p>
          <button
            onClick={() => toggleBriefRead(brief.no)}
            className={`rounded-full px-6 py-3 font-sans text-[14px] font-medium transition-all duration-[180ms] ${
              read ? 'bg-ochre-tint text-ochre-deep' : 'bg-ink text-on-dark hover:bg-dark-hover'
            }`}
          >
            {read ? 'Brief read ✓' : 'Mark brief as read'}
          </button>
        </footer>
      </div>
    </article>
  )
}
