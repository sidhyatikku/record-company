'use client'

import { useMemo, useRef, useState } from 'react'
import type { Album } from '@/lib/types'

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
    if (album.placeholder) {
      return { number: track.number, title: track.title, length: track.length, src: null, fallback: null }
    }
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

function shuffled<T>(items: T[]) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function useAlbumPlayer(tracks: PlayableTrack[], refreshSrc?: (index: number) => Promise<string | null>) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const usedFallback = useRef(false)
  const usedRefresh = useRef(false)
  const userPicked = useRef(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([])
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set())

  const playable = useMemo(() => tracks.flatMap((t, i) => (t.src ? [i] : [])), [tracks])
  const queue = (shuffle ? shuffleOrder : playable).filter((i) => !failed.has(i))

  const canPlay = (index: number) => Boolean(tracks[index]?.src) && !failed.has(index)

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

  function playAt(index: number, fromUser = false) {
    const audio = audioRef.current
    const track = tracks[index]
    if (!audio || !track?.src) return
    userPicked.current = fromUser
    usedFallback.current = false
    usedRefresh.current = false
    audio.src = track.src
    audio.volume = volume
    audio.muted = muted
    setCurrentIndex(index)
    setCurrentTime(0)
    setDuration(0)
    setIsBuffering(true)
    audio.play().catch(() => {})
  }

  function step(direction: 1 | -1) {
    const audio = audioRef.current
    if (!audio) return
    const position = currentIndex == null ? -1 : queue.indexOf(currentIndex)
    let target: number | undefined = queue[position + direction]
    if (position === -1 && currentIndex != null && !shuffle) {
      target =
        direction === 1 ? queue.find((i) => i > currentIndex) : [...queue].reverse().find((i) => i < currentIndex)
    }
    if (target != null) {
      playAt(target)
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (currentIndex == null) {
      if (queue[0] != null) playAt(queue[0])
      return
    }
    if (!canPlay(currentIndex)) {
      step(1)
      return
    }
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  function select(index: number) {
    if (!canPlay(index)) showUnavailable(index)
    else if (index === currentIndex) toggle()
    else playAt(index, true)
  }

  function prev() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.currentTime > 3 || currentIndex == null) audio.currentTime = 0
    else step(-1)
  }

  function seek(time: number) {
    const audio = audioRef.current
    if (!audio || currentIndex == null) return
    audio.currentTime = time
    setCurrentTime(time)
  }

  function changeVolume(value: number) {
    const audio = audioRef.current
    setVolume(value)
    if (audio) audio.volume = value
    if (muted && value > 0) {
      setMuted(false)
      if (audio) audio.muted = false
    }
  }

  function toggleMute() {
    const audio = audioRef.current
    const next = !muted
    setMuted(next)
    if (audio) audio.muted = next
  }

  function toggleShuffle() {
    if (!shuffle) {
      const rest = shuffled(playable.filter((i) => i !== currentIndex))
      setShuffleOrder(currentIndex == null ? rest : [currentIndex, ...rest])
    }
    setShuffle(!shuffle)
  }

  const audioProps = {
    ref: audioRef,
    preload: 'none' as const,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onPlaying: () => setIsBuffering(false),
    onWaiting: () => setIsBuffering(true),
    onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => setCurrentTime(e.currentTarget.currentTime),
    onDurationChange: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const d = e.currentTarget.duration
      if (Number.isFinite(d)) setDuration(d)
    },
    onEnded: () => step(1),
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
      setIsBuffering(false)
      setFailed((prev) => new Set(prev).add(index))
      if (userPicked.current) showUnavailable(index)
      else step(1)
    },
  }

  const currentUnavailable = currentIndex != null && !canPlay(currentIndex)

  return {
    audioProps,
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
    next: () => step(1),
    prev,
    seek,
    changeVolume,
    toggleMute,
    toggleShuffle,
  }
}

export type AlbumPlayer = ReturnType<typeof useAlbumPlayer>
