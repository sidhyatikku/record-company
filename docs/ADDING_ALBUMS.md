# Adding albums

The library is built from two parallel folder trees under `data/albums/`, one folder per artist:

```text
data/albums/
├── Album Info/
│   └── 21 Savage/
│       ├── i am - i was.json
│       └── Issa Album.json
└── Album Art/            # stored with Git LFS
    └── 21 Savage/
        ├── i am - i was.jpg
        └── Issa Album.jpg
```

An album's info file and artwork file share the same artist folder and file name, differing only by extension. The shelf sorts by artist, then release date, automatically.

## 1. Add the metadata

Create `data/albums/Album Info/<Artist>/<Album title>.json`:

```json
{
  "title": "i am > i was",
  "artist": "21 Savage",
  "year": 2018,
  "release_date": "2018-12-21",
  "type": "Album",
  "description": "I Am > I Was is the second solo studio album by rapper 21 Savage…",
  "genres": ["hip hop", "trap"],
  "rating": { "value_out_of_5": 4, "votes": 4 },
  "links": {
    "musicbrainz": "https://musicbrainz.org/release-group/…",
    "wikipedia": "https://en.wikipedia.org/wiki/…"
  },
  "tracklist": { "source": "musicbrainz", "total_tracks": 15, "…": "…" }
}
```

| Field | Required | Notes |
| --- | :---: | --- |
| `title` | yes | Used for display and Deezer matching |
| `artist` | yes | Used for sorting, the A–Z section, and Deezer matching |
| `year` / `release_date` | | Secondary sort key within an artist |
| `type` | | e.g. `Album`, `EP`, `Single` |
| `description` | | Shown in the **About** panel |
| `genres` | | Rendered as pills |
| `rating` | | Star rating and vote count |
| `links` | | External references. Spotify links and IDs are stripped by the build. |
| `tracklist` | | MusicBrainz-shaped tracklist |

> **Tip:** Keep `title` and `artist` close to how they appear on Deezer. The matcher ignores case, accents, punctuation, and bracketed suffixes like "(Deluxe)", but very different spellings won't match.

## 2. Add the cover

Save square artwork (`.jpg`, `.jpeg`, `.png` or `.webp`) to `data/albums/Album Art/<Artist>/<Album title>.<ext>`, using the same name as the info file. Albums without artwork are drawn with a generated palette.

## 3. Rebuild the library

```bash
git lfs pull          # fetch artwork if you cloned without LFS
pnpm build:library
```

`scripts/build-library.mjs`:

- reads every info file and strips Spotify IDs, URLs and tokens from it,
- converts each cover to a web-sized WebP in `public/covers/<Artist>/<Album title>.webp`,
- writes the manifest `data/library.json`, which `lib/albums.ts` loads at runtime.

Commit the updated info files, `data/library.json` and `public/covers/`.

## 4. Check it

Run `pnpm dev` and then:

- [ ] The album appears under the right letter on the shelf
- [ ] Searching its title, artist, or a song name finds it
- [ ] The detail dialog shows metadata, cover and tracklist
- [ ] Previews load. Tracks Deezer doesn't carry show **No preview**.
