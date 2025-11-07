import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  const env = loadEnv(mode, process.cwd(), '');

  // Backend API URL resolution
  const apiUrl =
    env.VITE_API_URL ||
    process.env.VITE_API_URL ||
    'https://iballot-backend-715732606815.asia-south1.run.app';

  console.log(`🔗 [VITE CONFIG] Mode=${mode} | API=${apiUrl}`);

  return {
    // Inject backend URL globally
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },

    plugins: [
      react(),

      // ✅ Progressive Web App Configuration
      VitePWA({
        registerType: 'autoUpdate', // Automatically updates the service worker
        includeAssets: [
          'favicon.ico',
          'robots.txt',
          'apple-touch-icon.png',
        ],
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/iballot-backend-715732606815\.asia-south1\.run\.app\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
        manifest: {
          name: 'iBallot',
          short_name: 'iBallot',
          description: 'Secure Blockchain E-Voting Platform',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],

    // Local or Docker dev server
    server: {
      host: '0.0.0.0', // Allow external connections (important for Docker)
      port: 3000,
      strictPort: true,
    },

    // Ensure consistent base path for production
    base: '/',
  };
});
