import { useMemo, useRef } from 'react'
import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  TextureLoader,
  Vector3,
  type Group,
} from 'three'
import sakuraOrbitGlyph from '../../assets/symbols/sakura-orbit-glyph.svg'

type ArtifactCoreProps = {
  drag: {
    active: boolean
    rotationX: number
    rotationY: number
  }
  hover: {
    x: number
    y: number
  }
  scrollDepth: number
  onDragStart: (event: ThreeEvent<PointerEvent>) => void
  onDragMove: (event: ThreeEvent<PointerEvent>) => void
  onDragEnd: (event: ThreeEvent<PointerEvent>) => void
}

const shardCount = 18
const ringCount = 4
const fissureCount = 7

export default function ArtifactCore({ drag, hover, scrollDepth, onDragStart, onDragMove, onDragEnd }: ArtifactCoreProps) {
  const rootRef = useRef<Group>(null)
  const coreRef = useRef<Mesh>(null)
  const fieldRef = useRef<Group>(null)
  const glyphTexture = useLoader(TextureLoader, sakuraOrbitGlyph)

  const shards = useMemo(
    () =>
      Array.from({ length: shardCount }, (_, index) => {
        const angle = (index / shardCount) * Math.PI * 2
        const lane = index % 3
        return {
          angle,
          lane,
          length: 0.34 + (index % 5) * 0.045,
          radius: 1.2 + lane * 0.18,
          spin: index % 2 === 0 ? 1 : -1,
          y: (lane - 1) * 0.12,
        }
      }),
    [],
  )

  const rings = useMemo(
    () =>
      Array.from({ length: ringCount }, (_, index) => ({
        radius: 1.06 + index * 0.23,
        tube: index === 0 ? 0.008 : 0.006,
        tiltX: index % 2 === 0 ? 0.72 : -0.58,
        tiltY: index % 2 === 0 ? -0.18 : 0.34,
        spin: index % 2 === 0 ? 1 : -1,
      })),
    [],
  )

  const fissures = useMemo(
    () =>
      Array.from({ length: fissureCount }, (_, index) => ({
        angle: (index / fissureCount) * Math.PI * 2,
        y: -0.2 + index * 0.065,
        length: 0.38 + (index % 3) * 0.12,
        opacity: 0.16 + (index % 2) * 0.08,
      })),
    [],
  )

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const root = rootRef.current
    const field = fieldRef.current
    const core = coreRef.current
    if (!root || !field || !core) return

    const targetX = drag.rotationX + hover.y * -0.22
    const targetY = drag.rotationY + hover.x * 0.28
    root.rotation.x = MathUtils.damp(root.rotation.x, targetX, 5, delta)
    root.rotation.y = MathUtils.damp(root.rotation.y, targetY, 5, delta)
    root.rotation.z = MathUtils.damp(root.rotation.z, hover.x * -0.05 + scrollDepth * 0.18, 3, delta)

    const scale = 1 + scrollDepth * 0.16 + (drag.active ? 0.025 : 0)
    root.scale.lerp(new Vector3(scale, scale, scale), 0.08)

    core.rotation.y += delta * (0.24 + scrollDepth * 0.16)
    core.rotation.x = Math.sin(time * 0.7) * 0.045

    field.rotation.z = time * -0.08
    field.scale.setScalar(1 + Math.sin(time * 0.6) * 0.025 + scrollDepth * 0.08)
  })

  return (
    <group
      ref={rootRef}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      onPointerLeave={onDragEnd}
    >
      <group ref={fieldRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.78, 0.004, 12, 180]} />
          <meshBasicMaterial color="#f0e6d8" transparent opacity={0.13} blending={AdditiveBlending} />
        </mesh>
        <mesh rotation={[Math.PI / 2.1, 0.15, 0.38]}>
          <torusGeometry args={[1.45 + scrollDepth * 0.1, 0.003, 12, 180]} />
          <meshBasicMaterial color="#a88b98" transparent opacity={0.16} blending={AdditiveBlending} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, -0.38, -0.1]}>
          <torusGeometry args={[1.18 + scrollDepth * 0.08, 0.003, 12, 180]} />
          <meshBasicMaterial color="#d4d0c8" transparent opacity={0.12} blending={AdditiveBlending} />
        </mesh>
      </group>

      <mesh ref={coreRef} scale={[1, 0.86, 0.72]}>
        <icosahedronGeometry args={[0.66, 1]} />
        <meshStandardMaterial
          color={new Color('#111112')}
          roughness={0.38}
          metalness={0.82}
          emissive={new Color('#241219')}
          emissiveIntensity={0.22 + scrollDepth * 0.18}
          flatShading
        />
      </mesh>

      <mesh scale={[0.8, 0.66, 0.58]}>
        <icosahedronGeometry args={[0.66, 0]} />
        <meshBasicMaterial color="#f1e9df" transparent opacity={0.035} wireframe blending={AdditiveBlending} />
      </mesh>

      {fissures.map((fissure, index) => (
        <mesh
          key={`fissure-${index}`}
          position={[Math.cos(fissure.angle) * 0.18, fissure.y, 0.46 + Math.sin(fissure.angle) * 0.08]}
          rotation={[0.18, 0, fissure.angle + scrollDepth * 0.22]}
          scale={[fissure.length, 0.01, 0.008]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? '#9d5b6d' : '#eee6dc'}
            transparent
            opacity={fissure.opacity}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}

      {rings.map((ring, index) => (
        <mesh
          key={index}
          rotation={[ring.tiltX, ring.tiltY, scrollDepth * ring.spin * 0.45 + index * 0.4]}
          scale={[1 + scrollDepth * 0.08, 1 + scrollDepth * 0.08, 1]}
        >
          <torusGeometry args={[ring.radius + scrollDepth * 0.08 * index, ring.tube, 12, 220]} />
          <meshStandardMaterial
            color={index === 1 ? '#a18391' : '#e7e0d8'}
            roughness={0.24}
            metalness={0.75}
            transparent
            opacity={0.32 - index * 0.035}
            emissive={index === 1 ? '#2b121b' : '#1f1d1a'}
            emissiveIntensity={0.18}
          />
        </mesh>
      ))}

      {shards.map((shard, index) => {
        const spread = scrollDepth * (0.36 + shard.lane * 0.1)
        const x = Math.cos(shard.angle) * (shard.radius + spread)
        const z = Math.sin(shard.angle) * (shard.radius + spread)
        return (
          <mesh
            key={index}
            position={[x, shard.y + Math.sin(shard.angle * 2) * 0.06, z]}
            rotation={[0.35 + shard.lane * 0.2, -shard.angle + Math.PI / 2, shard.spin * (0.34 + scrollDepth * 0.42)]}
            scale={[0.08, shard.length + scrollDepth * 0.08, 0.02]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={index % 4 === 0 ? '#23151a' : '#b9b4ad'}
              roughness={0.46}
              metalness={0.66}
              emissive={index % 4 === 0 ? '#3a111d' : '#080808'}
              emissiveIntensity={0.12}
              transparent
              opacity={0.68}
            />
          </mesh>
        )
      })}

      <mesh position={[0, 0, 0.92]} scale={[0.96, 0.96, 0.96]}>
        <planeGeometry args={[1.25, 1.25]} />
        <meshBasicMaterial
          map={glyphTexture}
          transparent
          opacity={0.42}
          color="#f5efe4"
          blending={AdditiveBlending}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={2.18}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#f1ddd8" transparent opacity={0.025 + scrollDepth * 0.018} side={BackSide} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}
