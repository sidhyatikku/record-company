'use client'

import { useEffect, useMemo, useRef } from 'react'
import useSWR from 'swr'
import type { Album, AlbumSummary } from '@/lib/types'
import { AlbumDetails } from './album-details'
import { PlayerControls } from './player-controls'
import { buildPlayableTracks, useAlbumPlayer } from './use-album-player'
import { VinylStage } from './vinyl-stage'

const fetcher = async (url: string): Promise<Album> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed with ${res.status}`)
  return res.json()
}

type AlbumDialogProps = {
  summary: AlbumSummary | null
  onClose: () => void
}

export function AlbumDialog({ summary, onClose }: AlbumDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

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
      {summary && <AlbumDialogBody key={summary.id} summary={summary} onClose={onClose} />}
    </dialog>
  )
}

function AlbumDialogBody({ summary, onClose }: { summary: AlbumSummary; onClose: () => void }) {
  const { data, error, isLoading } = useSWR<Album>(`/api/albums/${summary.id}`, fetcher, {
    revalidateOnFocus: false,
  })
  const tracks = useMemo(() => buildPlayableTracks(data), [data])
  const player = useAlbumPlayer(tracks)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <audio {...player.audioProps} />
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
          <VinylStage album={summary} playing={player.isPlaying} />
          <PlayerControls player={player} artist={summary.artist} isLoading={isLoading || (!data && !error)} />
        </div>
        <div className="pinstripe border-t border-[#8d949c] p-5 sm:p-7 md:overflow-y-auto md:border-t-0 md:border-l md:shadow-[inset_4px_0_8px_-4px_rgba(0,0,0,0.35)]">
          <AlbumDetails summary={summary} album={data} isLoading={isLoading} error={error} player={player} />
        </div>
      </div>
    </div>
  )
}
