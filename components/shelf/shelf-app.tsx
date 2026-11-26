'use client'

import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import type { SongMatch } from '@/lib/albums'
import type { AlbumSummary } from '@/lib/types'
import { AlbumDialog } from './album-dialog'
import { Bookcase } from './bookcase'
import { CassetteRack } from './cassette-rack'
import { CdRack } from './cd-rack'
import { DigitalGallery } from './digital-gallery'
import { ShelfHeader } from './shelf-header'
import type { ShelfView } from './views'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** Autoplay stops after this many albums in a row with no playable preview, so it never spins through the shelf silently. */
const MAX_SILENT_SKIPS = 10

export function ShelfApp({ albums }: { albums: AlbumSummary[] }) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ShelfView>('vinyl')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [autoplay, setAutoplay] = useState(true)
  const [autoStartId, setAutoStartId] = useState<string | null>(null)
  const skipStreak = useRef(0)
  const deferredQuery = useDeferredValue(query)

  const songQuery = deferredQuery.trim().toLowerCase()
  const { data: songResults, isLoading: searchingSongs } = useSWR<{ matches: SongMatch[] }>(
    songQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(songQuery)}` : null,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const filtered = useMemo(() => {
    const q = songQuery
    if (!q) return albums
    const songIds = new Set(q.length >= 2 ? (songResults?.matches ?? []).map((m) => m.id) : [])
    return albums.filter(
      (a) => a.artist.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || songIds.has(a.id),
    )
  }, [albums, songQuery, songResults])

  const selected = useMemo(() => albums.find((a) => a.id === selectedId) ?? null, [albums, selectedId])

  const pool = filtered.length ? filtered : albums
  const upNext = useMemo(() => {
    if (!selectedId || pool.length < 2) return null
    const index = pool.findIndex((a) => a.id === selectedId)
    return pool[(index + 1) % pool.length]
  }, [pool, selectedId])

  const openAlbum = useCallback((id: string | null) => {
    skipStreak.current = 0
    setAutoStartId(null)
    setSelectedId(id)
  }, [])
  const handleSelect = useCallback((id: string) => openAlbum(id), [openAlbum])
  const handleClose = useCallback(() => openAlbum(null), [openAlbum])
  const handleShuffle = useCallback(() => {
    openAlbum(pool[Math.floor(Math.random() * pool.length)].id)
  }, [pool, openAlbum])
  const handleToggleAutoplay = useCallback(() => setAutoplay((on) => !on), [])
  const handleAlbumEnd = useCallback(
    (played: boolean) => {
      skipStreak.current = played ? 0 : skipStreak.current + 1
      if (!upNext || skipStreak.current > MAX_SILENT_SKIPS) {
        setAutoStartId(null)
        return
      }
      setSelectedId(upNext.id)
      setAutoStartId(upNext.id)
    },
    [upNext],
  )
  const handleViewChange = useCallback((next: ShelfView) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="min-h-dvh">
      <ShelfHeader
        query={query}
        onQueryChange={setQuery}
        searching={searchingSongs}
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
      <AlbumDialog
        summary={selected}
        view={view}
        onClose={handleClose}
        autoplay={autoplay}
        autoStart={selected != null && selected.id === autoStartId}
        upNext={autoplay ? upNext : null}
        onToggleAutoplay={handleToggleAutoplay}
        onAlbumEnd={handleAlbumEnd}
      />
    </div>
  )
}
