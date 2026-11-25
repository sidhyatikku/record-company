'use client'

import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { AlbumDialog } from './album-dialog'
import { Bookcase } from './bookcase'
import { ShelfHeader } from './shelf-header'

export function ShelfApp({ albums }: { albums: AlbumSummary[] }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query)

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return albums
    return albums.filter((a) => a.artist.toLowerCase().includes(q) || a.title.toLowerCase().includes(q))
  }, [albums, deferredQuery])

  const selected = useMemo(() => albums.find((a) => a.id === selectedId) ?? null, [albums, selectedId])

  const handleSelect = useCallback((id: string) => setSelectedId(id), [])
  const handleClose = useCallback(() => setSelectedId(null), [])
  const handleShuffle = useCallback(() => {
    const pool = filtered.length ? filtered : albums
    setSelectedId(pool[Math.floor(Math.random() * pool.length)].id)
  }, [filtered, albums])

  return (
    <div className="min-h-dvh">
      <ShelfHeader
        query={query}
        onQueryChange={setQuery}
        shown={filtered.length}
        total={albums.length}
        onShuffle={handleShuffle}
      />
      <main>
        <Bookcase albums={filtered} onSelect={handleSelect} />
      </main>
      <AlbumDialog summary={selected} onClose={handleClose} />
    </div>
  )
}
