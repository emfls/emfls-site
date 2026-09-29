import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { gameCategories } from './src/data/gameCategories.ts';
import { games } from './src/data/games.ts';

const siteOrigin = 'https://emfls.com';
const sitemapRoutes = new Set([
  '/',
  '/games/',
  ...games.map(({ href }) => href),
  ...gameCategories.map(({ href }) => href),
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
]);

export default defineConfig({
  site: siteOrigin,
  integrations: [
    sitemap({
      filter: (page) => {
        try {
          const url = new URL(page);
          return url.origin === siteOrigin && !url.search && !url.hash && sitemapRoutes.has(url.pathname);
        } catch {
          return false;
        }
      },
    }),
  ],
});
