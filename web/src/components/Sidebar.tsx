'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Avatar, Eyebrow, Wordmark } from './primitives'
import { useCounts } from '@/lib/store'
import { tagHue } from '@/lib/tags'

const NAV = [
  { key: 'brief', href: '/brief', label: "Today's brief" },
  { key: 'briefs', href: '/briefs', label: 'Past briefs' },
  { key: 'library', href: '/library', label: 'Library' },
  { key: 'ask', href: '/ask', label: 'Ask your library' },
  { key: 'settings', href: '/settings', label: 'Settings' },
] as const

/** Detail counts as Library for nav highlighting (02 § 1, derived `effScreen`). */
function screenOf(pathname: string): string {
  if (pathname.startsWith('/idea')) return 'library'
  if (pathname.startsWith('/library')) return 'library'
  if (pathname.startsWith('/briefs')) return 'briefs'
  if (pathname.startsWith('/brief')) return 'brief'
  if (pathname.startsWith('/ask')) return 'ask'
  if (pathname.startsWith('/settings')) return 'settings'
  return ''
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const counts = useCounts()
  const params = useSearchParams()
  const active = screenOf(pathname)
  const activeTag = active === 'library' ? params.get('tag') : null

  const navCount: Record<string, number | null> = {
    brief: null,
    briefs: counts.briefs,
    library: counts.ideas,
    ask: null,
    settings: null,
  }

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-line-sidebar bg-ground-sunk px-[18px] py-[30px] lg:flex"
      aria-label="Primary"
    >
      <Wordmark className="mb-8 px-[10px]" />

      <div className="-mx-[18px] flex-1 overflow-y-auto px-[18px]">
        <nav className="flex flex-col gap-[2px]">
          {NAV.map((n) => {
            const on = active === n.key
            const count = navCount[n.key]
            return (
              <Link
                key={n.key}
                href={n.href}
                className={`flex items-center justify-between rounded-lg px-[11px] py-[9px] font-sans text-[14px] transition-colors duration-[150ms] ${
                  on ? 'bg-nav-on text-ink' : 'bg-transparent text-muted hover:bg-nav-hover'
                }`}
                aria-current={on ? 'page' : undefined}
              >
                <span className="flex items-center gap-[7px]">
                  {n.label}
                  {n.key === 'brief' && counts.unreadBriefs > 0 && (
                    <span
                      className="h-[6px] w-[6px] rounded-full bg-ochre"
                      aria-label="Unread brief"
                    />
                  )}
                </span>
                {count !== null && (
                  <span className="font-sans text-[12px] text-fainter">{count}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-[34px]">
          <Eyebrow className="px-[11px] text-fainter">Tags</Eyebrow>
          <div className="mt-[10px] flex flex-col">
            {counts.tags.map((t) => {
              const on = activeTag === t.name
              return (
                <button
                  key={t.name}
                  // Clicking an active tag clears it — toggle, not radio (02 § 5).
                  onClick={() =>
                    router.push(on ? '/library' : `/library?tag=${encodeURIComponent(t.name)}`)
                  }
                  className="flex items-center gap-[9px] px-[11px] py-[6px] text-left font-sans text-[13.5px] transition-colors duration-[150ms]"
                  style={{ color: on ? '#A2731F' : '#5C554A' }}
                >
                  <span
                    className="h-[5px] w-[5px] shrink-0 rounded-full"
                    style={{ background: tagHue(t.name).fg }}
                  />
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <span className="font-sans text-[12px] text-faintest">{t.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-line-sidebar pt-[18px]">
        <div className="flex items-center gap-[10px] px-[10px]">
          <Avatar initials="SR" size={30} large />
          <div className="min-w-0">
            <div className="truncate font-sans text-[13px] font-medium text-ink">Sam Rieber</div>
            <div className="truncate font-sans text-[11.5px] text-faint">@samrieber</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
