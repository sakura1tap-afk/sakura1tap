import { useEffect, useRef } from "react";

/**
 * Cursor ripple layer: expanding rings that bloom where the pointer travels and a
 * brighter ring on click, plus a soft ember core that trails the cursor.
 *
 * Drawn on its own 2D canvas instead of DOM nodes so a fast pointer can spawn dozens
 * of ripples per second without touching layout. Skipped entirely for coarse pointers
 * and for `prefers-reduced-motion`.
 */
type Ripple = {
  born: number
  life: number
  radius: number
  strength: number
  x: number
  y: number
}

const MOVE_TRIGGER_DISTANCE = 46
const MAX_RIPPLES = 26
const CORE_EASE = 0.18

export default function CursorRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const finePointer = window.matchMedia("(pointer: fine)").matches
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!finePointer || reducedMotion) return

    const context = canvas.getContext("2d")
    if (!context) return

    let frame = 0
    let disposed = false
    let width = 0
    let height = 0
    let dpr = 1

    const ripples: Ripple[] = []
    const pointer = { x: 0, y: 0 }
    const core = { x: 0, y: 0, visible: 0 }
    let lastSpawn = { x: -999, y: -999 }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (x: number, y: number, strength: number) => {
      ripples.push({ born: performance.now(), life: 1150, radius: 6, strength, x, y })
      if (ripples.length > MAX_RIPPLES) ripples.shift()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!event.isPrimary) return
      pointer.x = event.clientX
      pointer.y = event.clientY
      core.visible = 1
      const distance = Math.hypot(event.clientX - lastSpawn.x, event.clientY - lastSpawn.y)
      if (distance < MOVE_TRIGGER_DISTANCE) return
      lastSpawn = { x: event.clientX, y: event.clientY }
      spawn(event.clientX, event.clientY, 0.55)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || (event.target as HTMLElement | null)?.closest("a, button, input")) return
      spawn(event.clientX, event.clientY, 1)
    }

    const onLeave = () => { core.visible = 0 }

    const render = (now: number) => {
      if (disposed) return
      context.clearRect(0, 0, width, height)

      // trailing core
      core.x += (pointer.x - core.x) * CORE_EASE
      core.y += (pointer.y - core.y) * CORE_EASE
      if (core.visible > 0.01) {
        const glow = context.createRadialGradient(core.x, core.y, 0, core.x, core.y, 90)
        glow.addColorStop(0, `rgba(240, 173, 112, ${0.1 * core.visible})`)
        glow.addColorStop(0.45, `rgba(137, 200, 208, ${0.05 * core.visible})`)
        glow.addColorStop(1, "rgba(137, 200, 208, 0)")
        context.fillStyle = glow
        context.fillRect(core.x - 90, core.y - 90, 180, 180)
      }

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index]
        const age = (now - ripple.born) / ripple.life
        if (age >= 1) { ripples.splice(index, 1); continue }
        const eased = 1 - Math.pow(1 - age, 3)
        const radius = ripple.radius + eased * 96
        const alpha = (1 - age) * (1 - age) * ripple.strength
        if (alpha < 0.01) continue

        context.beginPath()
        context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2)
        context.strokeStyle = `rgba(240, 173, 112, ${alpha * 0.5})`
        context.lineWidth = 1.1
        context.stroke()

        context.beginPath()
        context.arc(ripple.x, ripple.y, radius * 0.72, 0, Math.PI * 2)
        context.strokeStyle = `rgba(137, 200, 208, ${alpha * 0.32})`
        context.lineWidth = 0.8
        context.stroke()
      }

      frame = window.requestAnimationFrame(render)
    }

    resize()
    window.addEventListener("resize", resize, { passive: true })
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown)
    document.documentElement.addEventListener("mouseleave", onLeave)
    window.addEventListener("blur", onLeave)
    frame = window.requestAnimationFrame(render)

    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      document.documentElement.removeEventListener("mouseleave", onLeave)
      window.removeEventListener("blur", onLeave)
    }
  }, [])

  return <canvas className="cursor-ripple" ref={canvasRef} aria-hidden="true" />
}
