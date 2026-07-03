import { AnimatePresence, motion } from 'framer-motion'
import {
  lazy,
  Suspense,
  type CSSProperties,
  type PointerEvent,
  type WheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { SectionKey } from '../../data/mainSections'
import DetailLayer from './DetailLayer'
import {
  getSequenceView,
  initialMainExperienceState,
  reduceMainExperience,
  type SequenceDirection,
} from './experienceMachine'
import MainMotionLayer from './MainMotionLayer'
import RealmInterface from './RealmInterface'

const RealmWorldStage = lazy(() => import('./RealmWorldStage'))

type MainExperienceProps = {
  modelBuffer: ArrayBuffer | null
}

const WHEEL_THRESHOLD = 72
const WHEEL_COOLDOWN_MS = 680
const DIRECTION_RESET_MS = 560
const MAIN_STAGE_TIMELINE_MS = [180, 550, 950, 1350, 2250, 3200]
const realmDust = Array.from({ length: 18 }, (_, index) => ({
  delay: `${(index % 9) * -0.7}s`,
  drift: `${Math.sin(index * 1.7) * 2.4}rem`,
  left: `${8 + ((index * 17) % 84)}%`,
  size: `${0.12 + (index % 4) * 0.045}rem`,
  top: `${12 + ((index * 23) % 74)}%`,
}))

export default function MainExperience({ modelBuffer }: MainExperienceProps) {
  const [state, dispatch] = useReducer(reduceMainExperience, initialMainExperienceState)
  const [stagePhase, setStagePhase] = useState(0)
  const rootRef = useRef<HTMLElement | null>(null)
  const wheelAccumulatorRef = useRef(0)
  const wheelCooldownRef = useRef(0)
  const directionResetRef = useRef(0)
  const view = getSequenceView(state)

  const setDirectionReset = useCallback(() => {
    window.clearTimeout(directionResetRef.current)
    directionResetRef.current = window.setTimeout(() => {
      dispatch({ type: 'clear-direction' })
    }, DIRECTION_RESET_MS)
  }, [])

  const shiftSequence = useCallback(
    (direction: SequenceDirection) => {
      dispatch({ type: 'shift', direction })
      setDirectionReset()
    },
    [setDirectionReset],
  )

  const activateSequence = (key: SectionKey) => {
    dispatch({ type: 'activate', key })
  }

  const openActiveSequence = () => {
    dispatch({ type: 'open-active' })
  }

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      if (view.isNodeOpen) return

      event.preventDefault()

      const now = window.performance.now()
      if (now - wheelCooldownRef.current < WHEEL_COOLDOWN_MS) return

      wheelAccumulatorRef.current += event.deltaY
      if (Math.abs(wheelAccumulatorRef.current) < WHEEL_THRESHOLD) return

      const direction = wheelAccumulatorRef.current > 0 ? 'next' : 'prev'
      wheelAccumulatorRef.current = 0
      wheelCooldownRef.current = now
      shiftSequence(direction)
    },
    [shiftSequence, view.isNodeOpen],
  )

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const root = rootRef.current
    if (!root) return

    root.style.setProperty('--cursor-x', `${(event.clientX / window.innerWidth) * 100}%`)
    root.style.setProperty('--cursor-y', `${(event.clientY / window.innerHeight) * 100}%`)
    root.style.setProperty('--cursor-px', `${event.clientX}px`)
    root.style.setProperty('--cursor-py', `${event.clientY}px`)
  }

  useEffect(() => {
    return () => window.clearTimeout(directionResetRef.current)
  }, [])

  useEffect(() => {
    const timers = MAIN_STAGE_TIMELINE_MS.map((delay, index) =>
      window.setTimeout(() => {
        setStagePhase(index + 1)
      }, delay),
    )

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
    }
  }, [])

  const styleVars = useMemo(
    () =>
      ({
        '--accent': view.activeSection.accent,
        '--cursor-x': '50%',
        '--cursor-y': '50%',
        '--cursor-px': '50vw',
        '--cursor-py': '50vh',
        '--layer-atmosphere': stagePhase >= 2 ? 1 : 0,
        '--layer-backdrop': stagePhase >= 1 ? 1 : 0,
        '--layer-stage': stagePhase >= 4 ? 1 : 0,
        '--layer-ui': stagePhase >= 3 ? 1 : 0,
        '--section-index': view.activeIndex,
      }) as CSSProperties,
    [stagePhase, view.activeIndex, view.activeSection.accent],
  )

  return (
    <motion.section
      className={`main-page realm-experience ${view.isNodeOpen ? 'has-node-open' : ''} ${state.direction ? `is-wheel-${state.direction}` : ''}`}
      data-stage-phase={stagePhase}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      ref={rootRef}
      style={styleVars}
      transition={{ duration: 0.72, ease: 'easeOut' }}
      onPointerMove={handlePointerMove}
      onWheel={handleWheel}
    >
      <MainMotionLayer active={state.active} nodeOpen={view.isNodeOpen} wheelDirection={state.direction}>
        <div className="realm-backdrop" aria-hidden="true" />
        <div className="realm-painting" aria-hidden="true" />
        <div className="realm-mist" aria-hidden="true" />
        <div className="realm-forest-frame" aria-hidden="true" />
        <div className="realm-gold-dust" aria-hidden="true">
          {realmDust.map((particle, index) => (
            <i
              key={index}
              style={
                {
                  '--dust-delay': particle.delay,
                  '--dust-drift': particle.drift,
                  '--dust-left': particle.left,
                  '--dust-size': particle.size,
                  '--dust-top': particle.top,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="realm-cursor-ripple" aria-hidden="true" />

        {stagePhase >= 4 ? (
          <Suspense fallback={<div className="realm-stage realm-stage-loading" aria-hidden="true" />}>
            <RealmWorldStage
              active={state.active}
              assetPhase={stagePhase}
              modelBuffer={modelBuffer}
              nodeOpen={view.isNodeOpen}
            />
          </Suspense>
        ) : (
          <div className="realm-stage realm-stage-loading" aria-hidden="true" />
        )}

        <RealmInterface
          active={state.active}
          isNodeOpen={view.isNodeOpen}
          onActivate={activateSequence}
          onOpenActive={openActiveSequence}
        />

        <AnimatePresence>
          {state.openNode && <DetailLayer active={state.openNode} onClose={() => dispatch({ type: 'close-node' })} />}
        </AnimatePresence>
      </MainMotionLayer>
    </motion.section>
  )
}
