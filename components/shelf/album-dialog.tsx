'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import type { Album, AlbumSummary } from '@/lib/types'
import { AlbumDetails } from './album-details'
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
  const { data, error, isLoading } = useSWR<Album>(summary ? `/api/albums/${summary.id}` : null, fetcher, {
    revalidateOnFocus: false,
  })

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
      {summary && (
        <div key={summary.id} className="flex min-h-0 flex-1 flex-col">
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
            <div className="linen flex items-center justify-center p-6 sm:p-10">
              <VinylStage album={summary} />
            </div>
            <div className="pinstripe border-t border-[#8d949c] p-5 sm:p-7 md:overflow-y-auto md:border-t-0 md:border-l md:shadow-[inset_4px_0_8px_-4px_rgba(0,0,0,0.35)]">
              <AlbumDetails summary={summary} album={data} isLoading={isLoading} error={error} />
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
