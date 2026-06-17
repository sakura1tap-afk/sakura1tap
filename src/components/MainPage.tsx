import { Center, Html } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Atom, Fingerprint, Layers3, Send } from 'lucide-react'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { Group, MathUtils, Points, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type SectionKey = 'identity' | 'work' | 'lab' | 'contact'

type MainPageProps = {
  modelBuffer: ArrayBuffer | null
}

type SectionConfig = {
  accent: string
  body: string
  camera: [number, number, number]
  icon: typeof Fingerprint
  label: string
  metric: string
  modelRotation: [number, number, number]
  orbit: [number, number, number]
  title: string
}

const sections: Record<SectionKey, SectionConfig> = {
  identity: {
    accent: '#d8f3ff',
    body: '一个安静但有反应的个人入口。先用场景建立记忆点，再把内容藏进可以探索的节点里。',
    camera: [0.2, 1.12, 4.25],
    icon: Fingerprint,
    label: 'IDENTITY',
    metric: '01 / SIGNAL',
    modelRotation: [0, -0.18, 0],
    orbit: [-0.12, 0.1, 0],
    title: 'Sakura1Tap',
  },
  work: {
    accent: '#ffe1a6',
    body: '作品区会像切换镜头一样展开：项目、截图、过程记录都可以绑定到场景里的不同焦点。',
    camera: [-1.18, 1.02, 4.05],
    icon: Layers3,
    label: 'WORK',
    metric: '02 / ARCHIVE',
    modelRotation: [0, 0.34, 0],
    orbit: [0.08, -0.1, 0.2],
    title: 'Selected Frames',
  },
  lab: {
    accent: '#ffd6eb',
    body: '实验区适合放前端动效、Three.js 小实验、AI 工具流，视觉上可以更像一个私人研究台。',
    camera: [1.25, 1.18, 3.85],
    icon: Atom,
    label: 'LAB',
    metric: '03 / MOTION',
    modelRotation: [0, -0.55, 0],
    orbit: [0.16, 0.18, -0.12],
    title: 'Interactive Lab',
  },
  contact: {
    accent: '#c8ffdf',
    body: '联系入口不做普通表单，后面可以设计成一条被点亮的通路，最终落到邮箱、社交链接或留言。',
    camera: [0.72, 0.98, 4.55],
    icon: Send,
    label: 'CONTACT',
    metric: '04 / ROUTE',
    modelRotation: [0, 0.08, 0],
    orbit: [-0.18, 0.0, -0.16],
    title: 'Open Channel',
  },
}

const sectionOrder = Object.keys(sections) as SectionKey[]

function SceneRig({ active }: { active: SectionKey }) {
  const { camera } = useThree()
  const lookTarget = useRef(new Vector3(0, 0.3, 0))
  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLook = useMemo(() => new Vector3(0, 0.34, 0), [])

  useFrame((_, delta) => {
    const config = sections[active]
    targetPosition.set(...config.camera)
    targetLook.set(config.orbit[0] * 0.35, 0.34 + config.orbit[1] * 0.25, config.orbit[2])

    camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 2.2))
    lookTarget.current.lerp(targetLook, 1 - Math.exp(-delta * 2.8))
    camera.lookAt(lookTarget.current)
  })

  return null
}

function MainStudyModel({ active, modelBuffer }: { active: SectionKey; modelBuffer: ArrayBuffer }) {
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
      modelBuffer.slice(0),
      '',
      (gltf) => {
        if (alive) {
          setScene(gltf.scene)
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
    group.position.y = MathUtils.damp(
      group.position.y,
      (isCompact ? -0.58 : -0.38) + Math.sin(state.clock.elapsedTime * 1.3) * 0.018,
      4,
      delta,
    )
  })

  if (error) {
    return (
      <Html center className="main-model-status">
        MODEL OFFLINE
      </Html>
    )
  }

  if (!scene) {
    return (
      <Html center className="main-model-status">
        SYNCING MODEL
      </Html>
    )
  }

  return (
    <group ref={groupRef} position={[isCompact ? 0 : 0.28, isCompact ? -0.58 : -0.38, 0]}>
      <Center>
        <primitive object={scene} scale={isCompact ? 0.00115 : 0.00168} />
      </Center>
    </group>
  )
}

function EnergyField({ active }: { active: SectionKey }) {
  const groupRef = useRef<Group>(null)
  const pointsRef = useRef<Points>(null)
  const accent = sections[active].accent
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(210 * 3)

    for (let index = 0; index < 210; index += 1) {
      const ring = index % 3
      const angle = index * 0.41
      const radius = 1.05 + ring * 0.42 + Math.sin(index * 1.7) * 0.08
      positions[index * 3] = Math.cos(angle) * radius
      positions[index * 3 + 1] = -0.1 + Math.sin(index * 0.37) * 0.72
      positions[index * 3 + 2] = Math.sin(angle) * radius * 0.34
    }

    return positions
  }, [])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.16
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.35) * 0.08
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[0.12, -0.15, -0.08]}>
      <mesh rotation={[Math.PI * 0.5, 0, 0.18]}>
        <torusGeometry args={[1.45, 0.004, 8, 180, Math.PI * 1.42]} />
        <meshBasicMaterial color={accent} transparent opacity={0.42} />
      </mesh>
      <mesh rotation={[Math.PI * 0.5, 0.2, -0.45]}>
        <torusGeometry args={[2.05, 0.003, 8, 180, Math.PI * 1.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={accent}
          depthWrite={false}
          opacity={0.56}
          size={0.018}
          sizeAttenuation
          transparent
        />
      </points>
    </group>
  )
}

function MainScene({ active, modelBuffer }: { active: SectionKey; modelBuffer: ArrayBuffer | null }) {
  const accent = sections[active].accent

  return (
    <Canvas
      camera={{ position: [0.2, 1.12, 4.25], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ height: '100%', width: '100%' }}
    >
      <color attach="background" args={['#090909']} />
      <fog attach="fog" args={['#090909', 4.6, 8.2]} />
      <ambientLight intensity={0.56} />
      <hemisphereLight args={['#ffffff', '#151515', 0.5]} />
      <directionalLight color="#ffffff" intensity={1.35} position={[4, 5, 3]} />
      <pointLight color={accent} intensity={2.4} position={[sections[active].orbit[0] * 5, 1.1, 2.1]} />
      <pointLight color="#ffffff" intensity={0.62} position={[-3, 1, -2]} />
      <SceneRig active={active} />
      <EnergyField active={active} />
      {modelBuffer ? (
        <MainStudyModel active={active} modelBuffer={modelBuffer} />
      ) : (
        <Html center className="main-model-status">
          MODEL BUFFER MISSING
        </Html>
      )}
    </Canvas>
  )
}

export default function MainPage({ modelBuffer }: MainPageProps) {
  const [active, setActive] = useState<SectionKey>('identity')
  const [cursor, setCursor] = useState({ x: 50, y: 50 })
  const activeSection = sections[active]

  return (
    <motion.section
      className="main-page main-experience"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.72, ease: 'easeOut' }}
      style={
        {
          '--accent': activeSection.accent,
          '--cursor-x': `${cursor.x}%`,
          '--cursor-y': `${cursor.y}%`,
        } as CSSProperties
      }
      onPointerMove={(event) => {
        setCursor({
          x: (event.clientX / window.innerWidth) * 100,
          y: (event.clientY / window.innerHeight) * 100,
        })
      }}
    >
      <div className="main-light-field" aria-hidden="true" />
      <div className="main-grid" aria-hidden="true" />
      <div className="main-scene">
        <MainScene active={active} modelBuffer={modelBuffer} />
      </div>

      <div className="main-node-map" aria-label="内部页节点">
        {sectionOrder.map((key, index) => {
          const config = sections[key]
          const Icon = config.icon

          return (
            <button
              className={`main-node ${active === key ? 'is-active' : ''}`}
              key={key}
              onClick={() => setActive(key)}
              style={{ '--node-index': index } as CSSProperties}
              type="button"
            >
              <span className="main-node-pulse" aria-hidden="true" />
              <Icon size={17} strokeWidth={1.7} />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>

      <aside className="main-panel">
        <div className="main-panel-rule" aria-hidden="true" />
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
            transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="main-panel-index">{activeSection.metric}</span>
            <h1>{activeSection.title}</h1>
            <p>{activeSection.body}</p>
          </motion.div>
        </AnimatePresence>
        <button className="main-panel-action" type="button">
          <span>OPEN NODE</span>
          <ArrowUpRight size={16} strokeWidth={1.7} />
        </button>
      </aside>
    </motion.section>
  )
}
