import { useEffect, useRef } from "react";

/**
 * Site cursor for the homepage.
 *
 * `body.cinematic-mode` hides the system cursor, so this has to do the whole job:
 *   - an exact dot for pointing accuracy (a trailing ring alone gives no anchor),
 *   - a ring that trails on a spring so movement reads as fluid rather than snapped,
 *   - a halo that breathes around the ring, which is what makes the pointer feel lit
 *     rather than drawn,
 *   - a label on interactive elements, so you can tell what is clickable beforehand.
 *
 * Ring / halo / label are DOM nodes so the label can be real text and the whole thing
 * stays crisp at any device pixel ratio; the motion trail lives in the shared canvas
 * layer (CursorRipple) so a fast pointer can leave a streak without spawning nodes.
 *
 * Only mounted for fine pointers; otherwise the system cursor is left alone by CSS.
 */
type HoverCopy = { label: string }

// Exponential smoothing rates in "1 / seconds". The spring is frame-rate independent:
// a 60 Hz and a 144 Hz display produce the same trajectory, which a per-frame
// `x += (target - x) * ease` lerp does not (it converges faster on high refresh screens).
const RING_RATE = 10.5
const DOT_RATE = 44
const HALO_RATE = 5.2
// A hovered element pulls the ring toward its centre so small targets feel caught.
// The trigger radius scales with the target instead of being fixed: on a 737px-wide link a
// wide radius would teleport the ring across the screen, while on a small button it would
// never engage at all.
const MAGNET_STRENGTH = 38
const MAGNET_MAX = 30
const MAGNET_MIN_RANGE = 96
const MAGNET_MAX_RANGE = 190
const IDLE_HIDE_MS = 2400

export default function CinematicCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const halo = haloRef.current
    const label = labelRef.current
    if (!dot || !ring || !halo || !label) return

    const finePointer = window.matchMedia("(pointer: fine)").matches
    if (!finePointer) return

    // The system cursor is hidden by `body.cinematic-mode`, so this still has to draw a
    // pointer for these visitors — but it must not animate. Lag, magnet and the halo are
    // all motion, so they collapse: the ring sits exactly on the pointer.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) halo.hidden = true

    let frame = 0
    let disposed = false
    let idleTimer = 0
    let hover: HoverCopy | null = null

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ringPoint = { ...target }
    const dotPoint = { ...target }
    const haloPoint = { ...target }
    let magnet = { x: 0, y: 0 }
    let pressed = false
    let dragging = false
    let lastTime = performance.now()
    // Visibility is owned here rather than by a timer callback, so a `setTimeout` that
    // fires after a fresh pointermove cannot hide a cursor that just came back.
    let visible = false
    // Last values actually written to the DOM. Writing identical transforms every frame
    // forces style recalculation for nothing, and the label is a text node update.
    let painted = { hovering: false, label: "", pressed: false, dragging: false }

    const applyTransforms = () => {
      dot.style.transform = `translate3d(${dotPoint.x.toFixed(2)}px, ${dotPoint.y.toFixed(2)}px, 0)`
      ring.style.transform = `translate3d(${ringPoint.x.toFixed(2)}px, ${ringPoint.y.toFixed(2)}px, 0)`
      halo.style.transform = `translate3d(${haloPoint.x.toFixed(2)}px, ${haloPoint.y.toFixed(2)}px, 0)`
    }

    /** Writes the state attributes, skipping any that already match the DOM. */
    const applyState = () => {
      const hovering = hover !== null
      const nextLabel = hover?.label ?? ""
      if (painted.hovering !== hovering) {
        ring.dataset.hover = String(hovering)
        painted.hovering = hovering
      }
      if (painted.pressed !== pressed) {
        ring.dataset.pressed = String(pressed)
        painted.pressed = pressed
      }
      if (painted.dragging !== dragging) {
        ring.dataset.dragging = String(dragging)
        painted.dragging = dragging
      }
      if (painted.label !== nextLabel) {
        label.textContent = nextLabel
        painted.label = nextLabel
      }
    }

    const setVisible = (next: boolean) => {
      if (visible === next) return
      visible = next
      const flag = String(next)
      dot.dataset.visible = flag
      ring.dataset.visible = flag
      halo.dataset.visible = flag
    }

    const reveal = () => {
      setVisible(true)
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setVisible(false), IDLE_HIDE_MS)
    }

    const textFor = (node: EventTarget | null): HoverCopy | null => {
      // pointermove can arrive with a non-Element target (window/document, synthetic
      // events). Calling .closest on it would throw, and the throw would land before the
      // cursor is revealed — leaving the site with no pointer at all.
      if (!(node instanceof Element)) return null
      const interactive = node.closest<HTMLElement>("a, button, [role='button']")
      if (!interactive) return null
      const explicit = interactive.dataset.cursor
      if (explicit) return { label: explicit }
      const text = (interactive.getAttribute("aria-label") || interactive.textContent || "").trim()
      if (!text) return { label: "打开" }
      return { label: text.length > 8 ? `${text.slice(0, 8)}…` : text }
    }

    // Hit testing runs inside the animation frame instead of on every pointermove, so a
    // fast flick does not trigger one forced layout per event.
    const sampleHover = () => {
      const node = document.elementFromPoint(target.x, target.y)
      // The label is information, not decoration, so it survives reduced motion.
      hover = textFor(node)
      // Magnetism is motion; under reduced motion the ring stays on the pointer.
      if (reducedMotion || !hover || !(node instanceof Element)) {
        magnet = { x: 0, y: 0 }
        return
      }
      const box = node.closest<HTMLElement>("a, button, [role='button']")!.getBoundingClientRect()
      const offsetX = box.left + box.width / 2 - target.x
      const offsetY = box.top + box.height / 2 - target.y
      const distance = Math.hypot(offsetX, offsetY)
      // Half the target's diagonal is the distance from its centre to the pointer while the
      // pointer is on the edge, so the pull stays proportional however large the target is.
      const reach = Math.min(MAGNET_MAX_RANGE, Math.max(MAGNET_MIN_RANGE, Math.hypot(box.width, box.height) / 2))
      if (distance > reach) {
        magnet = { x: 0, y: 0 }
        return
      }
      // Ease the pull in from the edge so the ring is captured instead of snapping.
      const falloff = 1 - distance / reach
      const pull = (MAGNET_STRENGTH / 100) * falloff
      magnet = { x: offsetX * pull, y: offsetY * pull }
      const length = Math.hypot(magnet.x, magnet.y)
      if (length > MAGNET_MAX) {
        magnet = { x: (magnet.x / length) * MAGNET_MAX, y: (magnet.y / length) * MAGNET_MAX }
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!event.isPrimary) return
      target.x = event.clientX
      target.y = event.clientY
      dragging = Boolean(document.documentElement.dataset.dragging)
      reveal()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return
      pressed = true
      applyState()
    }
    const onPointerUp = () => { pressed = false; applyState() }
    const onLeave = () => setVisible(false)

    const tick = (time: number) => {
      if (disposed) return
      // Clamped so a backgrounded tab does not teleport the ring on its first frame back.
      const dt = Math.min(0.05, Math.max(0, (time - lastTime) / 1000))
      lastTime = time

      sampleHover()

      const ringEase = reducedMotion ? 1 : 1 - Math.exp(-RING_RATE * dt)
      const dotEase = reducedMotion ? 1 : 1 - Math.exp(-DOT_RATE * dt)
      const haloEase = 1 - Math.exp(-HALO_RATE * dt)

      dotPoint.x += (target.x - dotPoint.x) * dotEase
      dotPoint.y += (target.y - dotPoint.y) * dotEase
      ringPoint.x += (target.x + magnet.x - ringPoint.x) * ringEase
      ringPoint.y += (target.y + magnet.y - ringPoint.y) * ringEase
      haloPoint.x += (ringPoint.x - haloPoint.x) * haloEase
      haloPoint.y += (ringPoint.y - haloPoint.y) * haloEase

      applyTransforms()
      applyState()
      frame = window.requestAnimationFrame(tick)
    }

    applyTransforms()
    applyState()
    setVisible(false)
    frame = window.requestAnimationFrame(tick)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    document.documentElement.addEventListener("mouseleave", onLeave)
    window.addEventListener("blur", onLeave)

    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      window.clearTimeout(idleTimer)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
      document.documentElement.removeEventListener("mouseleave", onLeave)
      window.removeEventListener("blur", onLeave)
    }
  }, [])

  return (
    <div className="cinematic-cursor" aria-hidden="true">
      <div className="cinematic-cursor-halo" ref={haloRef} />
      <div className="cinematic-cursor-ring" ref={ringRef}>
        <span className="cinematic-cursor-label" ref={labelRef} />
      </div>
      <div className="cinematic-cursor-dot" ref={dotRef} />
    </div>
  )
}
