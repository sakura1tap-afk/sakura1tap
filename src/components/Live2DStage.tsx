import * as PIXI from 'pixi.js'
import { config, Live2DModel } from 'pixi-live2d-display/cubism4'
import { useEffect, useRef, useState } from 'react'

type FocusPoint = {
  x: number
  y: number
}

type StageState = 'loading' | 'ready' | 'error'

type Live2DStageProps = {
  focusPoint: FocusPoint | null
  isEntering: boolean
  onLoadStateChange?: (state: StageState) => void
}

type Live2DLayout = {
  heightRatio: number
  maxHeight: number
  maxScale: number
  mobileHeightRatio: number
  mobileMaxHeight: number
  mobileMaxScale: number
  mobileX: number
  mobileY: number
  x: number
  y: number
}

type Live2DModelInstance = InstanceType<typeof Live2DModel>

const stageModels: Array<{ layout: Live2DLayout; url: string }> = [
  {
    url: '/live2d/Frieren/Frieren.model3.json',
    layout: {
      heightRatio: 0.92,
      maxHeight: 800,
      maxScale: 0.5,
      mobileHeightRatio: 0.66,
      mobileMaxHeight: 530,
      mobileMaxScale: 0.24,
      mobileX: 0.38,
      mobileY: 0.68,
      x: 0.36,
      y: 0.8,
    },
  },
  {
    url: '/live2d/Fern/fern.model3.json',
    layout: {
      heightRatio: 0.92,
      maxHeight: 800,
      maxScale: 0.5,
      mobileHeightRatio: 0.66,
      mobileMaxHeight: 530,
      mobileMaxScale: 0.24,
      mobileX: 0.62,
      mobileY: 0.68,
      x: 0.67,
      y: 0.8,
    },
  },
]

export default function Live2DStage({ focusPoint, isEntering, onLoadStateChange }: Live2DStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelsRef = useRef<Array<{ layout: Live2DLayout; model: Live2DModelInstance }>>([])
  const [loadState, setLoadState] = useState<StageState>('loading')

  useEffect(() => {
    onLoadStateChange?.(loadState)
  }, [loadState, onLoadStateChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    const applyStageLayout = () => {
      const app = appRef.current
      if (!app || !container) return

      const rect = container.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      const isCompact = window.innerWidth < 720

      app.renderer.resize(width, height)

      modelsRef.current.forEach(({ layout, model }, index) => {
        const targetHeight = Math.min(
          height * (isCompact ? layout.mobileHeightRatio : layout.heightRatio),
          isCompact ? layout.mobileMaxHeight : layout.maxHeight,
        )
        const modelBoundsHeight = Math.max(1, model.getBounds().height / Math.max(model.scale.y, 0.0001))
        const scale = Math.min(targetHeight / modelBoundsHeight, isCompact ? layout.mobileMaxScale : layout.maxScale)

        model.scale.set(scale)
        model.x = width * (isCompact ? layout.mobileX : layout.x)
        model.y = height * (isCompact ? layout.mobileY : layout.y)

        const fittedBounds = model.getBounds()
        container.dataset[`live2dScale${index}`] = scale.toFixed(4)
        container.dataset[`live2dBounds${index}`] = [
          fittedBounds.x.toFixed(1),
          fittedBounds.y.toFixed(1),
          fittedBounds.width.toFixed(1),
          fittedBounds.height.toFixed(1),
        ].join(',')
      })
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
        app.view.className = 'live2d-canvas live2d-stage-canvas'
        container.appendChild(app.view)

        const loadedModels = await Promise.all(
          stageModels.map(async ({ layout, url }) => {
            const model = await Live2DModel.from(url)
            model.anchor.set(0.5, 0.52)
            model.alpha = 1
            model.interactive = true
            return { layout, model }
          }),
        )

        if (disposed) {
          loadedModels.forEach(({ model }) => model.destroy({ children: true, texture: true, baseTexture: true }))
          return
        }

        modelsRef.current = loadedModels
        loadedModels.forEach(({ model }) => {
          app.stage.addChild(model)
          void model.motion('').catch(() => undefined)
        })

        applyStageLayout()
        window.requestAnimationFrame(applyStageLayout)
        setLoadState('ready')

        resizeObserver = new ResizeObserver(applyStageLayout)
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
      modelsRef.current.forEach(({ model }) => model.destroy({ children: true, texture: true, baseTexture: true }))
      modelsRef.current = []
      appRef.current?.destroy(true)
      appRef.current = null
      container.querySelector('.live2d-canvas')?.remove()
    }
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      modelsRef.current.forEach(({ model }) => {
        model.focus(event.clientX - rect.left, event.clientY - rect.top)
      })
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !focusPoint) return

    const rect = container.getBoundingClientRect()
    modelsRef.current.forEach(({ model }) => {
      model.focus(rect.width * focusPoint.x, rect.height * focusPoint.y)
    })
  }, [focusPoint])

  const triggerCharacterFeedback = () => {
    modelsRef.current.forEach(({ model }) => {
      void model.expression().catch(() => undefined)
      void model.motion('').catch(() => undefined)
    })
  }

  return (
    <div
      className={`live2d-stage is-${loadState} ${isEntering ? 'is-entering' : ''}`}
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
