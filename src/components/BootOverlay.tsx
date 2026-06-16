import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

type BootOverlayProps = {
  modelUrl: string
  onComplete: (loadedModelUrl: string) => void
}

type BootState = 'loading' | 'complete' | 'error'

export default function BootOverlay({ modelUrl, onComplete }: BootOverlayProps) {
  const [attempt, setAttempt] = useState(0)
  const [bootState, setBootState] = useState<BootState>('loading')
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [message, setMessage] = useState('INITIALIZING')
  const [loadedModelUrl, setLoadedModelUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const displayProgress = useMemo(() => Math.min(100, Math.max(0, Math.round(progress))), [progress])
  const complete = minimumElapsed && bootState === 'complete'

  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!complete) return

    setProgress(100)
    const hideTimer = window.setTimeout(() => {
      if (loadedModelUrl) {
        onComplete(loadedModelUrl)
      }
    }, 360)
    return () => window.clearTimeout(hideTimer)
  }, [complete, loadedModelUrl, onComplete])

  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    let simulatedProgress = 8

    setBootState('loading')
    setMinimumElapsed(false)
    setLoadedModelUrl(null)
    setMessage('CONNECTING')
    setProgress(0)

    const minimumTimer = window.setTimeout(() => {
      if (alive) setMinimumElapsed(true)
    }, 1250)

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
          const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }))
          setLoadedModelUrl(objectUrl)
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
        const modelParts = chunks.map((chunk) => {
          const copy = new ArrayBuffer(chunk.byteLength)
          new Uint8Array(copy).set(chunk)
          return copy
        })
        const objectUrl = URL.createObjectURL(new Blob(modelParts, { type: 'model/gltf-binary' }))
        setLoadedModelUrl(objectUrl)
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
          <span>{message}</span>
          <span>{displayProgress.toString().padStart(3, '0')}%</span>
        </div>
        {bootState === 'error' && (
          <div className="boot-error">
            <span>模型加载超时或被当前网络阻止</span>
            <button onClick={retry} type="button">
              RETRY
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
