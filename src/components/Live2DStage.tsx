import { useEffect, useRef, useState } from 'react'
import { CubismSdkModel, ensureCubismFramework, type CubismSdkModelConfig } from '../live2d/CubismSdkModel'

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

// `x` / `y` are viewport fractions for the character's bounding-box centre and
// `height` is that box's height in NDC units (1 = half the viewport height).
// See CubismSdkLayout for how the values are applied.
//
// Framing: the characters are large and sit low, so only the head and shoulders rise
// above the fold. `y` deliberately exceeds 1 — the body is meant to be off-screen, and
// that is what keeps the artwork from swallowing the scene.
const stageModels: CubismSdkModelConfig[] = [
  {
    url: '/live2d/WhiteAngelOriginal/无口天使 5.model3.json',
    required: true,
    feedbackExpressions: ['expression15', 'expression2', 'expression3', 'expression5', 'expression8', 'expression9'],
    parameterOverrides: { Param80: 1 },
    layout: {
      height: 1.5,
      mobileHeight: 1.22,
      mobileX: 0.28,
      mobileY: 1.0,
      x: 0.28,
      y: 1.06,
    },
  },
  {
    url: '/live2d/Fern/fern.model3.json',
    required: true,
    parameterOverrides: { Param33: 1 },
    layout: {
      height: 1.56,
      mobileHeight: 1.28,
      mobileX: 0.7,
      mobileY: 1.0,
      x: 0.7,
      y: 1.06,
    },
  },
]

const MODEL_LOAD_TIMEOUT = 24000
// Demo build: render the models at full device resolution. Lower this if a weak GPU
// ever struggles, but crispness matters more than the last few frames here.
const MAX_DPR = 2

export default function Live2DStage({ focusPoint, isEntering, onLoadStateChange }: Live2DStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<CubismStageEngine | null>(null)
  const [loadState, setLoadState] = useState<StageState>('loading')

  useEffect(() => {
    onLoadStateChange?.(loadState)
  }, [loadState, onLoadStateChange])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return undefined

    let disposed = false
    const engine = new CubismStageEngine(canvas, container)
    engineRef.current = engine

    const init = async () => {
      try {
        setLoadState('loading')
        await engine.load()
        if (disposed) return
        if (isLocalhost()) {
          window.__sakuraCubismStage = {
            getSnapshot: engine.getDebugSnapshot,
          }
        }
        engine.start()
        setLoadState('ready')
      } catch (error) {
        console.warn('Live2D model failed to load.', error)
        if (disposed) return
        setLoadState('error')
      }
    }

    void init()

    return () => {
      disposed = true
      engine.stop()
      if (window.__sakuraCubismStage?.getSnapshot === engine.getDebugSnapshot) {
        delete window.__sakuraCubismStage
      }
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      engineRef.current?.setFocusFromRatio(
        clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
        clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
      )
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => {
    if (!focusPoint) return
    engineRef.current?.setFocusFromRatio(focusPoint.x, focusPoint.y)
  }, [focusPoint])

  const triggerCharacterFeedback = () => {
    engineRef.current?.triggerFeedback()
  }

  return (
    <div
      className={`live2d-stage is-${loadState} ${isEntering ? 'is-entering' : ''}`}
      onPointerDown={triggerCharacterFeedback}
      ref={containerRef}
    >
      <canvas className="live2d-canvas live2d-stage-canvas" ref={canvasRef} />
      {loadState === 'error' && <div className="live2d-status">Live2D model not found.</div>}
      {loadState === 'loading' && <div className="live2d-status">loading</div>}
    </div>
  )
}

class CubismStageEngine {
  private animationFrame = 0
  private readonly canvas: HTMLCanvasElement
  private readonly container: HTMLDivElement
  private gl: WebGLRenderingContext | null = null
  private lastTime = performance.now()
  private models: CubismSdkModel[] = []
  private resizeObserver: ResizeObserver | null = null

  public constructor(canvas: HTMLCanvasElement, container: HTMLDivElement) {
    this.canvas = canvas
    this.container = container
  }

  public async load() {
    await ensureCubismFramework()

    const contextOptions = {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    }
    const gl =
      (this.canvas.getContext('webgl2', contextOptions) as WebGLRenderingContext | null) ??
      (this.canvas.getContext('webgl', contextOptions) as WebGLRenderingContext | null)

    if (!gl) throw new Error('WebGL context is not available.')
    this.gl = gl
    this.resize()

    const loadedModels: CubismSdkModel[] = []
    for (const [index, config] of stageModels.entries()) {
      if (index > 0) await waitForFrame()
      const model = await this.loadModel(config)
      if (model) {
        loadedModels.push(model)
        this.models = loadedModels.slice()
        this.resize()
        this.renderFrame(0)
      }
    }

    this.models = loadedModels

    if (this.models.length === 0) throw new Error('No Live2D models loaded.')

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.container)
    this.renderFrame(0)
  }

  public start() {
    this.lastTime = performance.now()
    const frame = (time: number) => {
      const delta = Math.min(0.05, Math.max(0, (time - this.lastTime) / 1000))
      this.lastTime = time
      this.renderFrame(delta)
      this.animationFrame = window.requestAnimationFrame(frame)
    }

    this.animationFrame = window.requestAnimationFrame(frame)
  }

  public stop() {
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame)
      this.animationFrame = 0
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.models.forEach((model) => model.release())
    this.models = []
  }

  public setFocusFromRatio(xRatio: number, yRatio: number) {
    const focusX = clamp((xRatio - 0.5) * 2, -1, 1)
    const focusY = clamp((0.5 - yRatio) * 2, -1, 1)
    this.models.forEach((model) => model.setFocus(focusX, focusY))
  }

  public triggerFeedback() {
    this.models.forEach((model) => model.triggerFeedback())
  }

  public getDebugSnapshot = () => this.models.map((model) => model.debugSnapshot())

  private async loadModel(config: CubismSdkModelConfig) {
    if (!this.gl) return null

    try {
      const model = new CubismSdkModel(config)
      await withTimeout(model.load(this.gl, this.canvas.width, this.canvas.height), MODEL_LOAD_TIMEOUT)
      return model
    } catch (error) {
      console.warn('Live2D model failed to load.', config.url, error)
      if (config.required) throw error
      return null
    }
  }

  private resize() {
    if (!this.gl) return

    const rect = this.container.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const width = Math.max(1, Math.floor(rect.width * dpr))
    const height = Math.max(1, Math.floor(rect.height * dpr))

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }

    this.gl.viewport(0, 0, width, height)
    this.models.forEach((model) => model.resize(width, height))
  }

  private renderFrame(deltaTimeSeconds: number) {
    const gl = this.gl
    if (!gl) return

    this.resize()
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    this.models.forEach((model) => {
      model.update(deltaTimeSeconds)
      model.draw(this.canvas.width, this.canvas.height)
    })

    gl.flush()
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId = 0
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('Live2D load timed out.')), timeoutMs)
      }),
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function waitForFrame() {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isLocalhost() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

declare global {
  interface Window {
    __sakuraCubismStage?: {
      getSnapshot: () => Array<ReturnType<CubismSdkModel['debugSnapshot']>>
    }
  }
}
