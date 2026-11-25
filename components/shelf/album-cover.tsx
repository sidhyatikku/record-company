import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { SpinePalette } from '@/lib/types'

type AlbumCoverProps = {
  title: string
  artist: string
  cover: string | null
  palette: SpinePalette
  className?: string
  eager?: boolean
}

function patternFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % 4
}

export function AlbumCover({ title, artist, cover, palette, className, eager }: AlbumCoverProps) {
  if (cover) {
    return (
      <div className={cn('sleeve-gloss bg-black', className)}>
        <img
          src={cover || '/placeholder.svg'}
          alt={`${title} by ${artist} album cover`}
          className="size-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
        />
      </div>
    )
  }

  const style = {
    '--bg': palette.background,
    '--fg': palette.foreground,
  } as CSSProperties
  const pattern = patternFor(`${artist}${title}`)

  return (
    <div className={cn('sleeve-gloss', className)} role="img" aria-label={`${title} by ${artist}, artwork pending`}>
      <div className="gen-cover" style={style}>
        {pattern === 0 && (
          <div
            aria-hidden
            className="absolute -right-[18%] -bottom-[18%] size-[85%] rounded-full"
            style={{
              background: `repeating-radial-gradient(circle, ${palette.accent} 0 6%, transparent 6% 12%)`,
              opacity: 0.85,
            }}
          />
        )}
        {pattern === 1 && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(135deg, transparent 0 9%, ${palette.accent} 9% 13%)`,
              opacity: 0.55,
            }}
          />
        )}
        {pattern === 2 && (
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[46%]" style={{ background: palette.accent }} />
        )}
        {pattern === 3 && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(${palette.accent} 18%, transparent 20%)`,
              backgroundSize: '12.5% 12.5%',
              opacity: 0.5,
            }}
          />
        )}
        <div className="relative flex h-full flex-col justify-between p-[8%]">
          <p className="gen-cover-artist">{artist}</p>
          <p className="gen-cover-title text-balance">{title}</p>
        </div>
      </div>
    </div>
  )
}
