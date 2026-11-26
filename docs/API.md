# API reference

All routes are Next.js Route Handlers under `app/api/`. They are read-only (`GET`), need no authentication, and call no service that requires an API key.

---

## `GET /api/albums/[id]`

Returns the full record for one album.

| Param | In | Description |
| --- | --- | --- |
| `id` | path | Album slug, e.g. `21-savage-i-am-i-was` |

**200**

```json
{
  "id": "21-savage-i-am-i-was",
  "title": "i am > i was",
  "artist": "21 Savage",
  "year": 2018,
  "genres": ["hip hop", "trap"],
  "rating": { "value_out_of_5": 4, "votes": 4 },
  "tracklist": { "...": "..." }
}
```

**404**: `{ "error": "Album not found" }`

---

## `GET /api/search`

Searches every album's tracklist by song name.

| Param | In | Description |
| --- | --- | --- |
| `q` | query | Search text. Truncated to 80 characters. |

**200**

```json
{ "matches": [{ "id": "21-savage-i-am-i-was", "song": "a&t" }] }
```

Cached with `public, max-age=300, stale-while-revalidate=86400`.

---

## `GET /api/deezer/album`

Finds an album on Deezer and lists its tracks with preview URLs.

| Param | In | Description |
| --- | --- | --- |
| `id` | query | Optional Deezer album id (digits only). Skips the search when present. |
| `artist` | query | Artist name, up to 200 characters |
| `title` | query | Album title, up to 200 characters |

Pass either `id`, or both `artist` and `title`.

**200**: match found

```json
{
  "albumId": "302127",
  "tracks": [
    { "id": "3135556", "title": "a lot", "preview": "https://cdnt-preview.dzcdn.net/...", "position": 1, "disc": 1 },
    { "id": "3135557", "title": "a&t", "preview": null, "position": 3, "disc": 1 }
  ]
}
```

`preview` is `null` when Deezer has no clip for that track.

**200**: no match: `{ "albumId": null, "tracks": [] }`

**Caching:** the album search is cached for 24 h. The tracklist is never cached, because preview URLs are signed and expire.

---

## `GET /api/preview`

Resolves one track's 30-second preview and redirects to it. The player calls this when a preview URL has expired.

| Param | In | Description |
| --- | --- | --- |
| `id` | query | Optional Deezer track id (digits only) |
| `artist` | query | Artist name, for the search fallback |
| `title` | query | Track title, for the search fallback |
| `album` | query | Optional album title, used to prefer the right edition |

The route tries `id` first, then searches `artist:"…" track:"…"`, preferring a result from the same album.

**302**: redirects to the `https://*.dzcdn.net` audio URL (`Cache-Control: private, max-age=900`)

**404**: `{ "error": "Preview not found" }`

---

## Input safety

- Free-text params are trimmed, stripped of `"` and `\`, and rejected above 200 characters. This stops them from breaking out of Deezer's quoted search syntax.
- Numeric ids must match `^\d{1,15}$`.
- Only `https:` URLs on `*.dzcdn.net` are returned or followed as previews, so the routes can't be used as an open redirect.
