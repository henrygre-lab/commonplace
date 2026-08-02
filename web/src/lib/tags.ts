import type { Bookmark } from './types'

/**
 * Tag palette — semantic, 5 families (01-design-spec.md § 1.1).
 * A tag's colour comes from its family, not from a hash.
 */
export type TagHue = { bg: string; fg: string }

const FAMILY: Record<string, number> = {
  Business: 0, Pricing: 0, Distribution: 0, Hiring: 0,
  Health: 1, Sleep: 1,
  Psychology: 2, Decisions: 2, Self: 2,
  Writing: 3, Career: 3, Tools: 3, Attention: 3,
  Philosophy: 4, Leverage: 4,
}

const PALETTE: TagHue[] = [
  { bg: '#F1E7D3', fg: '#7C5710' }, // Commerce
  { bg: '#E4EADA', fg: '#4E6137' }, // Body
  { bg: '#E1E7ED', fg: '#456079' }, // Mind
  { bg: '#F2E4DD', fg: '#8A5441' }, // Craft
  { bg: '#EAE3EC', fg: '#6A5171' }, // Meaning
]

/** Any user-added tag outside the fixed taxonomy. */
const FALLBACK: TagHue = { bg: '#EFE9DA', fg: '#6E6555' }

export function tagHue(name: string): TagHue {
  const i = FAMILY[name]
  return i === undefined ? FALLBACK : PALETTE[i]
}

/** The fixed taxonomy the extract prompt draws from (03-react-web-app.md § 4.1). */
export const TAXONOMY = Object.keys(FAMILY)

const THEME_NAMES = [
  'Business & pricing',
  'Health',
  'Psychology & decisions',
  'Craft & career',
  'Philosophy & leverage',
]

export const EVERYTHING_ELSE = 'Everything else'

/** Library → Group by Theme. Maps from the same five families. */
export function themeOf(item: Bookmark): string {
  for (const t of item.tags) {
    if (FAMILY[t] !== undefined) return THEME_NAMES[FAMILY[t]]
  }
  return EVERYTHING_ELSE
}

const MONTHS: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
}

/** Date groups read as "July 2026". */
export function monthGroup(date: string): string {
  return `${MONTHS[date.split(' ')[1]] ?? ''} 2026`
}

/** Disagreement is visually distinct from agreement (01-design-spec.md § 2). */
export function reasonColour(reason: string): string {
  return reason.toLowerCase().includes('opposite') ? '#8A5441' : '#A2731F'
}
