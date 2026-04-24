import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Simply-Life OS',
        short_name: 'Simply-Life',
        description: 'Seu sistema operacional pessoal. Gerencie tarefas, finanças, saúde e produtividade em um só lugar.',
        start_url: '/',
        display: 'standalone',
        theme_color: '#09090b',
        background_color: '#09090b',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // cache-first pra assets estáticos
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // network-first pra chamadas de API
            urlPattern: /\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
          {
            // stale-while-revalidate pra Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
    // bundle analyzer — roda só com ANALYZE=true
    ...(process.env.ANALYZE === 'true'
      ? [visualizer({ open: true, gzipSize: true, brotliSize: true, filename: 'dist/stats.html' })]
      : []),
  ],
  server: {
    port: 5173,
    strictPort: true, // falha ao invés de incrementar a porta
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks ( id: string )
        {
          // separa vendors em chunks menores para melhor cache
          if ( id.includes('node_modules') )
          {
            if ( /react|react-dom|react-router/.test(id) )      return 'vendor-react';
            if ( /framer-motion|lucide-react|sonner/.test(id) )  return 'vendor-ui';
            if ( /recharts/.test(id) )                           return 'vendor-charts';
            if ( /@tiptap/.test(id) )                            return 'vendor-editor';
            if ( /@dnd-kit/.test(id) )                           return 'vendor-dnd';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
