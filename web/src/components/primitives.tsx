'use client'

import { tagHue } from '@/lib/tags'

/* ── Wordmark — 7px ochre dot + Newsreader 19px, gap 9px ─────────────────── */

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[9px] ${className}`}>
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ochre" />
      <span className="font-serif text-[19px] text-ink">Commonplace</span>
    </div>
  )
}

/* ── Eyebrow — the workhorse label of this design ─────────────────────────
   11px / 0.14em / uppercase / #918879, or ochre when the section deserves
   emphasis (The idea, Connections, Resurfaced, Ask answer).                  */

export function Eyebrow({
  children,
  accent = false,
  className = '',
  size = 11,
}: {
  children: React.ReactNode
  accent?: boolean
  className?: string
  size?: number
}) {
  return (
    <span
      className={`font-sans uppercase ${accent ? 'text-ochre' : 'text-faint'} ${className}`}
      style={{ fontSize: size, letterSpacing: '0.14em' }}
    >
      {children}
    </span>
  )
}

/** Eyebrow followed by a flex-1 hairline — the section rule used all over. */
export function SectionRule({
  label,
  accent = false,
  trailing,
}: {
  label: React.ReactNode
  accent?: boolean
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4">
      <Eyebrow accent={accent}>{label}</Eyebrow>
      <span className="h-px flex-1 bg-line-row" />
      {trailing}
    </div>
  )
}

/* ── Avatar — initials in a circle ───────────────────────────────────────── */

export function Avatar({
  initials,
  size = 26,
  large = false,
  className = '',
}: {
  initials: string
  size?: number
  large?: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-sans text-muted-2 ${
        large ? 'bg-avatar-lg' : 'bg-avatar'
      } ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.38)) }}
    >
      {initials}
    </span>
  )
}

/* ── Segmented control ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  alt = false,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  /** the "Preview as" trough sits on sunk ground and needs a darker track */
  alt?: boolean
  label?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex gap-[2px] rounded-[9px] p-[3px] ${alt ? 'bg-segment-alt' : 'bg-segment'}`}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`rounded-[7px] px-[11px] py-[5px] font-sans text-[12.5px] transition-[background,color] duration-[180ms] ${
              on ? 'bg-segment-on text-ink' : 'bg-transparent text-muted-3 hover:text-ink'
            }`}
            style={on ? { boxShadow: '0 1px 2px rgba(60,48,26,.12)' } : undefined}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Tag chip ────────────────────────────────────────────────────────────── */

export function TagChip({
  name,
  detail = false,
  onRemove,
}: {
  name: string
  /** detail cards use the larger 12.5px / 4px 10px chip */
  detail?: boolean
  onRemove?: () => void
}) {
  const hue = tagHue(name)
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-full font-sans"
      style={{
        background: hue.bg,
        color: hue.fg,
        fontSize: detail ? 12.5 : 11.5,
        padding: detail ? '4px 10px' : '3px 9px',
      }}
    >
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="opacity-45 transition-opacity duration-[160ms] hover:opacity-100"
          style={{ color: hue.fg }}
        >
          ×
        </button>
      )}
    </span>
  )
}

/* ── Toggle — track 42×25, knob 19px, translateX(17px) when on ───────────── */

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative shrink-0 rounded-full p-[3px] transition-colors duration-[180ms] ${
        on ? 'bg-ochre' : 'bg-toggle-off'
      }`}
      style={{ width: 42, height: 25 }}
    >
      <span
        className="block rounded-full bg-knob transition-transform duration-[180ms]"
        style={{
          width: 19,
          height: 19,
          transform: on ? 'translateX(17px)' : 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,.18)',
        }}
      />
    </button>
  )
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */

export function DarkButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`rounded-[10px] bg-ink px-[22px] py-[11px] font-sans text-[14.5px] font-medium text-on-dark transition-colors duration-[180ms] hover:bg-dark-hover disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

export function OutlineButton({
  children,
  className = '',
  danger = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      {...rest}
      className={`rounded-[9px] border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-medium transition-colors duration-[160ms] ${
        danger
          ? 'border-line text-danger hover:border-danger-line'
          : 'border-line text-muted hover:border-ochre-line'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** The ochre inline text link, underlined in ochre-line-soft. */
export function TextLink({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`font-sans text-[13.5px] font-medium text-ochre underline decoration-ochre-line-soft underline-offset-[3px] transition-colors duration-[160ms] hover:text-ochre-deep ${className}`}
    >
      {children}
    </button>
  )
}
