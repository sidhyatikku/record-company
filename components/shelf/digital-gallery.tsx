'use client'

import { Play } from 'lucide-react'
import { memo, useMemo } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { AlbumCover } from './album-cover'
import { groupBySection, sectionAnchor } from './views'

type GalleryProps = { albums: AlbumSummary[]; onSelect: (id: string) => void }

export function DigitalGallery({ albums, onSelect }: GalleryProps) {
  const sections = useMemo(() => groupBySection(albums), [albums])

  return (
    <div className="digital-shell">
      {sections.length > 1 && (
        <nav className="az-index" aria-label="Jump to artists by letter">
          {sections.map(({ letter }) => (
            <a key={letter} href={`#${sectionAnchor(letter)}`}>
              {letter}
            </a>
          ))}
        </nav>
      )}

      {albums.length === 0 ? (
        <p className="py-24 text-center text-lg font-bold text-[#c9ced4]">No albums match your search.</p>
      ) : (
        sections.map(({ letter, albums: run }) => (
          <section
            key={letter}
            id={sectionAnchor(letter)}
            className="digital-section"
            aria-labelledby={`${sectionAnchor(letter)}-h`}
          >
            <h2 id={`${sectionAnchor(letter)}-h`} className="ios-section-header">
              {letter}
            </h2>
            <ul className="digital-grid">
              {run.map((album) => (
                <li key={album.id}>
                  <DigitalTile album={album} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

const DigitalTile = memo(function DigitalTile({
  album,
  onSelect,
}: {
  album: AlbumSummary
  onSelect: (id: string) => void
}) {
  return (
    <button type="button" className="digital-tile" onClick={() => onSelect(album.id)}>
      <span className="digital-art" aria-hidden>
        <AlbumCover
          title={album.title}
          artist={album.artist}
          cover={album.cover}
          palette={album.palette}
          className="size-full"
        />
        <span className="digital-play">
          <Play className="size-5 translate-x-px fill-current" />
        </span>
      </span>
      <span className="digital-title">{album.title}</span>
      <span className="digital-artist">
        {album.artist}
        {album.year ? ` · ${album.year}` : ''}
      </span>
    </button>
  )
})
