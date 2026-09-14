import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://emfls.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/tags/') && !page.endsWith('/site-map/'),
    }),
  ],
});
