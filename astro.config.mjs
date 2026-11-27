import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Wide tables scroll sideways on phones.
const rehypeTableScroll = () => (tree) => {
  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.map((c) => {
      if (c.type === 'element' && c.tagName === 'table') return { type: 'element', tagName: 'div', properties: { className: ['table-scroll'] }, children: [c] };
      walk(c);
      return c;
    });
  };
  walk(tree);
};

// External links open in a new tab.
const rehypeExternalLinks = () => (tree) => {
  const walk = (n) => {
    if (n.type === 'element' && n.tagName === 'a' && /^https?:\/\//.test(n.properties?.href || '') && !/zentacircuits\.com/.test(n.properties.href)) {
      n.properties.target = '_blank';
      n.properties.rel = ['noopener'];
    }
    (n.children || []).forEach(walk);
  };
  walk(tree);
};

export default defineConfig({
  site: 'https://zentacircuits.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx()],
  markdown: { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex, rehypeTableScroll, rehypeExternalLinks] },
});
