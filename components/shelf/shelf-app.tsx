'use client'

import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { AlbumDialog } from './album-dialog'
import { Bookcase } from './bookcase'
import { CassetteRack } from './cassette-rack'
import { CdRack } from './cd-rack'
import { DigitalGallery } from './digital-gallery'
import { ShelfHeader } from './shelf-header'
import type { ShelfView } from './views'

export function ShelfApp({ albums }: { albums: AlbumSummary[] }) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ShelfView>('vinyl')
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
  const handleViewChange = useCallback((next: ShelfView) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="min-h-dvh">
      <ShelfHeader
        query={query}
        onQueryChange={setQuery}
        shown={filtered.length}
        total={albums.length}
        onShuffle={handleShuffle}
        view={view}
        onViewChange={handleViewChange}
      />
      <main>
        {view === 'vinyl' && <Bookcase albums={filtered} onSelect={handleSelect} />}
        {view === 'cassette' && <CassetteRack albums={filtered} onSelect={handleSelect} />}
        {view === 'cd' && <CdRack albums={filtered} onSelect={handleSelect} />}
        {view === 'digital' && <DigitalGallery albums={filtered} onSelect={handleSelect} />}
      </main>
      <AlbumDialog summary={selected} view={view} onClose={handleClose} />
    </div>
  )
}
