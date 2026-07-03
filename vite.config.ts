import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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

          if (id.includes('/pixi.js/') || id.includes('/pixi-live2d-display/') || id.includes('/live2dcubismcore/')) {
            return 'live2d-vendor'
          }

          return undefined
        },
      },
    },
  },
})
