'use client'

import { memo, useMemo, useState, type CSSProperties } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { AlbumCover } from './album-cover'
import { groupBySection } from './views'
import { useTouchArm } from './use-touch-arm'

const TAPES_PER_COLUMN = 24

type RackProps = { albums: AlbumSummary[]; onSelect: (id: string) => void }

export function CassetteRack({ albums, onSelect }: RackProps) {
  const columns = useMemo(() => {
    return groupBySection(albums).flatMap(({ letter, albums: run }) => {
      const parts = Math.ceil(run.length / TAPES_PER_COLUMN)
      return Array.from({ length: parts }, (_, i) => ({
        key: `${letter}-${i}`,
        letter,
        part: i + 1,
        parts,
        albums: run.slice(i * TAPES_PER_COLUMN, (i + 1) * TAPES_PER_COLUMN),
      }))
    })
  }, [albums])

  return (
    <div className="cassette-wall">
      <section className="cassette-cabinet" aria-label="Cassette rack, sorted by artist then release date">
        {albums.length === 0 ? (
          <p className="engraved col-span-full py-24 text-center text-lg font-bold">No tapes match your search.</p>
        ) : (
          columns.map((col) => (
            <div
              key={col.key}
              className="cassette-cubby"
              role="group"
              aria-label={`Artists: ${col.letter}${col.parts > 1 ? `, part ${col.part} of ${col.parts}` : ''}`}
            >
              <span className="dymo" aria-hidden>
                {col.letter}
                {col.parts > 1 && <span className="opacity-60">{` ${col.part}/${col.parts}`}</span>}
              </span>
              {col.albums.map((album) => (
                <CassetteTape key={album.id} album={album} onSelect={onSelect} />
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  )
}

const CassetteTape = memo(function CassetteTape({
  album,
  onSelect,
}: {
  album: AlbumSummary
  onSelect: (id: string) => void
}) {
  const [primed, setPrimed] = useState(false)
  const { armed, onPointerDown, shouldOpen } = useTouchArm(album.id, () => setPrimed(true))
  const style = {
    '--bg': album.palette.background,
    '--fg': album.palette.foreground,
    '--accent': album.palette.accent,
  } as CSSProperties

  return (
    <button
      type="button"
      className="tape"
      style={style}
      aria-label={`${album.artist} — ${album.title}${album.year ? ` (${album.year})` : ''}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPrimed(true)}
      onFocus={() => setPrimed(true)}
      data-armed={armed ? '' : undefined}
      onPointerDown={onPointerDown}
      onClick={(e) => shouldOpen(e) && onSelect(album.id)}
    >
      <span className="tape-grab" aria-hidden>
        <span className="tape-tilt">
          <span className="tape-spine">
            <span className="tape-card">
              <span className="tape-stripe" />
              <span className="tape-artist">{album.artist}</span>
              <span className="tape-title">{album.title}</span>
              {album.year && <span className="tape-year">{album.year}</span>}
            </span>
          </span>
          {primed && (
            <span className="tape-face">
              <span className="tape-face-card">
                <span className="tape-face-art">
                  <AlbumCover
                    title={album.title}
                    artist={album.artist}
                    cover={album.cover}
                    palette={album.palette}
                    className="size-full"
                    eager
                  />
                </span>
                <span className="tape-face-text">
                  <span className="tape-face-artist">{album.artist}</span>
                  <span className="tape-face-title">{album.title}</span>
                  <span className="tape-face-meta">Stereo · Type II{album.year ? ` · ${album.year}` : ''}</span>
                </span>
              </span>
              <span className="case-glare" />
            </span>
          )}
        </span>
      </span>
    </button>
  )
})
