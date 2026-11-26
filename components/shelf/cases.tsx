import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { AlbumSummary } from '@/lib/types'
import { AlbumCover } from './album-cover'

type CaseProps = { album: AlbumSummary; className?: string; eager?: boolean }

/** CD jewel case: ridged hinge on the left, artwork under clear plastic. */
export function JewelCase({ album, className, eager }: CaseProps) {
  return (
    <div className={cn('jewel-case', className)}>
      <div className="jewel-hinge" aria-hidden />
      <div className="jewel-art">
        <AlbumCover
          title={album.title}
          artist={album.artist}
          cover={album.cover}
          palette={album.palette}
          className="size-full"
          eager={eager}
        />
      </div>
      <div className="case-glare" aria-hidden />
    </div>
  )
}

/** Cassette J-card seen through a Norelco case: square art over a printed title band. */
export function JCardCase({ album, className, eager }: CaseProps) {
  return (
    <div className={cn('cq', className)}>
      <div className="jcard">
        <div className="jcard-art">
          <AlbumCover
            title={album.title}
            artist={album.artist}
            cover={album.cover}
            palette={album.palette}
            className="size-full"
            eager={eager}
          />
        </div>
        <div className="jcard-band" style={{ background: album.palette.background, color: album.palette.foreground }}>
          <span className="jcard-artist">{album.artist}</span>
          <span className="jcard-title">{album.title}</span>
          <span className="jcard-meta">
            Stereo · Type II{album.year ? ` · ${album.year}` : ''}
          </span>
        </div>
        <div className="case-glare" aria-hidden />
      </div>
    </div>
  )
}

/** The cassette shell itself, with a printed label and two reels visible through the window. */
export function CassetteShell({ album, className }: CaseProps) {
  const style = {
    '--bg': album.palette.background,
    '--fg': album.palette.foreground,
    '--accent': album.palette.accent,
  } as CSSProperties
  return (
    <div className={cn('cq', className)}>
      <div className="cassette-shell" style={style}>
        <div className="cassette-label">
          <span className="cassette-side">A</span>
          <span className="cassette-text">
            <span className="font-extrabold uppercase">{album.artist}</span>
            <span className="opacity-80"> — {album.title}</span>
          </span>
          <span className="cassette-stripe" />
        </div>
        <div className="cassette-window">
          <span className="reel reel-left" />
          <span className="reel reel-right" />
        </div>
        <div className="cassette-bottom" />
      </div>
    </div>
  )
}
