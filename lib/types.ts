export type Track = {
  number: string
  title: string
  length: string | null
}

export type Disc = {
  disc: number
  format: string | null
  title: string | null
  tracks: Track[]
}

export type Tracklist = {
  source?: string
  edition?: {
    title?: string
    disambiguation?: string | null
    date?: string | null
    country?: string | null
  }
  total_tracks: number
  total_length: string | null
  discs: Disc[]
}

export type SpinePalette = {
  background: string
  foreground: string
  accent: string
}

export type Album = {
  id: string
  title: string
  artist: string
  year: number | null
  releaseDate: string | null
  type: string | null
  description: string | null
  genres: string[]
  rating: { value_out_of_5: number; votes: number } | null
  links: Record<string, string>
  tracklist: Tracklist | null
  cover: string | null
  placeholder: boolean
}

export type AlbumSummary = {
  id: string
  title: string
  artist: string
  year: number | null
  cover: string | null
  palette: SpinePalette
  spineWidth: number
  heightRatio: number
}
