import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Album, AlbumSummary, SpinePalette, Tracklist } from './types'

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

/** Entry shape written by `scripts/build-library.mjs` into `data/library.json`. */
type LibraryEntry = Omit<Album, 'id'> & { folder: string }

function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
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

function sanitizeTracklist(list: Tracklist | null): Tracklist | null {
  if (!list) return null
  return {
    ...list,
    discs: list.discs.map((disc) => ({
      ...disc,
      tracks: disc.tracks.map((t) => ({
        ...t,
        preview: typeof t.preview === 'string' && t.preview.startsWith('https://') ? t.preview : null,
        deezer_id: t.deezer_id && /^\d+$/.test(t.deezer_id) ? t.deezer_id : null,
      })),
    })),
  }
}

let cache: { albums: Album[]; byId: Map<string, Album> } | null = null

function load() {
  if (cache) return cache

  const file = path.join(process.cwd(), 'data', 'library.json')
  const { albums: entries } = JSON.parse(readFileSync(file, 'utf8')) as { albums: LibraryEntry[] }

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
  const sorted = entries
    .map(({ folder: _folder, ...album }) => ({ ...album, tracklist: sanitizeTracklist(album.tracklist) }))
    .sort(
      (a, b) =>
        Number(sectionFor(a.artist) !== '#') - Number(sectionFor(b.artist) !== '#') ||
        collator.compare(artistSortKey(a.artist), artistSortKey(b.artist)) ||
        collator.compare(a.artist, b.artist) ||
        releaseSortKey(a).localeCompare(releaseSortKey(b)) ||
        collator.compare(a.title, b.title),
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
