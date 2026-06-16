import { Center, useGLTF } from '@react-three/drei'

const MODEL_PATH = '/models/study.glb'

export default function StudyModel() {
  const gltf = useGLTF(MODEL_PATH)

  return (
    <Center position={[0, -0.35, 0]}>
      <primitive object={gltf.scene} scale={1.65} />
    </Center>
  )
}
