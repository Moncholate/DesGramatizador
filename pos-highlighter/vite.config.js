import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  /* Fecha de compilación para el reporte de errores. Se inyecta al construir y
     no se escribe a mano: una constante en el código se queda vieja el primer
     día que nadie se acuerda de subirla, y entonces miente. */
  define: {
    __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
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
        /* `id` fija la identidad de la app instalada aparte de la URL. Sin él
           la identidad ES el start_url, y esta app ya lo cambió dos veces
           (/pos-highlighter/ → /Desgramatizador/ → /DesGramatizador/): cada
           cambio dejó huérfana a la copia instalada. Si algún día se renombra
           otra vez, se mueven scope y start_url y este `id` se deja quieto. */
        id: '/DesGramatizador/',
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
