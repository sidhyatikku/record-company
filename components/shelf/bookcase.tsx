import { Fragment } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { RecordSpine } from './record-spine'
import { SectionDivider } from './section-divider'

type BookcaseProps = {
  albums: AlbumSummary[]
  onSelect: (id: string) => void
}

const TAB_SPACE = 32

export function Bookcase({ albums, onSelect }: BookcaseProps) {
  const sectionWidths = new Map<string, number>()
  for (const album of albums) {
    sectionWidths.set(album.section, (sectionWidths.get(album.section) ?? 0) + album.spineWidth)
  }

  return (
    <div className="bookcase-frame">
      <section className="bookcase" aria-label="Record shelf, sorted by artist then release date">
        {albums.length === 0 ? (
          <p className="engraved flex h-[calc(var(--row)-var(--board))] w-full items-center justify-center text-lg font-bold">
            No records match your search.
          </p>
        ) : (
          albums.map((album, i) => (
            <Fragment key={album.id}>
              {album.section !== albums[i - 1]?.section && <SectionDivider letter={album.section} />}
              <RecordSpine album={album} onSelect={onSelect} />
              {album.section !== albums[i + 1]?.section && (
                <span
                  aria-hidden
                  className="flex-none"
                  style={{ width: Math.max(0, TAB_SPACE - (sectionWidths.get(album.section) ?? 0)) }}
                />
              )}
            </Fragment>
          ))
        )}
      </section>
    </div>
  )
}
