import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BackSide,
  Box3,
  CanvasTexture,
  DoubleSide,
  Group,
  LinearFilter,
  MathUtils,
  Points,
  VideoTexture,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mainSections as sections, type SectionKey } from '../../data/mainSections'
import ArcaneRelicHologram from './ArcaneRelicHologram'
import SurrealHandRelic from './SurrealHandRelic'

type MainSceneProps = {
  active: SectionKey
  assetPhase: number
  modelBuffer: ArrayBuffer | null
  nodeOpen: boolean
}

function centerObject(object: Group) {
  const box = new Box3().setFromObject(object)
  const center = box.getCenter(new Vector3())
  object.position.sub(center)
  return object
}

function SceneRig({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const { camera } = useThree()
  const lookTarget = useRef(new Vector3(0, 0.3, 0))
  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLook = useMemo(() => new Vector3(0, 0.34, 0), [])

  useFrame((_, delta) => {
    const config = sections[active]
    const depthPush = nodeOpen ? 0.52 : 0
    targetPosition.set(config.camera[0], config.camera[1] + (nodeOpen ? 0.1 : 0), config.camera[2] + depthPush)
    targetLook.set(config.orbit[0] * 0.35, 0.34 + config.orbit[1] * 0.25, config.orbit[2])

    camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 2.2))
    lookTarget.current.lerp(targetLook, 1 - Math.exp(-delta * 2.8))
    camera.lookAt(lookTarget.current)
  })

  return null
}

function MainStudyModel({
  active,
  modelBuffer,
  nodeOpen,
}: {
  active: SectionKey
  modelBuffer: ArrayBuffer
  nodeOpen: boolean
}) {
  const [scene, setScene] = useState<Group | null>(null)
  const [error, setError] = useState(false)
  const groupRef = useRef<Group>(null)
  const { size } = useThree()
  const isCompact = size.width < 720

  useEffect(() => {
    let alive = true
    const loader = new GLTFLoader()

    setScene(null)
    setError(false)

    loader.parse(
      modelBuffer,
      '',
      (gltf) => {
        if (alive) {
          setScene(centerObject(gltf.scene))
        }
      },
      (parseError) => {
        console.warn('Main scene model parse failed.', parseError)
        if (alive) {
          setError(true)
        }
      },
    )

    return () => {
      alive = false
    }
  }, [modelBuffer])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    const config = sections[active]
    group.rotation.x = MathUtils.damp(group.rotation.x, config.modelRotation[0], 3.2, delta)
    group.rotation.y = MathUtils.damp(group.rotation.y, config.modelRotation[1], 3.2, delta)
    group.rotation.z = MathUtils.damp(group.rotation.z, config.modelRotation[2], 3.2, delta)
    group.position.x = MathUtils.damp(group.position.x, isCompact ? 0 : nodeOpen ? -0.04 : 0.28, 3.4, delta)
    group.position.y = MathUtils.damp(
      group.position.y,
      (isCompact ? -0.58 : -0.38) + Math.sin(state.clock.elapsedTime * 1.3) * 0.018,
      4,
      delta,
    )
  })

  if (error) {
    return null
  }

  if (!scene) {
    return null
  }

  return (
    <group ref={groupRef} position={[isCompact ? 0 : 0.28, isCompact ? -0.58 : -0.38, 0]}>
      <primitive object={scene} scale={isCompact ? 0.00115 : 0.00168} />
    </group>
  )
}

function EnergyField({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const pointsRef = useRef<Points>(null)
  const { size } = useThree()
  const accent = sections[active].accent
  const particleCount = size.width < 720 ? 480 : 900
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)

    for (let index = 0; index < particleCount; index += 1) {
      const ring = index % 9
      const angle = index * 0.37
      const radius = 0.82 + ring * 0.18 + Math.sin(index * 1.7) * 0.12
      positions[index * 3] = Math.cos(angle) * radius
      positions[index * 3 + 1] = -0.12 + Math.sin(index * 0.29) * 1.18
      positions[index * 3 + 2] = Math.sin(angle) * radius * 0.5
    }

    return positions
  }, [particleCount])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (nodeOpen ? 0.28 : 0.16)
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.35) * 0.08
      groupRef.current.scale.setScalar(MathUtils.damp(groupRef.current.scale.x, nodeOpen ? 1.12 : 1, 3, delta))
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * (nodeOpen ? 0.16 : 0.08)
    }
  })

  return (
    <group ref={groupRef} position={[0.12, -0.15, -0.08]}>
      <mesh rotation={[Math.PI * 0.5, 0, 0.18]}>
        <torusGeometry args={[1.45, 0.004, 8, 180, Math.PI * 1.42]} />
        <meshBasicMaterial color={accent} transparent opacity={nodeOpen ? 0.68 : 0.42} />
      </mesh>
      <mesh rotation={[Math.PI * 0.5, 0.2, -0.45]}>
        <torusGeometry args={[2.05, 0.003, 8, 180, Math.PI * 1.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={nodeOpen ? 0.34 : 0.2} />
      </mesh>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={accent}
          depthWrite={false}
          opacity={nodeOpen ? 0.66 : 0.48}
          size={nodeOpen ? 0.018 : 0.014}
          sizeAttenuation
          transparent
        />
      </points>
    </group>
  )
}

function ParticleBloom({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const coreRef = useRef<Points>(null)
  const { size } = useThree()
  const accent = sections[active].accent
  const cloudCount = size.width < 720 ? 760 : 1500
  const streamCount = size.width < 720 ? 220 : 420
  const { cloud, stream } = useMemo(() => {
    const cloudPositions = new Float32Array(cloudCount * 3)
    const streamPositions = new Float32Array(streamCount * 3)

    for (let index = 0; index < cloudCount; index += 1) {
      const shell = index % 15
      const angle = index * 2.399963
      const radius = 0.16 + shell * 0.085 + Math.sin(index * 0.71) * 0.06
      const rise = Math.sin(index * 0.17) * 0.62

      cloudPositions[index * 3] = Math.cos(angle) * radius * (1 + Math.sin(index * 0.09) * 0.22)
      cloudPositions[index * 3 + 1] = 0.16 + rise
      cloudPositions[index * 3 + 2] = Math.sin(angle) * radius * 0.72
    }

    for (let index = 0; index < streamCount; index += 1) {
      const progress = index / (streamCount - 1)
      const angle = progress * Math.PI * 5.4
      const radius = 0.28 + Math.sin(progress * Math.PI) * 1.34

      streamPositions[index * 3] = Math.cos(angle) * radius
      streamPositions[index * 3 + 1] = -0.72 + progress * 1.72
      streamPositions[index * 3 + 2] = Math.sin(angle) * radius * 0.36 - 0.22
    }

    return {
      cloud: cloudPositions,
      stream: streamPositions,
    }
  }, [cloudCount, streamCount])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (nodeOpen ? 0.11 : 0.07)
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.44) * 0.035
    }

    if (coreRef.current) {
      coreRef.current.rotation.z -= delta * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[0.04, 0.06, -0.32]}>
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cloud, 3]} />
        </bufferGeometry>
        <pointsMaterial
          blending={AdditiveBlending}
          color={accent}
          depthWrite={false}
          opacity={nodeOpen ? 0.56 : 0.38}
          size={nodeOpen ? 0.018 : 0.014}
          sizeAttenuation
          transparent
        />
      </points>
      <points rotation={[0.12, 0, -0.18]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stream, 3]} />
        </bufferGeometry>
        <pointsMaterial
          blending={AdditiveBlending}
          color="#f5f5f5"
          depthWrite={false}
          opacity={nodeOpen ? 0.36 : 0.22}
          size={0.012}
          sizeAttenuation
          transparent
        />
      </points>
    </group>
  )
}

function createPanelTexture(accent: string, variant: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createLinearGradient(0, 0, 512, 320)
  gradient.addColorStop(0, 'rgba(245, 245, 245, 0.11)')
  gradient.addColorStop(0.42, `${accent}33`)
  gradient.addColorStop(1, 'rgba(12, 14, 12, 0.72)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 320)

  ctx.globalCompositeOperation = 'screen'
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 67 + variant * 41) % 512
    const y = (index * 29 + variant * 73) % 320
    const radius = 18 + ((index + variant) % 7) * 9
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
    glow.addColorStop(0, index % 3 === 0 ? 'rgba(245, 245, 245, 0.42)' : `${accent}55`)
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = 'rgba(245, 245, 245, 0.16)'
  ctx.lineWidth = 1
  for (let index = 0; index < 9; index += 1) {
    const y = 36 + index * 29 + variant * 2
    ctx.beginPath()
    ctx.moveTo(28, y)
    ctx.bezierCurveTo(132, y - 32, 264, y + 44, 484, y - 8)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.fillRect(0, 0, 512, 320)

  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  return texture
}

function createPanelVideoTexture(url: string) {
  const video = document.createElement('video')
  video.src = url
  video.crossOrigin = 'anonymous'
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'

  const texture = new VideoTexture(video)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter

  return { texture, video }
}

type MediaPanelId = 0 | 1 | 2 | 3

type MediaPanelConfig = {
  id: MediaPanelId
  rotation: [number, number, number]
  url: string
  x: number
  y: number
  z: number
}

const mediaPanels: MediaPanelConfig[] = [
  { id: 0, x: -1.38, y: 0.48, z: -0.08, rotation: [0.02, 0.72, -0.035], url: '/art/videos/272021_medium.mp4' },
  { id: 1, x: 1.42, y: 0.42, z: -0.14, rotation: [0.015, -0.78, 0.04], url: '/art/videos/285205_medium.mp4' },
  { id: 2, x: -1.1, y: -0.78, z: -0.02, rotation: [-0.02, 0.62, 0.045], url: '/art/videos/285224_medium.mp4' },
  { id: 3, x: 1.1, y: -0.72, z: -0.08, rotation: [-0.015, -0.66, -0.035], url: '/art/videos/285240_medium.mp4' },
]

function VideoFocusPanel({
  accent,
  config,
  focused,
  nodeOpen,
  onFocus,
}: {
  accent: string
  config: MediaPanelConfig
  focused: boolean
  nodeOpen: boolean
  onFocus: (id: MediaPanelId, event: ThreeEvent<MouseEvent>) => void
}) {
  const groupRef = useRef<Group>(null)
  const { texture, video } = useMemo(() => createPanelVideoTexture(config.url), [config.url])

  useEffect(() => {
    if (focused) {
      void video.play().catch(() => undefined)
    } else {
      video.pause()
    }
  }, [focused, video])

  useEffect(() => {
    return () => {
      video.pause()
      video.removeAttribute('src')
      texture.dispose()
    }
  }, [texture, video])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    const drift = focused ? Math.sin(state.clock.elapsedTime * 0.45) * 0.018 : 0
    const targetX = focused ? 0 : config.x
    const targetY = focused ? 0.02 + drift : config.y + Math.sin(state.clock.elapsedTime * 0.32 + config.id) * 0.012
    const targetZ = focused ? 0.34 : config.z - Math.abs(config.x) * 0.1
    const targetScale = focused ? (nodeOpen ? 1.38 : 1.28) : 0.82
    const targetRotation = focused ? [0, 0, 0] : config.rotation

    group.position.x = MathUtils.damp(group.position.x, targetX, 4.8, delta)
    group.position.y = MathUtils.damp(group.position.y, targetY, 4.8, delta)
    group.position.z = MathUtils.damp(group.position.z, targetZ, 4.8, delta)
    group.rotation.x = MathUtils.damp(group.rotation.x, targetRotation[0], 4.8, delta)
    group.rotation.y = MathUtils.damp(group.rotation.y, targetRotation[1], 4.8, delta)
    group.rotation.z = MathUtils.damp(group.rotation.z, targetRotation[2], 4.8, delta)
    group.scale.setScalar(MathUtils.damp(group.scale.x, targetScale, 5, delta))
  })

  return (
    <group ref={groupRef} position={[config.x, config.y, config.z]} rotation={config.rotation} scale={focused ? 1.24 : 0.82}>
      <mesh position={[0, 0, -0.012]}>
        <planeGeometry args={[1.98, 1.16]} />
        <meshBasicMaterial color="#030403" opacity={focused ? 0.66 : 0.36} side={DoubleSide} transparent />
      </mesh>
      <mesh onClick={(event) => onFocus(config.id, event)}>
        <planeGeometry args={[1.86, 1.04]} />
        <meshBasicMaterial
          color="#ffffff"
          map={texture}
          opacity={focused ? 0.96 : 0.42}
          side={DoubleSide}
          transparent
        />
      </mesh>
      <mesh position={[0, 0.6, 0.012]}>
        <planeGeometry args={[focused ? 1.42 : 0.68, 0.012]} />
        <meshBasicMaterial color={focused ? accent : '#ffffff'} opacity={focused ? 0.82 : 0.2} transparent />
      </mesh>
    </group>
  )
}

function MediaGlassPanels({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const [focused, setFocused] = useState<MediaPanelId>(0)
  const accent = sections[active].accent

  const focusPanel = useCallback((id: MediaPanelId, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    setFocused(id)
  }, [])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (group) {
      group.rotation.y = MathUtils.damp(group.rotation.y, nodeOpen ? -0.08 : 0.03, 2.6, delta)
      group.position.y = Math.sin(state.clock.elapsedTime * 0.28) * 0.024
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.02, -0.54]}>
      {mediaPanels.map((config) => (
        <VideoFocusPanel
          accent={accent}
          config={config}
          focused={focused === config.id}
          key={config.id}
          nodeOpen={nodeOpen}
          onFocus={focusPanel}
        />
      ))}
    </group>
  )
}

function CableRig({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const accent = sections[active].accent
  const cablePositions = useMemo(() => {
    const lines = [
      [-1.35, 1.16, -0.5, -0.72, 0.42, -0.36],
      [-0.44, 1.28, -0.58, 0.04, 0.68, -0.42],
      [0.52, 1.2, -0.54, 0.98, 0.2, -0.34],
      [1.18, 1.04, -0.48, 0.42, -0.58, -0.26],
      [-1.65, -0.62, -0.3, -0.32, -0.92, -0.18],
      [1.52, -0.44, -0.3, 0.12, -0.98, -0.16],
    ]
    return new Float32Array(lines.flat())
  }, [])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.z = Math.sin(state.clock.elapsedTime * 0.24) * 0.018
    group.scale.setScalar(MathUtils.damp(group.scale.x, nodeOpen ? 1.04 : 1, 2.4, delta))
  })

  return (
    <group ref={groupRef} position={[0, 0.02, -0.72]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cablePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f5f5f5" opacity={nodeOpen ? 0.28 : 0.16} transparent />
      </lineSegments>
      <mesh position={[0, 1.05, -0.02]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[1.18, 0.01, 8, 120]} />
        <meshBasicMaterial color={accent} opacity={nodeOpen ? 0.26 : 0.14} transparent blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}

function LiquidReflection({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const accent = sections[active].accent

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.z += delta * 0.018
    group.scale.x = MathUtils.damp(group.scale.x, nodeOpen ? 1.08 : 1, 3, delta)
    group.scale.y = MathUtils.damp(group.scale.y, nodeOpen ? 0.92 : 0.82, 3, delta)
    group.position.y = -1.14 + Math.sin(state.clock.elapsedTime * 0.7) * 0.012
  })

  return (
    <group ref={groupRef} position={[0.14, -1.14, -0.44]} rotation={[-Math.PI * 0.5, 0, 0.08]}>
      <mesh>
        <circleGeometry args={[2.9, 96]} />
        <meshBasicMaterial color="#061414" opacity={nodeOpen ? 0.28 : 0.2} transparent />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <ringGeometry args={[0.78, 2.76, 128]} />
        <meshBasicMaterial blending={AdditiveBlending} color={accent} opacity={nodeOpen ? 0.13 : 0.08} transparent />
      </mesh>
      <mesh position={[0.38, -0.12, 0.006]}>
        <ringGeometry args={[0.18, 1.42, 128, 1, 0.2, Math.PI * 1.36]} />
        <meshBasicMaterial blending={AdditiveBlending} color="#f5f5f5" opacity={nodeOpen ? 0.28 : 0.16} transparent />
      </mesh>
      <mesh position={[-0.48, 0.28, 0.008]} rotation={[0, 0, -0.32]}>
        <planeGeometry args={[2.7, 0.012]} />
        <meshBasicMaterial blending={AdditiveBlending} color="#d4af37" opacity={nodeOpen ? 0.38 : 0.2} transparent />
      </mesh>
    </group>
  )
}

function InstallationPanels({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const accent = sections[active].accent

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.y = MathUtils.damp(group.rotation.y, nodeOpen ? -0.08 : 0.04, 2.6, delta)
    group.position.y = Math.sin(state.clock.elapsedTime * 0.42) * 0.025
  })

  return (
    <group ref={groupRef} position={[0.08, 0.02, -0.72]}>
      <mesh position={[-1.12, 0.28, 0.18]} rotation={[0.02, 0.36, -0.02]}>
        <planeGeometry args={[1.7, 1.08, 1, 1]} />
        <meshPhysicalMaterial
          color="#101716"
          emissive={accent}
          emissiveIntensity={0.08}
          metalness={0.28}
          opacity={0.34}
          roughness={0.18}
          side={DoubleSide}
          transparent
          transmission={0.18}
        />
      </mesh>
      <mesh position={[1.05, 0.12, 0.02]} rotation={[0, -0.42, 0.04]}>
        <planeGeometry args={[1.55, 0.96, 1, 1]} />
        <meshPhysicalMaterial
          color="#071113"
          emissive="#d4af37"
          emissiveIntensity={0.06}
          metalness={0.34}
          opacity={0.28}
          roughness={0.2}
          side={DoubleSide}
          transparent
          transmission={0.2}
        />
      </mesh>
      <mesh position={[0, 0.95, -0.12]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[0.92, 0.014, 8, 96]} />
        <meshStandardMaterial color="#14191b" emissive={accent} emissiveIntensity={0.08} metalness={0.62} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.86, 0.1]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[1.24, 0.012, 8, 120]} />
        <meshStandardMaterial color="#070707" emissive={accent} emissiveIntensity={0.04} metalness={0.5} roughness={0.42} />
      </mesh>
    </group>
  )
}

function WorldSigilFallback({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const accent = sections[active].accent
  const { helixA, helixB, bridges } = useMemo(() => {
    const steps = 74
    const height = 2.3
    const radius = 0.36
    const positionsA = new Float32Array(steps * 3)
    const positionsB = new Float32Array(steps * 3)
    const bridgePositions = new Float32Array(steps * 6)

    for (let index = 0; index < steps; index += 1) {
      const progress = index / (steps - 1)
      const angle = progress * Math.PI * 8.2
      const y = (progress - 0.5) * height
      const xA = Math.cos(angle) * radius
      const zA = Math.sin(angle) * radius
      const xB = Math.cos(angle + Math.PI) * radius
      const zB = Math.sin(angle + Math.PI) * radius

      positionsA[index * 3] = xA
      positionsA[index * 3 + 1] = y
      positionsA[index * 3 + 2] = zA

      positionsB[index * 3] = xB
      positionsB[index * 3 + 1] = y
      positionsB[index * 3 + 2] = zB

      bridgePositions[index * 6] = xA
      bridgePositions[index * 6 + 1] = y
      bridgePositions[index * 6 + 2] = zA
      bridgePositions[index * 6 + 3] = xB
      bridgePositions[index * 6 + 4] = y
      bridgePositions[index * 6 + 5] = zB
    }

    return {
      bridges: bridgePositions,
      helixA: positionsA,
      helixB: positionsB,
    }
  }, [])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.y += delta * (nodeOpen ? 0.34 : 0.2)
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.42) * 0.08
    group.position.y = -0.02 + Math.sin(state.clock.elapsedTime * 0.72) * 0.035
    group.scale.setScalar(MathUtils.damp(group.scale.x, nodeOpen ? 1.1 : 0.96, 4, delta))
  })

  return (
    <group ref={groupRef} position={[-0.78, 0.12, -0.38]} rotation={[0.1, -0.24, -0.18]}>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[helixA, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={accent} transparent opacity={nodeOpen ? 0.74 : 0.5} blending={AdditiveBlending} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[helixB, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f5f5f5" transparent opacity={nodeOpen ? 0.5 : 0.32} blending={AdditiveBlending} />
      </line>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bridges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={nodeOpen ? 0.2 : 0.12} blending={AdditiveBlending} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[helixA, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={accent}
          depthWrite={false}
          opacity={nodeOpen ? 0.84 : 0.62}
          size={0.028}
          sizeAttenuation
          transparent
          blending={AdditiveBlending}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[helixB, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#f5f5f5"
          depthWrite={false}
          opacity={nodeOpen ? 0.74 : 0.52}
          size={0.024}
          sizeAttenuation
          transparent
          blending={AdditiveBlending}
        />
      </points>
    </group>
  )
}

function ObsidianBase({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const accent = sections[active].accent

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    group.rotation.y += delta * 0.035
    group.position.y = -1.05 + Math.sin(state.clock.elapsedTime * 0.4) * 0.012
  })

  return (
    <group ref={groupRef} position={[0.05, -1.05, -0.22]} rotation={[0, 0.24, 0]}>
      <mesh>
        <cylinderGeometry args={[1.72, 2.05, 0.16, 7, 1]} />
        <meshStandardMaterial
          color="#050505"
          emissive={accent}
          emissiveIntensity={nodeOpen ? 0.035 : 0.018}
          metalness={0.42}
          roughness={0.68}
        />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI * 0.5, 0, 0.14]}>
        <ringGeometry args={[1.05, 1.86, 7, 1]} />
        <meshBasicMaterial color="#050505" opacity={0.58} transparent />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[1.46, 0.006, 8, 160]} />
        <meshBasicMaterial color={accent} transparent opacity={nodeOpen ? 0.42 : 0.24} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}

function NightEnvironmentWash({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const accent = sections[active].accent

  return (
    <group>
      <mesh position={[0, 0.3, -4.2]}>
        <sphereGeometry args={[6.2, 32, 16]} />
        <meshBasicMaterial color="#101410" side={BackSide} transparent opacity={nodeOpen ? 0.82 : 0.68} />
      </mesh>
      <mesh position={[0.9, -0.78, -1.85]} rotation={[-Math.PI * 0.5, 0, 0.08]}>
        <ringGeometry args={[0.72, 2.9, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={nodeOpen ? 0.16 : 0.09} blending={AdditiveBlending} />
      </mesh>
      <mesh position={[-1.35, 0.42, -1.62]} rotation={[0.18, 0.28, -0.34]}>
        <planeGeometry args={[2.1, 0.012]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={nodeOpen ? 0.5 : 0.28} blending={AdditiveBlending} />
      </mesh>
      <mesh position={[1.48, 0.9, -1.45]} rotation={[0.2, -0.42, 0.52]}>
        <planeGeometry args={[1.44, 0.01]} />
        <meshBasicMaterial color="#f5f5f5" transparent opacity={nodeOpen ? 0.32 : 0.18} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}

export default function MainScene({ active, nodeOpen }: MainSceneProps) {
  const accent = sections[active].accent

  return (
    <Canvas
      camera={{ position: [0, 0.58, 4.15], fov: 38 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ height: '100%', width: '100%' }}
    >
      <color attach="background" args={['#020303']} />
      <fog attach="fog" args={['#020303', 4.2, 9.6]} />
      <ambientLight intensity={nodeOpen ? 0.28 : 0.2} />
      <hemisphereLight args={['#ffffff', '#050606', nodeOpen ? 0.54 : 0.42]} />
      <directionalLight color="#ffffff" intensity={nodeOpen ? 0.82 : 0.62} position={[3.4, 4.8, 3.2]} />
      <spotLight
        angle={0.42}
        color={accent}
        distance={7}
        intensity={nodeOpen ? 1.6 : 1.08}
        penumbra={0.82}
        position={[-1.8, 2.2, 2.8]}
      />
      <spotLight
        angle={0.44}
        color="#f5f5f5"
        distance={6}
        intensity={nodeOpen ? 0.92 : 0.62}
        penumbra={0.9}
        position={[2.2, 1.6, 2.4]}
      />
      <pointLight color={accent} intensity={nodeOpen ? 2.2 : 1.4} position={[sections[active].orbit[0] * 2.4, 0.8, 1.8]} />
      <SceneRig active={active} nodeOpen={nodeOpen} />
      <MediaGlassPanels active={active} nodeOpen={nodeOpen} />
    </Canvas>
  )
}
