import { AnimatePresence, motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import Live2DStage from './Live2DStage'

type Live2DEntryProps = {
  isReady: boolean
  onEnter: () => void
  onReadyChange?: (isReady: boolean) => void
}

const gateParticles = Array.from({ length: 28 }, (_, index) => ({
  index,
  angle: `${index * 23 + Math.sin(index * 1.9) * 18}deg`,
  distance: `${2.3 + (index % 7) * 0.42}rem`,
  size: `${0.12 + (index % 4) * 0.035}rem`,
  delay: `${index * 46}ms`,
}))

export default function Live2DEntry({ isReady, onEnter, onReadyChange }: Live2DEntryProps) {
  const [isEntering, setIsEntering] = useState(false)
  const [buttonHover, setButtonHover] = useState(false)
  const [modelLoadState, setModelLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

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
      className={`live2d-entry ${isEntering ? 'is-entering' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: 'easeOut' }}
    >
      <div className="live2d-entry-bg" aria-hidden="true" />
      <div className="live2d-entry-grid" aria-hidden="true" />
      <div className="live2d-entry-vignette" aria-hidden="true" />
      <div className="live2d-entry-ink" aria-hidden="true" />
      <div className="live2d-entry-foreground" aria-hidden="true" />

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
        animate={{ opacity: isReady ? 1 : 0.44 }}
        aria-label="进入"
        className="live2d-enter-button city-gate-entry"
        disabled={!isReady || isEntering}
        onClick={handleEnter}
        onPointerEnter={() => setButtonHover(true)}
        onPointerLeave={() => setButtonHover(false)}
        type="button"
      >
        <span className="city-gate-entry-core" aria-hidden="true" />
        <span className="city-gate-entry-rays" aria-hidden="true" />
        <span className="city-gate-entry-particles" aria-hidden="true">
          {gateParticles.map((particle) => (
            <i
              key={particle.index}
              style={
                {
                  '--particle-angle': particle.angle,
                  '--particle-distance': particle.distance,
                  '--particle-size': particle.size,
                  '--particle-delay': particle.delay,
                } as CSSProperties
              }
            />
          ))}
        </span>
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
