'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wordmark } from './primitives'
import { useCounts } from '@/lib/store'

/**
 * Responsive fill-in for 02 § 7. Between 768 and 1099px the sidebar collapses to
 * a top bar; below 768px the phone layout takes over and navigation moves to a
 * bottom tab bar.
 */

const ALL = [
  { href: '/brief', label: "Today's brief", short: 'Brief' },
  { href: '/briefs', label: 'Past briefs', short: 'Briefs' },
  { href: '/library', label: 'Library', short: 'Library' },
  { href: '/ask', label: 'Ask your library', short: 'Ask' },
  { href: '/settings', label: 'Settings', short: 'Settings' },
]

const TABS = [ALL[0], ALL[2], ALL[3], ALL[4]]

function isOn(pathname: string, href: string) {
  if (href === '/library') return pathname.startsWith('/library') || pathname.startsWith('/idea')
  if (href === '/brief') return pathname === '/brief' || /^\/brief\//.test(pathname)
  return pathname.startsWith(href)
}

export function MobileNav() {
  const pathname = usePathname()
  const counts = useCounts()

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 hidden items-center gap-6 border-b border-line-sidebar bg-ground-sunk px-6 py-[14px] md:flex lg:hidden">
        <Wordmark />
        <nav className="flex min-w-0 flex-1 items-center gap-[2px] overflow-x-auto">
          {ALL.map((n) => {
            const on = isOn(pathname, n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? 'page' : undefined}
                className={`shrink-0 rounded-lg px-[11px] py-[7px] font-sans text-[13.5px] transition-colors duration-[150ms] ${
                  on ? 'bg-nav-on text-ink' : 'text-muted hover:bg-nav-hover'
                }`}
              >
                {n.short}
              </Link>
            )
          })}
        </nav>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line-sidebar bg-ground-sunk md:hidden"
      >
        {TABS.map((n) => {
          const on = isOn(pathname, n.href)
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? 'page' : undefined}
              // Hit targets never below 44pt.
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[3px] font-sans text-[11.5px] transition-colors duration-[150ms] ${
                on ? 'text-ink' : 'text-muted'
              }`}
            >
              <span className="flex items-center gap-[5px]">
                {n.short}
                {n.href === '/brief' && counts.unreadBriefs > 0 && (
                  <span className="h-[5px] w-[5px] rounded-full bg-ochre" />
                )}
              </span>
              <span
                className={`h-[2px] w-[18px] rounded-full ${on ? 'bg-ochre' : 'bg-transparent'}`}
              />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
