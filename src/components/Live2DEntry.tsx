import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Live2DStage from './Live2DStage'
import './CinematicEntry.css'

type Live2DEntryProps = {
  isReady: boolean
  onEnter: () => void
  onReadyChange?: (isReady: boolean) => void
}

const EntryMotionController = lazy(() => import('./EntryMotionController'))

export default function Live2DEntry({ isReady, onEnter, onReadyChange }: Live2DEntryProps) {
  const [isEntering, setIsEntering] = useState(false)
  const [buttonHover, setButtonHover] = useState(false)
  const [modelLoadState, setModelLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    onReadyChange?.(modelLoadState !== 'loading')
  }, [modelLoadState, onReadyChange])

  const handleEnter = () => {
    if (!isReady || isEntering) return
    setIsEntering(true)
    window.setTimeout(onEnter, 680)
  }

  return (
    <motion.div
      className={`live2d-entry cinematic-entry ${isEntering ? 'is-entering' : ''}`}
      ref={rootRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: 'easeOut' }}
    >
      <picture className="entry-cinematic-bg" aria-hidden="true">
        <source media="(max-width: 760px)" srcSet="/cinematic/awakening-mobile.webp" />
        <img src="/cinematic/awakening.webp" alt="" draggable={false} />
      </picture>
      <div className="entry-cinematic-shade" aria-hidden="true" />
      <Suspense fallback={null}>
        <EntryMotionController isEntering={isEntering} modelReady={modelLoadState === 'ready'} rootRef={rootRef} />
      </Suspense>
      <Live2DStage
        focusPoint={buttonHover ? { x: 0.5, y: 0.42 } : null}
        isEntering={isEntering}
        onLoadStateChange={setModelLoadState}
      />

      <header className="entry-cinematic-header">
        <strong>SAKURA1TAP</strong>
        <span>AN INTERACTIVE REALM</span>
      </header>
      <div className="entry-cinematic-copy">
        <span>PROLOGUE / 00</span>
        <p>Touch the quiet.<br />Let the world answer.</p>
      </div>
      <motion.button
        animate={{ opacity: isReady ? 1 : 0.44 }}
        aria-label="Enter the realm"
        className="live2d-enter-button realm-enter-button"
        disabled={!isReady || isEntering}
        onClick={handleEnter}
        onPointerEnter={() => setButtonHover(true)}
        onPointerLeave={() => setButtonHover(false)}
        type="button"
      >
        <span className="realm-enter-label">ENTER THE WEATHER</span>
        <i aria-hidden="true">↘</i>
      </motion.button>

      <AnimatePresence>
        {isEntering && (
          <motion.div
            className="live2d-entry-curtain cinematic-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
