import { getCollection, type CollectionEntry } from 'astro:content';
import { IS_PREVIEW } from '../data/site';

export type Article = CollectionEntry<'articles'>;

// Live = not a draft and pubDate reached (scheduled publishing). Preview builds show everything.
export const liveArticles = async () =>
  (await getCollection('articles', (a) => IS_PREVIEW || (!a.data.draft && a.data.pubDate <= new Date())))
    .sort((a, b) => +b.data.pubDate - +a.data.pubDate);

export const slugOf = (a: Article) => a.id.split('/').pop()!;
export const articleUrl = (a: Article) => `/${a.data.category}/${a.data.subcategory}/${slugOf(a)}/`;
export const featuredSrc = (a: Article) => `/images/featured/${slugOf(a)}.webp`;
