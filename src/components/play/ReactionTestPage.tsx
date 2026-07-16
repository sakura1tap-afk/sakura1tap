import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, RotateCcw, Send, Trophy } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './ReactionTestPage.css'

type ReactionTestPageProps = {
  onBack: () => void
}

type TestPhase = 'idle' | 'waiting' | 'ready' | 'result' | 'false-start' | 'complete'
type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

type LeaderboardEntry = {
  averageMs: number
  nickname: string
  rank: number
  updatedAt: string
}

const TRIAL_COUNT = 5
const MIN_DELAY_MS = 1200
const SHORT_DELAY_MAX_MS = 3200
const MEDIUM_DELAY_MAX_MS = 5000
const MAX_DELAY_MS = 8000
const LONG_DELAY_THRESHOLD_MS = 5000
const PLAYER_ID_KEY = 'sakura1tap.reaction.player-id'
const PLAYER_NAME_KEY = 'sakura1tap.reaction.nickname'

function getOrCreatePlayerId() {
  const stored = window.localStorage.getItem(PLAYER_ID_KEY)
  if (stored) return stored
  const playerId = window.crypto.randomUUID()
  window.localStorage.setItem(PLAYER_ID_KEY, playerId)
  return playerId
}

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardStatus, setLeaderboardStatus] = useState<RequestStatus>('idle')
  const [nickname, setNickname] = useState(() => window.localStorage.getItem(PLAYER_NAME_KEY) ?? '')
  const [submissionStatus, setSubmissionStatus] = useState<RequestStatus>('idle')
  const [submissionMessage, setSubmissionMessage] = useState('')

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
    setSubmissionStatus('idle')
    setSubmissionMessage('')
  }, [clearTimer])

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardStatus('loading')
    try {
      const response = await window.fetch('/api/reaction-leaderboard', {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('排行榜暂时不可用')
      const payload = await response.json() as { entries?: LeaderboardEntry[] }
      setLeaderboard(payload.entries ?? [])
      setLeaderboardStatus('success')
    } catch {
      setLeaderboardStatus('error')
    }
  }, [])

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
    void loadLeaderboard()
  }, [loadLeaderboard])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      if ((event.target as HTMLElement | null)?.closest('button, input')) return
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

  const submitScore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanNickname = nickname.trim().normalize('NFKC')
    if (!/^[\p{L}\p{N}_-]{2,16}$/u.test(cleanNickname)) {
      setSubmissionStatus('error')
      setSubmissionMessage('昵称使用 2–16 个中英文、数字、_ 或 -')
      return
    }
    if (phase !== 'complete' || results.length !== TRIAL_COUNT) return

    setSubmissionStatus('loading')
    setSubmissionMessage('')
    try {
      const response = await window.fetch('/api/reaction-leaderboard', {
        body: JSON.stringify({ nickname: cleanNickname, playerId: getOrCreatePlayerId(), results }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const payload = await response.json() as { entries?: LeaderboardEntry[]; error?: string; rank?: number }
      if (!response.ok) throw new Error(payload.error ?? '成绩保存失败')
      window.localStorage.setItem(PLAYER_NAME_KEY, cleanNickname)
      setNickname(cleanNickname)
      setLeaderboard(payload.entries ?? [])
      setLeaderboardStatus('success')
      setSubmissionStatus('success')
      setSubmissionMessage(payload.rank ? `已保存 · 当前第 ${payload.rank} 名` : '成绩已保存')
    } catch (error) {
      setSubmissionStatus('error')
      setSubmissionMessage(error instanceof Error ? error.message : '成绩保存失败')
    }
  }

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
          {phase === 'complete' && (
            <form className="reaction-test-submit" onSubmit={submitScore}>
              <input
                aria-label="排行榜昵称"
                autoComplete="nickname"
                maxLength={16}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="输入昵称"
                value={nickname}
              />
              <button disabled={submissionStatus === 'loading'} type="submit">
                <Send size={13} strokeWidth={1.8} />
                {submissionStatus === 'loading' ? '保存中' : '保存成绩'}
              </button>
              {submissionMessage && <small className={`is-${submissionStatus}`}>{submissionMessage}</small>}
            </form>
          )}
        </div>

        {phase === 'complete' && (
          <div className="reaction-test-results">
            {results.map((value, index) => (
              <span key={`${value}-${index}`}><i>{index + 1}</i><b>{value}</b><small>ms</small></span>
            ))}
          </div>
        )}

        <aside className="reaction-leaderboard" aria-label="反应时间排行榜">
          <header>
            <span><Trophy size={13} strokeWidth={1.8} />全站排行榜</span>
            <button
              aria-label="刷新排行榜"
              disabled={leaderboardStatus === 'loading'}
              onClick={() => void loadLeaderboard()}
              type="button"
            >
              <RefreshCw className={leaderboardStatus === 'loading' ? 'is-loading' : ''} size={13} strokeWidth={1.8} />
            </button>
          </header>
          {leaderboard.length > 0 ? (
            <ol>
              {leaderboard.slice(0, 5).map((entry) => (
                <li key={`${entry.rank}-${entry.nickname}`}>
                  <i>{String(entry.rank).padStart(2, '0')}</i>
                  <span>{entry.nickname}</span>
                  <b>{entry.averageMs}<small>ms</small></b>
                </li>
              ))}
            </ol>
          ) : (
            <p>{leaderboardStatus === 'loading' ? '读取中…' : leaderboardStatus === 'error' ? '等待数据库连接' : '成为第一个上榜者'}</p>
          )}
        </aside>

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
