import { useCallback, useState, type PointerEvent, type WheelEvent } from 'react'
import ArtifactScene from './ArtifactScene'
import './ArtifactLab.css'

type PointerVector = {
  x: number
  y: number
}

type DebugState = {
  depth: number
  drag: number
  hover: number
}

const initialDebug: DebugState = {
  depth: 0,
  drag: 0,
  hover: 0,
}

function normalizePointer(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
    y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
  }
}

export default function ArtifactLab() {
  const [hover, setHover] = useState<PointerVector>({ x: 0, y: 0 })
  const [scrollDepth, setScrollDepth] = useState(0.28)
  const [debug, setDebug] = useState<DebugState>(initialDebug)

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    setHover(normalizePointer(event))
  }

  const handlePointerLeave = () => {
    setHover({ x: 0, y: 0 })
  }

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    event.preventDefault()
    const nextDepth = Math.min(1, Math.max(0, scrollDepth + event.deltaY * 0.0008))
    setScrollDepth(nextDepth)
  }

  const handleDebugChange = useCallback((nextDebug: DebugState) => {
    setDebug(nextDebug)
  }, [])

  return (
    <section
      className="artifact-lab"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
    >
      <div className="artifact-lab-field" aria-hidden="true" />
      <ArtifactScene hover={hover} scrollDepth={scrollDepth} onDebugChange={handleDebugChange} />
      <div className="artifact-lab-title">
        <span>SAKURA1TAP ARTIFACT</span>
        <strong>DIGITAL ARTIFACT LOOKDEV</strong>
      </div>
      <div className="artifact-lab-prompt">DRAG / SCROLL / MOVE</div>
      <div className="artifact-lab-debug" aria-live="off">
        <span>depth {debug.depth.toFixed(2)}</span>
        <span>drag {debug.drag.toFixed(2)}</span>
        <span>hover {debug.hover.toFixed(2)}</span>
      </div>
    </section>
  )
}
