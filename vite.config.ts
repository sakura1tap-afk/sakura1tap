import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-404-fallback',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-vendor'
          }

          if (
            id.includes('/three/') ||
            id.includes('/@react-three/fiber/') ||
            id.includes('/@react-three/drei/')
          ) {
            return 'three-vendor'
          }

          if (id.includes('/gsap/') || id.includes('/@gsap/react/')) {
            return 'gsap-vendor'
          }

          if (id.includes('/framer-motion/')) {
            return 'motion-vendor'
          }

          return undefined
        },
      },
    },
  },
})
