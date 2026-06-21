import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import DodgeGame from './DodgeGame'

type PlayGamePageProps = {
  onBack: () => void
}

export default function PlayGamePage({ onBack }: PlayGamePageProps) {
  return (
    <motion.section
      className="play-game-page"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className="play-game-topbar">
        <button aria-label="返回 Play 介绍页" onClick={onBack} type="button">
          <ArrowLeft size={17} strokeWidth={1.8} />
          <span>BACK</span>
        </button>
        <div>
          <span>BLACKOUT RUN</span>
          <strong>FULLSCREEN PROGRAM</strong>
        </div>
      </header>
      <div className="play-game-shell">
        <DodgeGame />
      </div>
    </motion.section>
  )
}
