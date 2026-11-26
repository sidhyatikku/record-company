import { ChevronRight, Loader2, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Album, AlbumSummary } from '@/lib/types'
import type { AlbumPlayer } from './use-album-player'

const LINK_LABELS: Record<string, string> = {
  musicbrainz: 'MusicBrainz',
  wikipedia: 'Wikipedia',
  allmusic: 'AllMusic',
  discogs: 'Discogs',
  wikidata: 'Wikidata',
  spotify: 'Spotify',
  apple_music: 'Apple Music',
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      <h3 className="ios-group-header">{title}</h3>
      <div className="ios-group">{children}</div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ios-group-row flex items-baseline justify-between gap-4 px-4 py-2.5 text-[15px]">
      <dt className="font-bold text-[#222]">{label}</dt>
      <dd className="text-right text-[#385487]">{value}</dd>
    </div>
  )
}

function Rating({ value, votes }: { value: number; votes: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex" role="img" aria-label={`Rated ${value} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            aria-hidden
            className="size-4 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]"
            fill={i < Math.round(value) ? '#4c566c' : 'transparent'}
            stroke="#4c566c"
          />
        ))}
      </div>
      <span className="text-xs font-bold text-[#4c566c]">
        {votes} {votes === 1 ? 'vote' : 'votes'}
      </span>
    </div>
  )
}

function DetailsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      {[3, 8, 4].map((rows, g) => (
        <div key={g} className="ios-group">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="ios-group-row h-10 px-4 py-3">
              <div className="h-3 w-2/3 rounded bg-[#dfe2e6]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

type AlbumDetailsProps = {
  summary: AlbumSummary
  album: Album | undefined
  isLoading: boolean
  error: unknown
  player?: AlbumPlayer
  previewsLoading?: boolean
}

function NowPlayingIndicator({ playing }: { playing: boolean }) {
  return (
    <span className={`eq ${playing ? '' : 'is-paused'}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  )
}

export function AlbumDetails({ summary, album, isLoading, error, player, previewsLoading = false }: AlbumDetailsProps) {
  const tracklist = album?.tracklist
  const discOffsets = (tracklist?.discs ?? []).reduce<number[]>(
    (offsets, disc, i) => [...offsets, i === 0 ? 0 : offsets[i - 1] + (tracklist?.discs[i - 1].tracks.length ?? 0)],
    [],
  )
  const multiDisc = (tracklist?.discs.length ?? 0) > 1
  const meta = [
    album?.type,
    summary.year,
    tracklist ? `${tracklist.total_tracks} tracks` : null,
    tracklist?.total_length,
  ].filter(Boolean)
  const links = Object.entries(album?.links ?? {})

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 px-1">
        <h2 className="text-[28px] leading-tight font-bold text-balance text-[#1e2632] [text-shadow:0_1px_0_rgba(255,255,255,0.8)]">
          {summary.title}
        </h2>
        <p className="text-lg font-bold text-[#4c566c] [text-shadow:0_1px_0_rgba(255,255,255,0.8)]">{summary.artist}</p>
        {meta.length > 0 && (
          <p className="text-sm font-medium text-[#4c566c] [text-shadow:0_1px_0_rgba(255,255,255,0.8)]">
            {meta.join(' · ')}
          </p>
        )}
        {album?.rating && <Rating value={album.rating.value_out_of_5} votes={album.rating.votes} />}
        {album && album.genres.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Genres">
            {album.genres.map((genre) => (
              <li key={genre} className="ios-chip capitalize">
                {genre}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="ios-group px-4 py-3 text-sm text-[#a3261d]">Couldn&apos;t load this record&apos;s details.</p>
      ) : isLoading || !album ? (
        <DetailsSkeleton />
      ) : (
        <>
          <Group title="About">
            <p className="px-4 py-3 text-[15px] leading-relaxed text-pretty text-[#2a2a2a]">
              {album.description ?? 'No description yet — this record’s story will appear here once its metadata arrives.'}
            </p>
          </Group>

          {tracklist && (
            <Group title="Tracklist">
              {previewsLoading && (
                <p
                  role="status"
                  className="flex items-center gap-2 border-b border-[#d4d7db] bg-[linear-gradient(#f7f8fa,#eceef1)] px-4 py-2 text-xs font-semibold text-[#4c566c] [text-shadow:0_1px_0_#fff]"
                >
                  <Loader2 className="size-3.5 shrink-0 animate-spin" strokeWidth={2.5} aria-hidden />
                  Fetching song previews from Deezer…
                </p>
              )}
              {tracklist.discs.map((disc, d) => (
                <div key={disc.disc}>
                  {(multiDisc || disc.format) && (
                    <p className="border-b border-[#d4d7db] bg-[linear-gradient(#f2f3f5,#e4e7eb)] px-4 py-1.5 text-xs font-bold tracking-wide text-[#6a7383] uppercase [text-shadow:0_1px_0_#fff]">
                      {multiDisc ? `Disc ${disc.disc}` : 'Side A / B'}
                      {disc.format ? ` · ${disc.format}` : ''}
                    </p>
                  )}
                  <table className="w-full text-[15px]">
                    <caption className="sr-only">
                      {multiDisc ? `Disc ${disc.disc} tracks` : 'Tracks'}
                    </caption>
                    <thead className="sr-only">
                      <tr>
                        <th scope="col">Number</th>
                        <th scope="col">Title</th>
                        <th scope="col">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disc.tracks.map((track, i) => {
                        const index = (discOffsets[d] ?? 0) + i
                        const isCurrent = player?.currentIndex === index
                        const canPlay = player?.canPlay(index) ?? false
                        const isPlayingThis = isCurrent && Boolean(player?.isPlaying)
                        const unavailable = Boolean(player?.hasPlayable) && !canPlay
                        return (
                          <tr
                            key={`${disc.disc}-${i}`}
                            aria-current={isCurrent ? 'true' : undefined}
                            className={`track-row border-t border-[#e3e3e3] first:border-t-0 ${isCurrent ? 'is-current' : ''} ${canPlay ? 'is-playable' : ''} ${unavailable ? 'is-unavailable' : ''}`}
                            onClick={canPlay || unavailable ? () => player?.select(index) : undefined}
                          >
                            <td className="w-10 py-2.5 pl-4 text-right text-sm text-[#8a8f98] tabular-nums">
                              {isCurrent && canPlay ? <NowPlayingIndicator playing={isPlayingThis} /> : track.number}
                            </td>
                            <td className="px-3 py-2.5">
                              {unavailable ? (
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 text-left focus-visible:outline-none"
                                  aria-disabled="true"
                                  aria-label={`${track.title}, preview not available`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    player?.select(index)
                                  }}
                                >
                                  <span className="track-title min-w-0 truncate font-medium">{track.title}</span>
                                  <span className="no-preview-pill shrink-0">No preview</span>
                                </button>
                              ) : canPlay ? (
                                <button
                                  type="button"
                                  className="track-title w-full text-left font-medium text-[#222] focus-visible:outline-none"
                                  aria-label={`${isPlayingThis ? 'Pause' : 'Play'} ${track.title}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    player?.select(index)
                                  }}
                                >
                                  {track.title}
                                </button>
                              ) : (
                                <span className="track-title font-medium text-[#222]">{track.title}</span>
                              )}
                            </td>
                            <td className="w-16 py-2.5 pr-4 text-right text-[#385487] tabular-nums">
                              {track.length ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#d4d7db] bg-[linear-gradient(#f2f3f5,#e8ebee)] px-4 py-2 text-sm font-bold text-[#4c566c] [text-shadow:0_1px_0_#fff]">
                <span>
                  {tracklist.total_tracks} tracks
                  {player?.hasPlayable && <span className="font-medium opacity-75"> · 30s previews via Deezer</span>}
                </span>
                <span className="tabular-nums">{tracklist.total_length ?? '—'}</span>
              </div>
            </Group>
          )}

          <Group title="Details">
            <dl>
              <DetailRow label="Released" value={formatDate(album.releaseDate) ?? album.year ?? 'Unknown'} />
              {album.type && <DetailRow label="Type" value={album.type} />}
              {tracklist?.edition?.disambiguation && (
                <DetailRow label="Edition" value={<span className="capitalize">{tracklist.edition.disambiguation}</span>} />
              )}
              {tracklist?.edition?.country && <DetailRow label="Country" value={tracklist.edition.country} />}
              {tracklist?.source && (
                <DetailRow label="Source" value={<span className="capitalize">{tracklist.source}</span>} />
              )}
            </dl>
          </Group>

          {links.length > 0 && (
            <Group title="Links">
              <ul>
                {links.map(([key, href]) => (
                  <li key={key} className="ios-group-row">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-2.5 text-[15px] font-bold text-[#222] hover:bg-[linear-gradient(#058cf5,#015fe6)] hover:text-white focus-visible:bg-[linear-gradient(#058cf5,#015fe6)] focus-visible:text-white focus-visible:outline-none"
                    >
                      {LINK_LABELS[key] ?? key}
                      <ChevronRight className="size-4 opacity-60" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </Group>
          )}
        </>
      )}
    </div>
  )
}
