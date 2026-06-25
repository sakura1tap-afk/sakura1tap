import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/')

          if (normalizedId.includes('/src/live2d/') || normalizedId.includes('/src/vendor/cubism/')) {
            return 'live2d-runtime'
          }

          if (
            normalizedId.includes('/src/components/PlayPage') ||
            normalizedId.includes('/src/components/PlayGamePage') ||
            normalizedId.includes('/src/components/DodgeGame')
          ) {
            return 'play'
          }

          if (!normalizedId.includes('/node_modules/')) return undefined

          if (
            normalizedId.includes('/three/') ||
            normalizedId.includes('/@react-three/fiber/') ||
            normalizedId.includes('/@react-three/drei/')
          ) {
            return 'vendor-three'
          }

          if (normalizedId.includes('/framer-motion/')) {
            return 'vendor-motion'
          }

          if (normalizedId.includes('/react/') || normalizedId.includes('/react-dom/')) {
            return 'vendor-react'
          }

          return 'vendor'
        },
      },
    },
  },
})
