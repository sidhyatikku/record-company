import type { CSSProperties } from 'react'
import type { AlbumSummary } from '@/lib/types'
import { AlbumCover } from './album-cover'
import { CassetteShell, JCardCase, JewelCase } from './cases'
import type { ShelfView } from './views'
import { VinylStage } from './vinyl-stage'

type StageProps = { album: AlbumSummary; playing: boolean }

export function FormatStage({ view, album, playing }: StageProps & { view: ShelfView }) {
  if (view === 'cassette') return <CassetteStage album={album} playing={playing} />
  if (view === 'cd') return <CdStage album={album} playing={playing} />
  if (view === 'digital') return <DigitalStage album={album} playing={playing} />
  return <VinylStage album={album} playing={playing} />
}

function CassetteStage({ album, playing }: StageProps) {
  return (
    <div className={`relative aspect-[1.45/1] w-full max-w-[520px] ${playing ? 'is-playing' : ''}`}>
      <div
        className="vinyl-slide absolute top-[22%] left-[3%] w-[56%] drop-shadow-[0_18px_24px_rgba(0,0,0,0.6)]"
        style={{ '--vinyl-out': '70%' } as CSSProperties}
        aria-hidden
      >
        <CassetteShell album={album} />
      </div>
      <JCardCase album={album} eager className="absolute top-0 left-0 w-[40%]" />
    </div>
  )
}

function CdStage({ album, playing }: StageProps) {
  return (
    <div className={`relative aspect-[1.4/1] w-full max-w-[520px] ${playing ? 'is-playing' : ''}`}>
      <div
        className="vinyl-slide absolute top-[5%] left-[4%] aspect-square w-[58%] drop-shadow-[0_14px_22px_rgba(0,0,0,0.6)]"
        style={{ '--vinyl-out': '50%' } as CSSProperties}
        aria-hidden
      >
        <div className="vinyl-spin cd-disc absolute inset-0">
          <div
            className="absolute inset-[19%] flex flex-col items-center justify-center gap-[2%] rounded-full px-[14%] text-center"
            style={{ background: album.palette.background, color: album.palette.foreground }}
          >
            <span className="line-clamp-1 text-[clamp(8px,2.2vw,12px)] font-extrabold tracking-[0.18em] uppercase">
              {album.artist}
            </span>
            <span className="mt-[22%] line-clamp-1 text-[clamp(7px,1.8vw,10px)] opacity-80">{album.title}</span>
          </div>
          <div className="cd-hub absolute inset-[38%] rounded-full" />
        </div>
      </div>
      <JewelCase album={album} eager className="absolute top-0 left-0 w-[68%]" />
    </div>
  )
}

function DigitalStage({ album, playing }: StageProps) {
  return (
    <div className="flex w-full max-w-[400px] justify-center pb-[18%]">
      <div className={`digital-stage-art aspect-square w-[82%] ${playing ? 'is-playing' : ''}`}>
        <AlbumCover
          title={album.title}
          artist={album.artist}
          cover={album.cover}
          palette={album.palette}
          className="size-full rounded-[10px]"
          eager
        />
      </div>
    </div>
  )
}
