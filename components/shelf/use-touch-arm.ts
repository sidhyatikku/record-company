'use client'

import { useRef, useSyncExternalStore, type MouseEvent, type PointerEvent } from 'react'

// One shared "armed" item across every shelf, so a touch tap previews a single album at a time.
let armedId: string | null = null
const listeners = new Set<() => void>()
let outsideTapBound = false

function setArmed(id: string | null) {
  if (armedId === id) return
  armedId = id
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!outsideTapBound) {
    outsideTapBound = true
    // Capture phase runs before the item's own onClick, so tapping another item re-arms it there.
    document.addEventListener(
      'click',
      (e) => {
        if (!(e.target instanceof Element) || !e.target.closest('[data-armed]')) setArmed(null)
      },
      true,
    )
  }
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Touch screens have no hover, so the first tap shows the hover preview and a
 * second tap on the same item opens it. Mouse and keyboard clicks open immediately.
 */
export function useTouchArm(id: string, onArm?: (el: HTMLElement) => void) {
  const armed = useSyncExternalStore(
    subscribe,
    () => armedId === id,
    () => false,
  )
  const lastPointer = useRef('')

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    lastPointer.current = e.pointerType
  }

  const shouldOpen = (e: MouseEvent<HTMLElement>) => {
    const isTouch = lastPointer.current === 'touch' || lastPointer.current === 'pen'
    lastPointer.current = ''
    if (!isTouch || armed) {
      setArmed(null)
      return true
    }
    onArm?.(e.currentTarget)
    setArmed(id)
    return false
  }

  return { armed, onPointerDown, shouldOpen }
}
