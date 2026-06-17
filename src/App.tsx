import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import BootOverlay from './components/BootOverlay'
import Live2DEntry from './components/Live2DEntry'
import MainPage from './components/MainPage'

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const [entered, setEntered] = useState(false)
  const [bootComplete, setBootComplete] = useState(false)
  const [modelBuffer, setModelBuffer] = useState<ArrayBuffer | null>(null)
  const [webglAvailable] = useState(canUseWebGL)

  return (
    <main className="app-shell tone-paper">
      <AnimatePresence mode="wait">
        {!entered ? (
          <motion.section
            key="entry"
            className="entry-page live2d-entry-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          >
            {webglAvailable ? (
              <>
                {bootComplete && <Live2DEntry isReady={bootComplete} onEnter={() => setEntered(true)} />}
                {!bootComplete && (
                  <BootOverlay
                    modelUrl="/models/study.glb"
                    onComplete={(loadedModelBuffer) => {
                      setModelBuffer(loadedModelBuffer)
                      setBootComplete(true)
                    }}
                  />
                )}
              </>
            ) : (
              <div className="webgl-fallback">
                <span>WEBGL UNAVAILABLE</span>
                <strong>当前设备无法启动 3D 场景</strong>
              </div>
            )}
          </motion.section>
        ) : (
          <MainPage key="main" modelBuffer={modelBuffer} />
        )}
      </AnimatePresence>
    </main>
  )
}
