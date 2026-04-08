/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: 'localhost',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true
      }
    }
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vue core - keep together
          if (id.includes('node_modules/vue') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/pinia')) {
            return 'vue-vendor'
          }
          // Three.js and its addons (AR/VR feature) - separate chunk
          if (id.includes('node_modules/three') ||
              id.includes('node_modules/three/')) {
            return 'three-vendor'
          }
          // MediaPipe for hand gesture detection
          if (id.includes('node_modules/@mediapipe')) {
            return 'mediapipe-vendor'
          }
          // Tesseract.js for OCR - separate chunk
          if (id.includes('node_modules/tesseract.js') ||
              id.includes('node_modules/tesseract.js/')) {
            return 'tesseract-vendor'
          }
          // Tauri APIs
          if (id.includes('node_modules/@tauri-apps')) {
            return 'tauri-vendor'
          }
          // VueUse utilities
          if (id.includes('node_modules/@vueuse/core')) {
            return 'vueuse-vendor'
          }
          // Chart.js
          if (id.includes('node_modules/chart.js') ||
              id.includes('node_modules/vue-chartjs')) {
            return 'charts'
          }
          // Quill editor
          if (id.includes('node_modules/@vueup/vue-quill') ||
              id.includes('node_modules/quill')) {
            return 'editor'
          }
          // Remaining vendor modules (should be minimal)
          if (id.includes('node_modules')) {
            return 'vendor-other'
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (ext === 'css') {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
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
  },
  test: {
    environment: 'jsdom',
    globals: true,
  }
})
