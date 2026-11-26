'use client'

import { useCallback, useState, type CSSProperties } from 'react'
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

const PATTERN_COUNT = 8

function hashSeed(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0
  return h
}

export function AlbumCover({ title, artist, cover, palette, className, eager }: AlbumCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const markFailed = useCallback(() => setFailedSrc(cover), [cover])

  // An image can fail before hydration attaches onError, so also check on mount.
  const imgRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth === 0) markFailed()
    },
    [markFailed],
  )

  if (cover && failedSrc !== cover) {
    return (
      <div className={cn('sleeve-gloss bg-black', className)}>
        <img
          ref={imgRef}
          src={cover}
          alt={`${title} by ${artist} album cover`}
          className="size-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={markFailed}
        />
      </div>
    )
  }

  return <GeneratedCover title={title} artist={artist} palette={palette} className={className} />
}

function GeneratedCover({
  title,
  artist,
  palette,
  className,
}: Pick<AlbumCoverProps, 'title' | 'artist' | 'palette' | 'className'>) {
  const seed = hashSeed(`${artist}\u0000${title}`)
  const pattern = seed % PATTERN_COUNT
  const hueShift = ((seed >>> 8) % 50) - 25
  const angle = 15 + ((seed >>> 4) % 150)
  const titleAtTop = ((seed >>> 12) & 1) === 1 && pattern !== 2

  const style = {
    '--bg': palette.background,
    '--fg': palette.foreground,
    filter: `hue-rotate(${hueShift}deg)`,
  } as CSSProperties

  return (
    <div className={cn('sleeve-gloss', className)} role="img" aria-label={`${title} by ${artist}, generated artwork`}>
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
              background: `repeating-linear-gradient(${angle}deg, transparent 0 9%, ${palette.accent} 9% 13%)`,
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
        {pattern === 4 && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: `conic-gradient(from ${angle}deg at 30% 70%, ${palette.accent}, transparent 25%, ${palette.accent} 50%, transparent 75%)`, opacity: 0.45 }}
          />
        )}
        {pattern === 5 && (
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: palette.accent, boxShadow: `0 0 0 6px var(--bg), 0 0 0 9px ${palette.accent}` }}
          />
        )}
        {pattern === 6 && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: `linear-gradient(${angle}deg, ${palette.accent} 0 33%, transparent 33% 66%, ${palette.accent} 66%)`, opacity: 0.4 }}
          />
        )}
        {pattern === 7 && (
          <div
            aria-hidden
            className="absolute inset-[14%] border-[3px]"
            style={{ borderColor: palette.accent, transform: `rotate(${angle % 45}deg)`, opacity: 0.8 }}
          />
        )}
        <div className={cn('relative flex h-full flex-col justify-between p-[8%]', titleAtTop && 'flex-col-reverse')}>
          <p className="gen-cover-artist">{artist}</p>
          <p className="gen-cover-title text-balance">{title}</p>
        </div>
      </div>
    </div>
  )
}
