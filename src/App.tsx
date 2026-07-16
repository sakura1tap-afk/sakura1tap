import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import RouteErrorBoundary from './app/RouteErrorBoundary'
import RouteFallback from './app/RouteFallback'
import { getPageFromPath, type AppPage, writeRoute } from './app/routes'
import BootOverlay from './components/BootOverlay'
import LiteEntry from './components/LiteEntry'
import { reactionFeatureLoader } from './features/registry'

const Live2DEntry = lazy(() => import('./components/Live2DEntry'))
const MainPage = lazy(() => import('./components/MainPage'))
const MotionLabPage = lazy(() => import('./components/lab/MotionLabPage'))
const PlayPage = lazy(() => import('./components/PlayPage'))
const ReactionTestPage = lazy(reactionFeatureLoader)
const SCENE_MOUNT_DELAY_MS = 120
const ENTRY_READY_TIMEOUT_MS = 15000

type NavigatorWithHints = Navigator & {
  connection?: { effectiveType?: string; saveData?: boolean }
  deviceMemory?: number
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function getEntryCapabilities() {
  const webglAvailable = canUseWebGL()
  const navigatorWithHints = window.navigator as NavigatorWithHints
  const connection = navigatorWithHints.connection
  const compactViewport = window.matchMedia('(max-width: 760px)').matches
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const lowMemory = typeof navigatorWithHints.deviceMemory === 'number' && navigatorWithHints.deviceMemory <= 4
  const slowConnection = connection?.saveData === true || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')

  return {
    useLiteEntry: !webglAvailable || compactViewport || coarsePointer || lowMemory || slowConnection,
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
  const [entryCapabilities] = useState(getEntryCapabilities)
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
    if (entryCapabilities.useLiteEntry || live2dReady) return undefined
    const timeout = window.setTimeout(() => setLive2dReady(true), ENTRY_READY_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [entryCapabilities.useLiteEntry, live2dReady])

  useEffect(() => {
    if (!entryCapabilities.useLiteEntry && !entryReady) return
    void import('./components/MainPage')
  }, [entryCapabilities.useLiteEntry, entryReady])

  const navigate = (nextPage: AppPage) => {
    writeRoute(nextPage)
    setPage(nextPage)
    setEntered(true)
  }

  const navigateToMain = () => navigate('main')
  const navigateToPlay = () => navigate('play')
  const navigateToLab = () => navigate('lab')
  const navigateToReaction = () => navigate('reaction')

  return (
    <main className="app-shell tone-paper">
      <RouteErrorBoundary resetKey={`${page}:${entered}`}>
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
            {entryCapabilities.useLiteEntry ? (
              <LiteEntry onEnter={navigateToMain} />
            ) : (
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
                    onUnavailable={() => {
                      setModelBuffer(null)
                      setBootModelLoaded(true)
                      setBootComplete(true)
                    }}
                    onComplete={(loadedModelBuffer) => {
                      setModelBuffer(loadedModelBuffer)
                      setBootComplete(true)
                    }}
                  />
                )}
              </>
            )}
          </motion.section>
        ) : page === 'reaction' ? (
          <Suspense key="reaction" fallback={<RouteFallback />}>
            <ReactionTestPage onBack={navigateToPlay} />
          </Suspense>
        ) : page === 'play' ? (
          <Suspense key="play" fallback={<RouteFallback />}>
            <PlayPage onClose={navigateToMain} onOpenLab={navigateToLab} onStartReaction={navigateToReaction} />
          </Suspense>
        ) : page === 'lab' ? (
          <Suspense key="lab" fallback={<RouteFallback />}>
            <MotionLabPage onClose={navigateToMain} />
          </Suspense>
        ) : (
          <Suspense key="main" fallback={<RouteFallback />}>
            <MainPage modelBuffer={modelBuffer} />
          </Suspense>
        )}
        </AnimatePresence>
      </RouteErrorBoundary>
    </main>
  )
}
