#!/usr/bin/env npx ts-node
/**
 * Usage: npx ts-node scripts/add-post.ts <url>
 *
 * Fetches a LinkedIn or Substack URL, extracts OG metadata,
 * writes an MDX file to src/content/foundry/, commits and pushes.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const url = process.argv[2];
if (!url) {
  console.error('Usage: npx ts-node scripts/add-post.ts <url>');
  process.exit(1);
}

const source = url.includes('linkedin.com') ? 'linkedin'
             : url.includes('substack.com') ? 'substack'
             : 'site';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function extractMeta(url: string): Promise<{ title: string; excerpt: string; date: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const get = (pattern: RegExp) => pattern.exec(html)?.[1]?.trim() ?? '';

    const title = get(/property="og:title"\s+content="([^"]+)"/)
               || get(/name="twitter:title"\s+content="([^"]+)"/)
               || get(/<title>([^<]+)<\/title>/);

    const excerpt = get(/property="og:description"\s+content="([^"]+)"/)
                 || get(/name="description"\s+content="([^"]+)"/)
                 || get(/name="twitter:description"\s+content="([^"]+)"/);

    const rawDate = get(/property="article:published_time"\s+content="([^"]+)"/)
                 || get(/datePublished":\s*"([^"]+)"/);

    const date = rawDate ? rawDate.slice(0, 10) : today();

    return title ? { title, excerpt, date } : null;
  } catch {
    return null;
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\nFetching metadata from ${url}...\n`);
  let meta = await extractMeta(url);

  if (!meta) {
    console.log('Could not extract metadata automatically. Please enter manually.\n');
    const title  = await prompt(rl, 'Title: ');
    const excerpt = await prompt(rl, 'Excerpt (1-2 sentences): ');
    meta = { title, excerpt, date: today() };
  } else {
    console.log(`Found: "${meta.title}"\n`);
    const override = await prompt(rl, 'Use this title? (Enter to confirm, or type a new one): ');
    if (override.trim()) meta.title = override.trim();

    const overrideExcerpt = await prompt(rl, `Excerpt: "${meta.excerpt}"\nPress Enter to confirm, or type a new one: `);
    if (overrideExcerpt.trim()) meta.excerpt = overrideExcerpt.trim();
  }

  const tagsRaw = await prompt(rl, 'Tags (comma-separated, or Enter to skip): ');
  const tags = tagsRaw.trim()
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  rl.close();

  const slug = toSlug(meta.title);
  const filename = `${meta.date}-${slug}.mdx`;
  const filepath = path.join(process.cwd(), 'src/content/foundry', filename);

  if (fs.existsSync(filepath)) {
    console.error(`\nFile already exists: src/content/foundry/${filename}`);
    process.exit(1);
  }

  const tagsYaml = tags.length
    ? `[${tags.map(t => `"${t}"`).join(', ')}]`
    : '[]';

  const content = `---
title: "${meta.title.replace(/"/g, '\\"')}"
date: "${meta.date}"
type: "external"
source: "${source}"
externalUrl: "${url}"
excerpt: "${meta.excerpt.replace(/"/g, '\\"')}"
tags: ${tagsYaml}
---
`;

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`\n✓ Created src/content/foundry/${filename}`);

  try {
    execSync(`git add src/content/foundry/${filename}`, { stdio: 'inherit' });
    execSync(`git commit -m "content: add ${source} post — ${meta.title.slice(0, 60)}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('\n✓ Committed and pushed. Live in ~45 seconds.');
  } catch {
    console.log('\nFile created. Run git add/commit/push manually to deploy.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
