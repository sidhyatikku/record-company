<div align="center">

# Sid's Record Shelf

**A skeuomorphic, iOS 6–inspired music library for browsing a 1,973-album collection — as vinyl, cassettes, CDs, or a digital grid — with 30-second song previews from Deezer.**

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Deezer](https://img.shields.io/badge/Previews-Deezer-A238FF?logo=deezer&logoColor=white)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

![Vinyl shelf](docs/images/vinyl.png)

</div>

---

## Contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Adding your own albums](#adding-your-own-albums)
- [Documentation](#documentation)
- [Contributing](#contributing)

## What it does

Sid's Record Shelf turns a music collection into a wooden bookcase you can browse like a real one.

| Feature | Description |
| --- | --- |
| **Four shelf formats** | Switch between **Vinyl**, **Cassette**, **CD**, and **Digital** with an iOS 6–style segmented control. Each format has its own spines, cases, and hover physics. |
| **A–Z sections** | Albums are sorted by artist, then release date, and grouped under lettered tabs. |
| **Pull-out hover** | Hover a spine to pull the record, tape, or case off the shelf and tilt it toward you. Items near a shelf edge stay inside the bookcase, and a held item stays put while you move onto it to click. |
| **Album detail view** | Click any item to open a dialog with cover art, the matching format stage (a record sliding from its sleeve, a cassette, a CD peeking from its jewel case), metadata, genres, ratings, and the full tracklist. |
| **30-second previews** | Tracks are matched to Deezer on the server and played through a skeuomorphic player with seek, volume, shuffle, and next/previous. |
| **Clear preview states** | A loader shows while previews are fetched from Deezer. Songs without a preview are marked **No preview** and skipped automatically. |
| **Search** | Search by **artist, album, or song name**. A song match shows the album that contains it on the shelf. |
| **Shuffle** | Open a random album from the collection. |

## Screenshots

| Cassette | CD |
| :---: | :---: |
| ![Cassette view](docs/images/cassette.png) | ![CD view](docs/images/cd.png) |
| **Digital** | **Album detail** |
| ![Digital view](docs/images/digital.png) | ![Album detail with player](docs/images/album-detail.png) |

<details>
<summary><strong>Song search</strong></summary>

Searching for a song (here, <code>a&amp;t</code>) narrows the shelf to the album that contains it.

![Song search](docs/images/song-search.png)

</details>

## Quick start

### Prerequisites

- **Node.js 20.9+** (required by Next.js 16)
- **pnpm** (the repo pins its version in `package.json` → `packageManager`; enable it with `corepack enable`)

### Run locally

```bash
git clone https://github.com/sidhyatikku/record-company.git
cd record-company
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server (Turbopack) |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |

### Environment variables

**None are required.** Deezer's public API needs no key, and all album data ships with the repo.

### Deploy

The app is a standard Next.js project, so it deploys to [Vercel](https://vercel.com/new) with no extra configuration.

## How it works

```mermaid
flowchart LR
  subgraph Browser
    UI[Shelf UI<br/>Vinyl · Cassette · CD · Digital]
    Dialog[Album dialog<br/>+ player]
  end

  subgraph "Next.js server"
    Albums["/api/albums/[id]"]
    Search["/api/search"]
    DzAlbum["/api/deezer/album"]
    Preview["/api/preview"]
    Data[(data/library.json<br/>built from data/albums/)]
  end

  Deezer[(Deezer public API)]
  CDN[(Deezer audio CDN<br/>*.dzcdn.net)]

  UI -->|song search| Search --> Data
  UI -->|open album| Dialog
  Dialog --> Albums --> Data
  Dialog -->|match tracks| DzAlbum --> Deezer
  Dialog -->|play / refresh expired URL| Preview --> Deezer
  Preview -.302 redirect.-> CDN
  Dialog -->|audio stream| CDN
```

1. **Collection data.** `pnpm build:library` reads the per-artist folders in `data/albums/`, writes the manifest `data/library.json` and web-sized covers in `public/covers/`. `lib/albums.ts` loads that manifest at runtime.
2. **Shelf rendering.** `components/shelf/` renders the bookcase for the selected format, grouped into A–Z sections.
3. **Track matching.** When an album opens, `/api/deezer/album` finds the album on Deezer and returns each track's preview URL, or `null` when Deezer has none.
4. **Playback.** `use-album-player.ts` drives a single `<audio>` element. If a signed preview URL has expired, it asks `/api/preview` for a fresh one. Tracks with no preview are marked unavailable and skipped.

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the full breakdown.

## Project structure

```text
.
├── app/
│   ├── api/
│   │   ├── albums/[id]/route.ts   # Full album record by id
│   │   ├── deezer/album/route.ts  # Match an album on Deezer, list track previews
│   │   ├── preview/route.ts       # Resolve one track's preview → 302 to Deezer CDN
│   │   └── search/route.ts        # Song-name search across tracklists
│   ├── globals.css                # Tailwind v4 + design tokens
│   ├── shelf.css                  # Bookcase, vinyl, dialog, player styles
│   ├── formats.css                # Cassette, CD, digital styles
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── shelf/                     # All shelf, dialog, and player components
│   └── ui/                        # shadcn/ui primitives
├── data/
│   ├── albums/
│   │   ├── Album Info/<Artist>/   # Album metadata (JSON), one folder per artist
│   │   └── Album Art/<Artist>/    # Original artwork (Git LFS)
│   └── library.json               # Generated manifest (pnpm build:library)
├── scripts/
│   └── build-library.mjs          # Builds the manifest + WebP covers
├── lib/
│   ├── albums.ts                  # Collection builder, sorting, search
│   └── types.ts                   # Shared types
├── public/
│   ├── covers/<Artist>/           # Generated WebP artwork
│   └── textures/wood.png          # Shelf texture
└── docs/                          # Project documentation
```

## Adding your own albums

1. Save the album's metadata as `data/albums/Album Info/<Artist>/<Album title>.json`.
2. Save its artwork with the same name under `data/albums/Album Art/<Artist>/`.
3. Run `pnpm build:library`.

The schema and a full walkthrough are in **[docs/ADDING_ALBUMS.md](docs/ADDING_ALBUMS.md)**.

## Documentation

| Doc | Covers |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Data flow, components, player state machine, hover mechanics |
| [API reference](docs/API.md) | Every route handler, its parameters, and responses |
| [Adding albums](docs/ADDING_ALBUMS.md) | Album JSON schema and how to register new records |
| [Contributing](CONTRIBUTING.md) | Branching, commits, and pull request checklist |
| [Changelog](CHANGELOG.md) | Notable changes |

## Contributing

Contributions are welcome. Read **[CONTRIBUTING.md](CONTRIBUTING.md)** before opening a pull request.

## Acknowledgements

- Song previews come from the [Deezer API](https://developers.deezer.com/api). Previews are 30-second clips; availability depends on Deezer's licensing per track and region.
- Album metadata comes from [MusicBrainz](https://musicbrainz.org/) and the sources linked in each album file.
- Visual direction is inspired by the wooden bookshelves of iOS 6.

---

<div align="center">
<sub>Built with Next.js · Made for record collectors</sub>
</div>
