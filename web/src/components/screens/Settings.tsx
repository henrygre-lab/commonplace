'use client'

import { useRouter } from 'next/navigation'
import { Avatar, Eyebrow, OutlineButton, Screen, Segmented, Toggle } from '@/components/primitives'
import { exportMarkdown } from '@/lib/export'
import { useCounts, useStore } from '@/lib/store'
import type { Settings as SettingsT } from '@/lib/types'

const TIMES = ['06:00', '07:00', '08:00', '19:00'].map((t) => ({ value: t, label: t }))
const FREQS = (['Daily', 'Weekdays', 'Weekly'] as const).map((f) => ({ value: f, label: f }))

const TOGGLES: { key: keyof Pick<SettingsT, 'email' | 'push' | 'spaced'>; name: string; desc: string }[] = [
  { key: 'email', name: 'Email the brief', desc: 'Arrives as plain text, no images, no tracking.' },
  { key: 'push', name: 'Push notification', desc: 'One a day, at delivery time only.' },
  { key: 'spaced', name: 'Include a recall prompt', desc: 'One question per brief about something you saved earlier.' },
]

/** Every control is optimistic and immediate. No Save button anywhere. */
export function Settings() {
  const router = useRouter()
  const { settings, setSettings, items, flash } = useStore()
  const counts = useCounts()

  return (
    <Screen maxWidth={720} top={52} bottom={110}>
      <h1 className="mb-10 font-serif text-[38px] text-ink" style={{ letterSpacing: '-0.022em' }}>
        Settings
      </h1>

      {/* ── Daily brief ────────────────────────────────────────────────────── */}
      <section className="mb-11">
        <div className="mb-1 border-b border-line pb-3">
          <Eyebrow>Daily brief</Eyebrow>
        </div>

        <Row title="Delivery time" desc="Your brief is written an hour before it arrives.">
          <Segmented
            label="Delivery time"
            value={settings.time}
            options={TIMES}
            onChange={(v) => setSettings({ time: v })}
          />
        </Row>

        <Row title="Frequency" desc="Fewer briefs mean longer ones.">
          <Segmented
            label="Frequency"
            value={settings.freq}
            options={FREQS}
            onChange={(v) => setSettings({ freq: v })}
          />
        </Row>

        {TOGGLES.map((t) => (
          <Row key={t.key} title={t.name} desc={t.desc}>
            <Toggle
              label={t.name}
              on={settings[t.key]}
              onChange={(v) => setSettings({ [t.key]: v } as Partial<SettingsT>)}
            />
          </Row>
        ))}
      </section>

      {/* ── Connected account ──────────────────────────────────────────────── */}
      <section className="mb-11">
        <div className="mb-5 border-b border-line pb-3">
          <Eyebrow>Connected account</Eyebrow>
        </div>

        <div className="rounded-[14px] border border-line bg-surface px-6 py-[22px]">
          <div className="mb-5 flex flex-wrap items-center gap-[13px]">
            <Avatar initials="SR" size={38} large />
            <div className="flex-1">
              <div className="font-sans text-[14.5px] font-medium text-ink">@samrieber</div>
              <div className="font-sans text-[12.5px] text-faint">
                X · read-only · connected 4 March
              </div>
            </div>
            <div className="flex items-center gap-[7px] font-sans text-[12.5px] text-muted-2">
              <span className="cp-pulse-slow h-[6px] w-[6px] rounded-full bg-sync" />
              <span>Syncing</span>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-[30px] border-t border-line-faint pt-[18px]">
            <Stat label="Bookmarks" value={String(counts.ideas)} />
            <Stat label="Summarised" value={String(counts.ideas)} />
            <Stat label="Last sync" value="6 min" />
            <div className="ml-auto flex items-end gap-2">
              <OutlineButton onClick={() => flash('Resync queued')}>Resync now</OutlineButton>
              <OutlineButton danger>Disconnect</OutlineButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── Your data ──────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-1 border-b border-line pb-3">
          <Eyebrow>Your data</Eyebrow>
        </div>

        <Row
          title="Export summaries and notes"
          desc="Markdown, one file per idea. Yours to keep."
        >
          <OutlineButton onClick={() => exportMarkdown(items)}>Export</OutlineButton>
        </Row>

        <Row title="Replay onboarding" desc="For walking someone through the setup flow." last>
          <OutlineButton onClick={() => router.push('/')}>Replay</OutlineButton>
        </Row>
      </section>
    </Screen>
  )
}

function Row({
  title,
  desc,
  children,
  last = false,
}: {
  title: string
  desc: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-[30px] py-5 ${
        last ? '' : 'border-b border-line-faint'
      }`}
    >
      <div className="min-w-[200px] flex-1">
        <div className="mb-1 font-sans text-[14.5px] font-medium text-ink">{title}</div>
        <div className="font-sans text-[13px] leading-[1.5] text-muted-3">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="mb-[5px] font-sans uppercase text-fainter"
        style={{ fontSize: 10.5, letterSpacing: '0.12em' }}
      >
        {label}
      </div>
      <div className="font-serif text-[21px] text-ink">{value}</div>
    </div>
  )
}
