import { useProgress } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

type BootOverlayProps = {
  onComplete: () => void
}

export default function BootOverlay({ onComplete }: BootOverlayProps) {
  const { active, progress } = useProgress()
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [visible, setVisible] = useState(true)
  const displayProgress = useMemo(() => {
    if (!active && progress === 0) return 100
    return Math.min(100, Math.round(progress))
  }, [active, progress])
  const complete = minimumElapsed && !active && displayProgress >= 100

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), 1250)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!complete) return

    const hideTimer = window.setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 360)

    return () => window.clearTimeout(hideTimer)
  }, [complete, onComplete])

  if (!visible) return null

  return (
    <motion.div className="boot-overlay" initial={{ opacity: 1 }}>
      <motion.div
        className="boot-scan"
        animate={{ x: ['-18%', '118%'] }}
        transition={{ duration: 1.55, ease: 'easeInOut', repeat: Infinity }}
      />

      <div className="boot-readout">
        <span className="boot-kicker">SAKURA1TAP SYSTEM</span>
        <div className="boot-track" aria-hidden="true">
          <motion.span animate={{ width: `${displayProgress}%` }} transition={{ ease: 'easeOut' }} />
        </div>
        <div className="boot-meta">
          <span>LOADING MODEL</span>
          <span>{displayProgress.toString().padStart(3, '0')}%</span>
        </div>
      </div>
    </motion.div>
  )
}
