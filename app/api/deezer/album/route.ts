import { NextResponse, type NextRequest } from 'next/server'

type DeezerAlbum = { id: number; title: string; nb_tracks?: number; record_type?: string; artist?: { name?: string } }
type DeezerTrack = { id: number; title: string; title_short?: string; preview?: string; track_position?: number; disk_number?: number }

const MAX_LEN = 200

function clean(value: string | null) {
  if (!value) return null
  const trimmed = value.replace(/["\\]/g, ' ').trim()
  return trimmed && trimmed.length <= MAX_LEN ? trimmed : null
}

function normalize(value: string | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function isDeezerPreview(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && hostname.endsWith('.dzcdn.net')
  } catch {
    return false
  }
}

async function deezer<T>(path: string, revalidate: number | false): Promise<T | null> {
  try {
    const res = await fetch(`https://api.deezer.com${path}`, revalidate === false ? { cache: 'no-store' } : { next: { revalidate } })
    if (!res.ok) return null
    const json = (await res.json()) as T & { error?: unknown }
    return json.error ? null : json
  } catch {
    return null
  }
}

async function findAlbumId(artist: string, title: string) {
  const q = encodeURIComponent(`artist:"${artist}" album:"${title}"`)
  // Album ids never change, so the search result can be cached for a day.
  const result = await deezer<{ data?: DeezerAlbum[] }>(`/search/album?q=${q}&limit=15`, 86400)
  const candidates = result?.data ?? []
  if (!candidates.length) return null

  const wantTitle = normalize(title)
  const wantArtist = normalize(artist)
  const score = (a: DeezerAlbum) =>
    (normalize(a.title) === wantTitle ? 4 : normalize(a.title).startsWith(wantTitle) ? 2 : 0) +
    (normalize(a.artist?.name) === wantArtist ? 2 : 0) +
    (a.record_type === 'album' ? 1 : 0)

  return [...candidates].sort((a, b) => score(b) - score(a) || (b.nb_tracks ?? 0) - (a.nb_tracks ?? 0))[0].id
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const artist = clean(params.get('artist'))
  const title = clean(params.get('title'))
  const idParam = params.get('id')

  let albumId: string | number | null = idParam && /^\d{1,15}$/.test(idParam) ? idParam : null
  if (!albumId && artist && title) albumId = await findAlbumId(artist, title)

  if (!albumId) {
    return NextResponse.json({ albumId: null, tracks: [] }, { headers: { 'Cache-Control': 'private, max-age=600' } })
  }

  // Preview URLs are signed and expire, so always fetch the tracklist fresh.
  const result = await deezer<{ data?: DeezerTrack[] }>(`/album/${albumId}/tracks?limit=200`, false)
  const tracks = (result?.data ?? []).map((t) => ({
    id: String(t.id),
    title: t.title_short ?? t.title,
    preview: isDeezerPreview(t.preview) ? t.preview : null,
    position: t.track_position ?? null,
    disc: t.disk_number ?? 1,
  }))

  return NextResponse.json(
    { albumId: String(albumId), tracks },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
