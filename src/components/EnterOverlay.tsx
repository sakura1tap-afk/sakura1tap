import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

type EnterOverlayProps = {
  onEnter: () => void
}

export default function EnterOverlay({ onEnter }: EnterOverlayProps) {
  return (
    <div className="enter-overlay">
      <motion.button
        className="enter-button"
        type="button"
        onClick={onEnter}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      >
        <span className="enter-button-orb" aria-hidden="true">
          <ArrowRight size={17} strokeWidth={1.9} />
        </span>
        <span className="enter-button-text">进入</span>
        <span className="enter-button-line" aria-hidden="true" />
      </motion.button>
    </div>
  )
}
