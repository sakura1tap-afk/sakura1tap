import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import './LusionStudy.css'

type LusionStudyProps = {
  onBack: () => void
  onClose: () => void
}

type StudyStatus = 'loading' | 'ready' | 'unavailable'
type RapierModule = typeof import('@dimforge/rapier3d-compat')
type RapierBody = import('@dimforge/rapier3d-compat').RigidBody
type RapierColliderDesc = import('@dimforge/rapier3d-compat').ColliderDesc

type PartSpec = {
  geometry: THREE.BufferGeometry
  massFactor: number
  radius: number
  createColliders: (scale: number) => RapierColliderDesc[]
}

type KineticPart = {
  body: RapierBody
  colorIndex: number
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>
  radius: number
  scale: number
  seed: number
}

const FIXED_TIME_STEP = 1 / 60
const MAX_PHYSICS_STEPS = 3
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

    let disposed = false
    let disposeRuntime: () => void = () => undefined

    const initialise = async () => {
      try {
        const RAPIER = await import('@dimforge/rapier3d-compat')
        await RAPIER.init()
        if (disposed) return
        disposeRuntime = createRuntime(RAPIER)
      } catch (error) {
        console.error('Kinetic field initialisation failed', error)
        if (!disposed) setStatus('unavailable')
      }
    }

    const createRuntime = (RAPIER: RapierModule) => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const compactViewport = window.matchMedia('(max-width: 820px)').matches
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
      const lowPowerDevice = navigator.hardwareConcurrency <= 4 || deviceMemory <= 4
      const partCount = reducedMotion ? 18 : compactViewport ? 28 : lowPowerDevice ? 40 : 56
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
        return () => undefined
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.04
      renderer.setClearColor(0xeef0ec, 0)
      let pixelRatio = Math.min(window.devicePixelRatio, compactViewport ? 1.12 : 1.45)
      renderer.setPixelRatio(pixelRatio)

      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0xeef0ec, 0.045)

      const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80)
      camera.position.set(0, 0, 11.5)

      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      const environmentScene = new RoomEnvironment()
      const environmentTarget = pmremGenerator.fromScene(environmentScene, 0.035)
      scene.environment = environmentTarget.texture

      const hemisphere = new THREE.HemisphereLight(0xffffff, 0x1a2ffb, 1.55)
      const keyLight = new THREE.DirectionalLight(0xffffff, 4.2)
      keyLight.position.set(-4, 6, 8)
      const rimLight = new THREE.DirectionalLight(0xff3b9d, 2.9)
      rimLight.position.set(6, -3, 4)
      const pointerLight = new THREE.PointLight(0x4c63ff, 30, 9, 1.8)
      pointerLight.position.set(0, 0, 3)
      scene.add(hemisphere, keyLight, rimLight, pointerLight)

      const materials: THREE.MeshPhysicalMaterial[] = [
        new THREE.MeshPhysicalMaterial({
          clearcoat: 0.92,
          clearcoatRoughness: 0.06,
          color: 0x1a2ffb,
          metalness: 0.76,
          roughness: 0.14,
        }),
        new THREE.MeshPhysicalMaterial({
          clearcoat: 1,
          clearcoatRoughness: 0.035,
          color: 0xf8f6f0,
          metalness: 0.08,
          roughness: 0.1,
        }),
        new THREE.MeshPhysicalMaterial({
          clearcoat: 0.84,
          clearcoatRoughness: 0.07,
          color: 0xff3b9d,
          metalness: 0.48,
          roughness: 0.16,
        }),
        new THREE.MeshPhysicalMaterial({
          clearcoat: 0.9,
          color: 0x151713,
          metalness: 0.84,
          roughness: 0.18,
        }),
        new THREE.MeshPhysicalMaterial({
          clearcoat: 0.8,
          clearcoatRoughness: 0.08,
          color: 0x72e6ff,
          metalness: 0.42,
          roughness: 0.15,
        }),
        new THREE.MeshPhysicalMaterial({
          clearcoat: 0.88,
          clearcoatRoughness: 0.05,
          color: 0xff8a3d,
          metalness: 0.58,
          roughness: 0.17,
        }),
      ]

      const barGeometry = new THREE.BoxGeometry(1.55, 0.48, 0.44, 2, 1, 1)
      const ringGeometry = new THREE.TorusGeometry(0.58, 0.18, 12, 28)
      const cylinderGeometry = new THREE.CylinderGeometry(0.32, 0.32, 1.25, 18, 1)
      const icosahedronGeometry = new THREE.IcosahedronGeometry(0.62, 1)
      const octahedronGeometry = new THREE.OctahedronGeometry(0.66, 0)
      const coneGeometry = new THREE.ConeGeometry(0.46, 1.2, 18, 1)
      const capsuleGeometry = new THREE.CapsuleGeometry(0.32, 0.74, 6, 12)
      const pyramidGeometry = new THREE.ConeGeometry(0.6, 1.08, 4, 1)
      const knotGeometry = new THREE.TorusKnotGeometry(0.43, 0.13, 64, 10, 2, 3)
      const gearGeometry = new THREE.CylinderGeometry(0.56, 0.56, 0.27, 12, 1)
      const geometries = [
        barGeometry,
        ringGeometry,
        cylinderGeometry,
        icosahedronGeometry,
        octahedronGeometry,
        coneGeometry,
        capsuleGeometry,
        pyramidGeometry,
        knotGeometry,
        gearGeometry,
      ]

      const convexCollider = (geometry: THREE.BufferGeometry, scale: number, fallbackRadius: number) => {
        const attribute = geometry.getAttribute('position')
        const vertices = new Float32Array(attribute.count * 3)
        for (let index = 0; index < attribute.count; index += 1) {
          vertices[index * 3] = attribute.getX(index) * scale
          vertices[index * 3 + 1] = attribute.getY(index) * scale
          vertices[index * 3 + 2] = attribute.getZ(index) * scale
        }
        return RAPIER.ColliderDesc.convexHull(vertices) ?? RAPIER.ColliderDesc.ball(fallbackRadius * scale)
      }

      const ringColliders = (scale: number) => Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2
        return RAPIER.ColliderDesc.ball(0.2 * scale).setTranslation(
          Math.cos(angle) * 0.57 * scale,
          Math.sin(angle) * 0.57 * scale,
          0,
        )
      })

      const knotColliders = (scale: number) => Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        const radial = 0.43 + 0.13 * Math.cos(angle * 3)
        return RAPIER.ColliderDesc.ball(0.17 * scale).setTranslation(
          Math.cos(angle * 2) * radial * scale,
          Math.sin(angle * 2) * radial * scale,
          Math.sin(angle * 3) * 0.13 * scale,
        )
      })

      const specs: PartSpec[] = [
        { geometry: barGeometry, massFactor: 1.45, radius: 0.86, createColliders: (scale) => [RAPIER.ColliderDesc.roundCuboid(0.775 * scale, 0.24 * scale, 0.22 * scale, 0.05 * scale)] },
        { geometry: ringGeometry, massFactor: 0.9, radius: 0.78, createColliders: ringColliders },
        { geometry: cylinderGeometry, massFactor: 1.25, radius: 0.72, createColliders: (scale) => [RAPIER.ColliderDesc.roundCylinder(0.625 * scale, 0.32 * scale, 0.04 * scale)] },
        { geometry: icosahedronGeometry, massFactor: 1.1, radius: 0.66, createColliders: (scale) => [convexCollider(icosahedronGeometry, scale, 0.62)] },
        { geometry: octahedronGeometry, massFactor: 0.95, radius: 0.68, createColliders: (scale) => [convexCollider(octahedronGeometry, scale, 0.66)] },
        { geometry: coneGeometry, massFactor: 1.05, radius: 0.7, createColliders: (scale) => [RAPIER.ColliderDesc.roundCone(0.6 * scale, 0.46 * scale, 0.035 * scale)] },
        { geometry: capsuleGeometry, massFactor: 1.3, radius: 0.72, createColliders: (scale) => [RAPIER.ColliderDesc.capsule(0.37 * scale, 0.32 * scale)] },
        { geometry: pyramidGeometry, massFactor: 1.02, radius: 0.72, createColliders: (scale) => [RAPIER.ColliderDesc.cone(0.54 * scale, 0.6 * scale)] },
        { geometry: knotGeometry, massFactor: 0.82, radius: 0.72, createColliders: knotColliders },
        { geometry: gearGeometry, massFactor: 1.18, radius: 0.62, createColliders: (scale) => [RAPIER.ColliderDesc.cylinder(0.135 * scale, 0.56 * scale)] },
      ]

      const world = new RAPIER.World({ x: 0, y: -1.45, z: 0 })
      world.timestep = FIXED_TIME_STEP
      world.numSolverIterations = compactViewport ? 5 : 7
      world.numInternalPgsIterations = 2
      world.maxCcdSubsteps = 2

      const parts: KineticPart[] = []
      const bounds = { x: 7, y: 4.2, z: 2.65 }
      let layoutSeed = 1729

      for (let index = 0; index < partCount; index += 1) {
        const spec = specs[(index * 7 + Math.floor(index / specs.length)) % specs.length]
        const scale = 0.48 + ((index * 37) % 10) * 0.045
        const colorIndex = (index * 3 + Math.floor(index / 5)) % materials.length
        const mesh = new THREE.Mesh(spec.geometry, materials[colorIndex])
        mesh.scale.setScalar(scale)
        mesh.userData.partIndex = index
        scene.add(mesh)

        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic()
            .setLinearDamping(0.38 + (index % 4) * 0.045)
            .setAngularDamping(0.3 + (index % 3) * 0.04)
            .setGravityScale(0.34 + (index % 5) * 0.055)
            .setCanSleep(false)
            .setCcdEnabled(index % 5 === 0),
        )
        body.setAdditionalSolverIterations(index % 7 === 0 ? 2 : 0)

        const colliderDescs = spec.createColliders(scale)
        const targetMass = (0.5 + scale * scale * scale * 2.25) * spec.massFactor
        colliderDescs.forEach((colliderDesc) => {
          colliderDesc
            .setMass(targetMass / colliderDescs.length)
            .setFriction(0.36)
            .setRestitution(0.72)
            .setContactSkin(0.012)
          world.createCollider(colliderDesc, body)
        })

        parts.push({
          body,
          colorIndex,
          mesh,
          radius: spec.radius * scale,
          scale,
          seed: index * 0.73 + 0.5,
        })
      }

      const scatterParts = () => {
        layoutSeed += 97
        const random = seededRandom(layoutSeed)
        const placed: Array<{ position: THREE.Vector3; radius: number }> = []

        parts.forEach((part, index) => {
          const candidate = new THREE.Vector3()
          let attempts = 0
          do {
            const angle = random() * Math.PI * 2
            const radius = 0.72 + Math.pow(random(), 0.68) * Math.min(bounds.x, bounds.y) * 0.92
            candidate.set(
              Math.cos(angle) * radius * (0.82 + random() * 0.44),
              Math.sin(angle) * radius * 0.84,
              (random() - 0.5) * bounds.z * 1.38,
            )
            attempts += 1
          } while (
            attempts < 22
            && placed.some((entry) => entry.position.distanceToSquared(candidate) < Math.pow((entry.radius + part.radius) * 0.72, 2))
          )
          placed.push({ position: candidate.clone(), radius: part.radius })

          const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            random() * Math.PI,
            random() * Math.PI,
            random() * Math.PI,
          ))
          part.body.resetForces(true)
          part.body.resetTorques(true)
          part.body.setTranslation({ x: candidate.x, y: candidate.y, z: candidate.z }, true)
          part.body.setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }, true)
          part.body.setLinvel({
            x: (random() - 0.5) * 1.35,
            y: (random() - 0.5) * 1.35,
            z: (random() - 0.5) * 0.72,
          }, true)
          part.body.setAngvel({
            x: (random() - 0.5) * 2.1,
            y: (random() - 0.5) * 2.1,
            z: (random() - 0.5) * 2.1 + index * 0.0015,
          }, true)
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
      let blastPulse = 0
      let draggingPart: KineticPart | null = null
      let dragDepth = 0
      let interactionTimer = 0

      const setInteraction = (name: 'idle' | 'blast' | 'color' | 'drag') => {
        root.dataset.interaction = name
        window.clearTimeout(interactionTimer)
        if (name === 'blast' || name === 'color') {
          interactionTimer = window.setTimeout(() => {
            if (!draggingPart) root.dataset.interaction = 'idle'
          }, 280)
        }
      }

      const mapPointerToWorld = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect()
        pointerNdc.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )
        raycaster.setFromCamera(pointerNdc, camera)
        previousPointerWorld.copy(pointerWorld)
        interactionPlane.constant = -(draggingPart ? dragDepth : 0)
        raycaster.ray.intersectPlane(interactionPlane, pointerWorld)
        if (previousPointerWorld.x < 50) {
          pointerSpeed = clamp(pointerWorld.distanceTo(previousPointerWorld) * 34, 0, 14)
        }
        pointerLight.position.set(pointerWorld.x, pointerWorld.y, 3)
      }

      const releaseDrag = (event?: PointerEvent) => {
        if (!draggingPart) return
        draggingPart = null
        root.dataset.dragging = 'false'
        setInteraction('idle')
        interactionPlane.constant = 0
        if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      }

      const onPointerMove = (event: PointerEvent) => {
        root.style.setProperty('--lusion-pointer-x', `${event.clientX}px`)
        root.style.setProperty('--lusion-pointer-y', `${event.clientY}px`)
        pointerActive = true
        mapPointerToWorld(event)
        if (draggingPart) setInteraction('drag')
      }
      const onPointerEnter = (event: PointerEvent) => {
        pointerActive = true
        mapPointerToWorld(event)
      }
      const onPointerLeave = () => {
        if (draggingPart) return
        pointerActive = false
        pointerSpeed = 0
      }
      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return
        pointerActive = true
        mapPointerToWorld(event)
        const hit = raycaster.intersectObjects(parts.map((part) => part.mesh), false)[0]
        const hitPart = typeof hit?.object.userData.partIndex === 'number'
          ? parts[hit.object.userData.partIndex as number]
          : undefined

        if (hitPart) {
          hitPart.colorIndex = (hitPart.colorIndex + 1 + Math.floor(Math.random() * (materials.length - 1))) % materials.length
          hitPart.mesh.material = materials[hitPart.colorIndex]
          hitPart.body.applyImpulseAtPoint(
            { x: pointerNdc.x * 0.16, y: pointerNdc.y * 0.16, z: -0.34 },
            hit?.point ?? hitPart.body.translation(),
            true,
          )
          hitPart.body.applyTorqueImpulse({ x: pointerNdc.y * 0.32, y: -pointerNdc.x * 0.32, z: 0.48 }, true)
          draggingPart = hitPart
          dragDepth = hitPart.body.translation().z
          root.dataset.dragging = 'true'
          setInteraction('color')
          canvas.setPointerCapture(event.pointerId)
          return
        }

        blastPulse = 1
        setInteraction('blast')
        parts.forEach((part) => {
          const position = part.body.translation()
          const dx = position.x - pointerWorld.x
          const dy = position.y - pointerWorld.y
          const dz = (position.z - pointerWorld.z) * 0.58
          const distance = Math.max(0.08, Math.hypot(dx, dy, dz))
          if (distance > 5.4) return
          const falloff = Math.pow(1 - distance / 5.4, 1.35)
          const impulse = falloff * (2.8 + part.body.mass() * 0.7)
          part.body.applyImpulse({
            x: (dx / distance) * impulse,
            y: (dy / distance) * impulse,
            z: (dz / distance) * impulse + 0.15 * falloff,
          }, true)
          part.body.applyTorqueImpulse({
            x: dy * falloff * 0.08,
            y: -dx * falloff * 0.08,
            z: (part.seed % 1 - 0.5) * falloff * 0.65,
          }, true)
        })
      }
      const onPointerUp = (event: PointerEvent) => releaseDrag(event)
      const onPointerCancel = (event: PointerEvent) => releaseDrag(event)

      canvas.addEventListener('pointermove', onPointerMove)
      canvas.addEventListener('pointerenter', onPointerEnter)
      canvas.addEventListener('pointerleave', onPointerLeave)
      canvas.addEventListener('pointerdown', onPointerDown)
      canvas.addEventListener('pointerup', onPointerUp)
      canvas.addEventListener('pointercancel', onPointerCancel)

      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const width = Math.max(1, Math.round(rect.width))
        const height = Math.max(1, Math.round(rect.height))
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()

        const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z
        bounds.y = visibleHeight * 0.4
        bounds.x = bounds.y * camera.aspect
      }
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas)
      resize()

      const applyFieldForces = (part: KineticPart, elapsed: number) => {
        const position = part.body.translation()
        const mass = part.body.mass()
        const distance = Math.max(0.18, Math.hypot(position.x, position.y, position.z * 1.28))
        const centreAcceleration = 0.52 + Math.min(distance, 8) * 0.17
        const centreForce = centreAcceleration * mass
        const inverseDistance = 1 / distance
        part.body.addForce({
          x: -position.x * inverseDistance * centreForce - position.y * mass * 0.035,
          y: -position.y * inverseDistance * centreForce + position.x * mass * 0.035 + Math.sin(elapsed * 0.55 + part.seed) * mass * 0.018,
          z: -position.z * mass * 1.2,
        }, true)

        const edgeX = Math.abs(position.x) - bounds.x
        const edgeY = Math.abs(position.y) - bounds.y
        const edgeZ = Math.abs(position.z) - bounds.z
        if (edgeX > -0.45) part.body.addForce({ x: -Math.sign(position.x) * Math.pow(edgeX + 0.48, 2) * 22 * mass, y: 0, z: 0 }, true)
        if (edgeY > -0.45) part.body.addForce({ x: 0, y: -Math.sign(position.y) * Math.pow(edgeY + 0.48, 2) * 22 * mass, z: 0 }, true)
        if (edgeZ > -0.4) part.body.addForce({ x: 0, y: 0, z: -Math.sign(position.z) * Math.pow(edgeZ + 0.42, 2) * 28 * mass }, true)

        if (pointerActive && !draggingPart) {
          const dx = position.x - pointerWorld.x
          const dy = position.y - pointerWorld.y
          const dz = (position.z - pointerWorld.z) * 0.52
          const pointerDistance = Math.max(0.08, Math.hypot(dx, dy, dz))
          if (pointerDistance < 2.85) {
            const falloff = Math.pow(1 - pointerDistance / 2.85, 1.6)
            const force = falloff * (8.5 + pointerSpeed * 0.9) * mass
            part.body.addForce({
              x: (dx / pointerDistance) * force,
              y: (dy / pointerDistance) * force,
              z: (dz / pointerDistance) * force,
            }, true)
            part.body.addTorque({ x: dy * falloff * 0.12, y: -dx * falloff * 0.12, z: 0.04 * mass }, true)
          }
        }
      }

      const applyDragForce = () => {
        if (!draggingPart) return
        const body = draggingPart.body
        const position = body.translation()
        const velocity = body.linvel()
        const mass = body.mass()
        let fx = (pointerWorld.x - position.x) * 31 * mass - velocity.x * 7.2 * mass
        let fy = (pointerWorld.y - position.y) * 31 * mass - velocity.y * 7.2 * mass
        let fz = (dragDepth - position.z) * 38 * mass - velocity.z * 7.8 * mass
        const magnitude = Math.hypot(fx, fy, fz)
        const maximum = 92 * mass
        if (magnitude > maximum) {
          const scale = maximum / magnitude
          fx *= scale
          fy *= scale
          fz *= scale
        }
        body.addForce({ x: fx, y: fy, z: fz }, true)
        body.addTorque({ x: -velocity.y * 0.18, y: velocity.x * 0.18, z: pointerSpeed * 0.025 }, true)
      }

      const syncMeshes = () => {
        parts.forEach((part) => {
          const position = part.body.translation()
          const rotation = part.body.rotation()
          const velocity = part.body.linvel()
          const angularVelocity = part.body.angvel()
          const speed = Math.hypot(velocity.x, velocity.y, velocity.z)
          const angularSpeed = Math.hypot(angularVelocity.x, angularVelocity.y, angularVelocity.z)
          if (speed > 10.5) {
            const scale = 10.5 / speed
            part.body.setLinvel({ x: velocity.x * scale, y: velocity.y * scale, z: velocity.z * scale }, false)
          }
          if (angularSpeed > 9) {
            const scale = 9 / angularSpeed
            part.body.setAngvel({ x: angularVelocity.x * scale, y: angularVelocity.y * scale, z: angularVelocity.z * scale }, false)
          }
          part.mesh.position.set(position.x, position.y, position.z)
          part.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
        })
      }

      let lastTime = performance.now()
      let accumulator = 0
      let frameId = 0
      let running = !document.hidden
      let qualityFrames = 0
      let qualityElapsed = 0

      const animate = (now: number) => {
        frameId = window.requestAnimationFrame(animate)
        if (!running) return

        const frameTime = Math.min((now - lastTime) / 1000, 0.05)
        lastTime = now
        accumulator += frameTime
        const elapsed = now / 1000
        let steps = 0
        while (accumulator >= FIXED_TIME_STEP && steps < MAX_PHYSICS_STEPS) {
          parts.forEach((part) => applyFieldForces(part, elapsed))
          applyDragForce()
          world.step()
          accumulator -= FIXED_TIME_STEP
          steps += 1
        }
        if (steps === MAX_PHYSICS_STEPS) accumulator = 0

        syncMeshes()
        blastPulse = Math.max(0, blastPulse - frameTime * 3.5)
        pointerSpeed *= Math.exp(-frameTime * 8)
        pointerLight.intensity = 25 + pointerSpeed * 1.25 + blastPulse * 42
        camera.position.x += ((pointerActive ? pointerNdc.x * 0.24 : 0) - camera.position.x) * frameTime * 1.35
        camera.position.y += ((pointerActive ? pointerNdc.y * 0.18 : 0) - camera.position.y) * frameTime * 1.35
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)

        qualityFrames += 1
        qualityElapsed += frameTime
        if (qualityElapsed >= 4) {
          const framesPerSecond = qualityFrames / qualityElapsed
          if (framesPerSecond < 44 && pixelRatio > 1) {
            pixelRatio = 1
            renderer.setPixelRatio(pixelRatio)
            root.dataset.quality = 'balanced'
            resize()
          }
          qualityFrames = 0
          qualityElapsed = 0
        }
      }

      const onVisibilityChange = () => {
        running = !document.hidden
        lastTime = performance.now()
        accumulator = 0
      }
      document.addEventListener('visibilitychange', onVisibilityChange)
      setStatus('ready')
      root.dataset.partCount = String(partCount)
      root.dataset.dragging = 'false'
      root.dataset.interaction = 'idle'
      frameId = window.requestAnimationFrame(animate)

      const onContextLost = (event: Event) => {
        event.preventDefault()
        setStatus('unavailable')
      }
      canvas.addEventListener('webglcontextlost', onContextLost)

      return () => {
        window.cancelAnimationFrame(frameId)
        window.clearTimeout(interactionTimer)
        resizeObserver.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        canvas.removeEventListener('pointermove', onPointerMove)
        canvas.removeEventListener('pointerenter', onPointerEnter)
        canvas.removeEventListener('pointerleave', onPointerLeave)
        canvas.removeEventListener('pointerdown', onPointerDown)
        canvas.removeEventListener('pointerup', onPointerUp)
        canvas.removeEventListener('pointercancel', onPointerCancel)
        canvas.removeEventListener('webglcontextlost', onContextLost)
        resetRef.current = () => undefined
        parts.forEach((part) => scene.remove(part.mesh))
        geometries.forEach((geometry) => geometry.dispose())
        materials.forEach((material) => material.dispose())
        world.free()
        environmentTarget.dispose()
        environmentScene.dispose()
        pmremGenerator.dispose()
        renderer.dispose()
      }
    }

    void initialise()

    return () => {
      disposed = true
      disposeRuntime()
    }
  }, [])

  return (
    <section
      aria-label="仿 Lusion 动效实验"
      className="lusion-study"
      data-dragging="false"
      data-interaction="idle"
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
        <canvas aria-label="可变色、拖动和碰撞的三维零件力场" ref={canvasRef} />
        {status === 'loading' && <div className="lusion-study-state">正在装配刚体世界…</div>}
        {status === 'unavailable' && (
          <div className="lusion-study-fallback">
            <strong>当前设备无法启动 WebGL</strong>
            <button onClick={onBack} type="button">返回实验室</button>
          </div>
        )}

        <div className="lusion-study-caption">
          <span>REALTIME / THREE.JS + RAPIER</span>
          <strong>KINETIC<br />PARTS</strong>
        </div>

        <div className="lusion-study-index" aria-label="仿 Lusion 实验列表">
          <div className="is-active"><span>01</span><strong>零件力场</strong><i>V2 运行中</i></div>
          <div><span>02</span><strong>滚动航行</strong><i>下一步</i></div>
        </div>
      </div>

      <footer className="lusion-study-footer">
        <span>点击零件变色 · 按住拖动 · 点击空白释放冲击</span>
        <button onClick={() => resetRef.current()} type="button">重新散开</button>
      </footer>

      <div className="lusion-study-cursor" aria-hidden="true"><i /></div>
    </section>
  )
}
