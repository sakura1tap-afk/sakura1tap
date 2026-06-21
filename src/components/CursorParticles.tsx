import { useEffect, useRef } from 'react'

type CursorParticlesProps = {
  isEntering: boolean
}

type Particle = {
  age: number
  life: number
  size: number
  vx: number
  vy: number
  x: number
  y: number
}

type Firefly = {
  alpha: number
  delay: number
  drift: number
  orbitX: number
  orbitY: number
  phase: number
  px: number
  py: number
  size: number
  speed: number
  vx: number
  vy: number
  x: number
  y: number
}

const MAX_SPARKS = 32
const FIREFLY_COUNT = 9
const GATE_X = 0.596
const GATE_Y = 0.545

export default function CursorParticles({ isEntering }: CursorParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const enteringRef = useRef(isEntering)

  useEffect(() => {
    enteringRef.current = isEntering
  }, [isEntering])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return undefined

    let animationFrame = 0
    let lastTime = performance.now()
    let pointerActive = false
    const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }
    const sparks: Particle[] = []
    const fireflies: Firefly[] = Array.from({ length: FIREFLY_COUNT }, (_, index) => ({
      alpha: 0.42 + Math.random() * 0.36,
      delay: index / Math.max(1, FIREFLY_COUNT - 1),
      drift: 0.7 + Math.random() * 1.4,
      orbitX: (Math.random() - 0.5) * 96,
      orbitY: (Math.random() - 0.5) * 72,
      phase: Math.random() * Math.PI * 2,
      px: window.innerWidth * (0.46 + Math.random() * 0.08),
      py: window.innerHeight * (0.52 + Math.random() * 0.08),
      size: 1.2 + Math.random() * 2.4,
      speed: 0.032 + Math.random() * 0.07,
      vx: 0,
      vy: 0,
      x: window.innerWidth * (0.46 + Math.random() * 0.08),
      y: window.innerHeight * (0.52 + Math.random() * 0.08),
    }))

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, window.innerWidth)
      const height = Math.max(1, window.innerHeight)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const addParticle = (x: number, y: number, burst = false) => {
      if (sparks.length >= MAX_SPARKS) sparks.shift()

      const angle = Math.random() * Math.PI * 2
      const speed = burst ? 0.9 + Math.random() * 1.6 : 0.16 + Math.random() * 0.38
      sparks.push({
        age: 0,
        life: burst ? 0.62 + Math.random() * 0.28 : 0.55 + Math.random() * 0.38,
        size: burst ? 0.9 + Math.random() * 1.8 : 0.55 + Math.random() * 1.1,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (burst ? 0.4 : 0),
        x: x + (Math.random() - 0.5) * (burst ? 18 : 7),
        y: y + (Math.random() - 0.5) * (burst ? 18 : 7),
      })
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerActive = true
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    const handlePointerDown = (event: PointerEvent) => {
      for (let index = 0; index < 12; index += 1) addParticle(event.clientX, event.clientY, true)
    }

    const draw = (time: number) => {
      const delta = Math.min(0.033, Math.max(0.001, (time - lastTime) / 1000))
      lastTime = time

      const width = window.innerWidth
      const height = window.innerHeight
      const gateX = width * GATE_X
      const gateY = height * GATE_Y

      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      const entering = enteringRef.current

      if (entering) {
        for (let index = 0; index < 2; index += 1) addParticle(gateX, gateY, true)
      }

      fireflies.forEach((firefly, index) => {
        const timeSeconds = time / 1000
        const idleX = gateX + Math.cos(timeSeconds * 0.42 + firefly.phase) * (42 + index * 3)
        const idleY = gateY + Math.sin(timeSeconds * 0.48 + firefly.phase) * (18 + index * 2)
        const trailAngle = timeSeconds * firefly.drift + firefly.phase
        const orbitBreath = 0.68 + Math.sin(timeSeconds * 0.9 + firefly.phase) * 0.18
        const scatterX = Math.cos(trailAngle) * firefly.orbitX * orbitBreath
        const scatterY = Math.sin(trailAngle * 1.27) * firefly.orbitY * orbitBreath
        const lagAngle = firefly.phase + timeSeconds * 0.22
        const lagDistance = 10 + firefly.delay * 34
        const targetX = entering ? gateX : pointerActive ? pointer.x + scatterX - Math.cos(lagAngle) * lagDistance : idleX
        const targetY = entering ? gateY : pointerActive ? pointer.y + scatterY - Math.sin(lagAngle) * lagDistance : idleY
        const ease = entering ? 0.095 : firefly.speed

        firefly.px = firefly.x
        firefly.py = firefly.y
        firefly.vx += (targetX - firefly.x) * ease
        firefly.vy += (targetY - firefly.y) * ease
        firefly.vx += Math.cos(timeSeconds * 1.7 + firefly.phase) * 0.018
        firefly.vy += Math.sin(timeSeconds * 1.55 + firefly.phase) * 0.018
        firefly.vx *= 0.74
        firefly.vy *= 0.74
        firefly.x += firefly.vx
        firefly.y += firefly.vy

        const pulse = 0.58 + Math.sin(timeSeconds * 2.3 + firefly.phase) * 0.22
        const alpha = firefly.alpha * pulse * (entering ? 1.25 : 1)
        const radius = firefly.size * (entering ? 1.55 : 1)
        const gradient = context.createRadialGradient(firefly.x, firefly.y, 0, firefly.x, firefly.y, radius * 8)
        gradient.addColorStop(0, `rgba(255, 252, 226, ${alpha})`)
        gradient.addColorStop(0.22, `rgba(255, 224, 139, ${alpha * 0.42})`)
        gradient.addColorStop(1, 'rgba(255, 190, 90, 0)')

        context.strokeStyle = `rgba(255, 226, 144, ${alpha * 0.16})`
        context.lineWidth = Math.max(0.6, radius * 0.8)
        context.beginPath()
        context.moveTo(firefly.px, firefly.py)
        context.lineTo(firefly.x, firefly.y)
        context.stroke()

        context.fillStyle = gradient
        context.beginPath()
        context.arc(firefly.x, firefly.y, radius * 8, 0, Math.PI * 2)
        context.fill()
      })

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const particle = sparks[index]
        particle.age += delta

        if (particle.age >= particle.life) {
          sparks.splice(index, 1)
          continue
        }

        const pullStrength = entering ? 0.1 : 0.012
        particle.vx += (gateX - particle.x) * pullStrength * delta
        particle.vy += (gateY - particle.y) * pullStrength * delta
        particle.vx *= 0.988
        particle.vy *= 0.988
        particle.x += particle.vx * 60 * delta
        particle.y += particle.vy * 60 * delta

        const progress = particle.age / particle.life
        const alpha = Math.sin(progress * Math.PI) * (entering ? 0.82 : 0.58)
        const radius = particle.size * (1 + progress * 1.7)
        const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 5.4)
        gradient.addColorStop(0, `rgba(255, 248, 218, ${alpha})`)
        gradient.addColorStop(0.28, `rgba(255, 214, 125, ${alpha * 0.36})`)
        gradient.addColorStop(1, 'rgba(255, 185, 80, 0)')

        context.fillStyle = gradient
        context.beginPath()
        context.arc(particle.x, particle.y, radius * 5.4, 0, Math.PI * 2)
        context.fill()
      }

      animationFrame = window.requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerdown', handlePointerDown)
    animationFrame = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  return <canvas aria-hidden="true" className="cursor-particles" data-entering={isEntering ? 'true' : 'false'} ref={canvasRef} />
}
