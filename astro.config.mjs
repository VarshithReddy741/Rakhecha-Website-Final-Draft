// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical URLs, the sitemap, and Open Graph tags are all derived from
  // this — keep it in sync with the deployed domain.
  site: 'https://rakhechafinserv.com',
  // "static" output with per-route `export const prerender = false` opt-out
  // is the Astro 5+ equivalent of the old "hybrid" mode: pages prerender by
  // default, and the server API routes (src/pages/api/) opt out individually.
  output: 'static',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    sitemap({
      // component-preview is a dev-only spot-check page, never a real route;
      // the client-login/apply/apply-success pages are transactional and
      // marked noindex in BaseLayout, so keep them out of the sitemap too.
      filter: (page) =>
        !page.includes('/component-preview') &&
        !page.includes('/client-login') &&
        !page.includes('/careers/apply'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
