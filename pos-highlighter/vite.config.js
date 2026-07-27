import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/DesGramatizador/',
  server: {
    port: 5175,
    open: false
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon-96x96.png', 'apple-touch-icon.png', 'logo.svg'],
      manifest: {
        name: 'Desgramatizador',
        short_name: 'Desgramatizador',
        description: 'Identificador de Partes de la Oración para estudiantes de inglés',
        theme_color: '#FB7185',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/DesGramatizador/',
        start_url: '/DesGramatizador/',
        icons: [
          { src: 'web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          { src: 'favicon-96x96.png', sizes: '96x96', type: 'image/png' }
        ]
      },
      workbox: {
        // registerType 'prompt': el SW nuevo espera hasta que el usuario toca
        // "Actualizar" (updateServiceWorker(true) hace skipWaiting + recarga).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unpkg-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ]
})
