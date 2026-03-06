import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vaga-ops-logo.jpg'],
      manifest: {
        name: 'VAGA OPS — Regulation Station',
        short_name: 'VAGA OPS',
        description: 'Nervous system regulation for WFH solopreneurs.',
        theme_color: '#060d1a',
        background_color: '#060d1a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/vaga-ops-logo.jpg', sizes: '192x192', type: 'image/jpeg', purpose: 'any maskable' },
          { src: '/vaga-ops-logo.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'any maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
