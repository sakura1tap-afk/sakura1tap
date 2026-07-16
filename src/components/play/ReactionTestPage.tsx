import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './ReactionTestPage.css'

type ReactionTestPageProps = {
  onBack: () => void
}

type TestPhase = 'idle' | 'waiting' | 'ready' | 'result' | 'false-start' | 'complete'

const TRIAL_COUNT = 5
const MIN_DELAY_MS = 1200
const MAX_DELAY_MS = 8000

function getRandomDelay() {
  const values = new Uint32Array(1)
  window.crypto.getRandomValues(values)
  const unit = values[0] / 0x100000000
  return Math.floor(MIN_DELAY_MS + unit * (MAX_DELAY_MS - MIN_DELAY_MS + 1))
}

export default function ReactionTestPage({ onBack }: ReactionTestPageProps) {
  const timerRef = useRef<number | null>(null)
  const readyAtRef = useRef(0)
  const [phase, setPhase] = useState<TestPhase>('idle')
  const [results, setResults] = useState<number[]>([])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const startTrial = useCallback(() => {
    clearTimer()
    setPhase('waiting')
    timerRef.current = window.setTimeout(() => {
      readyAtRef.current = window.performance.now()
      timerRef.current = null
      setPhase('ready')
    }, getRandomDelay())
  }, [clearTimer])

  const resetTest = useCallback(() => {
    clearTimer()
    setResults([])
    setPhase('idle')
  }, [clearTimer])

  const triggerStage = useCallback(() => {
    if (phase === 'idle' || phase === 'result' || phase === 'false-start') {
      startTrial()
      return
    }

    if (phase === 'waiting') {
      clearTimer()
      setPhase('false-start')
      return
    }

    if (phase === 'ready') {
      const reaction = Math.max(1, Math.round(window.performance.now() - readyAtRef.current))
      const nextResults = [...results, reaction]
      setResults(nextResults)
      setPhase(nextResults.length === TRIAL_COUNT ? 'complete' : 'result')
      return
    }

    if (phase === 'complete') resetTest()
  }, [clearTimer, phase, resetTest, results, startTrial])

  useEffect(() => clearTimer, [clearTimer])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      triggerStage()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [triggerStage])

  const average = useMemo(() => {
    if (results.length === 0) return 0
    return Math.round(results.reduce((sum, value) => sum + value, 0) / results.length)
  }, [results])

  const trialNumber = Math.min(results.length + 1, TRIAL_COUNT)
  const lastResult = results.at(-1)

  const centerCopy = {
    idle: { eyebrow: 'REACTION TEST', title: '点击开始', detail: '共 5 次 · 取平均值' },
    waiting: { eyebrow: `第 ${trialNumber} / ${TRIAL_COUNT} 次`, title: '等待绿色', detail: '现在点击会判定为抢跑' },
    ready: { eyebrow: `第 ${trialNumber} / ${TRIAL_COUNT} 次`, title: '点击', detail: '现在' },
    result: { eyebrow: `第 ${results.length} / ${TRIAL_COUNT} 次`, title: `${lastResult ?? 0} ms`, detail: '点击继续下一次' },
    'false-start': { eyebrow: `第 ${trialNumber} / ${TRIAL_COUNT} 次`, title: '抢跑', detail: '本次不计入结果 · 点击重试' },
    complete: { eyebrow: '平均反应时间', title: `${average} ms`, detail: '5 次测试完成' },
  }[phase]

  return (
    <motion.section
      animate={{ opacity: 1 }}
      className={`reaction-test is-${phase}`}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <header className="reaction-test-header" onPointerDown={(event) => event.stopPropagation()}>
        <button onClick={onBack} type="button">
          <ArrowLeft size={16} strokeWidth={1.8} />
          <span>功能空间</span>
        </button>
        <div className="reaction-test-progress" aria-label={`已完成 ${results.length} 次，共 ${TRIAL_COUNT} 次`}>
          {Array.from({ length: TRIAL_COUNT }, (_, index) => (
            <i
              className={`${index < results.length ? 'is-complete' : ''} ${index === results.length && phase !== 'complete' ? 'is-current' : ''}`}
              key={index}
            />
          ))}
        </div>
        <div className="reaction-test-counter">
          <strong>{String(phase === 'complete' ? TRIAL_COUNT : trialNumber).padStart(2, '0')}</strong>
          <span>/ 05</span>
        </div>
      </header>

      <div
        aria-label={centerCopy.title}
        className="reaction-test-stage"
        onPointerDown={(event) => {
          event.preventDefault()
          triggerStage()
        }}
        role="button"
        tabIndex={0}
      >
        <div className="reaction-test-noise" aria-hidden="true" />
        <div className="reaction-test-ring" aria-hidden="true"><i /></div>
        <div className="reaction-test-center" aria-live="assertive">
          <span>{centerCopy.eyebrow}</span>
          <strong>{centerCopy.title}</strong>
          <p>{centerCopy.detail}</p>
        </div>

        {phase === 'complete' && (
          <div className="reaction-test-results" onPointerDown={(event) => event.stopPropagation()}>
            {results.map((value, index) => (
              <span key={`${value}-${index}`}><i>{index + 1}</i><b>{value}</b><small>ms</small></span>
            ))}
          </div>
        )}
      </div>

      <footer className="reaction-test-footer" onPointerDown={(event) => event.stopPropagation()}>
        <span>随机等待 1.2–8 秒</span>
        <span>鼠标 / 触控 / 空格</span>
        {phase === 'complete' ? (
          <button onClick={resetTest} type="button"><RotateCcw size={15} strokeWidth={1.8} />重新测试</button>
        ) : (
          <span>{results.map((value) => `${value}ms`).join(' · ') || '尚无记录'}</span>
        )}
      </footer>
    </motion.section>
  )
}
