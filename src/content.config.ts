import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One file per topic: src/content/articles/<category>/<subcategory>/<slug>.mdx
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().max(70),
    seoTitle: z.string().max(65).optional(),
    description: z.string().max(160),
    focusKeyword: z.string(),
    category: z.string(),
    subcategory: z.string(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
    author: z.string().default('santaji-gadepatil'),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    readMinutes: z.number().int().positive(),
    shortAnswer: z.string().max(420),
    featured: z.object({ kicker: z.string(), line1: z.string(), line2: z.string().default(''), art: z.string().default('generic') }),
    image: z.object({ alt: z.string() }),
    prerequisites: z.array(z.object({ name: z.string(), href: z.string() })).default([]),
    learn: z.array(z.string()).default([]),
    simulator: z.string().optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    interview: z.array(z.string()).default([]),
    references: z.array(z.object({ text: z.string(), url: z.string().url().optional() })).min(3),
    prev: z.object({ name: z.string(), href: z.string() }).optional(),
    next: z.object({ name: z.string(), href: z.string() }).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
