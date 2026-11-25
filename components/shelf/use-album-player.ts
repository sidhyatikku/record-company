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

export function buildPlayableTracks(album: Album | undefined): PlayableTrack[] {
  if (!album?.tracklist) return []
  return album.tracklist.discs.flatMap((disc) =>
    disc.tracks.map((track) => {
      if (album.placeholder) {
        return { number: track.number, title: track.title, length: track.length, src: null, fallback: null }
      }
      const params = new URLSearchParams({ artist: album.artist, title: track.title, album: album.title })
      if (track.deezer_id) params.set('id', track.deezer_id)
      const resolver = `/api/preview?${params}`
      return {
        number: track.number,
        title: track.title,
        length: track.length,
        src: track.preview ?? resolver,
        fallback: track.preview ? resolver : null,
      }
    }),
  )
}

function shuffled<T>(items: T[]) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function useAlbumPlayer(tracks: PlayableTrack[]) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const usedFallback = useRef(false)
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

  function playAt(index: number) {
    const audio = audioRef.current
    const track = tracks[index]
    if (!audio || !track?.src) return
    usedFallback.current = false
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
    const target = queue[position + direction]
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
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  function select(index: number) {
    if (index === currentIndex) toggle()
    else playAt(index)
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
      if (track?.fallback && !usedFallback.current) {
        usedFallback.current = true
        audio.src = track.fallback
        audio.play().catch(() => {})
        return
      }
      setIsBuffering(false)
      setFailed((prev) => new Set(prev).add(currentIndex))
      step(1)
    },
  }

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
