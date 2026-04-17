import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const foundry = await getCollection('foundry', ({ data }) =>
    !data.draft && data.source === 'site'
  );

  const sorted = foundry.sort((a, b) =>
    new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    title: 'The Foundry — Sai Sri Ram',
    description: 'Essays, notes, and experiments on AI, labor markets, and digital public infrastructure.',
    site: context.site,
    items: sorted.map(post => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.excerpt,
      link: `/foundry/${post.id}/`,
    })),
  });
}
