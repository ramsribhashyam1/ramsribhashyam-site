import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    role: z.string(),
    dateStart: z.string(),
    dateEnd: z.string(),
    category: z.enum(['project', 'publication', 'tool']),
    domains: z.array(z.string()),
    countries: z.array(z.string()),
    impact: z.string().optional(),
    mediaLinks: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
    policyLinks: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
    externalUrl: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const foundry = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/foundry' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    type: z.enum(['essay', 'note', 'experiment', 'diagram', 'framework', 'external']),
    source: z.enum(['site', 'substack', 'linkedin']).default('site'),
    externalUrl: z.string().optional(),
    excerpt: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});

const fieldwork = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/fieldwork' }),
  schema: z.object({
    countryCode: z.string(),
    countryName: z.string(),
    region: z.string(),
    roles: z.array(z.object({
      org: z.string(),
      title: z.string(),
      years: z.string(),
      summary: z.string(),
    })),
  }),
});

export const collections = { work, foundry, fieldwork };
