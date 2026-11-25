import iAmIWas from './albums/21-savage-i-am-i-was.json'

export type RawAlbum = {
  title: string
  artist: string
  year?: number | null
  release_date?: string | null
  type?: string | null
  description?: string | null
  genres?: string[]
  rating?: { value_out_of_5: number; votes: number } | null
  links?: Record<string, string>
  tracklist?: unknown
}

/**
 * Albums with downloaded metadata. Drop each JSON into `data/albums/`,
 * its artwork into `public/covers/`, and register it here.
 * Remaining slots up to the collection total are filled with placeholders.
 */
export const realAlbums: { data: RawAlbum; cover: string | null }[] = [
  { data: iAmIWas, cover: '/covers/21-savage-i-am-i-was.jpg' },
]
