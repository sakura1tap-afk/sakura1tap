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

type StageModelConfig = {
  feedbackExpressions?: string[]
  layout: Live2DLayout
  parameterOverrides?: Record<string, number>
  required?: boolean
  url: string
}

type LoadedStageModel = {
  feedbackExpressions?: string[]
  layout: Live2DLayout
  model: Live2DModelInstance
  parameterOverrides?: Record<string, number>
}

const stageModels: StageModelConfig[] = [
  {
    url: '/live2d/Frieren/Frieren.model3.json',
    required: true,
    feedbackExpressions: ['wh', 'han', 'ku', 'yy', 'mmy', 'anya2'],
    layout: {
      heightRatio: 1.06,
      maxHeight: 930,
      maxScale: 0.62,
      mobileHeightRatio: 0.74,
      mobileMaxHeight: 530,
      mobileMaxScale: 0.3,
      mobileX: 0.35,
      mobileY: 0.76,
      x: 0.3,
      y: 0.88,
    },
  },
  {
    url: '/live2d/Fern/fern.model3.json',
    parameterOverrides: { Param33: 1 },
    layout: {
      heightRatio: 1.08,
      maxHeight: 940,
      maxScale: 0.6,
      mobileHeightRatio: 0.74,
      mobileMaxHeight: 530,
      mobileMaxScale: 0.3,
      mobileX: 0.65,
      mobileY: 0.76,
      x: 0.71,
      y: 0.88,
    },
  },
]

const MODEL_LOAD_TIMEOUT = 18000

const focusModelAtStagePoint = (model: Live2DModelInstance, stageX: number, stageY: number) => {
  const bounds = model.getBounds()
  const centerX = bounds.x + bounds.width * 0.5
  const centerY = bounds.y + bounds.height * 0.45
  const focusX = (stageX - centerX) / Math.max(bounds.width * 0.48, 1)
  const focusY = (centerY - stageY) / Math.max(bounds.height * 0.42, 1)

  model.focus(focusX, focusY)
}

export default function Live2DStage({ focusPoint, isEntering, onLoadStateChange }: Live2DStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const feedbackIndexRef = useRef(0)
  const modelsRef = useRef<LoadedStageModel[]>([])
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

    const applyParameterOverrides = (model: Live2DModelInstance, overrides?: Record<string, number>) => {
      if (!overrides) return

      const coreModel = model.internalModel.coreModel as {
        setParameterValueById?: (parameterId: string, value: number, weight?: number) => void
      }

      Object.entries(overrides).forEach(([parameterId, value]) => {
        coreModel.setParameterValueById?.(parameterId, value, 1)
      })
    }

    const bindParameterOverrides = (model: Live2DModelInstance, overrides?: Record<string, number>) => {
      if (!overrides) return

      const internalModel = model.internalModel as {
        on?: (eventName: string, callback: () => void) => void
      }

      internalModel.on?.('beforeModelUpdate', () => applyParameterOverrides(model, overrides))
    }

    const waitForStableFrame = async (app: PIXI.Application) => {
      app.renderer.render(app.stage)
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
      app.renderer.render(app.stage)
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
    }

    const loadModelWithTimeout = async ({
      feedbackExpressions,
      layout,
      parameterOverrides,
      required,
      url,
    }: StageModelConfig): Promise<LoadedStageModel | null> => {
      let timeoutId = 0
      try {
        const model = await Promise.race([
          Live2DModel.from(url),
          new Promise<never>((_, reject) => {
            timeoutId = window.setTimeout(() => reject(new Error(`Live2D load timed out: ${url}`)), MODEL_LOAD_TIMEOUT)
          }),
        ])
        window.clearTimeout(timeoutId)
        model.anchor.set(0.5, 0.52)
        model.alpha = 1
        model.interactive = true
        applyParameterOverrides(model, parameterOverrides)
        bindParameterOverrides(model, parameterOverrides)
        return { feedbackExpressions, layout, model, parameterOverrides }
      } catch (error) {
        window.clearTimeout(timeoutId)
        console.warn('Live2D model failed to load.', url, error)
        if (required) throw error
        return null
      }
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

        const loadedModels = (await Promise.all(stageModels.map(loadModelWithTimeout))).filter(
          (item): item is LoadedStageModel => item !== null,
        )

        if (disposed) {
          loadedModels.forEach(({ model }) => model.destroy({ children: true }))
          return
        }

        if (loadedModels.length === 0) {
          throw new Error('No Live2D models loaded.')
        }

        modelsRef.current = loadedModels
        loadedModels.forEach(({ model, parameterOverrides }) => {
          app.stage.addChild(model)
          applyParameterOverrides(model, parameterOverrides)
        })
        app.ticker.add(() => {
          modelsRef.current.forEach(({ model, parameterOverrides }) => {
            applyParameterOverrides(model, parameterOverrides)
          })
        })

        applyStageLayout()
        window.requestAnimationFrame(applyStageLayout)
        await waitForStableFrame(app)
        if (disposed) return
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
      modelsRef.current.forEach(({ model }) => model.destroy({ children: true }))
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
        focusModelAtStagePoint(model, event.clientX - rect.left, event.clientY - rect.top)
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
      focusModelAtStagePoint(model, rect.width * focusPoint.x, rect.height * focusPoint.y)
    })
  }, [focusPoint])

  const triggerCharacterFeedback = () => {
    const feedbackIndex = feedbackIndexRef.current
    feedbackIndexRef.current += 1

    modelsRef.current.forEach(({ feedbackExpressions, model }) => {
      const expressionName = feedbackExpressions?.[feedbackIndex % feedbackExpressions.length]

      if (expressionName) {
        void model.expression(expressionName).catch(() => {
          void model.expression().catch(() => undefined)
        })
      } else {
        void model.expression().catch(() => undefined)
      }

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
