import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SabiSpell',
        short_name: 'SabiSpell',
        description: 'Adaptive spelling game for everyone',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0A6EBD',
        background_color: '#0A6EBD',
        // ponytail: add a padded maskable icon entry once the Phase 1 logo exists
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom' },
});
