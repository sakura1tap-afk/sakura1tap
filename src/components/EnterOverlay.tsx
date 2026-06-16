import { motion } from 'framer-motion'

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
        whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.52)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      >
        进入
      </motion.button>
    </div>
  )
}
