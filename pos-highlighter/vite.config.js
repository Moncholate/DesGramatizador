import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

/* Version para el reporte de errores: sale del COMMIT y no de la hora de
   compilar. Dice que codigo esta en linea y es DETERMINISTA, asi que el mismo
   commit da siempre el mismo bundle y un despliegue se puede verificar
   comparando el hash servido con el local. Con la hora dentro, cada build daba
   un hash distinto y esa comprobacion dejaba de funcionar. Paso. */
function versionDelCommit() {
  try {
    const q = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    return `${q('git log -1 --format=%cs')} · ${q('git rev-parse --short HEAD')}`
  } catch { return 'dev' }
}

export default defineConfig({
  /* Ver `versionDelCommit` arriba. */
  define: {
    __APP_BUILD__: JSON.stringify(versionDelCommit()),
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
