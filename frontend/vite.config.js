import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png'],
      manifest: {
        name: 'Chinmaya Medicals',
        short_name: 'ChinmayaRx',
        description: 'Trusted online pharmacy — order prescription & OTC medicines with fast delivery and live tracking.',
        theme_color: '#12b76a',
        background_color: '#f8faf9',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['medical', 'health', 'shopping'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Browse Medicines',
            short_name: 'Medicines',
            url: '/'
          },
          {
            name: 'My Cart',
            short_name: 'Cart',
            url: '/cart'
          },
          {
            name: 'My Orders',
            short_name: 'Orders',
            url: '/my-orders'
          },
          {
            name: 'Health Dashboard',
            short_name: 'Health',
            url: '/health-dashboard'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/medicines/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'medicines-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 5
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
