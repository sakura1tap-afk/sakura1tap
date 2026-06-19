declare namespace Live2DCubismCore {
  namespace Logging {
    function csmSetLogFunction(handler: (message: string) => void): void
  }

  namespace Version {
    function csmGetVersion(): number
  }

  class Moc {
    static fromArrayBuffer(buffer: ArrayBuffer, shouldCheckMocConsistency?: boolean): Moc | null
    static hasMocConsistency(buffer: ArrayBuffer): boolean
    static getMocVersion(buffer: ArrayBuffer): number
    _ptr?: unknown
    createModel(): Model | null
    deleteModel(model: Model): void
    release(): void
  }

  class Model {
    parameters: {
      count: number
      ids: string[]
      values: Float32Array
      maximumValues: Float32Array
      minimumValues: Float32Array
      defaultValues: Float32Array
    }
    parts: {
      count: number
      ids: string[]
      opacities: Float32Array
    }
    drawables: {
      count: number
      ids: string[]
      constantFlags: Uint8Array
      dynamicFlags: Uint8Array
      textureIndices: Int32Array
      drawOrders: Int32Array
      renderOrders: Int32Array
      opacities: Float32Array
      maskCounts: Int32Array
      masks: Int32Array[]
      vertexCounts: Int32Array
      vertexPositions: Float32Array[]
      vertexUvs: Float32Array[]
      indexCounts: Int32Array
      indices: Uint16Array[]
      multiplyColors?: Float32Array
      screenColors?: Float32Array
      resetDynamicFlags(): void
    }
    canvasinfo: {
      CanvasWidth: number
      CanvasHeight: number
      PixelsPerUnit: number
    }
    update(): void
    saveParameters(): void
    loadParameters(): void
    release(): void
  }
}
