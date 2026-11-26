# Adding albums

The shelf always shows 1,973 slots. Each real album you add replaces a placeholder, and the shelf re-sorts by artist and release date automatically.

## 1. Add the metadata

Create `data/albums/<slug>.json`. Use a lowercase, hyphenated slug of artist and title, e.g. `21-savage-i-am-i-was`.

```json
{
  "title": "i am > i was",
  "artist": "21 Savage",
  "year": 2018,
  "release_date": "2018-12-21",
  "type": "Album",
  "description": "I Am > I Was is the second solo studio album by rapper 21 Savage…",
  "genres": ["hip hop", "pop", "southern hip hop", "trap"],
  "rating": { "value_out_of_5": 4, "votes": 4 },
  "links": {
    "musicbrainz": "https://musicbrainz.org/release-group/…",
    "wikipedia": "https://en.wikipedia.org/wiki/…"
  },
  "tracklist": {
    "source": "musicbrainz",
    "total_tracks": 15,
    "…": "see data/albums/21-savage-i-am-i-was.json for the full shape"
  }
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
| `links` | | External references |
| `tracklist` | | MusicBrainz-shaped tracklist. Copy the structure from the existing example. |

> **Tip:** Keep `title` and `artist` close to how they appear on Deezer. The matcher ignores case, accents, punctuation, and bracketed suffixes like "(Deluxe)", but very different spellings won't match.

## 2. Add the cover

Save square artwork to `public/covers/<slug>.jpg`. About 600×600 px or larger looks sharp in the detail dialog.

## 3. Register it

Import the JSON in `data/real-albums.ts` and add an entry:

```ts
import iAmIWas from './albums/21-savage-i-am-i-was.json'
import myAlbum from './albums/my-artist-my-album.json'

export const realAlbums: { data: RawAlbum; cover: string | null }[] = [
  { data: iAmIWas, cover: '/covers/21-savage-i-am-i-was.jpg' },
  { data: myAlbum, cover: '/covers/my-artist-my-album.jpg' },
]
```

Use `cover: null` if you don't have artwork yet. The album is drawn with a generated palette instead.

## 4. Check it

Run `pnpm dev` and then:

- [ ] The album appears under the right letter on the shelf
- [ ] Searching its title, artist, or a song name finds it
- [ ] The detail dialog shows metadata and the tracklist
- [ ] Previews load. Tracks Deezer doesn't carry show **No preview**.
