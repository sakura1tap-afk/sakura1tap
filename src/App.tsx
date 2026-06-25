import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import BootOverlay from './components/BootOverlay'

const Live2DEntry = lazy(() => import('./components/Live2DEntry'))
const MainPage = lazy(() => import('./components/MainPage'))
const PlayPage = lazy(() => import('./components/PlayPage'))
const PlayGamePage = lazy(() => import('./components/PlayGamePage'))

type AppPage = 'main' | 'play' | 'play-game'

function getPageFromPath(pathname: string): AppPage {
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
  const [live2dReady, setLive2dReady] = useState(false)
  const [modelBuffer, setModelBuffer] = useState<ArrayBuffer | null>(null)
  const [page, setPage] = useState<AppPage>(() => getPageFromPath(window.location.pathname))
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
    if (!webglAvailable || entered) return

    void import('./components/Live2DEntry')
  }, [entered, webglAvailable])

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
                <Suspense fallback={null}>
                  <Live2DEntry
                    isReady={entryReady}
                    onEnter={navigateToMain}
                    onReadyChange={setLive2dReady}
                  />
                </Suspense>
                {!entryReady && (
                  <BootOverlay
                    canComplete={live2dReady}
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
        ) : page === 'play-game' ? (
          <Suspense key="play-game" fallback={null}>
            <PlayGamePage onBack={navigateToPlay} />
          </Suspense>
        ) : page === 'play' ? (
          <Suspense key="play" fallback={null}>
            <PlayPage onClose={navigateToMain} onStartGame={navigateToPlayGame} />
          </Suspense>
        ) : (
          <Suspense key="main" fallback={null}>
            <MainPage modelBuffer={modelBuffer} onOpenPlay={navigateToPlay} />
          </Suspense>
        )}
      </AnimatePresence>
    </main>
  )
}
