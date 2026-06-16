import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

type EnterOverlayProps = {
  isReady: boolean
  onEnter: () => void
}

export default function EnterOverlay({ isReady, onEnter }: EnterOverlayProps) {
  return (
    <div className={`enter-overlay ${isReady ? 'is-ready' : ''}`}>
      <div className="enter-tether" aria-hidden="true">
        <span className="enter-tether-line" />
        <span className="enter-tether-pulse" />
        <span className="enter-target" />
      </div>
      <motion.button
        className="enter-button"
        disabled={!isReady}
        type="button"
        onClick={onEnter}
      >
        <span className="enter-button-scan" aria-hidden="true" />
        <span className="enter-button-orb" aria-hidden="true">
          <ArrowRight size={17} strokeWidth={1.9} />
        </span>
        <span className="enter-button-text">进入</span>
        <span className="enter-button-line" aria-hidden="true">
          <span />
        </span>
      </motion.button>
    </div>
  )
}
