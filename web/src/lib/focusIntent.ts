'use client'

/**
 * `/` jumps to Library and focuses search; `g a` focuses the Ask input. Both
 * cross a route change, so the intent is parked here and claimed by whichever
 * screen mounts next. The event covers the case where that screen is already on
 * the page and will not remount.
 */

export type FocusTarget = 'search' | 'ask'

let pending: FocusTarget | null = null

export function requestFocus(target: FocusTarget) {
  pending = target
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cp:focus', { detail: target }))
  }
}

export function claimFocus(target: FocusTarget): boolean {
  if (pending !== target) return false
  pending = null
  return true
}
