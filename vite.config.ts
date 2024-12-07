import { fileURLToPath, URL } from 'node:url';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';
import circleDependency from 'vite-plugin-circular-dependency';
import { IgnorePublicPlugin as ignorePublic } from 'vite-plugin-ignore-public';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ignorePublic(),
    dts({ rollupTypes: true }),
    circleDependency({
      circleImportThrowErr: false,
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@bubblejs/bubble': fileURLToPath(
        new URL('./src/index.ts', import.meta.url),
      ),
    },
  },
});
