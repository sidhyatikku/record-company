'use client'

import { Pause, Play, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { AlbumPlayer } from './use-album-player'

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type PlayerControlsProps = {
  player: AlbumPlayer
  artist: string
  isLoading: boolean
}

export function PlayerControls({ player, artist, isLoading }: PlayerControlsProps) {
  const { currentTrack, isPlaying, isBuffering, currentTime, shuffle, volume, muted } = player
  const disabled = isLoading || !player.hasPlayable
  const duration = player.duration || (currentTrack ? 30 : 0)
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0
  const effectiveVolume = muted ? 0 : volume
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2

  const status = isLoading
    ? 'Loading tracks…'
    : !player.hasPlayable
      ? 'Previews aren’t available for this record yet'
      : currentTrack
        ? null
        : 'Press play to hear 30-second previews'

  return (
    <section className="player-panel w-full max-w-[480px]" aria-label="Preview player">
      <div className="flex min-h-11 flex-col items-center justify-center px-4 pt-3 text-center" aria-live="polite">
        {currentTrack ? (
          <>
            <p className="player-engraved line-clamp-1 text-[15px] font-bold">
              {currentTrack.number}. {currentTrack.title}
            </p>
            <p className="player-engraved line-clamp-1 text-xs font-medium opacity-80">
              {isBuffering && isPlaying ? 'Loading preview…' : `${artist} · Preview`}
            </p>
          </>
        ) : (
          <p className="player-engraved text-[13px] font-medium">{status}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-4">
        <span className="player-engraved w-9 text-right text-[11px] font-bold tabular-nums">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          className="ios-range flex-1"
          min={0}
          max={duration || 30}
          step={0.1}
          value={currentTrack ? currentTime : 0}
          disabled={disabled || !currentTrack}
          onChange={(e) => player.seek(Number(e.target.value))}
          style={{ '--fill': `${progress}%` } as CSSProperties}
          aria-label="Seek"
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        />
        <span className="player-engraved w-9 text-[11px] font-bold tabular-nums">
          -{formatTime(duration - currentTime)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-1 pb-3">
        <div className="flex">
          <button
            type="button"
            className="player-btn p-2"
            data-active={shuffle || undefined}
            aria-pressed={shuffle}
            aria-label="Shuffle"
            disabled={disabled}
            onClick={player.toggleShuffle}
          >
            <Shuffle className="size-[18px]" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className="player-btn p-2" aria-label="Previous track" disabled={disabled} onClick={player.prev}>
            <SkipBack className="size-6" fill="currentColor" aria-hidden />
          </button>
          <button
            type="button"
            className="player-btn player-btn-main grid size-14 place-items-center"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={disabled}
            onClick={player.toggle}
          >
            {isPlaying ? (
              <Pause className="size-7" fill="currentColor" aria-hidden />
            ) : (
              <Play className="ml-1 size-7" fill="currentColor" aria-hidden />
            )}
          </button>
          <button type="button" className="player-btn p-2" aria-label="Next track" disabled={disabled} onClick={player.next}>
            <SkipForward className="size-6" fill="currentColor" aria-hidden />
          </button>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="player-btn shrink-0 p-1"
            aria-label={muted ? 'Unmute' : 'Mute'}
            aria-pressed={muted}
            onClick={player.toggleMute}
          >
            <VolumeIcon className="size-[18px]" strokeWidth={2.5} aria-hidden />
          </button>
          <input
            type="range"
            className="ios-range ios-range-sm w-full max-w-24"
            min={0}
            max={1}
            step={0.01}
            value={effectiveVolume}
            onChange={(e) => player.changeVolume(Number(e.target.value))}
            style={{ '--fill': `${effectiveVolume * 100}%` } as CSSProperties}
            aria-label="Volume"
          />
        </div>
      </div>
    </section>
  )
}
