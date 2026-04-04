import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Check if Tauri CLI is available
const hasTauriCLI = (() => {
  try {
    require.resolve('@tauri-apps/cli');
    return true;
  } catch {
    return false;
  }
})();

export default defineConfig(async () => {
  const plugins = [vue()];
  
  if (hasTauriCLI) {
    try {
      const { tauri } = await import('@tauri-apps/cli/vite');
      plugins.push(tauri());
    } catch (e) {
      console.warn('[Vite] Failed to load Tauri plugin:', e);
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        overlay: true,
        protocol: 'ws',
        host: 'localhost',
        port: 3000
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8003',
          changeOrigin: true,
          timeout: 180000
        }
      }
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: function (id) {
            if (id.includes('node_modules/vue') ||
                id.includes('node_modules/vue-router') ||
                id.includes('node_modules/pinia')) {
              return 'vendor-vue';
            }
            if (id.includes('node_modules/@vueuse') ||
                id.includes('node_modules/naive-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('node_modules')) {
              return 'vendor-other';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: function (assetInfo) {
            var info = (assetInfo.name || '').split('.') || [];
            var ext = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(assetInfo.name || '')) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (ext === 'css') {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      chunkSizeWarningLimit: 500,
      minify: 'esbuild',
      sourcemap: false,
      cssMinify: true
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'axios', '@vueuse/core'],
      exclude: []
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  };
});
