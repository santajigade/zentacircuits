import { SITE } from '../data/site';
export const GET = () =>
  new Response(
    SITE.launched ? `User-agent: *\nAllow: /\nDisallow: /search/\n\nSitemap: ${SITE.url}/sitemap.xml\n` : `User-agent: *\nDisallow: /\n`,
    { headers: { 'Content-Type': 'text/plain' } },
  );
