import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import BootOverlay from './components/BootOverlay'

const Live2DEntry = lazy(() => import('./components/Live2DEntry'))
const MainPage = lazy(() => import('./components/MainPage'))
const LegacyMainExperience = lazy(() => import('./components/main/MainExperience'))
const PlayPage = lazy(() => import('./components/PlayPage'))
const PlayGamePage = lazy(() => import('./components/PlayGamePage'))
const SCENE_MOUNT_DELAY_MS = 120

type AppPage = 'main' | 'lab' | 'play' | 'play-game'

function getPageFromPath(pathname: string): AppPage {
  if (pathname === '/lab') return 'lab'
  if (pathname === '/play/blackout') return 'play-game'
  if (pathname === '/play') return 'play'
  return 'main'
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const [entered, setEntered] = useState(() => getPageFromPath(window.location.pathname) !== 'main')
  const [bootComplete, setBootComplete] = useState(false)
  const [bootModelLoaded, setBootModelLoaded] = useState(false)
  const [live2dReady, setLive2dReady] = useState(false)
  const [modelBuffer, setModelBuffer] = useState<ArrayBuffer | null>(null)
  const [page, setPage] = useState<AppPage>(() => getPageFromPath(window.location.pathname))
  const [sceneMountAllowed, setSceneMountAllowed] = useState(false)
  const [webglAvailable] = useState(canUseWebGL)
  const entryReady = bootComplete && live2dReady

  useEffect(() => {
    const syncPageFromLocation = () => {
      const nextPage = getPageFromPath(window.location.pathname)
      setPage(nextPage)
      if (nextPage !== 'main') setEntered(true)
    }

    window.addEventListener('popstate', syncPageFromLocation)
    return () => window.removeEventListener('popstate', syncPageFromLocation)
  }, [])

  useEffect(() => {
    if (!bootModelLoaded) {
      setSceneMountAllowed(false)
      return undefined
    }

    const mountTimer = window.setTimeout(() => {
      setSceneMountAllowed(true)
    }, SCENE_MOUNT_DELAY_MS)

    return () => window.clearTimeout(mountTimer)
  }, [bootModelLoaded])

  useEffect(() => {
    if (!entryReady) return

    void import('./components/MainPage')
  }, [entryReady])

  const navigateToMain = () => {
    window.history.pushState({}, '', '/')
    setPage('main')
    setEntered(true)
  }

  const navigateToPlay = () => {
    window.history.pushState({}, '', '/play')
    setPage('play')
    setEntered(true)
  }

  const navigateToPlayGame = () => {
    window.history.pushState({}, '', '/play/blackout')
    setPage('play-game')
    setEntered(true)
  }

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
                {sceneMountAllowed && (
                  <Suspense fallback={null}>
                    <Live2DEntry
                      isReady={entryReady}
                      onEnter={navigateToMain}
                      onReadyChange={setLive2dReady}
                    />
                  </Suspense>
                )}
                {!entryReady && (
                  <BootOverlay
                    canComplete={live2dReady}
                    modelUrl="/models/study.glb"
                    onModelLoaded={(loadedModelBuffer) => {
                      setModelBuffer(loadedModelBuffer)
                      setBootModelLoaded(true)
                    }}
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
        ) : page === 'play-game' ? (
          <Suspense key="play-game" fallback={null}>
            <PlayGamePage onBack={navigateToPlay} />
          </Suspense>
        ) : page === 'play' ? (
          <Suspense key="play" fallback={null}>
            <PlayPage onClose={navigateToMain} onStartGame={navigateToPlayGame} />
          </Suspense>
        ) : page === 'lab' ? (
          <Suspense key="lab" fallback={null}>
            <LegacyMainExperience modelBuffer={modelBuffer} />
          </Suspense>
        ) : (
          <Suspense key="main" fallback={null}>
            <MainPage modelBuffer={modelBuffer} />
          </Suspense>
        )}
      </AnimatePresence>
    </main>
  )
}
