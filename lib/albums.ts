import { realAlbums } from '@/data/real-albums'
import type { Album, AlbumSummary, SpinePalette, Tracklist } from './types'

export const COLLECTION_SIZE = 1973

const PALETTES: SpinePalette[] = [
  { background: '#151515', foreground: '#f2efe6', accent: '#c9a227' },
  { background: '#1f1d1b', foreground: '#e0d6c2', accent: '#8c2f24' },
  { background: '#efe8d8', foreground: '#2a2622', accent: '#b6452c' },
  { background: '#f6f3ec', foreground: '#1b1b1b', accent: '#2d5d8a' },
  { background: '#c9a227', foreground: '#1c1a14', accent: '#1c1a14' },
  { background: '#e3b23c', foreground: '#2b1d0e', accent: '#7a2e1c' },
  { background: '#a3261d', foreground: '#f6e7cf', accent: '#f6e7cf' },
  { background: '#7a1f1a', foreground: '#f0d9a8', accent: '#e0a43a' },
  { background: '#1f3a5f', foreground: '#e9eef5', accent: '#e0a43a' },
  { background: '#233044', foreground: '#c9d6e6', accent: '#8bb4d8' },
  { background: '#2f5d50', foreground: '#eee8d5', accent: '#e8b04b' },
  { background: '#3e6b48', foreground: '#f3eddc', accent: '#f3eddc' },
  { background: '#d8602b', foreground: '#1d130c', accent: '#fff1d6' },
  { background: '#5b3a6e', foreground: '#f1e6f5', accent: '#d9a6e8' },
  { background: '#8a8f94', foreground: '#121212', accent: '#c0352b' },
  { background: '#4a3426', foreground: '#ead9bf', accent: '#c99b5f' },
  { background: '#c7c2b6', foreground: '#232323', accent: '#232323' },
  { background: '#0e4d64', foreground: '#f4f1e8', accent: '#f2b134' },
  { background: '#b83b5e', foreground: '#fff2f2', accent: '#2d1b24' },
  { background: '#2b2b2b', foreground: '#d64933', accent: '#d64933' },
]

const ARTIST_A = [
  'The', 'Velvet', 'Midnight', 'Golden', 'Paper', 'Silver', 'Young', 'Neon', 'Blue', 'Lazy',
  'Electric', 'Quiet', 'Burning', 'Hollow', 'Crystal', 'Northern', 'Wild', 'Sunday', 'Cosmic', 'Glass',
]
const ARTIST_B = [
  'Harbors', 'Foxes', 'Saints', 'Machines', 'Parade', 'Comets', 'Ghosts', 'Rivers', 'Lions', 'Kites',
  'Orchids', 'Satellites', 'Strangers', 'Engines', 'Tides', 'Wolves', 'Echoes', 'Palms', 'Sparrows', 'Lanterns',
]
const SOLO_FIRST = [
  'Nina', 'Marcus', 'Lola', 'Andre', 'June', 'Otis', 'Mavis', 'Theo', 'Ruby', 'Calvin',
  'Iris', 'Desmond', 'Ada', 'Felix', 'Nora', 'Isaac', 'Etta', 'Leon', 'Vera', 'Miles',
]
const SOLO_LAST = [
  'Moreau', 'Holloway', 'Reyes', 'Okafor', 'Lindqvist', 'Bishop', 'Carter', 'Vance', 'Nakamura', 'Price',
  'Delgado', 'Whitfield', 'Kane', 'Ashby', 'Monroe', 'Quinn', 'Sterling', 'Laurent', 'Ford', 'Ellis',
]
const TITLE_A = [
  'Late', 'Static', 'Endless', 'Paper', 'Summer', 'Slow', 'Northern', 'Velvet', 'Second', 'Distant',
  'Golden', 'Broken', 'Electric', 'Silent', 'Low', 'Midnight', 'Open', 'Hidden', 'Bright', 'Faded',
]
const TITLE_B = [
  'Light', 'Hours', 'Weather', 'Motion', 'Rooms', 'Signals', 'Gardens', 'Season', 'Highway', 'Machines',
  'Dreams', 'Water', 'Fever', 'Frequencies', 'Horizon', 'Letters', 'Youth', 'Cities', 'Stories', 'Tapes',
]
const TRACK_WORDS = [
  'intro', 'run', 'home', 'fire', 'gold', 'night', 'drive', 'stay', 'falling', 'sun', 'blue', 'ocean',
  'heart', 'echo', 'ghost', 'money', 'river', 'ride', 'wait', 'stars', 'rain', 'city', 'lost', 'free',
]
const GENRES = [
  'hip hop', 'jazz', 'soul', 'rock', 'indie rock', 'electronic', 'ambient', 'r&b', 'funk', 'pop',
  'folk', 'house', 'trap', 'disco', 'post-punk', 'shoegaze', 'blues', 'reggae', 'synth-pop', 'neo soul',
]
const TYPES = ['Album', 'Album', 'Album', 'EP', 'Compilation', 'Live']

function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seededRandom(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rand: () => number, list: T[]) {
  return list[Math.floor(rand() * list.length)]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

function formatLength(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function makePlaceholder(index: number): Omit<Album, 'id'> {
  const rand = seededRandom(index * 7919 + 17)
  const artist =
    rand() > 0.45
      ? `${pick(rand, SOLO_FIRST)} ${pick(rand, SOLO_LAST)}`
      : `${pick(rand, ARTIST_A)} ${pick(rand, ARTIST_B)}`
  const title = rand() > 0.3 ? `${pick(rand, TITLE_A)} ${pick(rand, TITLE_B)}` : pick(rand, TITLE_B)
  const year = 1958 + Math.floor(rand() * 68)
  const trackCount = 7 + Math.floor(rand() * 10)
  let totalSeconds = 0
  const tracks = Array.from({ length: trackCount }, (_, i) => {
    const seconds = 130 + Math.floor(rand() * 220)
    totalSeconds += seconds
    const words = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => pick(rand, TRACK_WORDS))
    return { number: String(i + 1), title: words.join(' '), length: formatLength(seconds) }
  })
  const genreCount = 1 + Math.floor(rand() * 3)
  const genres = Array.from(new Set(Array.from({ length: genreCount }, () => pick(rand, GENRES))))

  const tracklist: Tracklist = {
    source: 'placeholder',
    total_tracks: trackCount,
    total_length: formatLength(totalSeconds),
    discs: [{ disc: 1, format: '12" Vinyl', title: null, tracks }],
  }

  return {
    title,
    artist,
    year,
    releaseDate: null,
    type: pick(rand, TYPES),
    description: null,
    genres,
    rating: null,
    links: {},
    tracklist,
    cover: null,
    placeholder: true,
  }
}

function artistSortKey(artist: string) {
  return artist.trim().replace(/^the\s+/i, '')
}

function releaseSortKey(album: Pick<Album, 'releaseDate' | 'year'>) {
  // Undated records sort after dated ones within the same artist.
  return album.releaseDate ?? (album.year ? String(album.year) : '9999')
}

function sectionFor(artist: string) {
  const first = artistSortKey(artist)
    .normalize('NFD')
    .charAt(0)
    .toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

type RawTrack = {
  number?: string | number
  title?: string
  length?: string | null
  preview?: string | null
  preview_url?: string | null
  deezer_preview?: string | null
  deezer_id?: string | number | null
  deezer?: { id?: string | number | null; preview?: string | null } | null
}

/** Accepts the common Deezer preview field shapes so new JSON exports drop straight in. */
function normalizeTracklist(raw: unknown): Tracklist | null {
  if (!raw || typeof raw !== 'object') return null
  const list = raw as Tracklist
  return {
    ...list,
    discs: (list.discs ?? []).map((disc) => ({
      ...disc,
      tracks: ((disc.tracks ?? []) as RawTrack[]).map((t, i) => {
        const preview = t.preview ?? t.preview_url ?? t.deezer_preview ?? t.deezer?.preview ?? null
        const id = t.deezer_id ?? t.deezer?.id ?? null
        return {
          number: String(t.number ?? i + 1),
          title: t.title ?? `Track ${i + 1}`,
          length: t.length ?? null,
          preview: typeof preview === 'string' && preview.startsWith('https://') ? preview : null,
          deezer_id: id != null && /^\d+$/.test(String(id)) ? String(id) : null,
        }
      }),
    })),
  }
}

let cache: { albums: Album[]; byId: Map<string, Album> } | null = null

function load() {
  if (cache) return cache

  const real: Omit<Album, 'id'>[] = realAlbums.map(({ data, cover }) => ({
    title: data.title,
    artist: data.artist,
    year: data.year ?? null,
    releaseDate: data.release_date ?? null,
    type: data.type ?? null,
    description: data.description ?? null,
    genres: data.genres ?? [],
    rating: data.rating ?? null,
    links: data.links ?? {},
    tracklist: normalizeTracklist(data.tracklist),
    cover,
    placeholder: false,
  }))

  const placeholderCount = Math.max(0, COLLECTION_SIZE - real.length)
  const placeholders = Array.from({ length: placeholderCount }, (_, i) => makePlaceholder(i))

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
  const sorted = [...real, ...placeholders].sort(
    (a, b) =>
      collator.compare(artistSortKey(a.artist), artistSortKey(b.artist)) ||
      collator.compare(a.artist, b.artist) ||
      releaseSortKey(a).localeCompare(releaseSortKey(b)),
  )

  const used = new Set<string>()
  const albums = sorted.map((album) => {
    const base = slugify(`${album.artist}-${album.title}`) || 'album'
    let id = base
    let n = 2
    while (used.has(id)) id = `${base}-${n++}`
    used.add(id)
    return { ...album, id }
  })

  cache = { albums, byId: new Map(albums.map((a) => [a.id, a])) }
  return cache
}

export function getAlbumSummaries(): AlbumSummary[] {
  return load().albums.map((album) => {
    const h = hashString(album.id)
    return {
      id: album.id,
      title: album.title,
      artist: album.artist,
      year: album.year,
      cover: album.cover,
      palette: PALETTES[h % PALETTES.length],
      section: sectionFor(album.artist),
      spineWidth: 3 + ((h >>> 5) % 3),
      heightRatio: 0.985 + ((h >>> 9) % 4) / 200,
    }
  })
}

export type SongMatch = { id: string; song: string }

/** Albums containing a track whose title includes the query; one match (the first song) per album. */
export function searchSongs(query: string, limit = 300): SongMatch[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const matches: SongMatch[] = []
  for (const album of load().albums) {
    const song = album.tracklist?.discs
      .flatMap((disc) => disc.tracks)
      .find((track) => track.title.toLowerCase().includes(q))
    if (song) {
      matches.push({ id: album.id, song: song.title })
      if (matches.length >= limit) break
    }
  }
  return matches
}

export function getAlbumById(id: string) {
  return load().byId.get(id) ?? null
}
