import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  plugins: [
    tanstackStart(),
    react(),
    nitro({
      routeRules: {
        '/bookings': {
          proxy: 'http://127.0.0.1:3001/bookings',
        },
        '/bookings/**': {
          proxy: 'http://127.0.0.1:3001/bookings/**',
        },
        '/stays': {
          proxy: 'http://127.0.0.1:3001/stays',
        },
        '/stays/**': {
          proxy: 'http://127.0.0.1:3001/stays/**',
        },
      },
    }),
  ],
})