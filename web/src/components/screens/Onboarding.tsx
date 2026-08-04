'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eyebrow, Wordmark } from '@/components/primitives'
import { SEED_BOOKMARKS } from '@/lib/seed'
import { tagHue } from '@/lib/tags'

/** The wordmark is pinned above every onboarding step; there is no other chrome. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="absolute left-1/2 top-10 -translate-x-1/2">
        <Wordmark />
      </div>
      {children}
    </div>
  )
}

/* ── Step 1 — the pitch. The public route, not a login wall. ───────────────── */

export function Pitch() {
  const router = useRouter()
  return (
    <Frame>
      <div className="cp-fade-slow max-w-[560px] text-center">
        <Eyebrow className="mb-[22px] block">A second brain for your X bookmarks</Eyebrow>
        <h1
          className="pretty mb-5 font-serif text-ink"
          style={{ fontSize: 50, lineHeight: 1.12, letterSpacing: '-0.022em' }}
        >
          Your bookmarks are a library nobody ever catalogued.
        </h1>
        <p
          className="pretty mx-auto mb-[38px] max-w-[460px] font-serif text-muted"
          style={{ fontSize: 19, lineHeight: 1.62 }}
        >
          Commonplace reads everything you save on X, extracts the idea inside it, and brings the
          right ones back to you each morning.
        </p>
        <button
          onClick={() => router.push('/connect')}
          className="rounded-full bg-ochre px-[30px] py-[14px] font-sans text-[15px] font-medium text-on-ochre transition-colors duration-[180ms] hover:bg-ochre-deep"
        >
          Get started
        </button>
        <div className="mt-7">
          <button
            onClick={() => router.push('/brief')}
            className="font-sans text-[13px] text-muted-3 underline decoration-line-strong underline-offset-[3px] transition-colors duration-[160ms] hover:text-ink"
          >
            See it with sample data
          </button>
        </div>
      </div>
    </Frame>
  )
}

/* ── Step 2 — consent ─────────────────────────────────────────────────────── */

const PERMISSIONS = [
  { title: 'Read your bookmarks', desc: 'Including your full history, backfilled once on setup.' },
  { title: 'Never post, follow, or message', desc: 'We ask for no write access at all.' },
  { title: 'Summaries stay yours', desc: 'Export or delete everything in one click.' },
]

export function Connect() {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)

  return (
    <Frame>
      <div className="cp-fade-slow w-full max-w-[520px]">
        <h1
          className="mb-[10px] text-center font-serif text-ink"
          style={{ fontSize: 36, lineHeight: 1.18, letterSpacing: '-0.02em' }}
        >
          Connect your X account
        </h1>
        <p
          className="mb-[14px] text-center font-sans text-muted"
          style={{ fontSize: 14.5, lineHeight: 1.6 }}
        >
          One connection. Read-only. Revoke it whenever you like.
        </p>

        {/* The flow below is a demonstration — there is no OAuth behind it. Said
            plainly here so nobody reaches the button believing otherwise. */}
        <p className="mb-[26px] text-center font-sans text-[13px] leading-[1.5] text-faint">
          This is a demonstration. No account is connected, and nothing is read from X.
        </p>

        <div className="mb-[26px] rounded-[14px] border border-line bg-surface px-6 py-2">
          {PERMISSIONS.map((p, i) => (
            <div
              key={p.title}
              className={`flex items-start gap-[14px] py-[18px] ${
                i < PERMISSIONS.length - 1 ? 'border-b border-line-faint' : ''
              }`}
            >
              <span
                className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ background: i === 0 ? '#A2731F' : '#C9BFA8' }}
              />
              <div>
                <div className="mb-[3px] font-sans text-[14px] font-medium text-ink">{p.title}</div>
                <div className="font-sans text-[13px] leading-[1.5] text-muted-3">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          disabled={connecting}
          onClick={() => {
            setConnecting(true)
            setTimeout(() => router.push('/setup'), 900)
          }}
          className="w-full rounded-[10px] bg-ink py-[15px] font-sans text-[15px] font-medium text-on-dark transition-colors duration-[180ms] hover:bg-dark-hover"
        >
          {connecting ? 'Authorising…' : 'Connect X account'}
        </button>

        <p className="mt-4 text-center font-sans text-[12.5px] text-faint">
          Signed in as <span className="text-muted">@samrieber</span>
        </p>
      </div>
    </Frame>
  )
}

/* ── Step 3 — backfill ────────────────────────────────────────────────────── */

const THEME_CHIPS = [
  'Business', 'Leverage', 'Health', 'Psychology', 'Writing', 'Pricing', 'Attention', 'Career',
]

export function Setup() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // The real ingest reports real totals; the count comes from the corpus, never
  // from the prototype's 1,284 (02 § 2).
  const total = SEED_BOOKMARKS.length

  useEffect(() => {
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 4 + Math.random() * 5
        if (next >= 100) {
          if (timer.current) clearInterval(timer.current)
          return 100
        }
        return next
      })
    }, 220)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  const busy = progress < 100
  const pct = Math.min(100, Math.round(progress))
  const done = Math.min(total, Math.round((progress / 100) * total))

  return (
    <Frame>
      <div className="cp-fade-slow w-full max-w-[520px]">
        <Eyebrow className="mb-[14px] block text-center">Backfilling your archive</Eyebrow>
        <h1
          className="pretty mb-[34px] text-center font-serif text-ink"
          style={{ fontSize: 40, lineHeight: 1.15, letterSpacing: '-0.02em' }}
        >
          {busy ? `${total} bookmarks found. Reading them now.` : 'Your library is ready.'}
        </h1>

        <div
          className="mb-[14px] h-[4px] overflow-hidden rounded-[4px] bg-line"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-[4px] bg-ochre"
            style={{ width: `${pct}%`, transition: 'width .35s linear' }}
          />
        </div>

        <div className="mb-[34px] flex justify-between font-sans text-[13px] text-muted-3">
          <span>{busy ? `Summarising ${done} of ${total}` : `All ${total} bookmarks summarised`}</span>
          <span>{pct}%</span>
        </div>

        <div className="mb-7 rounded-[14px] border border-line bg-surface px-6 py-5">
          <div
            className="mb-3 font-sans uppercase text-faint"
            style={{ fontSize: 11, letterSpacing: '0.12em' }}
          >
            Emerging themes
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {THEME_CHIPS.map((name) => {
              const hue = tagHue(name)
              return (
                <span
                  key={name}
                  className="rounded-full px-[11px] py-[5px] font-sans text-[12.5px]"
                  style={{ background: hue.bg, color: hue.fg }}
                >
                  {name}
                </span>
              )
            })}
          </div>
        </div>

        <button
          disabled={busy}
          onClick={() => router.push('/brief')}
          className={`w-full rounded-[10px] py-[15px] font-sans text-[15px] font-medium transition-all duration-200 ${
            busy
              ? 'cursor-not-allowed bg-line text-fainter'
              : 'bg-ochre text-on-ochre hover:bg-ochre-deep'
          }`}
        >
          {busy ? 'Processing…' : 'Enter your library'}
        </button>
      </div>
    </Frame>
  )
}
