#!/usr/bin/env npx ts-node
/**
 * Usage: npx ts-node scripts/audit-content.ts
 *
 * Checks all content files for schema issues, stale drafts, and missing fields.
 * Exits with code 1 if any errors are found.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── ANSI colour helpers ───────────────────────────────────────────────────────
const RED    = (s: string) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s: string) => `\x1b[33m${s}\x1b[0m`;
const GREEN  = (s: string) => `\x1b[32m${s}\x1b[0m`;
const DIM    = (s: string) => `\x1b[2m${s}\x1b[0m`;
const BOLD   = (s: string) => `\x1b[1m${s}\x1b[0m`;

// ── Frontmatter parser ────────────────────────────────────────────────────────
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) result[key] = val;
  }
  return result;
}

function getFiles(dir: string, ext: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => ext.some(e => f.endsWith(e)))
    .map(f => path.join(dir, f));
}

interface Issue {
  file: string;
  level: 'error' | 'warn';
  message: string;
}

const issues: Issue[] = [];

function error(file: string, message: string) {
  issues.push({ file, level: 'error', message });
}
function warn(file: string, message: string) {
  issues.push({ file, level: 'warn', message });
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const now = Date.now();

// ── Audit: work/ ──────────────────────────────────────────────────────────────
const workFiles = getFiles('src/content/work', ['.md', '.mdx']);
console.log(DIM(`\nChecking ${workFiles.length} work entries...`));

for (const file of workFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(content);
  const short = path.relative(process.cwd(), file);

  if (!fm.title)     error(short, 'Missing: title');
  if (!fm.org)       error(short, 'Missing: org');
  if (!fm.role)      error(short, 'Missing: role');
  if (!fm.dateStart) error(short, 'Missing: dateStart');
  if (!fm.dateEnd)   error(short, 'Missing: dateEnd');
  if (!fm.category)  error(short, 'Missing: category');

  if (fm.category && !['project', 'publication', 'tool'].includes(fm.category)) {
    error(short, `Invalid category: "${fm.category}" — must be project, publication, or tool`);
  }

  const rawDomains = content.match(/^domains:\s*\[([^\]]*)\]/m)?.[1] ?? '';
  if (!rawDomains.trim()) warn(short, 'No domains listed');

  const rawCountries = content.match(/^countries:\s*\[([^\]]*)\]/m)?.[1] ?? '';
  if (!rawCountries.trim()) warn(short, 'No countries listed');

  if (fm.draft === 'true') {
    const stat = fs.statSync(file);
    const ageDays = Math.floor((now - stat.mtimeMs) / (1000 * 60 * 60 * 24));
    if (now - stat.mtimeMs > THIRTY_DAYS) {
      warn(short, `Draft unchanged for ${ageDays} days — publish or delete?`);
    }
  }
}

// ── Audit: foundry/ ───────────────────────────────────────────────────────────
const foundryFiles = getFiles('src/content/foundry', ['.md', '.mdx']);
console.log(DIM(`Checking ${foundryFiles.length} foundry entries...`));

for (const file of foundryFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(content);
  const short = path.relative(process.cwd(), file);

  if (!fm.title)   error(short, 'Missing: title');
  if (!fm.date)    error(short, 'Missing: date');
  if (!fm.type)    error(short, 'Missing: type');
  if (!fm.excerpt) error(short, 'Missing: excerpt');

  const validTypes = ['essay', 'note', 'experiment', 'diagram', 'framework', 'external'];
  if (fm.type && !validTypes.includes(fm.type)) {
    error(short, `Invalid type: "${fm.type}"`);
  }

  const validSources = ['site', 'substack', 'linkedin'];
  if (fm.source && !validSources.includes(fm.source)) {
    error(short, `Invalid source: "${fm.source}"`);
  }

  if ((fm.type === 'external' || (fm.source && fm.source !== 'site')) && !fm.externalUrl) {
    error(short, 'External post missing externalUrl');
  }

  const rawTags = content.match(/^tags:\s*\[([^\]]*)\]/m)?.[1] ?? '';
  if (!rawTags.trim()) warn(short, 'No tags listed');

  if (fm.date && !/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) {
    error(short, `Date "${fm.date}" not in YYYY-MM-DD format`);
  }

  if (fm.draft === 'true') {
    const stat = fs.statSync(file);
    const ageDays = Math.floor((now - stat.mtimeMs) / (1000 * 60 * 60 * 24));
    if (now - stat.mtimeMs > THIRTY_DAYS) {
      warn(short, `Draft unchanged for ${ageDays} days — publish or delete?`);
    }
  }
}

// ── Audit: fieldwork/ ─────────────────────────────────────────────────────────
const fieldworkFiles = getFiles('src/content/fieldwork', ['.json']);
console.log(DIM(`Checking ${fieldworkFiles.length} fieldwork entries...\n`));

for (const file of fieldworkFiles) {
  const short = path.relative(process.cwd(), file);
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.countryCode)  error(short, 'Missing: countryCode');
    if (!data.countryName)  error(short, 'Missing: countryName');
    if (!data.region)       error(short, 'Missing: region');
    if (!Array.isArray(data.roles) || data.roles.length === 0) {
      warn(short, 'No roles defined');
    } else {
      for (const role of data.roles) {
        if (!role.org)     error(short, `Role missing: org (in ${JSON.stringify(role)})`);
        if (!role.title)   error(short, `Role missing: title`);
        if (!role.years)   error(short, `Role missing: years`);
        if (!role.summary) warn(short, `Role missing: summary`);
      }
    }
  } catch {
    error(short, 'Invalid JSON');
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const errors = issues.filter(i => i.level === 'error');
const warnings = issues.filter(i => i.level === 'warn');

if (issues.length === 0) {
  console.log(GREEN('✓ All content looks good.\n'));
  process.exit(0);
}

if (errors.length > 0) {
  console.log(BOLD(RED(`✗ ${errors.length} error${errors.length > 1 ? 's' : ''}:`)));
  for (const issue of errors) {
    console.log(`  ${RED('●')} ${BOLD(issue.file)}: ${issue.message}`);
  }
  console.log('');
}

if (warnings.length > 0) {
  console.log(BOLD(YELLOW(`⚠ ${warnings.length} warning${warnings.length > 1 ? 's' : ''}:`)));
  for (const issue of warnings) {
    console.log(`  ${YELLOW('○')} ${BOLD(issue.file)}: ${issue.message}`);
  }
  console.log('');
}

console.log(DIM(`${workFiles.length + foundryFiles.length + fieldworkFiles.length} files checked.\n`));

if (errors.length > 0) process.exit(1);
