import * as PIXI from 'pixi.js'
import { config, Live2DModel } from 'pixi-live2d-display/cubism4'
import { useEffect, useRef, useState } from 'react'

type FocusPoint = {
  x: number
  y: number
}

type Live2DCharacterProps = {
  focusPoint: FocusPoint | null
  isEntering: boolean
  modelUrl?: string
  onLoadStateChange?: (state: 'loading' | 'ready' | 'error') => void
}

const live2dLayout = {
  desktopHeightRatio: 0.72,
  desktopMaxHeight: 620,
  desktopX: 0.5,
  desktopY: 0.64,
  mobileHeightRatio: 0.68,
  mobileMaxHeight: 560,
  mobileX: 0.5,
  mobileY: 0.64,
}

type Live2DModelInstance = InstanceType<typeof Live2DModel>

export default function Live2DCharacter({
  focusPoint,
  isEntering,
  modelUrl = '/live2d/Frieren/Frieren.model3.json',
  onLoadStateChange,
}: Live2DCharacterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelRef = useRef<Live2DModelInstance | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    onLoadStateChange?.(loadState)
  }, [loadState, onLoadStateChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    const applyModelLayout = () => {
      const app = appRef.current
      const model = modelRef.current
      if (!app || !model || !container) return

      const rect = container.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      const isCompact = width < 720
      const targetHeight = Math.min(
        height * (isCompact ? live2dLayout.mobileHeightRatio : live2dLayout.desktopHeightRatio),
        isCompact ? live2dLayout.mobileMaxHeight : live2dLayout.desktopMaxHeight,
      )
      const modelBoundsHeight = Math.max(1, model.getBounds().height / Math.max(model.scale.y, 0.0001))
      const scale = Math.min(targetHeight / modelBoundsHeight, isCompact ? 0.24 : 0.32)

      app.renderer.resize(width, height)
      model.scale.set(scale)
      model.x = width * (isCompact ? live2dLayout.mobileX : live2dLayout.desktopX)
      model.y = height * (isCompact ? live2dLayout.mobileY : live2dLayout.desktopY)
      container.dataset.live2dScale = scale.toFixed(4)
      container.dataset.live2dBoundsHeight = modelBoundsHeight.toFixed(1)
      container.dataset.live2dTargetHeight = targetHeight.toFixed(1)
    }

    const init = async () => {
      try {
        setLoadState('loading')

        if (!window.Live2DCubismCore) {
          throw new Error('Cubism runtime is not available.')
        }

        window.PIXI = PIXI
        config.logLevel = config.LOG_LEVEL_ERROR
        Live2DModel.registerTicker(PIXI.Ticker)

        const app = new PIXI.Application({
          antialias: true,
          autoDensity: true,
          backgroundAlpha: 0,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        })
        appRef.current = app
        app.view.className = 'live2d-canvas'
        container.appendChild(app.view)

        const model = await Live2DModel.from(modelUrl)
        if (disposed) {
          model.destroy({ children: true, texture: true, baseTexture: true })
          return
        }

        modelRef.current = model
        model.anchor.set(0.5, 0.52)
        model.interactive = true
        app.stage.addChild(model)
        applyModelLayout()
        window.requestAnimationFrame(applyModelLayout)
        setLoadState('ready')

        resizeObserver = new ResizeObserver(applyModelLayout)
        resizeObserver.observe(container)
      } catch (error) {
        console.warn('Live2D model failed to load.', error)
        setLoadState('error')
      }
    }

    void init()

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      modelRef.current?.destroy({ children: true, texture: true, baseTexture: true })
      modelRef.current = null
      appRef.current?.destroy(true)
      appRef.current = null
      container.querySelector('.live2d-canvas')?.remove()
    }
  }, [modelUrl])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current
      const model = modelRef.current
      if (!container || !model) return

      const rect = container.getBoundingClientRect()
      model.focus(event.clientX - rect.left, event.clientY - rect.top)
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const model = modelRef.current
    if (!container || !model || !focusPoint) return

    const rect = container.getBoundingClientRect()
    model.focus(rect.width * focusPoint.x, rect.height * focusPoint.y)
  }, [focusPoint])

  const triggerCharacterFeedback = () => {
    const model = modelRef.current
    if (!model) return

    void model.expression().catch(() => undefined)
    void model.motion('').catch(() => undefined)
  }

  return (
    <div
      className={`live2d-character is-${loadState} ${isEntering ? 'is-entering' : ''}`}
      onPointerDown={triggerCharacterFeedback}
      ref={containerRef}
    >
      {loadState === 'error' && <div className="live2d-status">Live2D model not found.</div>}
      {loadState === 'loading' && <div className="live2d-status">loading</div>}
    </div>
  )
}

declare global {
  interface Window {
    Live2DCubismCore?: unknown
    PIXI?: typeof PIXI
  }
}
