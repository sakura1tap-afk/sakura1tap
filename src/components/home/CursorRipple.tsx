import { useEffect, useRef } from "react";

/**
 * Cursor FX layer for the homepage: a speed-reactive motion trail, expanding rings that
 * bloom where the pointer travels, a brighter ring on click, and a soft ember core.
 *
 * Drawn on its own 2D canvas instead of DOM nodes so a fast pointer can spawn dozens of
 * ripples per second without touching layout. Skipped entirely for coarse pointers.
 *
 * Colour comes from CSS (`--ember` / `--ice`, the act accent tokens) instead of hardcoded
 * rgb, so the trail takes on each act's tone. The stage backdrop is a fixed night scene
 * throughout, so the `screen` blend this layer relies on always has dark ground.
 */

type Ripple = {
  born: number
  life: number
  radius: number
  strength: number
  x: number
  y: number
}

type Palette = { ember: string; ice: string }

// Exponential smoothing rates in "1 / seconds", so the trail converges identically at
// 60 Hz and 144 Hz.
const CORE_RATE = 12
const TRAIL_RATE = 16
const TRAIL_NODES = 3
// The trail draws only the distance the pointer actually covered: a fast flick leaves a
// long streak, a slow drift leaves almost none.
const TRAIL_FADE_PER_PX = 0.018
const MOVE_TRIGGER_DISTANCE = 46
const MAX_RIPPLES = 26

/** Parses `rgb()` / `rgba()` into a usable triple; returns null for anything else. */
function parseColor(value: string): [number, number, number] | null {
  const match = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function rgba(color: [number, number, number], alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

export default function CursorRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const finePointer = window.matchMedia("(pointer: fine)").matches
    if (!finePointer) return

    const context = canvas.getContext("2d")
    if (!context) return

    let frame = 0
    let disposed = false
    let width = 0
    let height = 0
    let dpr = 2

    const ripples: Ripple[] = []
    const pointer = { x: 0, y: 0 }
    const core = { x: 0, y: 0, visible: 0 }
    let lastSpawn = { x: -999, y: -999 }
    let moving = false
    let lastTime = performance.now()
    let palette: Palette = { ember: "#f0ad70", ice: "#89c8d0" }
    let accent: [number, number, number] = [240, 173, 112]
    let cool: [number, number, number] = [137, 200, 208]

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Re-resolved on every frame so `data-scene` changes cost nothing extra: the accent
    // is whatever the act's own tokens say it is.
    const syncPalette = () => {
      const styles = getComputedStyle(document.documentElement)
      const nextEmber = styles.getPropertyValue("--ember").trim()
      const nextIce = styles.getPropertyValue("--ice").trim()
      if (!nextEmber || !nextIce) return
      if (nextEmber === palette.ember && nextIce === palette.ice) return
      palette = { ember: nextEmber, ice: nextIce }
      const parsedEmber = parseColor(nextEmber)
      const parsedIce = parseColor(nextIce)
      if (parsedEmber) accent = parsedEmber
      if (parsedIce) cool = parsedIce
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
      moving = true
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
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000))
      lastTime = now
      context.clearRect(0, 0, width, height)
      syncPalette()

      const ember = accent
      const ice = cool

      const coreEase = 1 - Math.exp(-CORE_RATE * dt)
      core.x += (pointer.x - core.x) * coreEase
      core.y += (pointer.y - core.y) * coreEase

      if (core.visible > 0.01) {
        const glow = context.createRadialGradient(core.x, core.y, 0, core.x, core.y, 90)
        glow.addColorStop(0, rgba(ember, 0.1 * core.visible))
        glow.addColorStop(0.45, rgba(ice, 0.05 * core.visible))
        glow.addColorStop(1, rgba(ice, 0))
        context.fillStyle = glow
        context.fillRect(core.x - 90, core.y - 90, 180, 180)
      }

      // Motion trail: node k sits k/TRAIL_NODES of the way back toward the core.
      if (moving && core.visible > 0.01) {
        const dx = core.x - pointer.x
        const dy = core.y - pointer.y
        const lag = Math.hypot(dx, dy)
        const baseAlpha = Math.min(0.5, lag * TRAIL_FADE_PER_PX) * core.visible
        if (baseAlpha > 0.012) {
          for (let node = TRAIL_NODES; node >= 1; node -= 1) {
            const t = node / TRAIL_NODES
            const alpha = baseAlpha * (1 - t) * (1 - t)
            if (alpha < 0.01) continue
            context.beginPath()
            context.arc(pointer.x + dx * t, pointer.y + dy * t, 3.1 * (1 - t * 0.7), 0, Math.PI * 2)
            context.fillStyle = rgba(ember, alpha)
            context.fill()
          }
        }
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
        context.strokeStyle = rgba(ember, alpha * 0.5)
        context.lineWidth = 1.1
        context.stroke()

        context.beginPath()
        context.arc(ripple.x, ripple.y, radius * 0.72, 0, Math.PI * 2)
        context.strokeStyle = rgba(ice, alpha * 0.32)
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
