import { lazy, type ReactNode, Suspense, useRef } from 'react'
import type { SectionKey } from '../../data/mainSections'

const MainMotionController = lazy(() => import('./MainMotionController'))

type MainMotionLayerProps = {
  active: SectionKey
  children: ReactNode
  nodeOpen: boolean
  wheelDirection: 'next' | 'prev' | null
}

export default function MainMotionLayer({ active, children, nodeOpen, wheelDirection }: MainMotionLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="main-motion-layer"
      data-active={active}
      data-node-open={nodeOpen}
      ref={rootRef}
    >
      <div className="main-ink-film" aria-hidden="true" />
      <div className="main-motion-scan" aria-hidden="true" />
      <Suspense fallback={null}>
        <MainMotionController
          active={active}
          nodeOpen={nodeOpen}
          rootRef={rootRef}
          wheelDirection={wheelDirection}
        />
      </Suspense>
      {children}
    </div>
  )
}
