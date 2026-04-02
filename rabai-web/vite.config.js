import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
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
        // 启用HTTP/2以提升加载速度
        hmr: {
            overlay: true
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
        // 启用CSS代码分割
        cssCodeSplit: true,
        // Split vendor chunks for better caching
        rollupOptions: {
            output: {
                // 更细粒度的代码分割
                manualChunks: function (id) {
                    // Vue核心
                    if (id.includes('node_modules/vue') ||
                        id.includes('node_modules/vue-router') ||
                        id.includes('node_modules/pinia')) {
                        return 'vendor-vue';
                    }
                    // UI库
                    if (id.includes('node_modules/@vueuse') ||
                        id.includes('node_modules/naive-ui')) {
                        return 'vendor-ui';
                    }
                    // 其他第三方库
                    if (id.includes('node_modules')) {
                        return 'vendor-other';
                    }
                },
                // 资源文件命名
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: function (assetInfo) {
                    var _a;
                    var info = ((_a = assetInfo.name) === null || _a === void 0 ? void 0 : _a.split('.')) || [];
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
        // Optimize chunk size
        chunkSizeWarningLimit: 500,
        // Minify with esbuild (faster than terser)
        minify: 'esbuild',
        // 不生成sourcemap以减小体积
        sourcemap: false,
        // 启用CSS压缩
        cssMinify: true
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['vue', 'vue-router', 'axios', '@vueuse/core'],
        // 预构建时排除大型库
        exclude: []
    },
    // 压缩配置
    esbuild: {
        // 移除console和debugger
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
});
