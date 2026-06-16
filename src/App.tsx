import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import BootOverlay from './components/BootOverlay'
import EntryScene from './components/EntryScene'
import EntryControls, { type BackgroundTone, type ModelSize, type ViewMode } from './components/EntryControls'
import EnterOverlay from './components/EnterOverlay'
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
  const [autoRotate, setAutoRotate] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('front')
  const [modelSize, setModelSize] = useState<ModelSize>('medium')
  const [backgroundTone, setBackgroundTone] = useState<BackgroundTone>('paper')
  const [softLight, setSoftLight] = useState(true)
  const [bootComplete, setBootComplete] = useState(false)
  const [modelBuffer, setModelBuffer] = useState<ArrayBuffer | null>(null)
  const [webglAvailable] = useState(canUseWebGL)

  return (
    <main className={`app-shell tone-${backgroundTone}`}>
      <AnimatePresence mode="wait">
        {!entered ? (
          <motion.section
            key="entry"
            className="entry-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          >
            {webglAvailable ? (
              <>
                {bootComplete && modelBuffer && (
                  <EntryScene
                    autoRotate={autoRotate}
                    backgroundTone={backgroundTone}
                    modelSize={modelSize}
                    modelBuffer={modelBuffer}
                    softLight={softLight}
                    viewMode={viewMode}
                  />
                )}
                <EntryControls
                  autoRotate={autoRotate}
                  backgroundTone={backgroundTone}
                  isReady={bootComplete}
                  onBackgroundToneChange={setBackgroundTone}
                  onModelSizeChange={setModelSize}
                  onSoftLightChange={setSoftLight}
                  onToggleRotate={() => setAutoRotate((value) => !value)}
                  onViewModeChange={setViewMode}
                  modelSize={modelSize}
                  softLight={softLight}
                  viewMode={viewMode}
                />
                <EnterOverlay isReady={bootComplete} onEnter={() => setEntered(true)} />
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
          <MainPage key="main" />
        )}
      </AnimatePresence>
    </main>
  )
}
