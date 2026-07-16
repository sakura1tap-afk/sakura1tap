import { useCallback, useEffect, useRef, useState } from 'react'
import './CinematicEntry.css'

type BootOverlayProps = {
  canComplete?: boolean
  modelUrl: string
  onComplete: (loadedModelBuffer: ArrayBuffer) => void
  onModelLoaded?: (loadedModelBuffer: ArrayBuffer) => void
}

export default function BootOverlay({ canComplete = true, modelUrl, onComplete, onModelLoaded }: BootOverlayProps) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const bufferRef = useRef<ArrayBuffer | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onModelLoadedRef = useRef(onModelLoaded)

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    onCompleteRef.current = onComplete
    onModelLoadedRef.current = onModelLoaded
  }, [onComplete, onModelLoaded])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    bufferRef.current = null
    setState('loading')

    const timeout = window.setTimeout(() => controller.abort(), 25000)

    async function loadModel() {
      try {
        const response = await fetch(modelUrl, { cache: 'force-cache', signal: controller.signal })
        const contentType = response.headers.get('content-type') ?? ''
        if (!response.ok || contentType.includes('text/html')) throw new Error(`Model request failed: ${response.status}`)
        const buffer = await response.arrayBuffer()
        if (!active) return
        bufferRef.current = buffer
        onModelLoadedRef.current?.(buffer)
        setState('ready')
      } catch (error) {
        if (!active) return
        console.warn('Model preload failed.', error)
        setState('error')
      }
    }

    const frame = window.requestAnimationFrame(() => void loadModel())
    return () => {
      active = false
      controller.abort()
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [attempt, modelUrl])

  useEffect(() => {
    if (!canComplete || state !== 'ready' || !bufferRef.current) return
    const buffer = bufferRef.current
    const timer = window.setTimeout(() => onCompleteRef.current(buffer), 920)
    return () => window.clearTimeout(timer)
  }, [canComplete, state])

  return (
    <div className={`boot-overlay boot-cinematic ${state === 'ready' && canComplete ? 'boot-revealing' : ''}`}>
      <picture className="boot-still" aria-hidden="true">
        <source media="(max-width: 760px)" srcSet="/cinematic/entry-v2-mobile.webp" />
        <img src="/cinematic/entry-v2.webp" alt="" draggable={false} />
      </picture>
      <div className="boot-cinematic-shade" aria-hidden="true" />
      <div className="boot-cinematic-copy">
        <strong>Sakura1Tap</strong>
      </div>
      {state === 'error' && (
        <div className="boot-cinematic-error" role="alert">
          <span>加载暂时中断</span>
          <button type="button" onClick={retry}>重试</button>
        </div>
      )}
    </div>
  )
}
