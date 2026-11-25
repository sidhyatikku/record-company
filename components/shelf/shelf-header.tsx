'use client'

import { Search, Shuffle } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { ViewToggle } from './view-toggle'
import { SHELF_VIEWS, type ShelfView } from './views'

type ShelfHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  shown: number
  total: number
  onShuffle: () => void
  view: ShelfView
  onViewChange: (view: ShelfView) => void
}

export function ShelfHeader({ query, onQueryChange, shown, total, onShuffle, view, onViewChange }: ShelfHeaderProps) {
  const fmt = new Intl.NumberFormat('en-US')
  const noun = SHELF_VIEWS.find((v) => v.id === view)?.noun ?? 'records'
  const headerRef = useRef<HTMLElement>(null)

  // Expose the sticky header's height so sticky section headers and anchors sit beneath it.
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const sync = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <header ref={headerRef} className="wood-bar sticky top-0 z-50">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
        <div className="mr-auto flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-baseline gap-3">
            <h1 className="engraved text-2xl font-bold tracking-tight sm:text-[28px]">{"Sid's Record Shelf"}</h1>
            <p className="engraved text-sm font-bold opacity-80">
              {shown === total ? `${fmt.format(total)} ${noun}` : `${fmt.format(shown)} of ${fmt.format(total)}`}
            </p>
          </div>
          <ViewToggle value={view} onChange={onViewChange} />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <label className="ios-search flex-1 sm:w-64 sm:flex-none">
            <Search className="size-4 shrink-0 text-[#8a8a8a]" aria-hidden />
            <span className="sr-only">Search records</span>
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search artist or album"
              autoComplete="off"
            />
          </label>
          <button type="button" className="ios-btn-wood" onClick={onShuffle}>
            <Shuffle className="size-3.5" aria-hidden />
            Shuffle
          </button>
        </div>
      </div>
    </header>
  )
}
