'use client'

import { Suspense, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useStore } from '@/lib/store'
import { useKeydown } from '@/lib/useKeydown'
import { requestFocus } from '@/lib/focusIntent'

/** Toast — fixed, centred, auto-dismissing. 01 § 3.10. */
function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="cp-fade fixed bottom-[26px] left-1/2 z-[95] -translate-x-1/2 rounded-full bg-ink px-5 py-[11px] font-sans text-[13px] text-on-dark"
      style={{ boxShadow: '0 8px 24px rgba(25,23,19,.24)' }}
    >
      {toast}
    </div>
  )
}

/**
 * The `g` chord and `/`. Screen-local keys (j/k/⏎/e/f) are owned by Library and
 * Detail, which install their own listener with the same input bail.
 */
function GlobalKeys() {
  const router = useRouter()
  const pathname = usePathname()
  const gFlag = useRef(false)
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const armG = () => {
    gFlag.current = true
    if (gTimer.current) clearTimeout(gTimer.current)
    // The flag is cleared after 800ms.
    gTimer.current = setTimeout(() => { gFlag.current = false }, 800)
  }

  useKeydown((e) => {
    if (e.key === '/') {
      e.preventDefault()
      requestFocus('search')
      if (!pathname.startsWith('/library')) router.push('/library')
      return
    }

    if (gFlag.current) {
      gFlag.current = false
      const dest: Record<string, string> = {
        b: '/brief', p: '/briefs', l: '/library', a: '/ask', s: '/settings',
      }
      const to = dest[e.key]
      if (to) {
        e.preventDefault()
        if (e.key === 'a') requestFocus('ask')
        router.push(to)
      }
      return
    }

    if (e.key === 'g') { armG(); return }
  })

  return null
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<div className="hidden w-[240px] shrink-0 bg-ground-sunk lg:block" />}>
        <Sidebar />
      </Suspense>
      <main className="min-w-0 flex-1 pb-[68px] lg:pb-0">{children}</main>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
      <GlobalKeys />
      <Toast />
    </div>
  )
}
