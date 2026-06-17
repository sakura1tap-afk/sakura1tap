import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import Live2DStage from './Live2DStage'

type Live2DEntryProps = {
  isReady: boolean
  onEnter: () => void
  onReadyChange?: (isReady: boolean) => void
}

const inkParticles = Array.from({ length: 18 }, (_, index) => ({
  index,
  x: `${28 + index * 2.6 + Math.sin(index * 1.7) * 4}%`,
  y: `${42 + Math.cos(index * 1.25) * 18}%`,
}))

export default function Live2DEntry({ isReady, onEnter, onReadyChange }: Live2DEntryProps) {
  const [isEntering, setIsEntering] = useState(false)
  const [buttonHover, setButtonHover] = useState(false)
  const [modelLoadState, setModelLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    onReadyChange?.(modelLoadState === 'ready' || modelLoadState === 'error')
  }, [modelLoadState, onReadyChange])

  const handleEnter = () => {
    if (!isReady || isEntering) return

    setIsEntering(true)
    window.setTimeout(onEnter, 680)
  }

  return (
    <motion.div
      className={`live2d-entry ${isEntering ? 'is-entering' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: 'easeOut' }}
    >
      <div className="live2d-entry-grid" aria-hidden="true" />
      <div className="live2d-entry-vignette" aria-hidden="true" />
      <div className="live2d-entry-ink" aria-hidden="true" />

      <Live2DStage
        focusPoint={buttonHover ? { x: 0.5, y: 0.42 } : null}
        isEntering={isEntering}
        onLoadStateChange={setModelLoadState}
      />

      <div className="live2d-entry-status" aria-hidden="true">
        <span>SAKURA1TAP</span>
        <span>{modelLoadState === 'ready' ? 'LIVE2D READY' : modelLoadState === 'error' ? 'MODEL OFFLINE' : 'SYNCING'}</span>
      </div>

      <motion.button
        animate={{ opacity: isReady ? 1 : 0.44, y: isReady ? 0 : 8 }}
        className="live2d-enter-button"
        disabled={!isReady || isEntering}
        onClick={handleEnter}
        onPointerEnter={() => setButtonHover(true)}
        onPointerLeave={() => setButtonHover(false)}
        type="button"
      >
        <span className="live2d-enter-ink" aria-hidden="true">
          {inkParticles.map((particle) => (
            <i
              key={particle.index}
              style={
                {
                  '--ink-index': particle.index,
                  '--ink-x': particle.x,
                  '--ink-y': particle.y,
                } as CSSProperties
              }
            />
          ))}
        </span>
        <span className="live2d-enter-mark" aria-hidden="true">
          <ArrowDownRight size={17} strokeWidth={1.8} />
        </span>
        <span className="live2d-enter-text">进入</span>
        <span className="live2d-enter-line" aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {isEntering && (
          <motion.div
            className="live2d-entry-curtain"
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
