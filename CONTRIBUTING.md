# Contributing

Thanks for helping improve Sid's Record Shelf.

## Getting set up

```bash
git clone https://github.com/sidhyatikku/record-company.git
cd record-company
corepack enable
pnpm install
pnpm dev
```

See the [README](README.md#quick-start) for prerequisites.

## Workflow

1. **Branch from `main`.** Use a short, descriptive name, e.g. `feat/song-search` or `fix/cd-hover`.
2. **Keep changes focused.** One feature or fix per pull request.
3. **Write clear commits** in the imperative mood: "Add song search", not "Added song search".
4. **Open a pull request** using the template, and include screenshots for anything visual.

`main` deploys to production, so never push to it directly.

## Code guidelines

- **TypeScript everywhere.** Run `npx tsc --noEmit` before pushing.
- **Components** live in `components/shelf/`. Keep them small and single-purpose.
- **Styles.** Shelf and format visuals belong in `app/shelf.css` and `app/formats.css`. Use Tailwind utilities for layout.
- **Data fetching.** Use SWR on the client and Route Handlers on the server. Don't fetch inside `useEffect`.
- **External input.** Validate and bound any query param before it reaches a third-party API (see [docs/API.md](docs/API.md#input-safety)).
- **Accessibility.** Interactive items must be keyboard-reachable and labelled. Respect `prefers-reduced-motion`.

## Pull request checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `pnpm build` succeeds
- [ ] Tested in all four shelf formats (Vinyl, Cassette, CD, Digital) if the shelf changed
- [ ] Tested items at the left and right edges of a shelf if hover behavior changed
- [ ] Screenshots attached for visual changes
- [ ] Docs updated if behavior or APIs changed

## Reporting issues

Use the issue templates for [bug reports](.github/ISSUE_TEMPLATE/bug_report.md) and [feature requests](.github/ISSUE_TEMPLATE/feature_request.md).
