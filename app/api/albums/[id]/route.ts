import { getAlbumById } from '@/lib/albums'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const album = getAlbumById(id)
  if (!album) {
    return Response.json({ error: 'Album not found' }, { status: 404 })
  }
  return Response.json(album)
}
