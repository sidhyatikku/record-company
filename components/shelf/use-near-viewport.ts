'use client'

import { useEffect, useRef, useState } from 'react'

type Listener = () => void

const EAGER_QUERY = '(min-width: 768px)'

const listeners = new WeakMap<Element, Listener>()
let observer: IntersectionObserver | null = null

// One observer shared by every spine; ~2,000 per-element observers would cost more than they save.
function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        listeners.get(entry.target)?.()
        listeners.delete(entry.target)
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: '300px 0px' },
  )
  return observer
}

/** On phones, becomes true (and stays true) once the element comes within ~300px of the viewport; immediately true at 768px and wider. */
export function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    // Phones lazy-load to stay inside iOS Safari's image memory budget; tablets and desktops load everything up front.
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia(EAGER_QUERY).matches) {
      setNear(true)
      return
    }
    const io = getObserver()
    listeners.set(el, () => setNear(true))
    io.observe(el)
    return () => {
      listeners.delete(el)
      io.unobserve(el)
    }
  }, [near])

  return [ref, near] as const
}
