import { searchSongs } from '@/lib/albums'

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').slice(0, 80)
  return Response.json(
    { matches: searchSongs(q) },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' } },
  )
}
