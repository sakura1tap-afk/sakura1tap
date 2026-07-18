import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import './LusionStudy.css'

type LusionStudyProps = {
  onBack: () => void
  onClose: () => void
}

type StudyStatus = 'loading' | 'ready' | 'unavailable'

type KineticPart = {
  angularVelocity: THREE.Vector3
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>
  radius: number
  seed: number
  velocity: THREE.Vector3
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const seededRandom = (seed: number) => {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export default function LusionStudy({ onBack, onClose }: LusionStudyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rootRef = useRef<HTMLElement | null>(null)
  const resetRef = useRef<() => void>(() => undefined)
  const [status, setStatus] = useState<StudyStatus>('loading')

  useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compactViewport = window.matchMedia('(max-width: 820px)').matches
    const partCount = reducedMotion ? 10 : compactViewport ? 14 : 26
    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !compactViewport,
        canvas,
        powerPreference: 'high-performance',
      })
    } catch {
      setStatus('unavailable')
      return undefined
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.setClearColor(0xeef0ec, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactViewport ? 1.15 : 1.5))

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xeef0ec, 0.052)

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80)
    camera.position.set(0, 0, 11.5)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const environmentScene = new RoomEnvironment()
    const environmentTarget = pmremGenerator.fromScene(environmentScene, 0.035)
    scene.environment = environmentTarget.texture

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x1a2ffb, 1.65)
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.4)
    keyLight.position.set(-4, 6, 8)
    const rimLight = new THREE.DirectionalLight(0xff3b9d, 3.2)
    rimLight.position.set(6, -3, 4)
    const pointerLight = new THREE.PointLight(0x4c63ff, 34, 9, 1.8)
    pointerLight.position.set(0, 0, 3)
    scene.add(hemisphere, keyLight, rimLight, pointerLight)

    const geometries: THREE.BufferGeometry[] = [
      new THREE.BoxGeometry(1.55, 0.48, 0.44, 2, 1, 1),
      new THREE.TorusGeometry(0.58, 0.19, 12, 28),
      new THREE.CylinderGeometry(0.32, 0.32, 1.25, 18, 1),
      new THREE.IcosahedronGeometry(0.62, 1),
      new THREE.OctahedronGeometry(0.66, 0),
      new THREE.ConeGeometry(0.46, 1.2, 16, 1),
    ]

    const materials: THREE.Material[] = [
      new THREE.MeshPhysicalMaterial({
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        color: 0x1a2ffb,
        metalness: 0.78,
        roughness: 0.14,
      }),
      new THREE.MeshPhysicalMaterial({
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        color: 0xf4f2ea,
        metalness: 0.12,
        roughness: 0.12,
      }),
      new THREE.MeshPhysicalMaterial({
        clearcoat: 0.76,
        clearcoatRoughness: 0.1,
        color: 0xff3b9d,
        metalness: 0.58,
        roughness: 0.18,
      }),
      new THREE.MeshPhysicalMaterial({
        clearcoat: 0.9,
        color: 0x171814,
        metalness: 0.86,
        roughness: 0.2,
      }),
    ]

    const parts: KineticPart[] = []
    const bounds = { x: 7, y: 4.2, z: 2.6 }
    let layoutSeed = 1729

    for (let index = 0; index < partCount; index += 1) {
      const geometry = geometries[index % geometries.length]
      const material = materials[(index * 3 + Math.floor(index / 4)) % materials.length]
      const mesh = new THREE.Mesh(geometry, material)
      const scale = 0.52 + ((index * 37) % 8) * 0.055
      mesh.scale.setScalar(scale)
      scene.add(mesh)
      parts.push({
        angularVelocity: new THREE.Vector3(),
        mesh,
        radius: 0.46 * scale + 0.18,
        seed: index * 0.73 + 0.5,
        velocity: new THREE.Vector3(),
      })
    }

    const scatterParts = () => {
      layoutSeed += 97
      const random = seededRandom(layoutSeed)
      parts.forEach((part, index) => {
        const angle = random() * Math.PI * 2
        const radius = 1.25 + Math.pow(random(), 0.58) * Math.min(bounds.x, bounds.y) * 0.92
        part.mesh.position.set(
          Math.cos(angle) * radius * (0.78 + random() * 0.52),
          Math.sin(angle) * radius * 0.78,
          (random() - 0.5) * bounds.z * 1.45,
        )
        part.mesh.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI)
        part.velocity.set((random() - 0.5) * 1.6, (random() - 0.5) * 1.6, (random() - 0.5) * 0.8)
        part.angularVelocity.set(
          (random() - 0.5) * 1.4,
          (random() - 0.5) * 1.4,
          (random() - 0.5) * 1.4 + index * 0.002,
        )
      })
    }
    resetRef.current = scatterParts
    scatterParts()

    const pointerNdc = new THREE.Vector2()
    const pointerWorld = new THREE.Vector3(100, 100, 0)
    const previousPointerWorld = new THREE.Vector3(100, 100, 0)
    const raycaster = new THREE.Raycaster()
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    let pointerActive = false
    let pointerSpeed = 0
    let blast = 0

    const mapPointerToWorld = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointerNdc, camera)
      previousPointerWorld.copy(pointerWorld)
      raycaster.ray.intersectPlane(interactionPlane, pointerWorld)
      if (previousPointerWorld.x < 50) {
        pointerSpeed = clamp(pointerWorld.distanceTo(previousPointerWorld) * 36, 0, 12)
      }
      pointerLight.position.set(pointerWorld.x, pointerWorld.y, 3)
    }

    const onPointerMove = (event: PointerEvent) => {
      root.style.setProperty('--lusion-pointer-x', `${event.clientX}px`)
      root.style.setProperty('--lusion-pointer-y', `${event.clientY}px`)
      pointerActive = true
      mapPointerToWorld(event)
    }
    const onPointerEnter = (event: PointerEvent) => {
      pointerActive = true
      mapPointerToWorld(event)
    }
    const onPointerLeave = () => {
      pointerActive = false
      pointerSpeed = 0
    }
    const onPointerDown = (event: PointerEvent) => {
      pointerActive = true
      mapPointerToWorld(event)
      blast = 1
      root.dataset.blast = 'true'
      window.setTimeout(() => {
        if (rootRef.current) rootRef.current.dataset.blast = 'false'
      }, 260)
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerenter', onPointerEnter)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointerdown', onPointerDown)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()

      const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z
      bounds.y = visibleHeight * 0.39
      bounds.x = bounds.y * camera.aspect
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const displacement = new THREE.Vector3()
    const force = new THREE.Vector3()
    const relativeVelocity = new THREE.Vector3()
    let lastTime = performance.now()
    let frameId = 0
    let running = !document.hidden

    const updatePart = (part: KineticPart, deltaTime: number, elapsed: number) => {
      const position = part.mesh.position
      force.copy(position).multiplyScalar(-0.34)
      force.x += -position.y * 0.055
      force.y += position.x * 0.055 + Math.sin(elapsed * 0.72 + part.seed) * 0.055
      force.z += -position.z * 0.48
      part.velocity.addScaledVector(force, deltaTime)

      if (pointerActive) {
        displacement.subVectors(position, pointerWorld)
        displacement.z *= 0.46
        const distance = Math.max(0.001, displacement.length())
        const influenceRadius = blast > 0 ? 5.2 : 3.05
        if (distance < influenceRadius) {
          const falloff = 1 - distance / influenceRadius
          const impulse = falloff * (blast > 0 ? 46 : 12 + pointerSpeed * 1.25)
          part.velocity.addScaledVector(displacement.normalize(), impulse * deltaTime)
          part.angularVelocity.x += displacement.y * falloff * deltaTime * 2.2
          part.angularVelocity.y -= displacement.x * falloff * deltaTime * 2.2
        }
      }

      const damping = Math.exp(-deltaTime * 1.24)
      part.velocity.multiplyScalar(damping)
      part.angularVelocity.multiplyScalar(Math.exp(-deltaTime * 0.42))
      if (part.velocity.lengthSq() > 64) part.velocity.setLength(8)
      position.addScaledVector(part.velocity, deltaTime)
      part.mesh.rotation.x += part.angularVelocity.x * deltaTime
      part.mesh.rotation.y += part.angularVelocity.y * deltaTime
      part.mesh.rotation.z += part.angularVelocity.z * deltaTime

      const edgeForce = 10
      if (Math.abs(position.x) > bounds.x) part.velocity.x -= Math.sign(position.x) * edgeForce * deltaTime
      if (Math.abs(position.y) > bounds.y) part.velocity.y -= Math.sign(position.y) * edgeForce * deltaTime
      if (Math.abs(position.z) > bounds.z) part.velocity.z -= Math.sign(position.z) * edgeForce * deltaTime
    }

    const solveCollisions = () => {
      for (let left = 0; left < parts.length; left += 1) {
        for (let right = left + 1; right < parts.length; right += 1) {
          const a = parts[left]
          const b = parts[right]
          displacement.subVectors(a.mesh.position, b.mesh.position)
          const minimumDistance = a.radius + b.radius
          const distanceSquared = displacement.lengthSq()
          if (distanceSquared <= 0.0001 || distanceSquared >= minimumDistance * minimumDistance) continue

          const distance = Math.sqrt(distanceSquared)
          displacement.multiplyScalar(1 / distance)
          const overlap = (minimumDistance - distance) * 0.5
          a.mesh.position.addScaledVector(displacement, overlap)
          b.mesh.position.addScaledVector(displacement, -overlap)

          relativeVelocity.subVectors(a.velocity, b.velocity)
          const closingVelocity = relativeVelocity.dot(displacement)
          if (closingVelocity < 0) {
            const impulse = -closingVelocity * 0.48
            a.velocity.addScaledVector(displacement, impulse)
            b.velocity.addScaledVector(displacement, -impulse)
          }
        }
      }
    }

    const animate = (now: number) => {
      frameId = window.requestAnimationFrame(animate)
      if (!running) return

      const deltaTime = Math.min((now - lastTime) / 1000, 0.033)
      lastTime = now
      const elapsed = now / 1000
      parts.forEach((part) => updatePart(part, deltaTime, elapsed))
      if (!reducedMotion) solveCollisions()
      blast = Math.max(0, blast - deltaTime * 3.2)
      pointerSpeed *= Math.exp(-deltaTime * 8)
      pointerLight.intensity = 26 + pointerSpeed * 1.4 + blast * 38
      camera.position.x += ((pointerActive ? pointerNdc.x * 0.26 : 0) - camera.position.x) * deltaTime * 1.4
      camera.position.y += ((pointerActive ? pointerNdc.y * 0.2 : 0) - camera.position.y) * deltaTime * 1.4
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }

    const onVisibilityChange = () => {
      running = !document.hidden
      lastTime = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    setStatus('ready')
    frameId = window.requestAnimationFrame(animate)

    const onContextLost = (event: Event) => {
      event.preventDefault()
      setStatus('unavailable')
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerenter', onPointerEnter)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      resetRef.current = () => undefined
      parts.forEach((part) => scene.remove(part.mesh))
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      environmentTarget.dispose()
      environmentScene.dispose()
      pmremGenerator.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <section
      aria-label="仿 Lusion 动效实验"
      className="lusion-study"
      data-blast="false"
      data-status={status}
      ref={rootRef}
    >
      <div className="lusion-study-backdrop" aria-hidden="true">
        <i className="lusion-study-grid" />
        <i className="lusion-study-orbit lusion-study-orbit-a" />
        <i className="lusion-study-orbit lusion-study-orbit-b" />
        <strong>KINETIC</strong>
      </div>

      <header className="lusion-study-header">
        <button className="lusion-study-brand" onClick={onClose} type="button">Sakura1Tap</button>
        <div className="lusion-study-heading">
          <span>01 / STUDY</span>
          <strong>仿 Lusion</strong>
        </div>
        <button className="lusion-study-back" onClick={onBack} type="button">返回实验室 ↗</button>
      </header>

      <div className="lusion-study-stage">
        <canvas aria-label="可使用鼠标碰撞的三维零件场" ref={canvasRef} />
        {status === 'loading' && <div className="lusion-study-state">正在装配零件…</div>}
        {status === 'unavailable' && (
          <div className="lusion-study-fallback">
            <strong>当前设备无法启动 WebGL</strong>
            <button onClick={onBack} type="button">返回实验室</button>
          </div>
        )}

        <div className="lusion-study-caption">
          <span>REALTIME / THREE.JS</span>
          <strong>KINETIC<br />PARTS</strong>
        </div>

        <div className="lusion-study-index" aria-label="仿 Lusion 实验列表">
          <div className="is-active"><span>01</span><strong>零件力场</strong><i>运行中</i></div>
          <div><span>02</span><strong>滚动航行</strong><i>下一步</i></div>
        </div>
      </div>

      <footer className="lusion-study-footer">
        <span>移动指针碰撞零件 · 点击释放冲击</span>
        <button onClick={() => resetRef.current()} type="button">重新散开</button>
      </footer>

      <div className="lusion-study-cursor" aria-hidden="true"><i /></div>
    </section>
  )
}
