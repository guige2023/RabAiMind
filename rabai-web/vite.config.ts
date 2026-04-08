/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'RabAi Mind - AI PPT 生成平台',
        short_name: 'RabAi Mind',
        description: '使用AI快速生成专业PPT演示文稿。支持智能排版、多样化模板、自动配图等功能。',
        theme_color: '#165DFF',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: '创建PPT',
            short_name: '创建',
            description: '创建新的PPT演示文稿',
            url: '/create',
            icons: [{ src: '/icon-192.svg', sizes: '192x192' }]
          },
          {
            name: '历史记录',
            short_name: '历史',
            description: '查看历史PPT',
            url: '/history',
            icons: [{ src: '/icon-192.svg', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
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
