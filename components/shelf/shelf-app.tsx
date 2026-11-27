'use client'

import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import type { SongMatch } from '@/lib/albums'
import { track } from '@/lib/analytics'
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
/** Report a search once typing pauses, not on every keystroke. */
const SEARCH_SETTLE_MS = 1000

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
  const previous = useMemo(() => {
    if (!selectedId || pool.length < 2) return null
    const index = pool.findIndex((a) => a.id === selectedId)
    return pool[(index - 1 + pool.length) % pool.length]
  }, [pool, selectedId])

  const [shuffle, setShuffle] = useState(false)
  const [shuffleNextId, setShuffleNextId] = useState<string | null>(null)
  const shuffleNext = useMemo(() => albums.find((a) => a.id === shuffleNextId) ?? null, [albums, shuffleNextId])
  const rollShuffleNext = useCallback(
    (excludeId: string | null) => {
      const candidates = pool.length > 1 ? pool.filter((a) => a.id !== excludeId) : pool
      setShuffleNextId(candidates[Math.floor(Math.random() * candidates.length)]?.id ?? null)
    },
    [pool],
  )
  const queuedNext = shuffle ? shuffleNext : upNext

  useEffect(() => {
    if (!songQuery) return
    const timer = setTimeout(() => {
      track('search', { search_term: songQuery, results: filtered.length, view })
    }, SEARCH_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [songQuery, filtered.length, view])

  // Read by the stable select handler, so the 1,970 memoized spines don't re-render on every keystroke.
  const eventContext = useRef({ view, songQuery })
  useLayoutEffect(() => {
    eventContext.current = { view, songQuery }
  })

  const albumParams = useCallback(
    (album: AlbumSummary) => ({
      album_id: album.id,
      album_title: album.title,
      artist: album.artist,
      view: eventContext.current.view,
    }),
    [],
  )

  const openAlbum = useCallback(
    (album: AlbumSummary, source: 'shelf' | 'search_result' | 'shuffle' | 'previous_arrow' | 'next_arrow') => {
      const search = eventContext.current.songQuery
      track('album_open', { ...albumParams(album), source, search_term: search || undefined })
      skipStreak.current = 0
      setAutoStartId(null)
      setSelectedId(album.id)
      if (shuffle) rollShuffleNext(album.id)
    },
    [albumParams, shuffle, rollShuffleNext],
  )
  const handleSelect = useCallback(
    (id: string) => {
      const album = albums.find((a) => a.id === id)
      if (album) openAlbum(album, eventContext.current.songQuery ? 'search_result' : 'shelf')
    },
    [albums, openAlbum],
  )
  const handleClose = useCallback(() => {
    if (selected) track('album_close', albumParams(selected))
    skipStreak.current = 0
    setAutoStartId(null)
    setSelectedId(null)
  }, [selected, albumParams])
  const handleShuffle = useCallback(() => {
    openAlbum(pool[Math.floor(Math.random() * pool.length)], 'shuffle')
  }, [pool, openAlbum])
  const handlePrevious = useCallback(() => {
    if (previous) openAlbum(previous, 'previous_arrow')
  }, [previous, openAlbum])
  const handleNext = useCallback(() => {
    if (upNext) openAlbum(upNext, 'next_arrow')
  }, [upNext, openAlbum])
  const handleToggleAutoplay = useCallback(() => {
    track('autoplay_toggle', { enabled: !autoplay, ...(selected ? albumParams(selected) : {}) })
    setAutoplay(!autoplay)
  }, [autoplay, selected, albumParams])
  const handleToggleShuffle = useCallback(() => {
    if (!shuffle) rollShuffleNext(selectedId)
    setShuffle(!shuffle)
  }, [shuffle, selectedId, rollShuffleNext])
  const handleAlbumEnd = useCallback(
    (played: boolean) => {
      skipStreak.current = played ? 0 : skipStreak.current + 1
      if (!queuedNext || skipStreak.current > MAX_SILENT_SKIPS) {
        track('autoplay_stopped', {
          reason: queuedNext ? 'too_many_unplayable_albums' : 'end_of_shelf',
          last_album_id: selectedId,
        })
        setAutoStartId(null)
        return
      }
      track('autoplay_next_album', {
        ...albumParams(queuedNext),
        from_album_id: selectedId,
        previous_album_played: played,
        shuffle,
      })
      track('album_open', { ...albumParams(queuedNext), source: shuffle ? 'shuffle_play' : 'autoplay' })
      setSelectedId(queuedNext.id)
      setAutoStartId(queuedNext.id)
      if (shuffle) rollShuffleNext(queuedNext.id)
    },
    [queuedNext, shuffle, selectedId, albumParams, rollShuffleNext],
  )
  const handleViewChange = useCallback(
    (next: ShelfView) => {
      if (next !== view) track('view_change', { view: next, previous_view: view })
      setView(next)
      window.scrollTo({ top: 0 })
    },
    [view],
  )

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
        previous={previous}
        next={upNext}
        onPrevious={handlePrevious}
        onNext={handleNext}
        autoplay={autoplay}
        autoStart={selected != null && selected.id === autoStartId}
        upNext={shuffle ? shuffleNext : autoplay ? upNext : null}
        shuffle={shuffle}
        onToggleShuffle={handleToggleShuffle}
        onToggleAutoplay={handleToggleAutoplay}
        onAlbumEnd={handleAlbumEnd}
      />
    </div>
  )
}
