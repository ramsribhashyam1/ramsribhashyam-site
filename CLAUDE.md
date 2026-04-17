# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (localhost:4321)
npm run build      # production build → dist/
npm run preview    # preview built site locally
```

No test suite or linter is configured yet. TypeScript errors surface during `npm run build` — always run a build to verify changes.

## What this is

Personal website for Sai Sri Ram Sribhashyam — refined editorial design, not a developer portfolio. Stack: **Astro 6 + Sveltia CMS + Vercel + GitHub**. Fully static output. All content lives as MDX/JSON files; no database.

Deploy: git push → Vercel auto-builds. CMS: `/admin` (Sveltia CMS backed by GitHub OAuth).

## Architecture

### Content collections (`src/content/`)
Three Astro content collections defined in `src/content/config.ts`:

- **`work/`** — MDX files. Case studies and publications. Schema includes `org`, `role`, `dateStart/End`, `category` (project/publication/tool), `domains[]`, `countries[]` (ISO codes), `impact`, `featured`, `draft`.
- **`foundry/`** — MDX files. Essays, notes, experiments, diagrams, external link-posts. Schema includes `type` (essay/note/experiment/diagram/framework/external), `source` (site/substack/linkedin), `externalUrl`, `excerpt`, `tags[]`.
- **`fieldwork/`** — JSON files, one per country (e.g. `IN.json`). Powers the D3 world map. Schema: `countryCode` (ISO alpha-2), `countryName`, `region`, `roles[]`.

### Design system
Plain CSS with custom properties — no Tailwind, no CSS-in-JS.
- `src/styles/tokens.css` — all design tokens (colors, type scale, spacing, layout widths). Supports `prefers-color-scheme: dark` via `:root` overrides.
- `src/styles/global.css` — imports tokens, font loading, reset, base typography, utility classes (`.container`, `.badge`, type badges).
- Colors: `--color-bg`, `--color-accent` (#1A3A2A deep forest in light mode), `--color-text-primary/secondary/tertiary`.
- Layout: `--max-width: 72rem`, `--content-width: 48rem`.

### World map
`src/components/WorldMap.astro` — D3 + TopoJSON rendered client-side. Loads `public/world-110m.json`. Worked countries highlighted with `--color-accent`. Hover shows roles from fieldwork collection. Click navigates to `/work?country=XX`. Country ISO alpha-2 must map to TopoJSON numeric IDs.

### Layouts
- `Base.astro` — HTML shell, meta tags, font loading, global CSS import.
- `Page.astro` — standard page wrapper with nav + footer.
- `Post.astro` — long-form reading layout (constrained `--content-width`).

### CLI scripts (`scripts/`)
Run with `npx ts-node scripts/<name>.ts`. Minimal dependencies — use Node built-ins + fetch.
- `add-post.ts <url>` — fetches LinkedIn/Substack URL, extracts OG metadata, writes MDX to `src/content/foundry/`, commits and pushes.
- `add-work.ts` — interactive readline prompts → MDX in `src/content/work/`.
- `audit-content.ts` — checks for missing frontmatter, drafts >30 days old, external posts missing `externalUrl`.

### CMS
`public/admin/config.yml` — Sveltia CMS config mapping to all three content collections. Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` env vars in Vercel for GitHub OAuth.

## Key constraints

- TypeScript strict mode throughout.
- All pages are static — no SSR.
- CSS is plain custom properties only — no utility frameworks.
- `d3-geo` types: use `@types/d3` (already installed); `d3-geo` types are included within it.
- `world-110m.json` must be present in `public/` for the map to work (`curl -o public/world-110m.json https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`).
- Mobile responsive required — use CSS Grid and `clamp()`.
