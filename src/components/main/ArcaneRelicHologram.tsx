import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  AnimationMixer,
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

type ArcaneRelicHologramProps = {
  active: SectionKey
  nodeOpen: boolean
}

const relicAsset = getSiteAsset('arcane-relic-hologram')
const ARCANE_RELIC_URL = relicAsset && 'url' in relicAsset ? relicAsset.url : '/art/models/dna_hologram.glb'

function centerObject(object: Group) {
  const box = new Box3().setFromObject(object)
  const center = box.getCenter(new Vector3())
  object.position.sub(center)
  return object
}

export default function ArcaneRelicHologram({ active, nodeOpen }: ArcaneRelicHologramProps) {
  const groupRef = useRef<Group>(null)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const gltf = useLoader(GLTFLoader, ARCANE_RELIC_URL)
  const accent = sections[active].accent

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true)

    clone.traverse((object: Object3D) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return

      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.frustumCulled = false
      mesh.material = new MeshStandardMaterial({
        blending: AdditiveBlending,
        color: '#f5f5f5',
        depthWrite: false,
        emissive: '#f5f5f5',
        emissiveIntensity: 0.9,
        metalness: 0.16,
        opacity: 0.42,
        roughness: 0.24,
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
      material.color.set(accent)
      material.emissive.set(accent)
      material.emissiveIntensity = nodeOpen ? 1.36 : 0.9
      material.opacity = nodeOpen ? 0.56 : 0.42
    })
  }, [accent, nodeOpen, scene])

  useEffect(() => {
    if (gltf.animations.length === 0) return

    const mixer = new AnimationMixer(scene)
    mixerRef.current = mixer

    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip)
      action.play()
    }

    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(scene)
      mixerRef.current = null
    }
  }, [gltf.animations, scene])

  useFrame((state, delta) => {
    mixerRef.current?.update(delta)

    const group = groupRef.current
    if (!group) return

    group.rotation.y += delta * (nodeOpen ? 0.28 : 0.16)
    group.rotation.z = MathUtils.damp(group.rotation.z, nodeOpen ? -0.06 : -0.14, 3, delta)
    group.position.y = 0.08 + Math.sin(state.clock.elapsedTime * 0.62) * 0.036
    group.scale.setScalar(MathUtils.damp(group.scale.x, nodeOpen ? 0.54 : 0.46, 3.8, delta))
  })

  return (
    <group ref={groupRef} position={[-0.82, 0.08, -0.52]} rotation={[0.14, -0.32, -0.14]}>
      <primitive object={scene} />
    </group>
  )
}
