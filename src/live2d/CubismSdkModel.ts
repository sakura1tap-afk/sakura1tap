import { CubismDefaultParameterId } from '../vendor/cubism/cubismdefaultparameterid'
import { CubismModelSettingJson } from '../vendor/cubism/cubismmodelsettingjson'
import { BreathParameterData, CubismBreath } from '../vendor/cubism/effect/cubismbreath'
import { CubismEyeBlink } from '../vendor/cubism/effect/cubismeyeblink'
import { CubismFramework, LogLevel, Option } from '../vendor/cubism/live2dcubismframework'
import { CubismMatrix44 } from '../vendor/cubism/math/cubismmatrix44'
import { CubismModelMatrix } from '../vendor/cubism/math/cubismmodelmatrix'
import { CubismUserModel } from '../vendor/cubism/model/cubismusermodel'
import type { ACubismMotion } from '../vendor/cubism/motion/acubismmotion'
import { CubismMotion } from '../vendor/cubism/motion/cubismmotion'
import { csmVector } from '../vendor/cubism/type/csmvector'

const PRIORITY_IDLE = 1
const PRIORITY_FORCE = 3
const CUBISM_RUNTIME_URL = '/vendor/live2dcubismcore.min.js'

type MeshBounds = {
  maxX: number
  maxY: number
  minX: number
  minY: number
}

const EMPTY_BOUNDS: MeshBounds = { maxX: 0.5, maxY: 0.5, minX: -0.5, minY: -0.5 }

let cubismRuntimePromise: Promise<void> | null = null
let frameworkStarted = false

/**
 * Placement is expressed against the *drawn* model, not the moc artboard: these
 * models declare a 1 x ~1.41 canvas whose origin sits near the middle of the
 * artwork, so the mesh lives roughly half an artboard away from the canvas centre.
 * `x` / `y` are viewport fractions (0 = left/top, 1 = right/bottom) for the centre
 * of the model's bounding box, and `height` is that box's height in NDC units
 * (2 = full viewport height, so 1 means half the viewport).
 */
export type CubismSdkLayout = {
  height: number
  mobileHeight: number
  mobileX: number
  mobileY: number
  x: number
  y: number
}

export type CubismSdkModelConfig = {
  feedbackExpressions?: string[]
  layout: CubismSdkLayout
  parameterOverrides?: Record<string, number>
  required?: boolean
  url: string
}

type MotionRecord = {
  group: string
  index: number
  motion: CubismMotion
}

type TextureRecord = {
  id: WebGLTexture
  url: string
}

type TextureSource = (HTMLImageElement | ImageBitmap) & { height: number; width: number }

type PendingTextureRecord = {
  index: number
  source: TextureSource
  url: string
}

/**
 * The Cubism Core is a ~200 kB blocking script that only the entry route needs, so it
 * is injected on demand instead of being loaded by index.html for every route.
 */
function loadCubismRuntime() {
  if (window.Live2DCubismCore) return Promise.resolve()
  if (!cubismRuntimePromise) {
    cubismRuntimePromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.async = true
      script.src = CUBISM_RUNTIME_URL
      script.addEventListener('load', () => {
        if (window.Live2DCubismCore) resolve()
        else reject(new Error('Cubism runtime did not initialise.'))
      })
      script.addEventListener('error', () => {
        cubismRuntimePromise = null
        reject(new Error('Cubism runtime failed to load.'))
      })
      document.head.appendChild(script)
    })
  }
  return cubismRuntimePromise
}

export async function ensureCubismFramework() {
  if (frameworkStarted) return

  await loadCubismRuntime()

  if (!window.Live2DCubismCore) {
    throw new Error('Cubism runtime is not available.')
  }

  const option = new Option()
  option.loggingLevel = LogLevel.LogLevel_Off
  option.logFunction = () => undefined
  CubismFramework.startUp(option)
  CubismFramework.initialize(1024 * 1024 * 32)
  frameworkStarted = true
}

export class CubismSdkModel extends CubismUserModel {
  public readonly config: CubismSdkModelConfig

  private readonly expressions = new Map<string, ACubismMotion>()
  private readonly motions: MotionRecord[] = []
  private readonly textures: TextureRecord[] = []
  private baseUrl = ''
  private expressionCursor = 0
  private idleCursor = 0
  private lastMotionStartedAt = 0
  private meshBounds: MeshBounds | null = null
  private modelSetting: CubismModelSettingJson | null = null
  private motionUpdated = false

  public constructor(config: CubismSdkModelConfig) {
    super()
    this.config = config
  }

  public async load(gl: WebGLRenderingContext, width: number, height: number) {
    this.baseUrl = getBaseUrl(this.config.url)

    const settingBuffer = await fetchArrayBuffer(this.config.url)
    this.modelSetting = new CubismModelSettingJson(settingBuffer, settingBuffer.byteLength)

    const modelFileName = this.modelSetting.getModelFileName()
    if (!modelFileName) throw new Error(`Live2D model file is missing: ${this.config.url}`)

    const modelBuffer = await fetchArrayBuffer(this.resolve(modelFileName))
    this.loadModel(modelBuffer)

    await Promise.all([this.loadExpressions(), this.loadPhysicsFile(), this.loadPoseFile(), this.loadMotions()])
    this.setupEyeBlink()
    this.setupBreath()

    this.createRenderer()
    this.getRenderer().startUp(gl)
    this.getRenderer().setIsPremultipliedAlpha(true)
    await this.loadTextures(gl)
    this.applyLayout(width, height)
    this.applyParameterOverrides()
    this.setInitialized(true)
  }

  public override release() {
    this.expressions.clear()
    this.motions.length = 0
    this.textures.length = 0
    this.meshBounds = null
    super.release()
  }

  public resize(width: number, height: number) {
    if (!this.isInitialized()) return
    this.applyLayout(width, height)
  }

  public setFocus(x: number, y: number) {
    this.setDragging(x, y)
  }

  public triggerFeedback() {
    if (this.expressions.size > 0) {
      const preferred = this.config.feedbackExpressions?.filter((name) => this.expressions.has(name)) ?? []
      const names = preferred.length > 0 ? preferred : [...this.expressions.keys()]
      const name = names[this.expressionCursor % names.length]
      this.expressionCursor += 1
      const expression = this.expressions.get(name)
      if (expression) this._expressionManager.startMotionPriority(expression, false, PRIORITY_FORCE)
    }

    if (this.motions.length > 0) {
      const record = this.motions[this.idleCursor % this.motions.length]
      this.idleCursor += 1
      this.startMotionRecord(record, PRIORITY_FORCE)
    }
  }

  public debugSnapshot() {
    if (!this._model) return null

    const idManager = CubismFramework.getIdManager()
    const get = (parameterId: string) => this._model.getParameterValueById(idManager.getId(parameterId))
    return {
      angleX: get(CubismDefaultParameterId.ParamAngleX),
      angleY: get(CubismDefaultParameterId.ParamAngleY),
      bodyAngleX: get(CubismDefaultParameterId.ParamBodyAngleX),
      eyeBallX: get(CubismDefaultParameterId.ParamEyeBallX),
      eyeBallY: get(CubismDefaultParameterId.ParamEyeBallY),
      initialized: this.isInitialized(),
    }
  }

  public update(deltaTimeSeconds: number) {
    if (!this.isInitialized() || !this._model) return

    this._dragManager.update(deltaTimeSeconds)
    this._model.loadParameters()
    this.motionUpdated = false

    if (this._motionManager.isFinished()) {
      this.startNextIdleMotion()
    } else {
      this.motionUpdated = this._motionManager.updateMotion(this._model, deltaTimeSeconds)
    }

    this._model.saveParameters()
    this._expressionManager.updateMotion(this._model, deltaTimeSeconds)

    if (!this.motionUpdated) {
      this._eyeBlink?.updateParameters(this._model, deltaTimeSeconds)
    }

    this.updateLookParameters()
    this._breath?.updateParameters(this._model, deltaTimeSeconds)
    this._physics?.evaluate(this._model, deltaTimeSeconds)
    this._pose?.updateParameters(this._model, deltaTimeSeconds)
    this.applyParameterOverrides()
    this._model.update()
  }

  public draw(width: number, height: number) {
    if (!this.isInitialized() || !this._model) return

    const aspect = width / Math.max(1, height)
    const matrix = new CubismMatrix44()
    matrix.scaleRelative(1 / aspect, 1)
    matrix.multiplyByMatrix(this._modelMatrix)

    const renderer = this.getRenderer()
    renderer.setMvpMatrix(matrix)
    renderer.setRenderState(null as unknown as WebGLFramebuffer, [0, 0, width, height])
    renderer.drawModel()
  }

  private async loadExpressions() {
    if (!this.modelSetting) return

    const count = this.modelSetting.getExpressionCount()
    await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const name = this.modelSetting?.getExpressionName(index)
        const fileName = this.modelSetting?.getExpressionFileName(index)
        if (!name || !fileName) return

        const buffer = await fetchArrayBuffer(this.resolve(fileName))
        const motion = this.loadExpression(buffer, buffer.byteLength, name)
        if (motion) this.expressions.set(name, motion)
      }),
    )
  }

  private async loadPhysicsFile() {
    const fileName = this.modelSetting?.getPhysicsFileName()
    if (!fileName) return

    const buffer = await fetchArrayBuffer(this.resolve(fileName))
    this.loadPhysics(buffer, buffer.byteLength)
  }

  private async loadPoseFile() {
    const fileName = this.modelSetting?.getPoseFileName()
    if (!fileName) return

    const buffer = await fetchArrayBuffer(this.resolve(fileName))
    this.loadPose(buffer, buffer.byteLength)
  }

  private async loadMotions() {
    if (!this.modelSetting) return

    const groups = Array.from({ length: this.modelSetting.getMotionGroupCount() }, (_, index) =>
      this.modelSetting?.getMotionGroupName(index),
    ).filter((group): group is string => group != null)

    await Promise.all(
      groups.flatMap((group) =>
        Array.from({ length: this.modelSetting?.getMotionCount(group) ?? 0 }, async (_, index) => {
          const setting = this.modelSetting
          if (!setting) return

          const fileName = setting.getMotionFileName(group, index)
          if (!fileName) return

          const buffer = await fetchArrayBuffer(this.resolve(fileName))
          const motion = this.loadMotion(buffer, buffer.byteLength, `${group}_${index}`)
          if (!motion) return

          const eyeBlinkIds = toCsmVector(Array.from({ length: this.modelSetting?.getEyeBlinkParameterCount() ?? 0 }, (_, idIndex) =>
            this.modelSetting?.getEyeBlinkParameterId(idIndex),
          ).filter((id): id is NonNullable<typeof id> => id != null))
          motion.setEffectIds(eyeBlinkIds, new csmVector())
          this.motions.push({ group, index, motion })
        }),
      ),
    )
  }

  private async loadTextures(gl: WebGLRenderingContext) {
    if (!this.modelSetting) return

    const count = this.modelSetting.getTextureCount()
    const pendingTextures = await Promise.all(
      Array.from({ length: count }, async (_, index): Promise<PendingTextureRecord | null> => {
        const texturePath = this.modelSetting?.getTextureFileName(index)
        if (!texturePath) return null

        const url = this.resolve(texturePath)
        return {
          index,
          source: await loadTextureSource(url),
          url,
        }
      }),
    )

    pendingTextures.filter(isPendingTextureRecord).forEach(({ index, source, url }) => {
      const texture = createTexture(gl, source, url)
      this.textures.push({ id: texture, url })
      this.getRenderer().bindTexture(index, texture)
    })
  }

  private setupEyeBlink() {
    if (!this.modelSetting || this.modelSetting.getEyeBlinkParameterCount() <= 0) return
    this._eyeBlink = CubismEyeBlink.create(this.modelSetting)
  }

  private setupBreath() {
    const idManager = CubismFramework.getIdManager()
    this._breath = CubismBreath.create()
    this._breath.setParameters(toCsmVector([
      new BreathParameterData(idManager.getId(CubismDefaultParameterId.ParamAngleX), 0, 10, 6.5345, 0.32),
      new BreathParameterData(idManager.getId(CubismDefaultParameterId.ParamAngleY), 0, 7, 3.5345, 0.28),
      new BreathParameterData(idManager.getId(CubismDefaultParameterId.ParamAngleZ), 0, 6, 5.5345, 0.24),
      new BreathParameterData(idManager.getId(CubismDefaultParameterId.ParamBodyAngleX), 0, 4, 15.5345, 0.4),
      new BreathParameterData(idManager.getId(CubismDefaultParameterId.ParamBreath), 0.5, 0.5, 3.2345, 1),
    ]))
  }

  private applyLayout(width: number, height: number) {
    if (!this._model) return

    const isCompact = width < 720
    const layout = this.config.layout
    const aspect = width / Math.max(1, height)
    const anchorX = isCompact ? layout.mobileX : layout.x
    const anchorY = isCompact ? layout.mobileY : layout.y
    const modelHeight = isCompact ? layout.mobileHeight : layout.height

    const bounds = this.getMeshBounds()
    const boundsHeight = Math.max(0.0001, bounds.maxY - bounds.minY)
    const scale = modelHeight / boundsHeight
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2

    this._modelMatrix = new CubismModelMatrix(this._model.getCanvasWidth(), this._model.getCanvasHeight())
    this._modelMatrix.scale(scale, scale)
    // draw() applies a projection that divides x by the viewport aspect *after* this
    // matrix, so the horizontal offset has to be pre-multiplied by the aspect while
    // the vertical offset does not. Anchoring the mesh box (instead of the moc
    // artboard) is what keeps the character where the layout says it is.
    this._modelMatrix.translateX(aspect * (anchorX * 2 - 1) - scale * centerX)
    this._modelMatrix.translateY(1 - anchorY * 2 - scale * centerY)
  }

  private getMeshBounds() {
    if (this.meshBounds || !this._model) return this.meshBounds ?? EMPTY_BOUNDS

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (let index = 0; index < this._model.getDrawableCount(); index += 1) {
      const positions = this._model.getDrawableVertexPositions(index)
      if (!positions) continue
      for (let offset = 0; offset + 1 < positions.length; offset += 2) {
        const x = positions[offset]
        const y = positions[offset + 1]
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }

    // Only remember a plausible box; an empty read (model not ready yet) is retried
    // on the next layout pass instead of being cached as the fallback box.
    if (Number.isFinite(minX) && Number.isFinite(maxX) && maxX > minX && maxY > minY) {
      this.meshBounds = { maxX, maxY, minX, minY }
    }
    return this.meshBounds ?? EMPTY_BOUNDS
  }

  private startNextIdleMotion() {
    if (this.motions.length === 0) return
    const now = performance.now()
    if (now - this.lastMotionStartedAt < 250) return

    const record = this.motions[this.idleCursor % this.motions.length]
    this.idleCursor += 1
    this.startMotionRecord(record, PRIORITY_IDLE)
  }

  private startMotionRecord(record: MotionRecord, priority: number) {
    this._motionManager.setReservePriority(priority)
    this._motionManager.startMotionPriority(record.motion, false, priority)
    this.lastMotionStartedAt = performance.now()
  }

  private applyParameterOverrides() {
    if (!this.config.parameterOverrides || !this._model) return

    const idManager = CubismFramework.getIdManager()
    Object.entries(this.config.parameterOverrides).forEach(([parameterId, value]) => {
      this._model.setParameterValueById(idManager.getId(parameterId), value, 1)
    })
  }

  private updateLookParameters() {
    if (!this._model) return

    const idManager = CubismFramework.getIdManager()
    const dragX = this._dragManager.getX()
    const dragY = this._dragManager.getY()

    this._model.addParameterValueById(idManager.getId(CubismDefaultParameterId.ParamAngleX), dragX * 24)
    this._model.addParameterValueById(idManager.getId(CubismDefaultParameterId.ParamAngleY), dragY * 18)
    this._model.addParameterValueById(idManager.getId(CubismDefaultParameterId.ParamAngleZ), dragX * dragY * -12)
    this._model.addParameterValueById(idManager.getId(CubismDefaultParameterId.ParamBodyAngleX), dragX * 7)
    this._model.addParameterValueById(idManager.getId(CubismDefaultParameterId.ParamEyeBallX), dragX)
    this._model.addParameterValueById(idManager.getId(CubismDefaultParameterId.ParamEyeBallY), dragY)
  }

  private resolve(fileName: string) {
    return new URL(fileName, new URL(this.baseUrl, window.location.origin)).toString()
  }
}

async function fetchArrayBuffer(url: string) {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`)
  return response.arrayBuffer()
}

function getBaseUrl(url: string) {
  return url.slice(0, url.lastIndexOf('/') + 1)
}

function createTexture(gl: WebGLRenderingContext, source: TextureSource, url: string) {
  const texture = gl.createTexture()
  if (!texture) throw new Error(`Failed to create WebGL texture: ${url}`)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)

  if (isPowerOfTwo(source.width) && isPowerOfTwo(source.height)) {
    gl.generateMipmap(gl.TEXTURE_2D)
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  }

  if ('close' in source && typeof source.close === 'function') {
    source.close()
  }

  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

async function loadTextureSource(url: string): Promise<TextureSource> {
  if ('createImageBitmap' in window) {
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) throw new Error(`Failed to load texture: ${url}`)

    return createImageBitmap(await response.blob(), { premultiplyAlpha: 'premultiply' })
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      if (image.decode) {
        image.decode().then(() => resolve(image)).catch(() => resolve(image))
      } else {
        resolve(image)
      }
    }
    image.onerror = () => reject(new Error(`Failed to load texture: ${url}`))
    image.src = url
  })
}

function isPendingTextureRecord(record: PendingTextureRecord | null): record is PendingTextureRecord {
  return record != null
}

function isPowerOfTwo(value: number) {
  return (value & (value - 1)) === 0
}

function toCsmVector<T>(items: T[]) {
  const vector = new csmVector<T>()
  items.forEach((item) => vector.pushBack(item))
  return vector
}

declare global {
  interface Window {
    Live2DCubismCore?: unknown
  }
}
