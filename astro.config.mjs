import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  site: 'https://your-site.pages.dev',
  adapter: cloudflare(),
  image: {
    service: {
      entrypoint: 'astro/assets/services/compile'
    }
  }
});