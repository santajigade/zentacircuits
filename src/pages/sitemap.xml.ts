// Lists only indexable pages, with the featured image of each article.
import { SITE, AUTHORS } from '../data/site';
import { CATEGORIES } from '../data/categories';
import { liveArticles, articleUrl, featuredSrc } from '../lib/content';

export async function GET() {
  const all = await liveArticles();
  const urls: { loc: string; mod?: Date; img?: string }[] = [{ loc: '/' }, { loc: '/about/' }, { loc: '/editorial-policy/' }];
  for (const c of CATEGORIES) {
    const n = all.filter((a) => a.data.category === c.slug);
    if (n.length >= SITE.categoryMinItems) urls.push({ loc: `/${c.slug}/` });
    for (const s of c.subs) if (n.filter((a) => a.data.subcategory === s.slug).length >= SITE.categoryMinItems) urls.push({ loc: `/${c.slug}/${s.slug}/` });
  }
  all.forEach((a) => urls.push({ loc: articleUrl(a), mod: a.data.updatedDate ?? a.data.pubDate, img: featuredSrc(a) }));
  Object.values(AUTHORS).forEach((au) => { if (all.some((a) => a.data.author === au.slug)) urls.push({ loc: `/author/${au.slug}/` }); });
  const body = SITE.launched
    ? urls.map((u) => `<url><loc>${SITE.url}${u.loc}</loc>${u.mod ? `<lastmod>${u.mod.toISOString().slice(0, 10)}</lastmod>` : ''}${u.img ? `<image:image><image:loc>${SITE.url}${u.img}</image:loc></image:image>` : ''}</url>`).join('')
    : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>\n`, { headers: { 'Content-Type': 'application/xml' } });
}
