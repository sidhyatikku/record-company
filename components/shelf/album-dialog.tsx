'use client'

import { createRef, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
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
  onToggleAutoplay: () => void
  onAlbumEnd: (played: boolean) => void
}

type AlbumDialogProps = AutoplayProps & {
  summary: AlbumSummary | null
  view: ShelfView
  onClose: () => void
}

export function AlbumDialog({ summary, view, onClose, ...autoplay }: AlbumDialogProps) {
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
        <AlbumDialogBody key={summary.id} summary={summary} view={view} onClose={onClose} audio={audio} {...autoplay} />
      )}
    </dialog>
  )
}

function AlbumDialogBody({
  summary,
  view,
  onClose,
  audio,
  autoplay,
  autoStart,
  upNext,
  onToggleAutoplay,
  onAlbumEnd,
}: AutoplayProps & {
  summary: AlbumSummary
  view: ShelfView
  onClose: () => void
  audio: SharedAudio
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
    analytics: { album_id: summary.id, album_title: summary.title, artist: summary.artist, view },
  })

  useEffect(() => {
    if (player.isPlaying) played.current = true
  }, [player.isPlaying])

  const nothingToPlay = Boolean(error) || (previewsReady && !player.hasPlayable)
  const skipAlbum = useEffectEvent(() => onAlbumEnd(false))
  useEffect(() => {
    if (autoStart && autoplay && nothingToPlay) skipAlbum()
  }, [autoStart, autoplay, nothingToPlay])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="wood-bar relative flex h-12 shrink-0 items-center justify-center px-24">
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
