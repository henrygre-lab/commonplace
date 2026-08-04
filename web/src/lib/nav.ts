/**
 * The five destinations, and which one a path belongs to.
 *
 * The sidebar and the mobile nav both need this, and both need the same
 * non-obvious rule: **detail counts as Library** for highlighting (02 § 1,
 * derived `effScreen`). Encoding it twice is how the two navs drift apart.
 */

export type NavKey = 'brief' | 'briefs' | 'library' | 'ask' | 'settings'

export type NavItem = {
  key: NavKey
  href: string
  /** Sidebar label. */
  label: string
  /** Tab-bar label, where there is no room for the long form. */
  short: string
}

export const NAV: NavItem[] = [
  { key: 'brief', href: '/brief', label: "Today's brief", short: 'Brief' },
  { key: 'briefs', href: '/briefs', label: 'Past briefs', short: 'Briefs' },
  { key: 'library', href: '/library', label: 'Library', short: 'Library' },
  { key: 'ask', href: '/ask', label: 'Ask your library', short: 'Ask' },
  { key: 'settings', href: '/settings', label: 'Settings', short: 'Settings' },
]

/** Which nav item a pathname should highlight, or null for none. */
export function navKeyFor(pathname: string): NavKey | null {
  // Order matters: /briefs must be tested before /brief, and an idea page
  // highlights Library rather than nothing.
  if (pathname.startsWith('/idea') || pathname.startsWith('/library')) return 'library'
  if (pathname.startsWith('/briefs')) return 'briefs'
  if (pathname.startsWith('/brief')) return 'brief'
  if (pathname.startsWith('/ask')) return 'ask'
  if (pathname.startsWith('/settings')) return 'settings'
  return null
}
