import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { DirectionalLight, EquirectangularReflectionMapping, MathUtils, PointLight, Vector3 } from 'three'
import ferndaleStudio07 from '../../assets/hdri/ferndale_studio_07_1k.hdr?url'
import ArtifactCore from './ArtifactCore'

type PointerVector = {
  x: number
  y: number
}

type ArtifactSceneProps = {
  hover: PointerVector
  scrollDepth: number
  onDebugChange: (debug: { depth: number; drag: number; hover: number }) => void
}

type DragState = {
  active: boolean
  lastX: number
  lastY: number
  rotationX: number
  rotationY: number
}

const initialDrag: DragState = {
  active: false,
  lastX: 0,
  lastY: 0,
  rotationX: -0.12,
  rotationY: 0.22,
}

function ArtifactEnvironment() {
  const texture = useLoader(RGBELoader, ferndaleStudio07)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    texture.mapping = EquirectangularReflectionMapping
    scene.environment = texture

    return () => {
      if (scene.environment === texture) scene.environment = null
    }
  }, [scene, texture])

  return null
}

function CameraRig({ hover, scrollDepth }: { hover: PointerVector; scrollDepth: number }) {
  const camera = useThree((state) => state.camera)
  const target = useMemo(() => new Vector3(), [])

  useFrame((_, delta) => {
    target.set(hover.x * 0.18, hover.y * 0.12, 4.35 - scrollDepth * 1.02)
    camera.position.lerp(target, 1 - Math.exp(-delta * 3.8))
    camera.lookAt(0, 0, 0)
  })

  return null
}

function LightRig({ hover, scrollDepth }: { hover: PointerVector; scrollDepth: number }) {
  const keyRef = useRef<DirectionalLight>(null)
  const rimRef = useRef<PointLight>(null)

  useFrame((state) => {
    const time = state.clock.elapsedTime
    if (keyRef.current) {
      keyRef.current.position.set(2.8 + hover.x * 1.2, 2.2 + hover.y * 0.6, 3.4)
      keyRef.current.intensity = 2.2 + scrollDepth * 0.55
    }
    if (rimRef.current) {
      rimRef.current.position.set(Math.sin(time * 0.35) * 2.2, 0.8, -2.2)
      rimRef.current.intensity = 7 + scrollDepth * 2
    }
  })

  return (
    <>
      <ambientLight intensity={0.24} />
      <directionalLight ref={keyRef} position={[2.8, 2.2, 3.4]} intensity={2.2} color="#f4eee7" />
      <pointLight ref={rimRef} position={[-1.4, 0.8, -2.2]} intensity={7} color="#8f5364" distance={5.2} />
    </>
  )
}

function ArtifactStage({ hover, scrollDepth, onDebugChange }: ArtifactSceneProps) {
  const [drag, setDrag] = useState<DragState>(initialDrag)

  useEffect(() => {
    const hoverAmount = Math.min(1, Math.hypot(hover.x, hover.y))
    const dragAmount = drag.active ? 1 : Math.min(1, Math.hypot(drag.rotationX, drag.rotationY) / 2.8)
    onDebugChange({
      depth: scrollDepth,
      drag: dragAmount,
      hover: hoverAmount,
    })
  }, [drag.active, drag.rotationX, drag.rotationY, hover.x, hover.y, onDebugChange, scrollDepth])

  const handleDragStart = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setDrag((current) => ({
      ...current,
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
    }))
  }

  const handleDragMove = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.active) return
    event.stopPropagation()
    const deltaX = event.clientX - drag.lastX
    const deltaY = event.clientY - drag.lastY
    setDrag((current) => ({
      ...current,
      lastX: event.clientX,
      lastY: event.clientY,
      rotationX: MathUtils.clamp(current.rotationX + deltaY * 0.006, -1.25, 1.25),
      rotationY: current.rotationY + deltaX * 0.008,
    }))
  }

  const handleDragEnd = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setDrag((current) => ({ ...current, active: false }))
  }

  return (
    <>
      <ArtifactEnvironment />
      <CameraRig hover={hover} scrollDepth={scrollDepth} />
      <LightRig hover={hover} scrollDepth={scrollDepth} />
      <ArtifactCore
        drag={drag}
        hover={hover}
        scrollDepth={scrollDepth}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
    </>
  )
}

export default function ArtifactScene({ hover, scrollDepth, onDebugChange }: ArtifactSceneProps) {
  return (
    <Canvas
      className="artifact-lab-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.35], fov: 42, near: 0.1, far: 24 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#020202']} />
      <fog attach="fog" args={['#020202', 4.8, 9.5]} />
      <Suspense fallback={null}>
        <ArtifactStage hover={hover} scrollDepth={scrollDepth} onDebugChange={onDebugChange} />
      </Suspense>
    </Canvas>
  )
}
