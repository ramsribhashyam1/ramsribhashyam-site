# Personal Website — Claude Code Execution Brief
# Ram (Sai Sri Ram Sribhashyam) · saisriram.com
# Stack: Astro + Sveltia CMS + Vercel + GitHub

---

## WHAT YOU ARE BUILDING

A personal website for a senior AI/development professional with 12 years across
World Bank, Tony Blair Institute, Mu Sigma, and Grameen Foundation. The site has
6 sections, is fully CMS-managed, deploys automatically on git push, and has a
Claude Code CLI automation layer for publishing content from URLs.

The site should feel like a living intellectual presence — not a static CV.
Design direction: refined editorial. Clean typography, generous whitespace,
confident hierarchy. NOT a developer portfolio. NOT a corporate consultant site.

---

## PHASE 0 — SETUP (run first, confirm before proceeding)

```bash
# 1. Scaffold Astro project
npm create astro@latest saisriram-site -- --template minimal --typescript strict --no-install
cd saisriram-site

# 2. Install all dependencies in one shot
npm install
npm install @astrojs/mdx @astrojs/sitemap @astrojs/rss
npm install d3 d3-geo topojson-client
npm install sharp
npm install -D @types/d3 @types/topojson-client

# 3. Confirm Node version >= 18
node --version

# 4. Init git
git init
git add .
git commit -m "init: astro scaffold"
```

---

## PHASE 1 — FILE STRUCTURE

Create this exact structure:

```
saisriram-site/
├── public/
│   ├── admin/              ← Sveltia CMS lives here
│   │   ├── index.html
│   │   └── config.yml
│   ├── fonts/              ← self-hosted fonts
│   └── world-110m.json     ← TopoJSON world map data (download in setup)
│
├── src/
│   ├── content/            ← ALL content lives here as MDX/JSON
│   │   ├── work/           ← case studies + publications
│   │   ├── foundry/        ← essays, notes, experiments, diagrams
│   │   └── fieldwork/      ← country data for world map
│   │
│   ├── components/
│   │   ├── WorldMap.astro      ← D3 interactive world map
│   │   ├── WorkCard.astro      ← case study card
│   │   ├── FoundryCard.astro   ← foundry item card
│   │   ├── Nav.astro           ← site navigation
│   │   ├── Footer.astro
│   │   └── NowBlock.astro      ← homepage "what I'm working on"
│   │
│   ├── layouts/
│   │   ├── Base.astro          ← HTML shell, meta, fonts
│   │   ├── Page.astro          ← standard page wrapper
│   │   └── Post.astro          ← long-form reading layout
│   │
│   ├── pages/
│   │   ├── index.astro         ← homepage
│   │   ├── work/
│   │   │   ├── index.astro     ← work + publications index
│   │   │   └── [slug].astro    ← individual case study
│   │   ├── foundry/
│   │   │   ├── index.astro     ← foundry feed
│   │   │   └── [slug].astro    ← individual foundry post
│   │   ├── about.astro
│   │   ├── fieldwork.astro     ← world map page
│   │   └── rss.xml.js          ← RSS feed
│   │
│   ├── styles/
│   │   ├── global.css          ← CSS custom properties, reset, typography
│   │   └── tokens.css          ← design tokens
│   │
│   └── lib/
│       └── content.ts          ← content collection helpers
│
├── scripts/                ← Claude Code CLI skills
│   ├── add-post.ts         ← ingest post from URL
│   ├── add-work.ts         ← add work/case study entry
│   └── audit-content.ts    ← consistency checker
│
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## PHASE 2 — CONTENT SCHEMAS

### 2a. Astro Content Collections Config
**File: `src/content/config.ts`**

```typescript
import { defineCollection, z } from 'astro:content';

// Work collection — case studies AND publications
const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    org: z.string(),                          // "World Bank", "Tony Blair Institute"
    role: z.string(),                         // "AI Product Manager", "Senior Advisor"
    dateStart: z.string(),                    // "2022-01"
    dateEnd: z.string(),                      // "2026-01" or "present"
    category: z.enum(['project', 'publication', 'tool']),
    domains: z.array(z.string()),             // ["AI", "labor markets", "education"]
    countries: z.array(z.string()),           // ISO codes: ["IN", "RW", "MA", "BA"]
    impact: z.string().optional(),            // "300+ job placements"
    mediaLinks: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
    policyLinks: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
    externalUrl: z.string().optional(),       // for publications linking to papers
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// Foundry collection — essays, notes, experiments, diagrams
const foundry = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),                         // "2026-04-16"
    type: z.enum([
      'essay',        // long-form, native post, full reading page
      'note',         // short, raw, quick thought
      'experiment',   // AI tool exploration, demo
      'diagram',      // visual explainer
      'framework',    // structured thinking piece
      'external',     // LinkedIn or Substack link-post
    ]),
    source: z.enum(['site', 'substack', 'linkedin']).default('site'),
    externalUrl: z.string().optional(),       // required if source != 'site'
    excerpt: z.string(),                      // 1-2 sentences, shown in feed
    tags: z.array(z.string()),               // ["AI", "labor markets", "LMIS"]
    draft: z.boolean().default(false),
  }),
});

// Fieldwork collection — one entry per country
const fieldwork = defineCollection({
  type: 'data',
  schema: z.object({
    countryCode: z.string(),                  // ISO 3166-1 alpha-2: "IN", "RW"
    countryName: z.string(),
    region: z.string(),                       // "South Asia", "Sub-Saharan Africa"
    roles: z.array(z.object({
      org: z.string(),
      title: z.string(),
      years: z.string(),                      // "2022–2026"
      summary: z.string(),                    // shown on map hover, 1 sentence
    })),
  }),
});

export const collections = { work, foundry, fieldwork };
```

---

## PHASE 3 — SAMPLE CONTENT

### 3a. Work entry — ACE Rwanda
**File: `src/content/work/ace-rwanda-credentialing.mdx`**

```mdx
---
title: "Blockchain credentialing & job matching platform"
org: "World Bank — African Centres for Excellence"
role: "Product Manager, Digital Transformation"
dateStart: "2019-01"
dateEnd: "2022-01"
category: "project"
domains: ["AI", "education", "digital infrastructure", "credentialing"]
countries: ["RW", "GH", "NG", "TZ", "KE", "ET", "SN", "CM"]
impact: "300+ verified job placements across 8 universities"
featured: true
---

## The problem

Eight Sub-Saharan African universities had graduates with genuine capability
and no way to prove it. Employers couldn't see what students knew. The gap
wasn't skill — it was legibility.

## What was built

A first-of-kind blockchain-based digital credentialing platform combined with
an AI-powered skills assessment pipeline. Graduate competency constructs mapped
to employer-facing skill signals. Inter-rater reliability protocols across
different curricula, languages, and data systems.

## What changed

300+ verified job placements. A GIZ collaboration. A platform that is still
running. And one conversation on Mt. Kigali — a University of Rwanda student
with a Master's in IoT who couldn't find work — that became the compass for
everything that followed.
```

### 3b. Foundry entry — native essay
**File: `src/content/foundry/what-lmis-actually-need.mdx`**

```mdx
---
title: "What a 21st century LMIS actually needs"
date: "2026-04-16"
type: "essay"
source: "site"
excerpt: "Most labour market information systems are built to report on the past. Here's what it would take to build one that actually helps people make decisions."
tags: ["LMIS", "labor markets", "data infrastructure", "policy"]
---

## The problem with how we measure labor markets...
```

### 3c. Foundry entry — external LinkedIn post (auto-ingested via CLI)
**File: `src/content/foundry/ai-for-everyone-claude-site.mdx`**

```mdx
---
title: "Finally, Claude coded my personal website"
date: "2026-04-16"
type: "external"
source: "linkedin"
externalUrl: "https://linkedin.com/posts/..."
excerpt: "The barrier to building something like this is not technical skill anymore. It's just knowing what you want."
tags: ["AI tools", "Claude", "personal site"]
---
```

### 3d. Fieldwork entry — India
**File: `src/content/fieldwork/IN.json`**

```json
{
  "countryCode": "IN",
  "countryName": "India",
  "region": "South Asia",
  "roles": [
    {
      "org": "Tony Blair Institute",
      "title": "Senior Advisor",
      "years": "2025",
      "summary": "Advised Andhra Pradesh government on AI-enabled education-to-employment platform across 5 ministries."
    },
    {
      "org": "World Bank",
      "title": "AI Product Manager",
      "years": "2022–2026",
      "summary": "Labor market diagnostics, NLP pipeline over 100K+ job postings, skills taxonomy for South Asia."
    }
  ]
}
```

---

## PHASE 4 — SVELTIA CMS CONFIG

**File: `public/admin/config.yml`**

```yaml
backend:
  name: github
  repo: YOUR_GITHUB_USERNAME/saisriram-site
  branch: main

media_folder: public/images
public_folder: /images

collections:
  - name: work
    label: Work & Publications
    folder: src/content/work
    create: true
    extension: mdx
    format: frontmatter
    fields:
      - { name: title, label: Title, widget: string }
      - { name: org, label: Organisation, widget: string }
      - { name: role, label: Role title, widget: string }
      - { name: dateStart, label: Start date, widget: string, hint: "YYYY-MM" }
      - { name: dateEnd, label: End date, widget: string, hint: "YYYY-MM or present" }
      - name: category
        label: Category
        widget: select
        options: [project, publication, tool]
      - { name: domains, label: Domains, widget: list }
      - { name: countries, label: Countries (ISO codes), widget: list }
      - { name: impact, label: Impact metric, widget: string, required: false }
      - { name: featured, label: Featured, widget: boolean, default: false }
      - { name: draft, label: Draft, widget: boolean, default: false }
      - { name: body, label: Content, widget: markdown }

  - name: foundry
    label: The Foundry
    folder: src/content/foundry
    create: true
    extension: mdx
    format: frontmatter
    fields:
      - { name: title, label: Title, widget: string }
      - { name: date, label: Date, widget: datetime, format: YYYY-MM-DD }
      - name: type
        label: Type
        widget: select
        options: [essay, note, experiment, diagram, framework, external]
      - name: source
        label: Source
        widget: select
        options: [site, substack, linkedin]
        default: site
      - { name: externalUrl, label: External URL, widget: string, required: false }
      - { name: excerpt, label: Excerpt, widget: text }
      - { name: tags, label: Tags, widget: list }
      - { name: draft, label: Draft, widget: boolean, default: false }
      - { name: body, label: Content, widget: markdown, required: false }

  - name: now
    label: Now (homepage)
    files:
      - name: now
        label: Current focus
        file: src/content/now.md
        fields:
          - { name: focus, label: Current focus, widget: text }
          - { name: reading, label: Currently reading, widget: string }
          - { name: building, label: Currently building, widget: string }
          - { name: updated, label: Last updated, widget: string }
```

**File: `public/admin/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
</head>
<body>
  <script src="https://unpkg.com/sveltia-cms/dist/sveltia-cms.js"></script>
</body>
</html>
```

---

## PHASE 5 — DESIGN SYSTEM

**File: `src/styles/tokens.css`**

```css
:root {
  /* Typography */
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-body: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;

  /* Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* Colors — light mode */
  --color-bg: #FAFAF8;
  --color-surface: #F4F3EF;
  --color-border: #E5E4DF;
  --color-text-primary: #1A1A18;
  --color-text-secondary: #5C5C58;
  --color-text-tertiary: #9C9A94;
  --color-accent: #1A3A2A;       /* deep forest — serious, not corporate */
  --color-accent-light: #E8F0EC;

  /* Layout */
  --max-width: 72rem;
  --content-width: 48rem;
  --nav-height: 4rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111110;
    --color-surface: #1C1C1A;
    --color-border: #2A2A28;
    --color-text-primary: #F0EFE9;
    --color-text-secondary: #A8A79F;
    --color-text-tertiary: #6A6A64;
    --color-accent: #6BAE8A;
    --color-accent-light: #1A2820;
  }
}
```

**File: `src/styles/global.css`**

```css
@import './tokens.css';

/* Font loading */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  scroll-behavior: smooth;
}

body { min-height: 100vh; }

/* Typography */
h1, h2, h3 { font-family: var(--font-display); font-weight: 400; line-height: 1.15; }
h1 { font-size: var(--text-5xl); }
h2 { font-size: var(--text-3xl); }
h3 { font-size: var(--text-xl); }
p { line-height: 1.75; color: var(--color-text-secondary); }

a { color: inherit; text-decoration: none; }
a:hover { color: var(--color-accent); }

/* Utility */
.container { max-width: var(--max-width); margin: 0 auto; padding: 0 var(--space-6); }
.content-width { max-width: var(--content-width); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }

/* Type badges */
.badge {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.badge.essay    { background: #EEEDFE; color: #534AB7; border-color: #AFA9EC; }
.badge.note     { background: var(--color-surface); }
.badge.external { background: #E1F5EE; color: #0F6E56; border-color: #5DCAA5; }
.badge.project  { background: #FAEEDA; color: #854F0B; border-color: #EF9F27; }
.badge.publication { background: var(--color-surface); color: var(--color-text-secondary); }
```

---

## PHASE 6 — KEY PAGES

### 6a. Homepage
**File: `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import WorldMap from '../components/WorldMap.astro';
import NowBlock from '../components/NowBlock.astro';
import { getCollection } from 'astro:content';

const featuredWork = await getCollection('work', ({ data }) =>
  data.featured && !data.draft
);
const recentFoundry = (await getCollection('foundry', ({ data }) => !data.draft))
  .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
  .slice(0, 3);
---

<Base title="Sai Sri Ram Sribhashyam">
  <main>
    <!-- Hero: sparse, confident -->
    <section class="hero container">
      <p class="hero-label">Sai Sri Ram Sribhashyam</p>
      <h1 class="hero-line">
        <!-- Opening line goes here — placeholder until Ram writes it -->
        Building bridges between human capability<br/>and institutional legibility.
      </h1>
      <p class="hero-sub">
        AI systems · Labor markets · Digital public infrastructure · 15 countries
      </p>
      <nav class="hero-nav">
        <a href="/work">Work</a>
        <a href="/foundry">The Foundry</a>
        <a href="/about">About</a>
      </nav>
    </section>

    <!-- World map — the centerpiece -->
    <section class="map-section">
      <WorldMap />
    </section>

    <!-- Now block -->
    <section class="now-section container">
      <NowBlock />
    </section>

    <!-- Recent foundry -->
    <section class="recent-section container">
      <h2 class="section-heading">Recent from the Foundry</h2>
      <!-- render recentFoundry cards -->
    </section>
  </main>
</Base>

<style>
.hero { padding: var(--space-24) 0 var(--space-16); }
.hero-label { font-size: var(--text-sm); color: var(--color-text-tertiary); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: var(--space-4); }
.hero-line { font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; color: var(--color-text-primary); margin-bottom: var(--space-6); max-width: 22ch; }
.hero-sub { font-size: var(--text-base); color: var(--color-text-tertiary); margin-bottom: var(--space-8); }
.hero-nav { display: flex; gap: var(--space-6); font-size: var(--text-sm); font-weight: 500; }
.hero-nav a { color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); padding-bottom: 2px; transition: color .15s, border-color .15s; }
.hero-nav a:hover { color: var(--color-accent); border-color: var(--color-accent); }
.map-section { width: 100%; height: 480px; background: var(--color-surface); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); overflow: hidden; }
.section-heading { font-family: var(--font-display); font-size: var(--text-2xl); margin-bottom: var(--space-8); color: var(--color-text-primary); }
</style>
```

### 6b. World Map Component
**File: `src/components/WorldMap.astro`**

```astro
---
import { getCollection } from 'astro:content';
const fieldworkData = await getCollection('fieldwork');
const fieldworkJson = JSON.stringify(fieldworkData.map(e => e.data));
---

<div id="world-map" style="width:100%;height:100%"></div>

<script define:vars={{ fieldworkJson }}>
const fieldwork = JSON.parse(fieldworkJson);
const workedCountries = new Set(fieldwork.map(f => f.countryCode));

// D3 world map — loads TopoJSON, colors worked countries, hover tooltip
// Full D3 implementation: import d3, topojson from CDN
// Color worked countries with var(--color-accent)
// On hover: show org, title, years, summary from fieldwork data
// On click: filter /work page by country

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
script.onload = () => {
  const s2 = document.createElement('script');
  s2.src = 'https://cdn.jsdelivr.net/npm/topojson@3/dist/topojson.min.js';
  s2.onload = initMap;
  document.head.appendChild(s2);
};
document.head.appendChild(script);

function initMap() {
  // BUILD MAP HERE — Claude Code writes full D3 implementation
  // Key behaviors:
  // 1. Projection: Natural Earth or Equal Earth
  // 2. Worked countries: filled with accent color, others surface color
  // 3. Hover: tooltip showing roles array for that country
  // 4. Click: navigates to /work?country=XX
  // 5. Responsive: redraws on resize
  console.log('Map init — implement with D3 + TopoJSON');
}
</script>
```

---

## PHASE 7 — CLI AUTOMATION SKILLS

### 7a. Add post from URL
**File: `scripts/add-post.ts`**

```typescript
#!/usr/bin/env npx ts-node
/**
 * Usage: npx ts-node scripts/add-post.ts <url>
 *
 * Fetches a LinkedIn or Substack URL, extracts metadata,
 * creates an MDX file in src/content/foundry/,
 * commits and pushes to GitHub.
 *
 * Claude Code: implement the full fetch + parse + write + commit logic.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const url = process.argv[2];
if (!url) { console.error('Usage: add-post.ts <url>'); process.exit(1); }

const source = url.includes('linkedin') ? 'linkedin'
             : url.includes('substack') ? 'substack'
             : 'site';

// Step 1: Fetch page and extract metadata
// Use fetch() to get the URL
// Parse: title (og:title), description (og:description), date (og:article:published_time or meta)
// If fetch fails, prompt user to provide title/excerpt manually

// Step 2: Generate slug from title
// kebab-case, lowercase, max 60 chars

// Step 3: Write MDX file
const template = (meta: any) => `---
title: "${meta.title}"
date: "${meta.date}"
type: "external"
source: "${source}"
externalUrl: "${url}"
excerpt: "${meta.excerpt}"
tags: []
---
`;

// Step 4: Commit and push
// git add .
// git commit -m "content: add ${source} post — ${title}"
// git push origin main

console.log(`✓ Post added and pushed. Live in ~45 seconds.`);
```

### 7b. Add work entry
**File: `scripts/add-work.ts`**

```typescript
#!/usr/bin/env npx ts-node
/**
 * Usage: npx ts-node scripts/add-work.ts
 *
 * Interactive CLI that prompts for work entry fields,
 * creates the MDX file, commits and pushes.
 *
 * Claude Code: implement readline prompts for each required field.
 */
```

### 7c. Content audit
**File: `scripts/audit-content.ts`**

```typescript
#!/usr/bin/env npx ts-node
/**
 * Usage: npx ts-node scripts/audit-content.ts
 *
 * Checks all content files for:
 * - Missing required frontmatter fields
 * - External posts missing externalUrl
 * - Work entries missing countries or domains
 * - Foundry posts missing excerpt
 * - Draft posts older than 30 days (reminder to publish or delete)
 *
 * Claude Code: implement full audit with colored console output.
 */
```

---

## PHASE 8 — VERCEL + GITHUB CONFIG

**File: `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

**File: `.github/workflows/deploy.yml`** (optional — Vercel auto-detects pushes)

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
```

---

## PHASE 9 — WORLD MAP DATA

```bash
# Download world map TopoJSON (110m resolution — good balance of detail/size)
curl -o public/world-110m.json \
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
```

Country ISO code → TopoJSON numeric ID mapping needed for D3.
Use `https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes` as reference.

---

## EXECUTION ORDER FOR CLAUDE CODE

Run phases in this exact order. Confirm each phase before proceeding.

1. **Phase 0** — Scaffold + install. Confirm all packages installed, git init done.
2. **Phase 1** — Create file structure (empty files/folders). Confirm tree matches spec.
3. **Phase 2** — Write `src/content/config.ts`. Run `npm run build` — must compile clean.
4. **Phase 3** — Write sample content files. Build again — must compile clean.
5. **Phase 4** — Write Sveltia CMS config. Confirm `public/admin/` exists.
6. **Phase 5** — Write design tokens and global CSS.
7. **Phase 6** — Build homepage, world map component, nav, footer.
8. **Phase 7** — Write all pages: work index, work slug, foundry index, foundry slug, about, fieldwork.
9. **Phase 8** — Write CLI scripts.
10. **Phase 9** — Download world map data. Wire up D3 in WorldMap component.
11. **Final** — Full build. Fix any TypeScript or Astro errors. Deploy to Vercel.

---

## CONTENT TO POPULATE (Ram provides these)

After the skeleton is live, populate with real data:

### Work entries to create:
- ACE Rwanda — blockchain credentialing, 8 universities, 300+ placements
- World Bank GIA — AI-powered audit platform, $2B+ portfolio, Atlas AI
- World Bank Education — NLP pipeline 100K+ job postings, MENA bias finding, WBG flagship chapter
- Tony Blair Institute — AP government AI platform, 5 ministries
- WeBa+ proposal — Western Balkans Labour Market Observatory
- Grameen Foundation — impact evaluations, livelihoods/conservation
- Mu Sigma — pharmaceutical predictive analytics, $2M+ revenue impact

### Publications to create:
- "Choosing Our Future" — WBG flagship, green skills chapter
- "Demand for Green and Digital Skills in MENA Region" (2024)
- ADB TA 59339-001 — India labor market LMIS (in progress)

### Fieldwork entries to create:
Countries: IN, RW, MA, JO, LB, BA, RS, MK, AL, ME, XK, GH, NG, TZ, US

### About page content:
- Arc: BITS Pilani → Mu Sigma → Grameen → World Bank → TBI → now
- Story 1: Rwanda / Mt. Kigali (use exact text from cover letter stories)
- Story 2: Andhra Pradesh ministers and AI
- What's next: SF, open to senior roles in AI + development

---

## NOTES FOR CLAUDE CODE

1. Use TypeScript throughout — strict mode.
2. Astro content collections handle all type safety — lean on them.
3. The world map D3 implementation is the hardest part — write it last.
4. CSS is plain CSS with custom properties — no Tailwind, no CSS-in-JS.
5. All pages are static — no server-side rendering needed.
6. The `scripts/` folder uses ts-node — keep dependencies minimal.
7. Sveltia CMS requires GitHub OAuth — Ram sets this up in Vercel env vars.
8. The opening line on the homepage is a placeholder — Ram will replace it.
9. Mobile responsive is required — use CSS Grid and clamp() throughout.
10. No analytics script yet — Ram adds Plausible later.
