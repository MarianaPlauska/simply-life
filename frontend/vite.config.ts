import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/

/** Evita 404 no dev quando a API serverless não está rodando */
function devOrchestrateMock(): Plugin
{
  return {
    name: 'dev-orchestrate-mock',
    apply: 'serve',
    configureServer(server)
    {
      server.middlewares.use('/api/orchestrate-tasks', (req, res, next) =>
      {
        if (req.method !== 'GET' && req.method !== 'POST')
        {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET')
        {
          res.end(JSON.stringify({
            intelligence: 'local_only',
            providers: { groq: false, gemini: false },
          }))
          return
        }

        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () =>
        {
          res.end(JSON.stringify({
            scores: [],
            source: 'mock',
            intelligence: 'local',
          }))
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    devOrchestrateMock(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512.png', 'og-image.png'],
      manifest: {
        name: 'Simply-Life OS',
        short_name: 'Simply-Life',
        description: 'Seu sistema operacional pessoal. Gerencie tarefas, finanças, saúde e produtividade em um só lugar.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        id: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        theme_color: '#1D2029',
        background_color: '#1D2029',
        categories: ['productivity', 'lifestyle', 'finance'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Kanban', short_name: 'Kanban', url: '/kanban', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Rotina Guiada', short_name: 'Rotina', url: '/kanban?foco=1', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Dashboard', short_name: 'Início', url: '/', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        importScripts: ['push-sw-handler.js'],
        // notificações locais de boleto no PWA instalado
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'simply-life-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
          {
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
  optimizeDeps: {
    include: ['recharts', 'canvas-confetti', 'react', 'react-dom', 'react-router-dom'],
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  },
})
