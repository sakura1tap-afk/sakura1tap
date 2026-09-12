import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import RouteErrorBoundary from './app/RouteErrorBoundary'
import RouteFallback from './app/RouteFallback'
import {
  getPageFromPath,
  navigateTo,
  PAGE_TITLES,
  ROUTE_CHANGE_EVENT,
  type AppPage,
} from './app/routes'
import LiteEntry from './components/LiteEntry'
import { reactionFeatureLoader } from './features/registry'

const Live2DEntry = lazy(() => import('./components/Live2DEntry'))
const MainPage = lazy(() => import('./components/MainPage'))
const MotionLabPage = lazy(() => import('./components/lab/MotionLabPage'))
const PlayPage = lazy(() => import('./components/PlayPage'))
const ReactionTestPage = lazy(reactionFeatureLoader)

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
  const [page, setPage] = useState<AppPage>(() => getPageFromPath(window.location.pathname))
  const [webglAvailable] = useState(canUseWebGL)

  useEffect(() => {
    const syncPageFromLocation = () => {
      const nextPage = getPageFromPath(window.location.pathname)
      setPage(nextPage)
      if (nextPage !== 'main') setEntered(true)
    }

    window.addEventListener('popstate', syncPageFromLocation)
    window.addEventListener(ROUTE_CHANGE_EVENT, syncPageFromLocation)
    return () => {
      window.removeEventListener('popstate', syncPageFromLocation)
      window.removeEventListener(ROUTE_CHANGE_EVENT, syncPageFromLocation)
    }
  }, [])

  // Each route gets its own document title so history, tabs and bookmarks are readable.
  useEffect(() => {
    document.title = PAGE_TITLES[entered ? page : 'main']
  }, [entered, page])

  useEffect(() => {
    void import('./components/MainPage')
  }, [])

  const navigate = (nextPage: AppPage) => {
    navigateTo(nextPage)
    setPage(nextPage)
    setEntered(true)
  }

  const navigateToMain = () => navigate('main')
  const navigateToPlay = () => navigate('play')
  const navigateToLab = () => navigate('lab')
  const navigateToReaction = () => navigate('reaction')

  const currentTitle = PAGE_TITLES[entered ? page : 'main']

  return (
    <main className="app-shell tone-paper">
      {/* Announces the new view to assistive tech, which an SPA otherwise never does. */}
      <p aria-live="polite" className="visually-hidden" data-route-announcer>
        {currentTitle}
      </p>
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
            {webglAvailable ? (
              <Suspense fallback={<LiteEntry onEnter={navigateToMain} />}>
                <Live2DEntry isReady onEnter={navigateToMain} />
              </Suspense>
            ) : (
              <LiteEntry onEnter={navigateToMain} />
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
            <MainPage />
          </Suspense>
        )}
        </AnimatePresence>
      </RouteErrorBoundary>
    </main>
  )
}
