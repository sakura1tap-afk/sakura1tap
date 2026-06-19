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

let frameworkStarted = false

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

export function ensureCubismFramework() {
  if (frameworkStarted) return

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
    for (let index = 0; index < count; index += 1) {
      const texturePath = this.modelSetting.getTextureFileName(index)
      if (!texturePath) continue

      const url = this.resolve(texturePath)
      const texture = await loadTexture(gl, url)
      this.textures.push({ id: texture, url })
      this.getRenderer().bindTexture(index, texture)
    }
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
    const x = (isCompact ? layout.mobileX : layout.x) - 0.5
    const y = 0.5 - (isCompact ? layout.mobileY : layout.y)
    const modelHeight = isCompact ? layout.mobileHeight : layout.height

    this._modelMatrix = new CubismModelMatrix(this._model.getCanvasWidth(), this._model.getCanvasHeight())
    this._modelMatrix.setHeight(modelHeight)
    this._modelMatrix.centerX(x * 2 * aspect)
    this._modelMatrix.centerY(y * 2)
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
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`)
  return response.arrayBuffer()
}

function getBaseUrl(url: string) {
  return url.slice(0, url.lastIndexOf('/') + 1)
}

async function loadTexture(gl: WebGLRenderingContext, url: string) {
  const image = await loadImage(url)
  const texture = gl.createTexture()
  if (!texture) throw new Error(`Failed to create WebGL texture: ${url}`)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

  if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
    gl.generateMipmap(gl.TEXTURE_2D)
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  }

  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load texture: ${url}`))
    image.src = url
  })
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
