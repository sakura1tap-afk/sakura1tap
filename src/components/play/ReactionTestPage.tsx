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
const SHORT_DELAY_MAX_MS = 3200
const MEDIUM_DELAY_MAX_MS = 5000
const MAX_DELAY_MS = 8000
const LONG_DELAY_THRESHOLD_MS = 5000

function getRandomUnit() {
  const values = new Uint32Array(1)
  window.crypto.getRandomValues(values)
  return values[0] / 0x100000000
}

function getRandomInteger(minimum: number, maximum: number) {
  return Math.floor(minimum + getRandomUnit() * (maximum - minimum + 1))
}

function getRandomDelay(previousDelay: number | null) {
  if (previousDelay !== null && previousDelay > LONG_DELAY_THRESHOLD_MS) {
    return getRandomInteger(MIN_DELAY_MS, SHORT_DELAY_MAX_MS)
  }

  const band = getRandomUnit()
  if (band < 0.72) return getRandomInteger(MIN_DELAY_MS, SHORT_DELAY_MAX_MS)
  if (band < 0.95) return getRandomInteger(SHORT_DELAY_MAX_MS + 1, MEDIUM_DELAY_MAX_MS)
  return getRandomInteger(MEDIUM_DELAY_MAX_MS + 1, MAX_DELAY_MS)
}

export default function ReactionTestPage({ onBack }: ReactionTestPageProps) {
  const timerRef = useRef<number | null>(null)
  const readyAtRef = useRef(0)
  const previousDelayRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<TestPhase>('idle')
  const [results, setResults] = useState<number[]>([])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const startTrial = useCallback(() => {
    clearTimer()
    const delay = getRandomDelay(previousDelayRef.current)
    previousDelayRef.current = delay
    setPhase('waiting')
    timerRef.current = window.setTimeout(() => {
      readyAtRef.current = window.performance.now()
      timerRef.current = null
      setPhase('ready')
    }, delay)
  }, [clearTimer])

  const resetTest = useCallback(() => {
    clearTimer()
    previousDelayRef.current = null
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

  const statusCopy = {
    idle: { eyebrow: 'REACTION TEST', title: '点击上方色块开始', detail: '完成 5 次有效测试后计算平均值' },
    waiting: { eyebrow: `第 ${trialNumber} / ${TRIAL_COUNT} 次`, title: '等待绿色', detail: '红色阶段提前点击会判定为抢跑' },
    ready: { eyebrow: `第 ${trialNumber} / ${TRIAL_COUNT} 次`, title: '立即点击绿色区域', detail: '计时已经开始' },
    result: { eyebrow: `第 ${results.length} / ${TRIAL_COUNT} 次`, title: `${lastResult ?? 0} ms`, detail: '点击上方色块继续下一次' },
    'false-start': { eyebrow: `第 ${trialNumber} / ${TRIAL_COUNT} 次`, title: '抢跑', detail: '本次不计入结果 · 点击上方色块重试' },
    complete: { eyebrow: '平均反应时间', title: `${average} ms`, detail: '5 次测试完成' },
  }[phase]

  return (
    <motion.section
      animate={{ opacity: 1 }}
      className={`reaction-test is-${phase}`}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div
        aria-label={statusCopy.title}
        className="reaction-test-stage"
        onPointerDown={(event) => {
          event.preventDefault()
          triggerStage()
        }}
        role="button"
        tabIndex={0}
      />

      <section className="reaction-test-console">
        <header className="reaction-test-console-header">
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

        <div className="reaction-test-status" aria-live="polite">
          <span>{statusCopy.eyebrow}</span>
          <strong>{statusCopy.title}</strong>
          <p>{statusCopy.detail}</p>
        </div>

        {phase === 'complete' && (
          <div className="reaction-test-results">
            {results.map((value, index) => (
              <span key={`${value}-${index}`}><i>{index + 1}</i><b>{value}</b><small>ms</small></span>
            ))}
          </div>
        )}

        <footer className="reaction-test-meta">
          <span>加密随机 · 1.2–8 秒</span>
          <span>鼠标 / 触控 / 空格</span>
          {phase === 'complete' ? (
            <button onClick={resetTest} type="button"><RotateCcw size={15} strokeWidth={1.8} />重新测试</button>
          ) : (
            <span>{results.map((value) => `${value}ms`).join(' · ') || '尚无记录'}</span>
          )}
        </footer>
      </section>
    </motion.section>
  )
}
