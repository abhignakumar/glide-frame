import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {},
  preload: {
    build: {
      isolatedEntries: true,
      rollupOptions: {
        input: {
          recorder: resolve(__dirname, 'src/preload/recorder.ts'),
          'stop-recorder': resolve(__dirname, 'src/preload/stop-recorder.ts'),
          editor: resolve(__dirname, 'src/preload/editor.ts'),
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          recorder: resolve(__dirname, 'src/renderer/recorder.html'),
          'stop-recorder': resolve(__dirname, 'src/renderer/stop-recorder.html'),
          editor: resolve(__dirname, 'src/renderer/editor.html'),
        },
      },
    },
  },
});
