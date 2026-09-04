// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rakhechafinserv.com',
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
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
