import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
        type: 'module'
      },
      includeAssets: ['favicon.ico', 'robots.txt', '*.png'],
      manifest: {
        name: 'NativeTalk - Multilingual Communication',
        short_name: 'NativeTalk',
        description: 'Chat and video call in any language with real-time translation',
        theme_color: '#0b1213',
        background_color: '#0b1213',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: "New Chat",
            short_name: "Chat",
            description: "Start a new conversation",
            url: "/messages",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Call History",
            short_name: "Calls",
            description: "View recent calls",
            url: "/history",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ['**/*.{js,css,html}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        ignoreURLParametersMatching: [/./],
        runtimeCaching: [
          {
            urlPattern: /^http.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
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
})
