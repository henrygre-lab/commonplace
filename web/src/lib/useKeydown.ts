'use client'

import { useEffect, useRef } from 'react'

function isField(t: EventTarget | null): t is HTMLElement {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
}

/**
 * A single window keydown listener with the input bail from 02 § 4: it stops
 * immediately when the target is an INPUT or TEXTAREA, except for Escape, which
 * blurs the field. Mirror this exactly or typing in search triggers navigation.
 */
export function useKeydown(handler: (e: KeyboardEvent) => void, enabled = true) {
  // Latest-ref, so the listener is installed once but always calls the current
  // handler. Writing the ref during render would be a render-phase side effect.
  const ref = useRef(handler)
  useEffect(() => { ref.current = handler })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (isField(e.target)) {
        if (e.key === 'Escape') e.target.blur()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      ref.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
