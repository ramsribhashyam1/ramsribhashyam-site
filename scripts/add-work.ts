#!/usr/bin/env npx ts-node
/**
 * Usage: npx ts-node scripts/add-work.ts
 *
 * Interactive CLI that prompts for work entry fields,
 * creates the MDX file in src/content/work/, commits and pushes.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

function prompt(rl: readline.Interface, question: string, fallback = ''): Promise<string> {
  return new Promise(resolve =>
    rl.question(question, answer => resolve(answer.trim() || fallback))
  );
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');
}

function formatList(input: string): string[] {
  return input.split(',').map(s => s.trim()).filter(Boolean);
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n── Add Work Entry ─────────────────────────────\n');

  const title      = await prompt(rl, 'Title: ');
  const org        = await prompt(rl, 'Organisation (e.g. "World Bank"): ');
  const role       = await prompt(rl, 'Role title: ');
  const dateStart  = await prompt(rl, 'Start date (YYYY-MM): ');
  const dateEnd    = await prompt(rl, 'End date (YYYY-MM or "present"): ', 'present');
  const categoryRaw = await prompt(rl, 'Category [project/publication/tool]: ', 'project');
  const category   = ['project', 'publication', 'tool'].includes(categoryRaw) ? categoryRaw : 'project';
  const domainsRaw = await prompt(rl, 'Domains (comma-separated, e.g. "AI, labor markets"): ');
  const countriesRaw = await prompt(rl, 'Countries (ISO codes, comma-separated, e.g. "IN, RW"): ');
  const impact     = await prompt(rl, 'Impact metric (optional, e.g. "300+ placements"): ');
  const externalUrl = await prompt(rl, 'External URL (optional, for publications): ');
  const featuredRaw = await prompt(rl, 'Featured on homepage? [y/N]: ', 'n');
  const featured   = featuredRaw.toLowerCase() === 'y';

  rl.close();

  const domains   = formatList(domainsRaw);
  const countries = formatList(countriesRaw);
  const slug      = toSlug(title);
  const filename  = `${slug}.mdx`;
  const filepath  = path.join(process.cwd(), 'src/content/work', filename);

  if (fs.existsSync(filepath)) {
    console.error(`\nFile already exists: src/content/work/${filename}`);
    process.exit(1);
  }

  const domainsYaml   = `[${domains.map(d => `"${d}"`).join(', ')}]`;
  const countriesYaml = `[${countries.map(c => `"${c}"`).join(', ')}]`;

  const frontmatter = [
    `title: "${title.replace(/"/g, '\\"')}"`,
    `org: "${org.replace(/"/g, '\\"')}"`,
    `role: "${role.replace(/"/g, '\\"')}"`,
    `dateStart: "${dateStart}"`,
    `dateEnd: "${dateEnd}"`,
    `category: "${category}"`,
    `domains: ${domainsYaml}`,
    `countries: ${countriesYaml}`,
    impact ? `impact: "${impact.replace(/"/g, '\\"')}"` : null,
    externalUrl ? `externalUrl: "${externalUrl}"` : null,
    `featured: ${featured}`,
    `draft: false`,
  ].filter(Boolean).join('\n');

  const content = `---\n${frontmatter}\n---\n\n## Overview\n\n<!-- Write the case study here -->\n`;

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`\n✓ Created src/content/work/${filename}`);
  console.log('  Edit the file to add the full case study body, then run:\n');
  console.log(`  git add src/content/work/${filename}`);
  console.log(`  git commit -m "content: add work entry — ${title.slice(0, 50)}"`);
  console.log('  git push origin main\n');

  const autoPush = process.argv.includes('--push');
  if (autoPush) {
    try {
      execSync(`git add src/content/work/${filename}`, { stdio: 'inherit' });
      execSync(`git commit -m "content: add work entry — ${title.slice(0, 50)}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✓ Committed and pushed.');
    } catch {
      console.log('Push failed — run git commands manually.');
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
