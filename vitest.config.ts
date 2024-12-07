import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      browser: {
        enabled: true,
        provider: 'playwright',
        name: 'chromium',
        headless: true,
        providerOptions: {
          launch: {
            args: ['--enable-gpu', '--enable-unsafe-webgpu'],
          },
        },
      },
      // environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
);
