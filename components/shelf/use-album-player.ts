'use client'

import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { track, type AnalyticsParams } from '@/lib/analytics'
import type { Album } from '@/lib/types'

export type AudioHandlers = Pick<
  React.AudioHTMLAttributes<HTMLAudioElement>,
  'onPlay' | 'onPause' | 'onPlaying' | 'onWaiting' | 'onTimeUpdate' | 'onDurationChange' | 'onEnded' | 'onError'
>

/**
 * One <audio> element is shared by every album the dialog shows. Safari only lets an element play
 * without a fresh click once the user has started it, so reusing it is what lets autoplay continue
 * into the next album.
 */
export type SharedAudio = {
  ref: RefObject<HTMLAudioElement | null>
  handlers: RefObject<AudioHandlers>
}

type PlayerOptions = {
  refreshSrc?: (index: number) => Promise<string | null>
  autoStart?: boolean
  onQueueEnd?: () => void
  /** Library-wide shuffle: every advance jumps to a random song on a random album instead of the next track. */
  shuffle?: boolean
  onToggleShuffle?: () => void
  onShuffleNext?: () => void
  /** Album details attached to every analytics event this player sends. */
  analytics?: AnalyticsParams
}

type PlayTrigger = 'tracklist' | 'play_button' | 'next' | 'previous' | 'autoplay' | 'auto_start' | 'error_skip'

/** Sliders fire on every pixel of a drag; report one event once the gesture settles. */
const GESTURE_SETTLE_MS = 600

export type PlayableTrack = {
  number: string
  title: string
  length: string | null
  src: string | null
  fallback: string | null
}

export type DeezerAlbumPreviews = {
  albumId: string | null
  tracks: { id: string; title: string; preview: string | null; position: number | null; disc: number }[]
}

function normalizeTitle(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

/**
 * Preview URLs come only from the fresh per-album Deezer lookup, never from the stored JSON,
 * because Deezer's signed links expire. Tracks the lookup can't match fall back to a per-track search.
 */
export function buildPlayableTracks(album: Album | undefined, deezer: DeezerAlbumPreviews | undefined): PlayableTrack[] {
  if (!album?.tracklist) return []
  const ours = album.tracklist.discs.flatMap((disc) => disc.tracks)
  const theirs = deezer?.tracks ?? []
  const byTitle = new Map(theirs.map((t) => [normalizeTitle(t.title), t]))
  const sameLength = theirs.length === ours.length

  return ours.map((track, index) => {
    const params = new URLSearchParams({ artist: album.artist, title: track.title, album: album.title })
    if (track.deezer_id) params.set('id', track.deezer_id)
    const resolver = `/api/preview?${params}`
    const match = byTitle.get(normalizeTitle(track.title)) ?? (sameLength ? theirs[index] : undefined)
    if (match && !match.preview) {
      return { number: track.number, title: track.title, length: track.length, src: null, fallback: null }
    }
    const fresh = match?.preview ?? undefined
    return {
      number: track.number,
      title: track.title,
      length: track.length,
      src: fresh ?? resolver,
      fallback: fresh ? resolver : null,
    }
  })
}

function pickRandom<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)]
}

export function useAlbumPlayer(
  tracks: PlayableTrack[],
  audio: SharedAudio,
  { refreshSrc, autoStart = false, onQueueEnd, shuffle = false, onToggleShuffle, onShuffleNext, analytics }: PlayerOptions = {},
) {
  const audioRef = audio.ref
  const volumeGesture = useRef<{ from: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  const seekGesture = useRef<{ from: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  const autoStarted = useRef(false)
  const usedFallback = useRef(false)
  const usedRefresh = useRef(false)
  const userPicked = useRef(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => audioRef.current?.volume ?? 0.8)
  const [muted, setMuted] = useState(() => audioRef.current?.muted ?? false)
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set())

  const playable = useMemo(() => tracks.flatMap((t, i) => (t.src ? [i] : [])), [tracks])
  const queue = playable.filter((i) => !failed.has(i))
  const firstPick = () => (shuffle ? pickRandom(queue) : queue[0])

  const canPlay = (index: number) => Boolean(tracks[index]?.src) && !failed.has(index)

  function emit(event: string, index: number | null = currentIndex, params: AnalyticsParams = {}) {
    const t = index == null ? undefined : tracks[index]
    track(event, {
      ...analytics,
      track_number: t?.number,
      track_title: t?.title,
      ...params,
    })
  }

  function showUnavailable(index: number) {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    setCurrentIndex(index)
    setCurrentTime(0)
    setDuration(0)
    setIsBuffering(false)
    setIsPlaying(false)
  }

  function playAt(index: number, trigger: PlayTrigger) {
    const audio = audioRef.current
    const target = tracks[index]
    if (!audio || !target?.src) return
    emit('song_play', index, { trigger, shuffle })
    userPicked.current = trigger === 'tracklist'
    usedFallback.current = false
    usedRefresh.current = false
    audio.src = target.src
    audio.volume = volume
    audio.muted = muted
    setCurrentIndex(index)
    setCurrentTime(0)
    setDuration(0)
    setIsBuffering(true)
    audio.play().catch(() => {})
  }

  function step(direction: 1 | -1, trigger: PlayTrigger) {
    const audio = audioRef.current
    if (!audio) return
    if (direction === 1 && shuffle && onShuffleNext) {
      emit('shuffle_next', null, { trigger })
      onShuffleNext()
      return
    }
    const position = currentIndex == null ? -1 : queue.indexOf(currentIndex)
    let target: number | undefined = queue[position + direction]
    if (position === -1 && currentIndex != null) {
      target =
        direction === 1 ? queue.find((i) => i > currentIndex) : [...queue].reverse().find((i) => i < currentIndex)
    }
    if (target != null) {
      playAt(target, trigger)
    } else if (direction === 1 && onQueueEnd) {
      emit('album_complete', null, { trigger })
      onQueueEnd()
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (currentIndex == null) {
      const first = firstPick()
      if (first != null) playAt(first, 'play_button')
      return
    }
    if (!canPlay(currentIndex)) {
      step(1, 'next')
      return
    }
    if (audio.paused) {
      emit('song_resume', currentIndex, { position_seconds: Math.round(audio.currentTime) })
      audio.play().catch(() => {})
    } else {
      emit('song_pause', currentIndex, { position_seconds: Math.round(audio.currentTime) })
      audio.pause()
    }
  }

  function select(index: number) {
    if (!canPlay(index)) {
      emit('song_unavailable', index)
      showUnavailable(index)
    } else if (index === currentIndex) toggle()
    else playAt(index, 'tracklist')
  }

  function next() {
    emit('next_track')
    step(1, 'next')
  }

  function prev() {
    const audio = audioRef.current
    if (!audio) return
    const restart = audio.currentTime > 3 || currentIndex == null
    emit('previous_track', currentIndex, { action: restart ? 'restart' : 'previous' })
    if (restart) audio.currentTime = 0
    else step(-1, 'previous')
  }

  function seek(time: number) {
    const audio = audioRef.current
    if (!audio || currentIndex == null) return
    const index = currentIndex
    const gesture = seekGesture.current
    if (gesture) clearTimeout(gesture.timer)
    const from = gesture?.from ?? audio.currentTime
    seekGesture.current = {
      from,
      timer: setTimeout(() => {
        seekGesture.current = null
        emit('seek', index, {
          direction: time >= from ? 'forward' : 'backward',
          from_seconds: Math.round(from),
          to_seconds: Math.round(time),
        })
      }, GESTURE_SETTLE_MS),
    }
    audio.currentTime = time
    setCurrentTime(time)
  }

  function changeVolume(value: number) {
    const audio = audioRef.current
    const gesture = volumeGesture.current
    if (gesture) clearTimeout(gesture.timer)
    const from = gesture?.from ?? volume
    volumeGesture.current = {
      from,
      timer: setTimeout(() => {
        volumeGesture.current = null
        if (value === from) return
        emit('volume_change', null, {
          direction: value > from ? 'up' : 'down',
          from_volume: Math.round(from * 100),
          to_volume: Math.round(value * 100),
        })
      }, GESTURE_SETTLE_MS),
    }
    setVolume(value)
    if (audio) audio.volume = value
    if (muted && value > 0) {
      setMuted(false)
      if (audio) audio.muted = false
    }
  }

  function toggleMute() {
    const audio = audioRef.current
    const nextMuted = !muted
    emit(nextMuted ? 'volume_mute' : 'volume_unmute', null, { volume: Math.round(volume * 100) })
    setMuted(nextMuted)
    if (audio) audio.muted = nextMuted
  }

  function toggleShuffle() {
    emit('shuffle_toggle', null, { enabled: !shuffle })
    onToggleShuffle?.()
  }

  const hasQueued = queue.length > 0
  const startQueue = useEffectEvent(() => {
    const first = firstPick()
    if (first != null) playAt(first, 'auto_start')
  })
  useEffect(() => {
    if (!autoStart || autoStarted.current || !hasQueued) return
    autoStarted.current = true
    startQueue()
  }, [autoStart, hasQueued])

  const handlers: AudioHandlers = {
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onPlaying: () => setIsBuffering(false),
    onWaiting: () => setIsBuffering(true),
    onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => setCurrentTime(e.currentTarget.currentTime),
    onDurationChange: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const d = e.currentTarget.duration
      if (Number.isFinite(d)) setDuration(d)
    },
    onEnded: () => {
      emit('song_complete')
      step(1, 'autoplay')
    },
    onError: () => {
      const audio = audioRef.current
      if (!audio || currentIndex == null) return
      const track = tracks[currentIndex]
      const index = currentIndex
      if (refreshSrc && !usedRefresh.current) {
        usedRefresh.current = true
        refreshSrc(index).then((src) => {
          if (src && audioRef.current) {
            audioRef.current.src = src
            audioRef.current.play().catch(() => {})
          } else {
            audioRef.current?.dispatchEvent(new Event('error'))
          }
        })
        return
      }
      if (track?.fallback && !usedFallback.current) {
        usedFallback.current = true
        audio.src = track.fallback
        audio.play().catch(() => {})
        return
      }
      emit('preview_error', index)
      setIsBuffering(false)
      setFailed((prev) => new Set(prev).add(index))
      if (userPicked.current) showUnavailable(index)
      else step(1, 'error_skip')
    },
  }

  useLayoutEffect(() => {
    audio.handlers.current = handlers
  })

  useLayoutEffect(() => {
    const { ref, handlers: shared } = audio
    return () => {
      shared.current = {}
      const el = ref.current
      if (el) {
        el.pause()
        el.removeAttribute('src')
        el.load()
      }
    }
  }, [audio])

  const currentUnavailable = currentIndex != null && !canPlay(currentIndex)

  return {
    tracks,
    currentIndex,
    currentTrack: currentIndex == null ? null : tracks[currentIndex],
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    hasPlayable: playable.length > 0,
    currentUnavailable,
    canPlay,
    select,
    toggle,
    next,
    prev,
    seek,
    changeVolume,
    toggleMute,
    toggleShuffle,
  }
}

export type AlbumPlayer = ReturnType<typeof useAlbumPlayer>
