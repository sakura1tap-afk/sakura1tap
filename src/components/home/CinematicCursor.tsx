import { useEffect, useRef } from "react";

/**
 * Site cursor for the homepage.
 *
 * `body.cinematic-mode` hides the system cursor, so this has to do the whole job:
 *   - an exact dot for pointing accuracy (the old 34px ring alone gave no anchor),
 *   - a ring that trails on a spring so movement reads as fluid rather than snapped,
 *   - a label on interactive elements, so you can tell what is clickable before clicking.
 *
 * The ring/dot are DOM nodes rather than canvas so the label can be real text and the
 * whole thing stays crisp at any device pixel ratio. Only mounted for fine pointers with
 * motion allowed; otherwise the system cursor is left alone by CSS.
 */
type HoverCopy = { label: string }

const RING_EASE = 0.16
const DOT_EASE = 0.55
const IDLE_HIDE_MS = 2400

export default function CinematicCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const label = labelRef.current
    if (!dot || !ring || !label) return

    const finePointer = window.matchMedia("(pointer: fine)").matches
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!finePointer) return

    let frame = 0
    let disposed = false
    let idleTimer = 0
    let hover: HoverCopy | null = null

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ringPoint = { ...target }
    const dotPoint = { ...target }
    let pressed = false
    let dragging = false

    const applyState = () => {
      dot.style.transform = `translate3d(${dotPoint.x}px, ${dotPoint.y}px, 0)`
      ring.style.transform = `translate3d(${ringPoint.x}px, ${ringPoint.y}px, 0)`
      ring.dataset.hover = hover ? "true" : "false"
      ring.dataset.pressed = pressed ? "true" : "false"
      ring.dataset.dragging = dragging ? "true" : "false"
      label.textContent = hover?.label ?? ""
    }

    const reveal = () => {
      dot.dataset.visible = "true"
      ring.dataset.visible = "true"
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        dot.dataset.visible = "false"
        ring.dataset.visible = "false"
      }, IDLE_HIDE_MS)
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

    const onPointerMove = (event: PointerEvent) => {
      if (!event.isPrimary) return
      target.x = event.clientX
      target.y = event.clientY
      dragging = Boolean(document.documentElement.dataset.dragging)
      reveal()
      hover = textFor(event.target)
      applyState()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return
      pressed = true
      applyState()
    }
    const onPointerUp = () => { pressed = false; applyState() }
    const onLeave = () => {
      dot.dataset.visible = "false"
      ring.dataset.visible = "false"
    }

    const tick = () => {
      if (disposed) return
      const ease = reducedMotion ? 1 : RING_EASE
      ringPoint.x += (target.x - ringPoint.x) * ease
      ringPoint.y += (target.y - ringPoint.y) * ease
      dotPoint.x += (target.x - dotPoint.x) * DOT_EASE
      dotPoint.y += (target.y - dotPoint.y) * DOT_EASE
      applyState()
      frame = window.requestAnimationFrame(tick)
    }

    applyState()
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
      <div className="cinematic-cursor-ring" ref={ringRef}>
        <span className="cinematic-cursor-label" ref={labelRef} />
      </div>
      <div className="cinematic-cursor-dot" ref={dotRef} />
    </div>
  )
}
