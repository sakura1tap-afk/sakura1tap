import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Box3,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getSiteAsset } from '../../assets/assetManifest'
import { mainSections as sections, type SectionKey } from '../../data/mainSections'

type SurrealHandRelicProps = {
  active: SectionKey
  nodeOpen: boolean
}

const handAsset = getSiteAsset('surreal-hand-relic')
const SURREAL_HAND_URL = handAsset && 'url' in handAsset ? handAsset.url : '/art/models/2d_hand_creation_rigged.glb'

function centerObject(object: Group) {
  const box = new Box3().setFromObject(object)
  const center = box.getCenter(new Vector3())
  object.position.sub(center)
  return object
}

export default function SurrealHandRelic({ active, nodeOpen }: SurrealHandRelicProps) {
  const groupRef = useRef<Group>(null)
  const gltf = useLoader(GLTFLoader, SURREAL_HAND_URL)
  const accent = sections[active].accent

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true)

    clone.traverse((object: Object3D) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return

      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.material = new MeshStandardMaterial({
        color: '#b8b0a4',
        depthWrite: false,
        emissive: '#d4af37',
        emissiveIntensity: 0.08,
        metalness: 0.24,
        opacity: 0.16,
        roughness: 0.54,
        transparent: true,
      })
    })

    return centerObject(clone)
  }, [gltf.scene])

  useEffect(() => {
    scene.traverse((object: Object3D) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return

      const material = mesh.material as MeshStandardMaterial
      material.color.set('#b8b0a4')
      material.emissive.set(accent)
      material.emissiveIntensity = nodeOpen ? 0.18 : 0.08
      material.opacity = nodeOpen ? 0.22 : 0.14
    })
  }, [accent, nodeOpen, scene])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.x = MathUtils.damp(group.rotation.x, nodeOpen ? -0.1 : -0.04, 3, delta)
    group.rotation.y += delta * (nodeOpen ? 0.055 : 0.028)
    group.rotation.z = MathUtils.damp(group.rotation.z, nodeOpen ? 0.18 : 0.1, 2.8, delta)
    group.position.y = -0.18 + Math.sin(state.clock.elapsedTime * 0.58) * 0.022
    group.scale.setScalar(MathUtils.damp(group.scale.x, nodeOpen ? 0.36 : 0.28, 3.2, delta))
  })

  return (
    <group ref={groupRef} position={[1.18, -0.18, -0.72]} rotation={[-0.04, 0.74, 0.1]}>
      <primitive object={scene} />
    </group>
  )
}
