'use client'

import { memo, useState, type CSSProperties } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { AlbumCover } from './album-cover'
import { useNearViewport } from './use-near-viewport'

type RecordSpineProps = {
  album: AlbumSummary
  onSelect: (id: string) => void
}

export const RecordSpine = memo(function RecordSpine({ album, onSelect }: RecordSpineProps) {
  // Mount the cover face lazily on first hover/focus so 1,973 sleeves don't all render artwork up front.
  const [primed, setPrimed] = useState(false)
  // Spine artwork is a full cover image; only fetch it once the spine nears the viewport.
  const [spineRef, near] = useNearViewport<HTMLButtonElement>()

  const grab = (el: HTMLElement) => {
    setPrimed(true)
    const bounds = el.closest('.bookcase')?.getBoundingClientRect()
    const sleeve = el.querySelector<HTMLElement>('.record-lift')
    if (!bounds || !sleeve) return
    const { right } = el.getBoundingClientRect()
    // The turned sleeve shows ~its full height in width to the right of the spine (plus perspective growth).
    const reach = right + sleeve.offsetHeight * 1.02 + 14
    el.style.setProperty('--nudge', `${Math.max(0, Math.round(reach - bounds.right))}px`)
  }

  const style = {
    '--w': `${album.spineWidth}px`,
    '--hr': album.heightRatio,
    '--bg': album.palette.background,
    '--fg': album.palette.foreground,
    '--accent': album.palette.accent,
  } as CSSProperties

  return (
    <button
      ref={spineRef}
      type="button"
      className="record"
      style={style}
      data-cover={album.cover ? '' : undefined}
      data-primed={primed ? '' : undefined}
      aria-label={`${album.artist} — ${album.title}${album.year ? ` (${album.year})` : ''}`}
      title={`${album.artist} — ${album.title}`}
      onPointerEnter={(e) => grab(e.currentTarget)}
      onFocus={(e) => grab(e.currentTarget)}
      onClick={() => onSelect(album.id)}
    >
      <span className="record-lift" aria-hidden>
        <span className="record-body">
          <span
            className="record-spine"
            style={
              album.cover && near
                ? { backgroundImage: `url("${album.cover}")`, backgroundPosition: '8% center', backgroundSize: 'auto 100%' }
                : undefined
            }
          />

          {primed && (
            <span className="record-cover">
              <AlbumCover
                title={album.title}
                artist={album.artist}
                cover={album.cover}
                palette={album.palette}
                className="size-full"
                eager
              />
            </span>
          )}
        </span>
      </span>
    </button>
  )
})
