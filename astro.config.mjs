import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  site: 'https://plots.milescb.com',
  adapter: cloudflare(),
  image: {
    service: {
      entrypoint: 'astro/services/sharp',
      config: {
        mode: 'compile'
      }
    }
  },
});