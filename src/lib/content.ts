import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function getPublishedWork() {
  return getCollection('work', ({ data }) => !data.draft);
}

export async function getFeaturedWork() {
  return getCollection('work', ({ data }) => data.featured && !data.draft);
}

export async function getPublishedFoundry() {
  const entries = await getCollection('foundry', ({ data }) => !data.draft);
  return entries.sort((a, b) =>
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
}

export function formatDateRange(dateStart: string, dateEnd: string): string {
  const start = dateStart.slice(0, 4);
  const end = dateEnd === 'present' ? 'present' : dateEnd.slice(0, 4);
  return start === end ? start : `${start}–${end}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function groupWorkByCategory(entries: CollectionEntry<'work'>[]) {
  return {
    projects: entries.filter(e => e.data.category === 'project'),
    publications: entries.filter(e => e.data.category === 'publication'),
    tools: entries.filter(e => e.data.category === 'tool'),
  };
}
