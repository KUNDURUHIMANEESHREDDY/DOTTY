import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = process.env.ELECTRON === 'true' || process.env.npm_lifecycle_event?.includes('electron');

  return {
    plugins: [
      react(),
      ...(isElectron
        ? [
            electron([
              {
                // Main process entry file of the Electron App.
                entry: 'electron/main.ts',
                onstart(options) {
                  options.startup();
                },
                vite: {
                  build: {
                    outDir: 'dist-electron',
                  },
                },
              },
              {
                entry: 'electron/preload.ts',
                onstart(options) {
                  // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                  // instead of restarting the entire Electron App.
                  options.reload();
                },
                vite: {
                  build: {
                    outDir: 'dist-electron',
                    lib: {
                      // Electron loads .js preload scripts as CommonJS (sandboxed);
                      // ESM output ("import" statements) fails with "Cannot use import statement outside a module"
                      formats: ['cjs'],
                    },
                    rollupOptions: {
                      output: {
                        inlineDynamicImports: true,
                      },
                    },
                  },
                },
              },
            ]),
            renderer(),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
    },
  };
});
