import { Center, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
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
  modelUrl: string
  viewMode: ViewMode
}

export default function StudyModel({ modelUrl, viewMode }: StudyModelProps) {
  const gltf = useGLTF(modelUrl)
  const settings = viewSettings[viewMode]
  const { size } = useThree()
  const isCompact = size.width < 640
  const position: [number, number, number] = isCompact
    ? [settings.position[0], settings.position[1] - 0.28, settings.position[2]]
    : settings.position
  const scale = settings.scale * (isCompact ? 0.62 : 1)

  return (
    <Center position={position}>
      <primitive object={gltf.scene} rotation={settings.rotation} scale={scale} />
    </Center>
  )
}
