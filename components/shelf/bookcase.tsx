import type { AlbumSummary } from '@/lib/types'
import { RecordSpine } from './record-spine'

type BookcaseProps = {
  albums: AlbumSummary[]
  onSelect: (id: string) => void
}

export function Bookcase({ albums, onSelect }: BookcaseProps) {
  return (
    <div className="bookcase-frame">
      <section className="bookcase" aria-label="Record shelf">
        {albums.length === 0 ? (
          <p className="engraved flex h-[calc(var(--row)-var(--board))] w-full items-center justify-center text-lg font-bold">
            No records match your search.
          </p>
        ) : (
          albums.map((album) => <RecordSpine key={album.id} album={album} onSelect={onSelect} />)
        )}
      </section>
    </div>
  )
}
