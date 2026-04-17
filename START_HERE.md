# Claude Code Session Starter

Paste this as your first message when you open Claude Code:

---

I am building my personal website. The complete technical brief is in
`CLAUDE_CODE_BRIEF.md` in this folder. Read it fully before doing anything.

Then execute Phase 0 through Phase 9 in order, confirming with me after each phase.

Key things to know:
- Stack: Astro + Sveltia CMS + Vercel + GitHub. Fully free.
- Design: refined editorial, clean typography, no frameworks like Tailwind.
- The world map is D3-geo — interactive, shows 15+ countries I worked in.
- All content is MDX files managed by git — no database.
- There is a CLI automation layer in /scripts for publishing from URLs.

Start with Phase 0. Show me the commands before running them.

---

## One-time Vercel + GitHub setup (do this before deploying)

1. Push repo to GitHub: `git remote add origin https://github.com/YOUR_USERNAME/saisriram-site.git`
2. Go to vercel.com → New Project → Import from GitHub → select the repo
3. Vercel auto-detects Astro — just click Deploy
4. For Sveltia CMS auth: Vercel → Settings → Environment Variables → add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from a GitHub OAuth App

## Domain setup
1. Buy domain (Namecheap / Cloudflare recommended)
2. Vercel → Settings → Domains → add your domain
3. Point DNS to Vercel nameservers
