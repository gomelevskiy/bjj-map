import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// VITE_BASE=/bjj-map/ для GitHub Pages (сайт живёт в подпапке репозитория).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  server: { fs: { allow: ['..'] } },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/icon.svg', 'belt.jpg', 'guard.jpg'],
      manifest: {
        name: 'Карта связок BJJ',
        short_name: 'Связки',
        description: 'Отмечай, что умеешь в BJJ, собирай связки и находи пробелы в игре',
        lang: 'ru',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#0D1210',
        theme_color: '#0D1210',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webmanifest}'],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.origin.includes('fonts.g'), handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } } }
        ]
      }
    })
  ]
});
