import { Center, Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Group } from 'three'
import type { ViewMode } from './EntryControls'

const viewSettings: Record<ViewMode, { position: [number, number, number]; rotation: [number, number, number]; scale: number }> = {
  detail: {
    position: [0.16, 0.58, 0],
    rotation: [0, -0.24, 0],
    scale: 0.00222,
  },
  front: {
    position: [0, 0.55, 0],
    rotation: [0, 0, 0],
    scale: 0.00205,
  },
  stage: {
    position: [-0.04, 0.45, 0],
    rotation: [0, 0.34, 0],
    scale: 0.00188,
  },
}

type StudyModelProps = {
  modelBuffer: ArrayBuffer
  viewMode: ViewMode
}

export default function StudyModel({ modelBuffer, viewMode }: StudyModelProps) {
  const [scene, setScene] = useState<Group | null>(null)
  const [error, setError] = useState(false)
  const settings = viewSettings[viewMode]
  const { size } = useThree()
  const isCompact = size.width < 640
  const position: [number, number, number] = isCompact
    ? [settings.position[0], settings.position[1] - 0.28, settings.position[2]]
    : settings.position
  const scale = settings.scale * (isCompact ? 0.62 : 1)

  useEffect(() => {
    let alive = true
    const loader = new GLTFLoader()
    const bufferCopy = modelBuffer.slice(0)

    setError(false)
    setScene(null)

    loader.parse(
      bufferCopy,
      '',
      (gltf) => {
        if (alive) {
          setScene(gltf.scene)
        }
      },
      (parseError) => {
        console.warn('Model parse failed.', parseError)
        if (alive) {
          setError(true)
        }
      },
    )

    return () => {
      alive = false
    }
  }, [modelBuffer])

  if (error) {
    return (
      <Html center className="model-status">
        模型解析失败
      </Html>
    )
  }

  if (!scene) {
    return (
      <Html center className="model-status">
        preparing scene
      </Html>
    )
  }

  return (
    <Center position={position}>
      <primitive object={scene} rotation={settings.rotation} scale={scale} />
    </Center>
  )
}
