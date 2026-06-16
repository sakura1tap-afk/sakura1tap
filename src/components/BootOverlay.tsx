import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

type BootOverlayProps = {
  modelUrl: string
  onComplete: (loadedModelBuffer: ArrayBuffer) => void
}

type BootState = 'loading' | 'complete' | 'error'

export default function BootOverlay({ modelUrl, onComplete }: BootOverlayProps) {
  const [attempt, setAttempt] = useState(0)
  const [bootState, setBootState] = useState<BootState>('loading')
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [message, setMessage] = useState('INITIALIZING')
  const [loadedModelBuffer, setLoadedModelBuffer] = useState<ArrayBuffer | null>(null)
  const [progress, setProgress] = useState(0)
  const bootSegments = useMemo(() => Array.from({ length: 18 }, (_, index) => index), [])
  const displayProgress = useMemo(() => Math.min(100, Math.max(0, Math.round(progress))), [progress])
  const activeSegments = Math.round((displayProgress / 100) * bootSegments.length)
  const complete = minimumElapsed && bootState === 'complete'

  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!complete) return

    setProgress(100)
    const hideTimer = window.setTimeout(() => {
      if (loadedModelBuffer) {
        onComplete(loadedModelBuffer)
      }
    }, 360)
    return () => window.clearTimeout(hideTimer)
  }, [complete, loadedModelBuffer, onComplete])

  useEffect(() => {
    if (bootState !== 'loading') return

    if (displayProgress > 86) {
      setMessage('DECODING SCENE')
    } else if (displayProgress > 56) {
      setMessage('MAPPING LIGHT')
    } else if (displayProgress > 24) {
      setMessage('STREAMING MESH')
    }
  }, [bootState, displayProgress])

  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    let simulatedProgress = 8

    setBootState('loading')
    setMinimumElapsed(false)
    setLoadedModelBuffer(null)
    setMessage('CONNECTING')
    setProgress(0)

    const minimumTimer = window.setTimeout(() => {
      if (alive) setMinimumElapsed(true)
    }, 1850)

    const timeoutTimer = window.setTimeout(() => {
      controller.abort()
    }, 25000)

    const simulationTimer = window.setInterval(() => {
      if (!alive) return
      simulatedProgress = Math.min(92, simulatedProgress + Math.max(1, (92 - simulatedProgress) * 0.08))
      setProgress((value) => Math.max(value, simulatedProgress))
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
          setMessage('CALIBRATING SCENE')
          setProgress((current) => Math.max(current, 96))
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
            setProgress(Math.min(99, (received / contentLength) * 100))
          } else {
            setProgress((current) => Math.max(current, Math.min(96, current + 2.5)))
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
        setMessage('CALIBRATING SCENE')
        setProgress((current) => Math.max(current, 96))
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
    <motion.div className={`boot-overlay boot-${bootState}`} initial={{ opacity: 1 }}>
      <div className="boot-grid" aria-hidden="true" />
      <motion.div
        className="boot-sweep"
        aria-hidden="true"
        animate={{ x: ['-22vw', '122vw'] }}
        transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
      />

      <section className="boot-console" aria-live="polite" aria-label="Loading 3D entry scene">
        <div className="boot-topline">
          <span>SAKURA1TAP</span>
          <span>ENTRY SEQUENCE</span>
        </div>

        <div className="boot-core" aria-hidden="true">
          <motion.span
            className="boot-ring boot-ring-outer"
            animate={{ rotate: 360 }}
            transition={{ duration: 9, ease: 'linear', repeat: Infinity }}
          />
          <motion.span
            className="boot-ring boot-ring-inner"
            animate={{ rotate: -360 }}
            transition={{ duration: 6.5, ease: 'linear', repeat: Infinity }}
          />
          <motion.span
            className="boot-reticle"
            animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.48, 0.85, 0.48] }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
          />
          <div className="boot-percent">
            <span>{displayProgress.toString().padStart(3, '0')}</span>
            <em>%</em>
          </div>
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
          <span>{bootState === 'complete' ? 'READY' : 'SYNC'}</span>
        </div>

        <div className="boot-data" aria-hidden="true">
          <span>
            <b>MODEL BUFFER</b>
            <i>{displayProgress > 92 ? 'LOCKED' : 'STREAM'}</i>
          </span>
          <span>
            <b>WEBGL</b>
            <i>ONLINE</i>
          </span>
          <span>
            <b>SCENE PARSE</b>
            <i>{bootState === 'complete' ? 'ARMED' : 'WAIT'}</i>
          </span>
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
