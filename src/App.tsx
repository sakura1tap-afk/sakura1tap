import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import BootOverlay from './components/BootOverlay'
import EntryScene from './components/EntryScene'
import EntryControls, { type BackgroundTone, type ViewMode } from './components/EntryControls'
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
  const [backgroundTone, setBackgroundTone] = useState<BackgroundTone>('paper')
  const [softLight, setSoftLight] = useState(true)
  const [bootComplete, setBootComplete] = useState(false)
  const [modelObjectUrl, setModelObjectUrl] = useState<string | null>(null)
  const [webglAvailable] = useState(canUseWebGL)

  useEffect(() => {
    return () => {
      if (modelObjectUrl) {
        URL.revokeObjectURL(modelObjectUrl)
      }
    }
  }, [modelObjectUrl])

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
                {bootComplete && modelObjectUrl && (
                  <EntryScene
                    autoRotate={autoRotate}
                    backgroundTone={backgroundTone}
                    modelUrl={modelObjectUrl}
                    softLight={softLight}
                    viewMode={viewMode}
                  />
                )}
                <EntryControls
                  autoRotate={autoRotate}
                  backgroundTone={backgroundTone}
                  isReady={bootComplete}
                  onBackgroundToneChange={setBackgroundTone}
                  onSoftLightChange={setSoftLight}
                  onToggleRotate={() => setAutoRotate((value) => !value)}
                  onViewModeChange={setViewMode}
                  softLight={softLight}
                  viewMode={viewMode}
                />
                <EnterOverlay isReady={bootComplete} onEnter={() => setEntered(true)} />
                {!bootComplete && (
                  <BootOverlay
                    modelUrl="/models/study.glb"
                    onComplete={(loadedModelUrl) => {
                      setModelObjectUrl(loadedModelUrl)
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
