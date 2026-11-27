'use client'

import { createRef, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Album, AlbumSummary } from '@/lib/types'
import { AlbumDetails } from './album-details'
import { PlayerControls } from './player-controls'
import { buildPlayableTracks, useAlbumPlayer, type DeezerAlbumPreviews, type SharedAudio } from './use-album-player'
import { FormatStage } from './format-stage'
import type { ShelfView } from './views'

const fetcher = async (url: string): Promise<Album> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed with ${res.status}`)
  return res.json()
}

const previewFetcher = async (url: string): Promise<DeezerAlbumPreviews> => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return { albumId: null, tracks: [] }
  return res.json()
}

function deezerLookupUrl(album: Album) {
  const params = new URLSearchParams({ artist: album.artist, title: album.title })
  const id = album.links.deezer?.match(/album\/(\d+)/)?.[1]
  if (id) params.set('id', id)
  return `/api/deezer/album?${params}`
}

type AutoplayProps = {
  autoplay: boolean
  autoStart: boolean
  upNext: AlbumSummary | null
  shuffle: boolean
  onToggleShuffle: () => void
  onToggleAutoplay: () => void
  onAlbumEnd: (played: boolean) => void
}

type NavProps = {
  previous: AlbumSummary | null
  next: AlbumSummary | null
  onPrevious: () => void
  onNext: () => void
}

type AlbumDialogProps = AutoplayProps &
  NavProps & {
    summary: AlbumSummary | null
    view: ShelfView
    onClose: () => void
  }

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true
  return target.tagName === 'INPUT' || target.getAttribute('role') === 'slider'
}

export function AlbumDialog({ summary, view, onClose, previous, next, onPrevious, onNext, ...autoplay }: AlbumDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [audio] = useState<SharedAudio>(() => ({ ref: createRef<HTMLAudioElement>(), handlers: { current: {} } }))
  const on = audio.handlers

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (summary && !dialog.open) dialog.showModal()
    if (!summary && dialog.open) dialog.close()
  }, [summary])

  return (
    <dialog
      ref={dialogRef}
      className="album-dialog"
      aria-labelledby="album-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      onKeyDown={(e) => {
        if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return
        if (e.key === 'ArrowLeft' && previous) {
          e.preventDefault()
          onPrevious()
        } else if (e.key === 'ArrowRight' && next) {
          e.preventDefault()
          onNext()
        }
      }}
    >
      <audio
        ref={audio.ref}
        preload="none"
        onPlay={(e) => on.current.onPlay?.(e)}
        onPause={(e) => on.current.onPause?.(e)}
        onPlaying={(e) => on.current.onPlaying?.(e)}
        onWaiting={(e) => on.current.onWaiting?.(e)}
        onTimeUpdate={(e) => on.current.onTimeUpdate?.(e)}
        onDurationChange={(e) => on.current.onDurationChange?.(e)}
        onEnded={(e) => on.current.onEnded?.(e)}
        onError={(e) => on.current.onError?.(e)}
      />
      {summary && (
        <AlbumDialogBody
          key={summary.id}
          summary={summary}
          view={view}
          onClose={onClose}
          audio={audio}
          nav={{ previous, next, onPrevious, onNext }}
          {...autoplay}
        />
      )}
    </dialog>
  )
}

function AlbumDialogBody({
  summary,
  view,
  onClose,
  audio,
  nav,
  autoplay,
  autoStart,
  upNext,
  shuffle,
  onToggleShuffle,
  onToggleAutoplay,
  onAlbumEnd,
}: AutoplayProps & {
  summary: AlbumSummary
  view: ShelfView
  onClose: () => void
  audio: SharedAudio
  nav: NavProps
}) {
  const { data, error, isLoading } = useSWR<Album>(`/api/albums/${summary.id}`, fetcher, {
    revalidateOnFocus: false,
  })
  const deezerKey = data?.tracklist ? deezerLookupUrl(data) : null
  const { data: previews, isLoading: previewsLoading, mutate: refreshPreviews } = useSWR<DeezerAlbumPreviews>(
    deezerKey,
    previewFetcher,
    { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 5 * 60 * 1000 },
  )
  const tracks = useMemo(() => buildPlayableTracks(data, previews), [data, previews])
  const played = useRef(false)
  const previewsReady = Boolean(data) && !previewsLoading
  const player = useAlbumPlayer(tracks, audio, {
    refreshSrc: async (index) => {
      const fresh = await refreshPreviews()
      return buildPlayableTracks(data, fresh)[index]?.src ?? null
    },
    autoStart: autoStart && previewsReady,
    onQueueEnd: autoplay ? () => onAlbumEnd(played.current) : undefined,
    shuffle,
    onToggleShuffle,
    onShuffleNext: () => onAlbumEnd(played.current),
    analytics: { album_id: summary.id, album_title: summary.title, artist: summary.artist, view },
  })

  useEffect(() => {
    if (player.isPlaying) played.current = true
  }, [player.isPlaying])

  const nothingToPlay = Boolean(error) || (previewsReady && !player.hasPlayable)
  const skipAlbum = useEffectEvent(() => onAlbumEnd(false))
  useEffect(() => {
    if (autoStart && (autoplay || shuffle) && nothingToPlay) skipAlbum()
  }, [autoStart, autoplay, shuffle, nothingToPlay])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="wood-bar relative flex h-12 shrink-0 items-center justify-center px-24">
        <div className="absolute top-1/2 left-3 flex -translate-y-1/2 items-center gap-1.5">
          <button
            type="button"
            className="ios-btn-wood flex items-center justify-center px-2!"
            onClick={nav.onPrevious}
            disabled={!nav.previous}
            aria-label={nav.previous ? `Previous album: ${nav.previous.title} by ${nav.previous.artist}` : 'Previous album'}
            title={nav.previous ? `${nav.previous.artist} — ${nav.previous.title}` : undefined}
          >
            <ChevronLeft className="size-4" aria-hidden="true" strokeWidth={3} />
          </button>
          <button
            type="button"
            className="ios-btn-wood flex items-center justify-center px-2!"
            onClick={nav.onNext}
            disabled={!nav.next}
            aria-label={nav.next ? `Next album: ${nav.next.title} by ${nav.next.artist}` : 'Next album'}
            title={nav.next ? `${nav.next.artist} — ${nav.next.title}` : undefined}
          >
            <ChevronRight className="size-4" aria-hidden="true" strokeWidth={3} />
          </button>
        </div>
        <p id="album-dialog-title" className="engraved truncate text-lg font-bold">
          {summary.artist} — {summary.title}
        </p>
        <button
          type="button"
          className="ios-btn-wood absolute top-1/2 right-3 -translate-y-1/2"
          onClick={onClose}
          autoFocus
        >
          Done
        </button>
      </div>

      <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1.1fr_1fr] md:overflow-hidden">
        <div className="linen flex flex-col items-center justify-center gap-8 p-6 sm:p-10 md:overflow-y-auto">
          <FormatStage view={view} album={summary} playing={player.isPlaying} />
          <PlayerControls
            player={player}
            artist={summary.artist}
            isLoading={isLoading || (!data && !error)}
            previewsLoading={previewsLoading}
            autoplay={autoplay}
            onToggleAutoplay={onToggleAutoplay}
            upNext={upNext}
          />
        </div>
        <div className="pinstripe border-t border-[#8d949c] p-5 sm:p-7 md:overflow-y-auto md:border-t-0 md:border-l md:shadow-[inset_4px_0_8px_-4px_rgba(0,0,0,0.35)]">
          <AlbumDetails summary={summary} album={data} isLoading={isLoading}
            error={error}
            player={player}
            previewsLoading={previewsLoading}
          />
        </div>
      </div>
    </div>
  )
}
