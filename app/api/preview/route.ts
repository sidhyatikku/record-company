import { NextResponse, type NextRequest } from 'next/server'

type DeezerTrack = { preview?: string; title?: string; album?: { title?: string } }

const MAX_LEN = 200

function clean(value: string | null) {
  if (!value) return null
  const trimmed = value.replace(/["\\]/g, ' ').trim()
  return trimmed && trimmed.length <= MAX_LEN ? trimmed : null
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

async function deezer<T>(path: string): Promise<T | null> {
  try {
    // Signed preview URLs expire after a few hours, so only cache lookups briefly.
    const res = await fetch(`https://api.deezer.com${path}`, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const id = params.get('id')
  const artist = clean(params.get('artist'))
  const title = clean(params.get('title'))
  const album = clean(params.get('album'))

  let preview: string | null = null

  if (id && /^\d{1,15}$/.test(id)) {
    const track = await deezer<DeezerTrack>(`/track/${id}`)
    if (isDeezerPreview(track?.preview)) preview = track.preview
  }

  if (!preview && artist && title) {
    const q = encodeURIComponent(`artist:"${artist}" track:"${title}"`)
    const result = await deezer<{ data?: DeezerTrack[] }>(`/search?q=${q}&limit=10`)
    const candidates = (result?.data ?? []).filter((t) => isDeezerPreview(t.preview))
    const albumMatch = album
      ? candidates.find((t) => t.album?.title?.toLowerCase() === album.toLowerCase())
      : undefined
    preview = (albumMatch ?? candidates[0])?.preview ?? null
  }

  if (!preview) {
    return NextResponse.json({ error: 'Preview not found' }, { status: 404 })
  }

  return NextResponse.redirect(preview, {
    status: 302,
    headers: { 'Cache-Control': 'private, max-age=900' },
  })
}
