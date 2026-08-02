'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { SEED_BOOKMARKS, SEED_BRIEFS } from './seed'
import type { Bookmark, Brief, Settings } from './types'

/**
 * Server state (bookmarks, briefs, settings) lives here for now, seeded from the
 * written content. The shape is deliberately repository-like so Phase 1's
 * Postgres/Drizzle reads can replace the seed without the screens changing —
 * see lib/repo.ts.
 *
 * The single most important structural rule (02 § 1): briefs, connections and
 * Ask answers all reference bookmarks BY ID and hydrate at render. Nothing is
 * denormalised, so a change anywhere propagates everywhere.
 */

type Store = {
  items: Bookmark[]
  briefs: Brief[]
  briefsRead: Record<number, boolean>
  settings: Settings
  toast: string | null

  patchItem: (id: number, patch: Partial<Bookmark>) => void
  toggleReviewed: (id: number) => void
  toggleCore: (id: number) => void
  toggleBriefRead: (no: number) => void
  setSettings: (patch: Partial<Settings>) => void
  flash: (msg: string) => void

  byId: (id: number) => Bookmark | undefined
  hydrate: (ids: number[]) => Bookmark[]
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Bookmark[]>(() =>
    SEED_BOOKMARKS.map((b) => ({ ...b, tags: [...b.tags] })),
  )
  const [briefsRead, setBriefsRead] = useState<Record<number, boolean>>({
    141: true, 140: true, 139: true, 138: true,
  })
  const [settings, setSettingsState] = useState<Settings>({
    time: '07:00', freq: 'Daily', email: true, push: false, spaced: true,
  })
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The toast auto-dismisses after 1900ms (01 § 3.10).
  const flash = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const patchItem = useCallback((id: number, patch: Partial<Bookmark>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }, [])

  // Toasts are raised outside the state updaters — React may invoke an updater
  // more than once, and a doubled toast is a visible bug.
  const toggleReviewed = useCallback((id: number) => {
    setItems((prev) => {
      const cur = prev.find((x) => x.id === id)
      if (!cur) return prev
      flash(cur.reviewed ? 'Moved back to unreviewed' : 'Marked reviewed')
      return prev.map((x) => (x.id === id ? { ...x, reviewed: !x.reviewed } : x))
    })
  }, [flash])

  const toggleCore = useCallback((id: number) => {
    setItems((prev) => {
      const cur = prev.find((x) => x.id === id)
      if (!cur) return prev
      flash(cur.core ? 'Removed from core' : 'Added to core — resurfaces more often')
      return prev.map((x) => (x.id === id ? { ...x, core: !x.core } : x))
    })
  }, [flash])

  const toggleBriefRead = useCallback((no: number) => {
    setBriefsRead((prev) => {
      // Toasts only when marking read, not when unmarking (02 § 5).
      if (!prev[no]) flash(`Brief marked read · next one at ${settings.time}`)
      return { ...prev, [no]: !prev[no] }
    })
  }, [flash, settings.time])

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }))
  }, [])

  const byId = useCallback((id: number) => items.find((x) => x.id === id), [items])
  const hydrate = useCallback(
    (ids: number[]) => ids.map((id) => items.find((x) => x.id === id)).filter(Boolean) as Bookmark[],
    [items],
  )

  const value = useMemo<Store>(
    () => ({
      items, briefs: SEED_BRIEFS, briefsRead, settings, toast,
      patchItem, toggleReviewed, toggleCore, toggleBriefRead, setSettings, flash,
      byId, hydrate,
    }),
    [items, briefsRead, settings, toast, patchItem, toggleReviewed, toggleCore,
     toggleBriefRead, setSettings, flash, byId, hydrate],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}

/**
 * Real counts, not the prototype's theatre (02 § 2). Every number the sidebar,
 * library subhead and settings show is derived from the corpus.
 */
export function useCounts() {
  const { items, briefs, briefsRead } = useStore()
  return useMemo(() => {
    const tagCounts: Record<string, number> = {}
    for (const it of items) for (const t of it.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1
    return {
      ideas: items.length,
      unreviewed: items.filter((i) => !i.reviewed).length,
      briefs: briefs.length,
      unreadBriefs: briefs.filter((b) => !briefsRead[b.no]).length,
      tags: Object.keys(tagCounts).sort().map((name) => ({ name, count: tagCounts[name] })),
    }
  }, [items, briefs, briefsRead])
}
