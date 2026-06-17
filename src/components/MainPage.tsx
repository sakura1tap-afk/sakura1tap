import { Center, Html } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Gamepad2,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  Waypoints,
  X,
} from 'lucide-react'
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, MathUtils, Points, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type SectionKey = 'about' | 'work' | 'source' | 'play'
type GamePhase = 'idle' | 'running' | 'over'

type MainPageProps = {
  modelBuffer: ArrayBuffer | null
}

type DetailCard = {
  body: string
  label: string
  meta: string
}

type SectionConfig = {
  accent: string
  body: string
  camera: [number, number, number]
  details: DetailCard[]
  hotspot: { left: string; top: string }
  icon: typeof Info
  label: string
  metric: string
  modelRotation: [number, number, number]
  orbit: [number, number, number]
  title: string
}

type Hazard = {
  height: number
  speedX: number
  speedY: number
  width: number
  x: number
  y: number
}

const sections: Record<SectionKey, SectionConfig> = {
  about: {
    accent: '#d8f3ff',
    body: '个人与网站介绍会成为入口说明层：你是谁、这个站点为什么存在、它想给访问者留下什么感觉。',
    camera: [0.2, 1.12, 4.25],
    details: [
      { label: 'SITE', meta: 'sakura1tap.com', body: '先用 3D 场景建立第一眼记忆点，再把内容拆成可探索节点。' },
      { label: 'TONE', meta: 'minimal / interactive', body: '黑白舞台、少量强调色、镜头响应，避免传统个人主页的模板感。' },
      { label: 'NEXT', meta: 'profile content', body: '后续可以填入个人简介、技术栈、学习路线和社交入口。' },
    ],
    hotspot: { left: '50%', top: '43%' },
    icon: Info,
    label: 'ABOUT',
    metric: '01 / IDENTITY',
    modelRotation: [0, -0.18, 0],
    orbit: [-0.12, 0.1, 0],
    title: 'Sakura1Tap',
  },
  work: {
    accent: '#ffe1a6',
    body: '工作区用来承载项目、作品、学习记录和前端实验。它应该像档案库，而不是普通列表。',
    camera: [-1.18, 1.02, 4.05],
    details: [
      { label: 'PROJECTS', meta: 'selected work', body: '放真正能代表你的项目，每个项目后续可以接截图、链接和过程记录。' },
      { label: 'NOTES', meta: 'learning log', body: '前端、Three.js、部署、AI 工具流都可以变成可索引的学习档案。' },
      { label: 'SYSTEM', meta: 'workbench', body: '未来可以把这里做成小型控制台：筛选、展开、预览项目。' },
    ],
    hotspot: { left: '61%', top: '59%' },
    icon: BriefcaseBusiness,
    label: 'WORK',
    metric: '02 / ARCHIVE',
    modelRotation: [0, 0.34, 0],
    orbit: [0.08, -0.1, 0.2],
    title: 'Work Field',
  },
  source: {
    accent: '#ffd6eb',
    body: '模型来源和灵感参考单独成区，既是版权说明，也是设计演化记录，让网站显得更专业。',
    camera: [1.25, 1.18, 3.85],
    details: [
      { label: 'MODEL', meta: 'Sketchfab / Felix The Cat', body: '当前实例模型来自 Sketchfab，项目内保留本地 GLB 和 attribution 说明。' },
      { label: 'REFERENCES', meta: 'Active Theory / Lusion / Bruno Simon', body: '参考方向是高交互、强转场、低文字密度，而不是直接复制某个页面。' },
      { label: 'PROCESS', meta: 'design log', body: '这个区域后续可以记录每次视觉迭代：加载、入口、内部页、小游戏。' },
    ],
    hotspot: { left: '47%', top: '28%' },
    icon: Waypoints,
    label: 'SOURCE',
    metric: '03 / ORIGIN',
    modelRotation: [0, -0.55, 0],
    orbit: [0.16, 0.18, -0.12],
    title: 'Source Index',
  },
  play: {
    accent: '#c8ffdf',
    body: '小游戏区会成为隐藏记忆点：一个黑白躲避原型，鼠标或手指控制光点，在扫描线里存活。',
    camera: [0.72, 0.98, 4.55],
    details: [
      { label: 'CONTROL', meta: 'pointer / touch', body: '鼠标或手指拖动光点，躲开白色扫描块，存活越久分数越高。' },
      { label: 'STYLE', meta: 'black / white', body: '保持和主场景一致的黑白视觉，不做花哨 UI，重点是紧张和流畅。' },
      { label: 'UPGRADE', meta: 'future 3D', body: '玩法确认后，可以把障碍投射到 3D 场景里，做成真正的空间小游戏。' },
    ],
    hotspot: { left: '54%', top: '69%' },
    icon: Gamepad2,
    label: 'PLAY',
    metric: '04 / DODGE',
    modelRotation: [0, 0.08, 0],
    orbit: [-0.18, 0.0, -0.16],
    title: 'Blackout Run',
  },
}

const sectionOrder = Object.keys(sections) as SectionKey[]

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
    group.position.x = MathUtils.damp(group.position.x, isCompact ? 0 : nodeOpen ? -0.04 : 0.28, 3.4, delta)
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

function EnergyField({ active, nodeOpen }: { active: SectionKey; nodeOpen: boolean }) {
  const groupRef = useRef<Group>(null)
  const pointsRef = useRef<Points>(null)
  const accent = sections[active].accent
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(260 * 3)

    for (let index = 0; index < 260; index += 1) {
      const ring = index % 4
      const angle = index * 0.41
      const radius = 1.05 + ring * 0.34 + Math.sin(index * 1.7) * 0.08
      positions[index * 3] = Math.cos(angle) * radius
      positions[index * 3 + 1] = -0.1 + Math.sin(index * 0.37) * 0.72
      positions[index * 3 + 2] = Math.sin(angle) * radius * 0.34
    }

    return positions
  }, [])

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
          opacity={nodeOpen ? 0.74 : 0.56}
          size={nodeOpen ? 0.022 : 0.018}
          sizeAttenuation
          transparent
        />
      </points>
    </group>
  )
}

function MainScene({
  active,
  modelBuffer,
  nodeOpen,
}: {
  active: SectionKey
  modelBuffer: ArrayBuffer | null
  nodeOpen: boolean
}) {
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
      <ambientLight intensity={nodeOpen ? 0.68 : 0.56} />
      <hemisphereLight args={['#ffffff', '#151515', nodeOpen ? 0.62 : 0.5]} />
      <directionalLight color="#ffffff" intensity={nodeOpen ? 1.55 : 1.35} position={[4, 5, 3]} />
      <pointLight color={accent} intensity={nodeOpen ? 3.4 : 2.4} position={[sections[active].orbit[0] * 5, 1.1, 2.1]} />
      <pointLight color="#ffffff" intensity={0.62} position={[-3, 1, -2]} />
      <SceneRig active={active} nodeOpen={nodeOpen} />
      <EnergyField active={active} nodeOpen={nodeOpen} />
      {modelBuffer ? (
        <MainStudyModel active={active} modelBuffer={modelBuffer} nodeOpen={nodeOpen} />
      ) : (
        <Html center className="main-model-status">
          MODEL BUFFER MISSING
        </Html>
      )}
    </Canvas>
  )
}

function DodgeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hazardsRef = useRef<Hazard[]>([])
  const playerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const scoreRef = useRef(0)
  const spawnRef = useRef(0)
  const phaseRef = useRef<GamePhase>('idle')
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const resetGame = useCallback(() => {
    hazardsRef.current = []
    scoreRef.current = 0
    spawnRef.current = 0
    setScore(0)
    setPhase('running')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    let width = 0
    let height = 0
    let animationFrame = 0
    let lastTime = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (!playerRef.current.x || !playerRef.current.y) {
        playerRef.current = {
          x: width * 0.5,
          y: height * 0.68,
          targetX: width * 0.5,
          targetY: height * 0.68,
        }
      }
    }

    const addHazard = () => {
      const vertical = Math.random() > 0.46
      const level = Math.min(1.8, 1 + scoreRef.current / 95)

      if (vertical) {
        const hazardWidth = 10 + Math.random() * 24
        const fromLeft = Math.random() > 0.5
        hazardsRef.current.push({
          height: height * (0.28 + Math.random() * 0.6),
          speedX: (fromLeft ? 1 : -1) * (95 + Math.random() * 65) * level,
          speedY: 0,
          width: hazardWidth,
          x: fromLeft ? -hazardWidth : width + hazardWidth,
          y: Math.random() * height * 0.72,
        })
      } else {
        const hazardHeight = 8 + Math.random() * 18
        hazardsRef.current.push({
          height: hazardHeight,
          speedX: 0,
          speedY: 105 + Math.random() * 90 * level,
          width: width * (0.34 + Math.random() * 0.42),
          x: Math.random() * width * 0.52,
          y: -hazardHeight,
        })
      }
    }

    const drawGrid = (time: number) => {
      context.fillStyle = '#050505'
      context.fillRect(0, 0, width, height)
      context.strokeStyle = 'rgba(255,255,255,0.07)'
      context.lineWidth = 1

      for (let x = ((time * 0.018) % 32) - 32; x < width + 32; x += 32) {
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x + width * 0.14, height)
        context.stroke()
      }

      for (let y = 0; y < height; y += 34) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()
      }
    }

    const loop = (time: number) => {
      const delta = Math.min(34, time - lastTime)
      lastTime = time
      const seconds = delta / 1000
      const phaseNow = phaseRef.current

      if (phaseNow === 'running') {
        scoreRef.current += seconds * 12
        const nextScore = Math.floor(scoreRef.current)
        setScore((value) => (value === nextScore ? value : nextScore))

        const player = playerRef.current
        player.x += (player.targetX - player.x) * Math.min(1, seconds * 9)
        player.y += (player.targetY - player.y) * Math.min(1, seconds * 9)

        spawnRef.current -= delta
        if (spawnRef.current <= 0) {
          addHazard()
          spawnRef.current = Math.max(280, 780 - scoreRef.current * 5)
        }

        hazardsRef.current = hazardsRef.current
          .map((hazard) => ({
            ...hazard,
            x: hazard.x + hazard.speedX * seconds,
            y: hazard.y + hazard.speedY * seconds,
          }))
          .filter(
            (hazard) =>
              hazard.x > -width * 0.4 &&
              hazard.x < width * 1.4 &&
              hazard.y > -height * 0.25 &&
              hazard.y < height * 1.25,
          )

        const radius = 9
        const hit = hazardsRef.current.some((hazard) => {
          const closestX = Math.max(hazard.x, Math.min(player.x, hazard.x + hazard.width))
          const closestY = Math.max(hazard.y, Math.min(player.y, hazard.y + hazard.height))
          const dx = player.x - closestX
          const dy = player.y - closestY
          return dx * dx + dy * dy < radius * radius
        })

        if (hit) {
          setBest((value) => Math.max(value, Math.floor(scoreRef.current)))
          setPhase('over')
        }
      }

      drawGrid(time)

      context.save()
      context.globalCompositeOperation = 'screen'
      hazardsRef.current.forEach((hazard, index) => {
        const alpha = 0.56 + Math.sin(time * 0.006 + index) * 0.16
        context.fillStyle = `rgba(255,255,255,${alpha})`
        context.shadowBlur = 18
        context.shadowColor = 'rgba(255,255,255,0.4)'
        context.fillRect(hazard.x, hazard.y, hazard.width, hazard.height)
      })
      context.restore()

      const player = playerRef.current
      context.save()
      context.translate(player.x, player.y)
      context.fillStyle = phaseNow === 'over' ? 'rgba(255,255,255,0.3)' : '#ffffff'
      context.shadowBlur = 22
      context.shadowColor = 'rgba(200,255,223,0.72)'
      context.beginPath()
      context.arc(0, 0, 8.5, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = 'rgba(255,255,255,0.38)'
      context.beginPath()
      context.arc(0, 0, 17, 0, Math.PI * 2)
      context.stroke()
      context.restore()

      context.fillStyle = 'rgba(255,255,255,0.58)'
      context.font = '10px Inter, sans-serif'
      context.letterSpacing = '2px'
      context.fillText(`SCORE ${Math.floor(scoreRef.current).toString().padStart(3, '0')}`, 18, 24)
      context.fillText(`BEST ${best.toString().padStart(3, '0')}`, 18, 42)

      animationFrame = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    animationFrame = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrame)
    }
  }, [best])

  const moveTarget = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    playerRef.current.targetX = Math.max(14, Math.min(rect.width - 14, clientX - rect.left))
    playerRef.current.targetY = Math.max(14, Math.min(rect.height - 14, clientY - rect.top))
  }

  return (
    <div className={`dodge-game is-${phase}`}>
      <canvas
        aria-label="黑白躲避小游戏"
        className="dodge-canvas"
        onPointerDown={(event) => {
          moveTarget(event.clientX, event.clientY)
          if (phase !== 'running') {
            resetGame()
          }
        }}
        onPointerMove={(event) => moveTarget(event.clientX, event.clientY)}
        ref={canvasRef}
      />
      <div className="dodge-hud">
        <span>BLACKOUT RUN</span>
        <strong>{score.toString().padStart(3, '0')}</strong>
      </div>
      {phase !== 'running' && (
        <button className="dodge-start" onClick={resetGame} type="button">
          {phase === 'over' ? <RotateCcw size={17} strokeWidth={1.8} /> : <Play size={17} strokeWidth={1.8} />}
          <span>{phase === 'over' ? 'RESTART' : 'START'}</span>
        </button>
      )}
    </div>
  )
}

function DetailLayer({ active, onClose }: { active: SectionKey; onClose: () => void }) {
  const section = sections[active]

  return (
    <motion.section
      className={`node-detail node-detail-${active}`}
      initial={{ opacity: 0, x: 28, filter: 'blur(12px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 28, filter: 'blur(12px)' }}
      transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className="node-detail-header">
        <div>
          <span>{section.metric}</span>
          <h2>{section.title}</h2>
        </div>
        <button aria-label="关闭节点详情" onClick={onClose} type="button">
          <X size={17} strokeWidth={1.8} />
        </button>
      </header>

      {active === 'play' ? (
        <DodgeGame />
      ) : (
        <div className="node-detail-grid">
          {section.details.map((detail) => (
            <article className="node-detail-card" key={detail.label}>
              <span>{detail.meta}</span>
              <h3>{detail.label}</h3>
              <p>{detail.body}</p>
            </article>
          ))}
        </div>
      )}
    </motion.section>
  )
}

export default function MainPage({ modelBuffer }: MainPageProps) {
  const [active, setActive] = useState<SectionKey>('about')
  const [openNode, setOpenNode] = useState<SectionKey | null>(null)
  const [cursor, setCursor] = useState({ x: 50, y: 50 })
  const activeSection = sections[active]
  const isNodeOpen = openNode !== null

  const activateSection = (key: SectionKey) => {
    setActive(key)
    setOpenNode(null)
  }

  return (
    <motion.section
      className={`main-page main-experience ${isNodeOpen ? 'has-node-open' : ''}`}
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
        <MainScene active={active} modelBuffer={modelBuffer} nodeOpen={isNodeOpen} />
      </div>

      <div className="scene-hotspots" aria-label="场景热点">
        {sectionOrder.map((key) => (
          <button
            aria-label={`切换到 ${sections[key].label}`}
            className={`scene-hotspot ${active === key ? 'is-active' : ''}`}
            key={key}
            onClick={() => activateSection(key)}
            style={
              {
                '--hotspot-left': sections[key].hotspot.left,
                '--hotspot-top': sections[key].hotspot.top,
              } as CSSProperties
            }
            type="button"
          >
            <span />
          </button>
        ))}
      </div>

      <div className="main-node-map" aria-label="内部页节点">
        {sectionOrder.map((key, index) => {
          const config = sections[key]
          const Icon = config.icon

          return (
            <button
              className={`main-node ${active === key ? 'is-active' : ''}`}
              key={key}
              onClick={() => activateSection(key)}
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
        <button className="main-panel-action" onClick={() => setOpenNode(active)} type="button">
          <span>{active === 'play' ? 'START GAME' : 'OPEN NODE'}</span>
          <ArrowUpRight size={16} strokeWidth={1.7} />
        </button>
      </aside>

      <AnimatePresence>
        {openNode && <DetailLayer active={openNode} onClose={() => setOpenNode(null)} />}
      </AnimatePresence>

      <div className="tech-strip" aria-hidden="true">
        <BookOpen size={14} strokeWidth={1.7} />
        <span>R3F CAMERA</span>
        <span>CANVAS GAME</span>
        <span>STATEFUL NODES</span>
        <Sparkles size={14} strokeWidth={1.7} />
      </div>
    </motion.section>
  )
}
