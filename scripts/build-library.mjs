#!/usr/bin/env node
/**
 * Builds the shelf's library from the folders in data/albums:
 *
 *   data/albums/Album Info/<Artist>/<Album>.json   metadata + tracklist (source of truth)
 *   data/albums/Album Art/<Artist>/<Album>.<ext>   full-size artwork (Git LFS)
 *
 * Outputs (both committed):
 *   public/covers/<Artist>/<Album>.webp            web-sized covers, same folder layout
 *   data/library.json                              compact manifest loaded by lib/albums.ts
 *
 * It also strips Spotify links/IDs from the Album Info files in place.
 *
 * Usage: node scripts/build-library.mjs [--force]
 */
import { existsSync } from 'node:fs'
import { mkdir, open, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const ALBUMS_DIR = path.join(ROOT, 'data/albums')
const INFO_DIR = path.join(ALBUMS_DIR, 'Album Info')
const ART_DIR = path.join(ALBUMS_DIR, 'Album Art')
const COVERS_DIR = path.join(ROOT, 'public/covers')
const MANIFEST = path.join(ROOT, 'data/library.json')

const COVER_SIZE = 600
const COVER_QUALITY = 76
const CONCURRENCY = 4
const ART_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const FORCE = process.argv.includes('--force')

async function listAlbumFiles(root, keep) {
  const out = []
  for (const artist of await readdir(root, { withFileTypes: true })) {
    if (!artist.isDirectory() || artist.name.startsWith('.')) continue
    for (const file of await readdir(path.join(root, artist.name), { withFileTypes: true })) {
      if (file.isFile() && !file.name.startsWith('.') && keep(file.name)) {
        out.push(path.join(artist.name, file.name))
      }
    }
  }
  return out.sort()
}

const withoutExt = (p) => p.slice(0, p.length - path.extname(p).length)
const isSpotify = (value) => typeof value === 'string' && /open\.spotify\.com|^spotify:/i.test(value)

/** Removes Spotify keys and Spotify URLs anywhere in the object. Returns true if anything changed. */
function stripSpotify(node) {
  if (!node || typeof node !== 'object') return false
  let changed = false
  for (const key of Object.keys(node)) {
    if (/spotify/i.test(key) || isSpotify(node[key])) {
      if (Array.isArray(node)) continue
      delete node[key]
      changed = true
    } else if (stripSpotify(node[key])) {
      changed = true
    }
  }
  if (Array.isArray(node)) {
    const kept = node.filter((v) => !isSpotify(v))
    if (kept.length !== node.length) {
      node.splice(0, node.length, ...kept)
      changed = true
    }
  }
  return changed
}

async function isLfsPointer(file) {
  const handle = await open(file, 'r')
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(40), 0, 40, 0)
    return buffer.subarray(0, bytesRead).toString('utf8').startsWith('version https://git-lfs')
  } finally {
    await handle.close()
  }
}

const coverUrl = (rel) => '/covers/' + withoutExt(rel).split(path.sep).map(encodeURIComponent).join('/') + '.webp'

/** Returns the public URL for an album's cover, generating the WebP if needed. */
async function buildCover(artRel, stats) {
  const src = path.join(ART_DIR, artRel)
  const dest = path.join(COVERS_DIR, withoutExt(artRel) + '.webp')
  if (!existsSync(src)) return null
  if (!FORCE && existsSync(dest) && (await stat(dest)).mtimeMs >= (await stat(src)).mtimeMs) {
    stats.coversCached++
    return coverUrl(artRel)
  }
  if (await isLfsPointer(src)) {
    stats.lfsPointers.push(artRel)
    return existsSync(dest) ? coverUrl(artRel) : null
  }
  try {
    await mkdir(path.dirname(dest), { recursive: true })
    await sharp(src, { failOn: 'none', limitInputPixels: false })
      .rotate()
      .resize(COVER_SIZE, COVER_SIZE, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: COVER_QUALITY })
      .toFile(dest)
    stats.coversBuilt++
    return coverUrl(artRel)
  } catch (error) {
    stats.coverErrors.push(`${artRel}: ${error.message}`)
    return null
  }
}

function compactTracklist(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.discs)) return null
  const edition = raw.edition
    ? {
        title: raw.edition.title ?? undefined,
        disambiguation: raw.edition.disambiguation ?? null,
        date: raw.edition.date ?? null,
        country: raw.edition.country ?? null,
      }
    : undefined
  return {
    source: raw.source,
    edition,
    total_tracks: raw.total_tracks ?? raw.discs.reduce((n, d) => n + (d.tracks?.length ?? 0), 0),
    total_length: raw.total_length ?? null,
    discs: raw.discs.map((disc, i) => ({
      disc: disc.disc ?? i + 1,
      format: disc.format ?? null,
      title: disc.title ?? null,
      tracks: (disc.tracks ?? []).map((t, j) => ({
        number: String(t.number ?? j + 1),
        title: t.title ?? `Track ${j + 1}`,
        length: t.length ?? null,
        preview: t.deezer?.preview ?? null,
        deezer_id: t.deezer?.id != null ? String(t.deezer.id) : null,
      })),
    })),
  }
}

const cleanLinks = (links) =>
  Object.fromEntries(Object.entries(links ?? {}).filter(([, v]) => typeof v === 'string' && v.startsWith('https://')))

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await fn(items[i], i)
      }
    }),
  )
  return results
}

async function main() {
  const stats = { coversBuilt: 0, coversCached: 0, lfsPointers: [], coverErrors: [], sanitized: 0 }
  const infoFiles = await listAlbumFiles(INFO_DIR, (name) => name.endsWith('.json'))
  const artFiles = await listAlbumFiles(ART_DIR, (name) => ART_EXTENSIONS.has(path.extname(name).toLowerCase()))
  const artByKey = new Map(artFiles.map((rel) => [withoutExt(rel), rel]))
  const usedArt = new Set()

  const fromInfo = await mapLimit(infoFiles, CONCURRENCY, async (rel) => {
    const file = path.join(INFO_DIR, rel)
    const data = JSON.parse(await readFile(file, 'utf8'))
    if (stripSpotify(data)) {
      await writeFile(file, JSON.stringify(data, null, 2))
      stats.sanitized++
    }

    const fromField = data.cover_file?.replace(/^Album Art[\\/]/, '').split('/').join(path.sep)
    const artRel = fromField && existsSync(path.join(ART_DIR, fromField)) ? fromField : artByKey.get(withoutExt(rel))
    if (artRel) usedArt.add(artRel)

    return {
      title: data.title,
      artist: data.artist,
      year: data.year ?? null,
      releaseDate: data.release_date ?? null,
      type: data.type ?? null,
      description: data.description ?? null,
      genres: data.genres ?? [],
      rating: data.rating ?? null,
      links: cleanLinks(data.links),
      tracklist: compactTracklist(data.tracklist),
      cover: artRel ? await buildCover(artRel, stats) : null,
      folder: path.dirname(rel),
    }
  })

  // Artwork with no matching info file (listed in Album Info/not_found.txt) still gets a spot on the shelf.
  const artOnly = artFiles.filter((rel) => !usedArt.has(rel))
  const fromArt = await mapLimit(artOnly, CONCURRENCY, async (rel) => ({
    title: path.basename(withoutExt(rel)),
    artist: path.dirname(rel),
    year: null,
    releaseDate: null,
    type: null,
    description: null,
    genres: [],
    rating: null,
    links: {},
    tracklist: null,
    cover: await buildCover(rel, stats),
    folder: path.dirname(rel),
  }))

  const albums = [...fromInfo, ...fromArt].filter((a) => a.title && a.artist)
  await writeFile(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), albums }))

  console.log(`Albums: ${albums.length} (${fromInfo.length} with info, ${fromArt.length} artwork-only)`)
  console.log(`Covers: ${stats.coversBuilt} built, ${stats.coversCached} up to date, ${albums.filter((a) => !a.cover).length} missing`)
  console.log(`Spotify data removed from ${stats.sanitized} info files`)
  if (stats.lfsPointers.length) {
    console.warn(`${stats.lfsPointers.length} artwork files are Git LFS pointers. Run \`git lfs pull\` first.`)
  }
  for (const error of stats.coverErrors) console.warn(`Cover failed: ${error}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
