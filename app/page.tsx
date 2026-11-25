import { ShelfApp } from '@/components/shelf/shelf-app'
import { getAlbumSummaries } from '@/lib/albums'

export default function Page() {
  return <ShelfApp albums={getAlbumSummaries()} />
}
