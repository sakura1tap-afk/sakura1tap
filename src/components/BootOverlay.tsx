import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type BootOverlayProps = {
  canComplete?: boolean
  modelUrl: string
  onComplete: (loadedModelBuffer: ArrayBuffer) => void
}

type BootState = 'loading' | 'complete' | 'error'

export default function BootOverlay({ canComplete = true, modelUrl, onComplete }: BootOverlayProps) {
  const [attempt, setAttempt] = useState(0)
  const [bootState, setBootState] = useState<BootState>('loading')
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [message, setMessage] = useState('INITIALIZING')
  const [loadedModelBuffer, setLoadedModelBuffer] = useState<ArrayBuffer | null>(null)
  const [progress, setProgress] = useState(0)
  const [targetProgress, setTargetProgress] = useState(0)
  const bootStartRef = useRef(0)
  const bootSegments = useMemo(() => Array.from({ length: 18 }, (_, index) => index), [])
  const displayProgress = useMemo(() => Math.min(100, Math.max(0, Math.round(progress))), [progress])
  const activeSegments = Math.round((displayProgress / 100) * bootSegments.length)
  const readyToFinish = minimumElapsed && bootState === 'complete' && canComplete
  const isRevealing = readyToFinish && displayProgress >= 100

  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!readyToFinish) return

    setTargetProgress(100)
  }, [readyToFinish])

  useEffect(() => {
    if (!readyToFinish || displayProgress < 100) return

    const hideTimer = window.setTimeout(() => {
      if (loadedModelBuffer) {
        onComplete(loadedModelBuffer)
      }
    }, 980)
    return () => window.clearTimeout(hideTimer)
  }, [displayProgress, loadedModelBuffer, onComplete, readyToFinish])

  useEffect(() => {
    if (bootState === 'error') return

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        const elapsed = window.performance.now() - bootStartRef.current
        const timedProgress = Math.min(targetProgress, (elapsed / 4300) * 100)
        const distance = targetProgress - current

        if (distance <= 0) return Math.max(current, timedProgress)
        if (distance < 0.35) return targetProgress

        const step = Math.min(2.4, Math.max(0.18, distance * 0.08))
        return Math.min(targetProgress, Math.max(timedProgress, current + step))
      })
    }, 80)

    return () => window.clearInterval(progressTimer)
  }, [bootState, targetProgress])

  useEffect(() => {
    if (bootState === 'error') return

    if (displayProgress >= 100 && readyToFinish) {
      setMessage('SCENE READY')
    } else if (displayProgress > 86) {
      setMessage('DECODING SCENE')
    } else if (displayProgress > 56) {
      setMessage('MAPPING LIGHT')
    } else if (displayProgress > 24) {
      setMessage('STREAMING MESH')
    } else {
      setMessage('CONNECTING')
    }
  }, [bootState, displayProgress, readyToFinish])

  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    let simulatedProgress = 2

    bootStartRef.current = window.performance.now()
    setBootState('loading')
    setMinimumElapsed(false)
    setLoadedModelBuffer(null)
    setMessage('CONNECTING')
    setProgress(0)
    setTargetProgress(0)

    const minimumTimer = window.setTimeout(() => {
      if (alive) setMinimumElapsed(true)
    }, 3200)

    const timeoutTimer = window.setTimeout(() => {
      controller.abort()
    }, 25000)

    const simulationTimer = window.setInterval(() => {
      if (!alive) return
      simulatedProgress = Math.min(84, simulatedProgress + Math.max(0.75, (84 - simulatedProgress) * 0.06))
      setTargetProgress((value) => Math.max(value, simulatedProgress))
    }, 180)

    async function preloadModel() {
      try {
        setMessage('LOADING MODEL')

        const response = await fetch(modelUrl, {
          cache: 'force-cache',
          signal: controller.signal,
        })

        const contentType = response.headers.get('content-type') ?? ''
        if (!response.ok || contentType.includes('text/html')) {
          throw new Error(`Model request failed: ${response.status}`)
        }

        const contentLength = Number(response.headers.get('content-length') ?? 0)

        if (!response.body) {
          const buffer = await response.arrayBuffer()
          if (!alive) return
          setLoadedModelBuffer(buffer)
          setTargetProgress((current) => Math.max(current, 94))
          setBootState('complete')
          return
        }

        const reader = response.body.getReader()
        let received = 0
        const chunks: Uint8Array[] = []

        while (alive) {
          const { done, value } = await reader.read()

          if (done) break
          if (value) chunks.push(value)
          received += value?.length ?? 0

          if (contentLength > 0) {
            const realProgress = (received / contentLength) * 100
            setTargetProgress((current) => Math.max(current, Math.min(92, realProgress * 0.92)))
          } else {
            setTargetProgress((current) => Math.max(current, Math.min(90, current + 2.5)))
          }
        }

        if (!alive) return
        const modelBuffer = new ArrayBuffer(received)
        const modelView = new Uint8Array(modelBuffer)
        let offset = 0
        for (const chunk of chunks) {
          modelView.set(chunk, offset)
          offset += chunk.byteLength
        }
        setLoadedModelBuffer(modelBuffer)
        setTargetProgress((current) => Math.max(current, 94))
        setBootState('complete')
      } catch (error) {
        if (!alive) return
        console.warn('Model preload failed.', error)
        setMessage('MODEL LOAD FAILED')
        setBootState('error')
      }
    }

    preloadModel()

    return () => {
      alive = false
      controller.abort()
      window.clearTimeout(minimumTimer)
      window.clearTimeout(timeoutTimer)
      window.clearInterval(simulationTimer)
    }
  }, [attempt, modelUrl])

  return (
    <motion.div className={`boot-overlay boot-${bootState} ${isRevealing ? 'boot-revealing' : ''}`} initial={{ opacity: 1 }}>
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-vignette" aria-hidden="true" />
      <div className="boot-reveal" aria-hidden="true" />
      <motion.div
        className="boot-sweep"
        aria-hidden="true"
        animate={{ y: ['-18vh', '118vh'] }}
        transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
      />

      <section className="boot-console" aria-live="polite" aria-label="Loading 3D entry scene">
        <div className="boot-topline">
          <span>SAKURA1TAP</span>
          <span>{readyToFinish && displayProgress >= 100 ? 'OPEN' : 'LOADING'}</span>
        </div>

        <div className="boot-percent">
          <span>{displayProgress.toString().padStart(3, '0')}</span>
          <em>%</em>
        </div>

        <div className="boot-segments" aria-hidden="true">
          {bootSegments.map((segment) => (
            <span
              className={segment < activeSegments ? 'is-active' : undefined}
              key={segment}
              style={{ transitionDelay: `${segment * 18}ms` }}
            />
          ))}
        </div>

        <div className="boot-track">
          <motion.span animate={{ width: `${displayProgress}%` }} transition={{ ease: 'easeOut' }} />
        </div>

        <div className="boot-meta">
          <span>{message}</span>
          <span>{readyToFinish && displayProgress >= 100 ? 'READY' : 'SYNC'}</span>
        </div>

        {bootState === 'error' && (
          <div className="boot-error">
            <span>模型加载超时或被当前网络阻止</span>
            <button onClick={retry} type="button">
              RETRY
            </button>
          </div>
        )}
      </section>
    </motion.div>
  )
}
