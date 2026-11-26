import type { AlbumSummary } from '@/lib/types'

export type ShelfView = 'vinyl' | 'cassette' | 'cd' | 'digital'

export const SHELF_VIEWS: { id: ShelfView; label: string; noun: string }[] = [
  { id: 'vinyl', label: 'Vinyl', noun: 'records' },
  { id: 'cassette', label: 'Cassette', noun: 'tapes' },
  { id: 'cd', label: 'CD', noun: 'CDs' },
  { id: 'digital', label: 'Digital', noun: 'albums' },
]

export type ShelfSection = { letter: string; albums: AlbumSummary[] }

/** Albums arrive pre-sorted by artist then release date, so sections are contiguous runs. */
export function groupBySection(albums: AlbumSummary[]): ShelfSection[] {
  const sections: ShelfSection[] = []
  for (const album of albums) {
    const last = sections[sections.length - 1]
    if (last && last.letter === album.section) last.albums.push(album)
    else sections.push({ letter: album.section, albums: [album] })
  }
  return sections
}

export function sectionAnchor(letter: string) {
  return `artists-${letter === '#' ? 'num' : letter}`
}
