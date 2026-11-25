import type { CSSProperties } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { AlbumCover } from './album-cover'

export function VinylStage({ album }: { album: AlbumSummary }) {
  return (
    <div className="relative aspect-[1.4/1] w-full max-w-[560px]">
      <div
        className="vinyl-slide absolute top-[3%] left-[1.5%] aspect-square w-[67%]"
        style={{ '--vinyl-out': '44%' } as CSSProperties}
        aria-hidden
      >
        <div className="vinyl-spin vinyl-grooves absolute inset-0 rounded-full">
          <div className="absolute inset-[33%] overflow-hidden rounded-full shadow-[0_0_0_2px_rgba(0,0,0,0.6)]">
            {album.cover ? (
              <img src={album.cover || '/placeholder.svg'} alt="" className="size-full object-cover" draggable={false} />
            ) : (
              <div
                className="flex size-full flex-col items-center justify-center gap-1 px-3 text-center"
                style={{ background: album.palette.accent, color: album.palette.background }}
              >
                <span className="line-clamp-1 text-[10px] font-bold tracking-widest uppercase">{album.artist}</span>
                <span className="line-clamp-1 text-[9px] opacity-80">{album.title}</span>
              </div>
            )}
          </div>
          <div className="absolute top-1/2 left-1/2 size-[3.5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9d9d9] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
        </div>
        <div className="vinyl-sheen pointer-events-none absolute inset-0 rounded-full" />
      </div>

      <div className="absolute top-0 left-0 aspect-square w-[71.4%] rounded-[2px] shadow-[0_24px_50px_rgba(0,0,0,0.65),0_3px_8px_rgba(0,0,0,0.5)]">
        <AlbumCover
          title={album.title}
          artist={album.artist}
          cover={album.cover}
          palette={album.palette}
          className="size-full rounded-[2px]"
          eager
        />
      </div>
    </div>
  )
}
