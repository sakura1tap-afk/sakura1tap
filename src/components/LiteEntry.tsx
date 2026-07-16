import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import './CinematicEntry.css'

type LiteEntryProps = {
  onEnter: () => void
}

export default function LiteEntry({ onEnter }: LiteEntryProps) {
  const [isEntering, setIsEntering] = useState(false)

  useEffect(() => {
    if (!isEntering) return undefined
    const timer = window.setTimeout(onEnter, 420)
    return () => window.clearTimeout(timer)
  }, [isEntering, onEnter])

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={`live2d-entry cinematic-entry lite-entry ${isEntering ? 'is-entering' : ''}`}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <picture className="entry-cinematic-bg" aria-hidden="true">
        <source media="(max-width: 760px)" srcSet="/cinematic/entry-v2-mobile.webp" />
        <img src="/cinematic/entry-v2.webp" alt="" draggable={false} />
      </picture>
      <div className="entry-cinematic-shade" aria-hidden="true" />

      <header className="entry-cinematic-header">
        <strong>Sakura1Tap</strong>
      </header>

      <button
        aria-label={isEntering ? '正在进入 Sakura1Tap' : '进入 Sakura1Tap'}
        className="live2d-enter-button realm-enter-button"
        disabled={isEntering}
        onClick={() => setIsEntering(true)}
        type="button"
      >
        <span className="entry-button-light" aria-hidden="true" />
        <b className="realm-enter-label">进入</b>
        <span className="entry-button-arrow" aria-hidden="true">→</span>
      </button>

      {isEntering && (
        <motion.div
          animate={{ opacity: 1 }}
          className="live2d-entry-curtain cinematic-curtain"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}
