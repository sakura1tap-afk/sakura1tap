import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
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

  const moveEntryButton = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 4
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 3
    event.currentTarget.style.setProperty('--entry-magnet-x', `${x}px`)
    event.currentTarget.style.setProperty('--entry-magnet-y', `${y}px`)
  }

  const resetEntryButton = (event: ReactPointerEvent<HTMLButtonElement>) => {
    setButtonHover(false)
    event.currentTarget.style.setProperty('--entry-magnet-x', '0px')
    event.currentTarget.style.setProperty('--entry-magnet-y', '0px')
    event.currentTarget.style.setProperty('--entry-press', '1')
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
        <source media="(max-width: 760px)" srcSet="/cinematic/entry-v2-mobile.webp" />
        <img src="/cinematic/entry-v2.webp" alt="" draggable={false} />
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
        <span>交互式个人空间</span>
      </header>
      <motion.button
        animate={{ opacity: isReady ? 1 : 0.44 }}
        aria-label={isReady ? '进入个人空间' : '空间正在准备中'}
        className="live2d-enter-button realm-enter-button"
        disabled={!isReady || isEntering}
        onClick={handleEnter}
        onPointerMove={moveEntryButton}
        onPointerEnter={() => setButtonHover(true)}
        onPointerDown={(event) => event.currentTarget.style.setProperty('--entry-press', '.98')}
        onPointerUp={(event) => event.currentTarget.style.setProperty('--entry-press', '1')}
        onPointerLeave={resetEntryButton}
        type="button"
      >
        <span className="entry-button-light" aria-hidden="true" />
        <b className="realm-enter-label">
          {isEntering ? '正在进入' : isReady ? '进入' : '准备中'}
        </b>
        <span className="entry-button-arrow" aria-hidden="true">→</span>
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
