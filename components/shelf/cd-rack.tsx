'use client'

import { Fragment, memo, useMemo, useState, type CSSProperties } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { JewelCase } from './cases'
import { groupBySection } from './views'

type RackProps = { albums: AlbumSummary[]; onSelect: (id: string) => void }

function paletteVars(album: AlbumSummary) {
  return {
    '--bg': album.palette.background,
    '--fg': album.palette.foreground,
    '--accent': album.palette.accent,
  } as CSSProperties
}

export function CdRack({ albums, onSelect }: RackProps) {
  const sections = useMemo(() => groupBySection(albums), [albums])

  return (
    <div className="cd-tower">
      <section className="cd-rack" aria-label="CD rack, sorted by artist then release date">
        {albums.length === 0 ? (
          <p className="flex h-[calc(var(--row)-var(--board))] w-full items-center justify-center text-lg font-bold text-[#e8c9a0]">
            No CDs match your search.
          </p>
        ) : (
          sections.map(({ letter, albums: run }) => (
            <Fragment key={letter}>
              <CdFaceOut album={run[0]} letter={letter} onSelect={onSelect} />
              {run.slice(1).map((album) => (
                <CdSpine key={album.id} album={album} onSelect={onSelect} />
              ))}
            </Fragment>
          ))
        )}
      </section>
    </div>
  )
}

const CdFaceOut = memo(function CdFaceOut({
  album,
  letter,
  onSelect,
}: {
  album: AlbumSummary
  letter: string
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      className="cd-slot cd-face-slot"
      aria-label={`Artists ${letter}: ${album.artist} — ${album.title}${album.year ? ` (${album.year})` : ''}`}
      onClick={() => onSelect(album.id)}
    >
      <span className="cd-face" aria-hidden>
        <JewelCase album={album} />
      </span>
      <span className="cd-plate" aria-hidden>
        {letter}
      </span>
    </button>
  )
})

const CdSpine = memo(function CdSpine({ album, onSelect }: { album: AlbumSummary; onSelect: (id: string) => void }) {
  const [primed, setPrimed] = useState(false)
  const [side, setSide] = useState<'left' | 'right'>('right')

  const grab = (el: HTMLElement) => {
    const { left, width } = el.getBoundingClientRect()
    setSide(left + width / 2 > window.innerWidth / 2 ? 'left' : 'right')
    setPrimed(true)
  }

  return (
    <button
      type="button"
      className="cd-slot"
      data-side={side}
      data-primed={primed || undefined}
      style={paletteVars(album)}
      aria-label={`${album.artist} — ${album.title}${album.year ? ` (${album.year})` : ''}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && grab(e.currentTarget)}
      // Hover can pass to this slot without a pointerenter when a neighbour's
      // hover bridge disappears under a still cursor, so any movement primes it.
      onPointerMove={primed ? undefined : (e) => e.pointerType === 'mouse' && grab(e.currentTarget)}
      onFocus={(e) => grab(e.currentTarget)}
      onClick={() => onSelect(album.id)}
    >
      <span className="cd-lift" aria-hidden>
        <span className="cd-turn">
          <span className="cd-spine">
            {album.artist} · {album.title}
          </span>
          {primed && (
            <span className="cd-front">
              <JewelCase album={album} eager />
            </span>
          )}
        </span>
      </span>
    </button>
  )
})
