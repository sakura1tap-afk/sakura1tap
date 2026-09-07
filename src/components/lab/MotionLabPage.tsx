import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import './MotionLabPage.css'

const LusionStudy = lazy(() => import('./LusionStudy'))

type MotionLabPageProps = {
  onClose: () => void
}

type MotionWindowId = 0 | 1 | 2 | 3

type MotionWindow = {
  depth: number
  id: MotionWindowId
  label: string
  rotate: string
  src: string
  title: string
  width: string
  x: string
  y: string
}

const motionWindows: MotionWindow[] = [
  {
    depth: 0.46,
    id: 0,
    label: 'MOTION 01',
    rotate: '-4deg',
    src: '/art/videos/272021_medium.mp4',
    title: '流光',
    width: '29vw',
    x: '24%',
    y: '34%',
  },
  {
    depth: 0.82,
    id: 1,
    label: 'MOTION 02',
    rotate: '3.4deg',
    src: '/art/videos/285205_medium.mp4',
    title: '折射',
    width: '25vw',
    x: '69%',
    y: '27%',
  },
  {
    depth: 0.64,
    id: 2,
    label: 'MOTION 03',
    rotate: '3deg',
    src: '/art/videos/285224_medium.mp4',
    title: '回声',
    width: '25vw',
    x: '31%',
    y: '75%',
  },
  {
    depth: 1,
    id: 3,
    label: 'MOTION 04',
    rotate: '-3.2deg',
    src: '/art/videos/285240_medium.mp4',
    title: '余像',
    width: '28vw',
    x: '73%',
    y: '72%',
  },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const applyWindowPan = (root: HTMLElement, panX: number, panY: number) => {
  root.querySelectorAll<HTMLElement>('.motion-window').forEach((windowElement) => {
    const depth = Number(windowElement.dataset.depth ?? 1)
    windowElement.style.setProperty('--window-pan-x', `${panX * depth}px`)
    windowElement.style.setProperty('--window-pan-y', `${panY * depth}px`)
  })
}

export default function MotionLabPage({ onClose }: MotionLabPageProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const dragRef = useRef({ active: false, pointerId: -1, startX: 0, startY: 0, panX: 0, panY: 0 })
  const [activeId, setActiveId] = useState<MotionWindowId | null>(null)
  const [failedVideos, setFailedVideos] = useState<Set<MotionWindowId>>(() => new Set())
  const [section, setSection] = useState<'windows' | 'lusion'>('windows')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const pauseAll = useCallback((except?: MotionWindowId) => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== except) video.pause()
    })
  }, [])

  const focusWindow = useCallback((id: MotionWindowId) => {
    pauseAll(id)
    setActiveId(id)
    setProgress(0)
    const video = videoRefs.current[id]
    if (!video) return
    void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [pauseAll])

  const returnToOverview = useCallback(() => {
    pauseAll()
    setActiveId(null)
    setIsPlaying(false)
    setProgress(0)
  }, [pauseAll])

  const selectWindow = (id: MotionWindowId) => {
    const video = videoRefs.current[id]
    if (failedVideos.has(id)) {
      setFailedVideos((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      video?.load()
      if (video) void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      return
    }
    if (activeId !== id) {
      focusWindow(id)
      return
    }
    if (!video) return
    if (video.paused) {
      void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const previewWindow = (id: MotionWindowId) => {
    if (activeId !== null || !window.matchMedia('(pointer: fine)').matches) return
    const video = videoRefs.current[id]
    if (video) void video.play().catch(() => undefined)
  }

  const stopPreview = (id: MotionWindowId) => {
    if (activeId !== null) return
    videoRefs.current[id]?.pause()
  }

  const updatePointer = (event: ReactPointerEvent<HTMLElement>) => {
    const root = rootRef.current
    if (!root) return

    const x = event.clientX / window.innerWidth
    const y = event.clientY / window.innerHeight
    root.style.setProperty('--lab-pointer-x', `${x * 100}%`)
    root.style.setProperty('--lab-pointer-y', `${y * 100}%`)
    root.style.setProperty('--lab-cursor-x', `${event.clientX}px`)
    root.style.setProperty('--lab-cursor-y', `${event.clientY}px`)

    const drag = dragRef.current
    if (drag.active) {
      drag.panX = clamp((event.clientX - drag.startX) * 0.16, -48, 48)
      drag.panY = clamp((event.clientY - drag.startY) * 0.12, -30, 30)
      applyWindowPan(root, drag.panX, drag.panY)
    } else if (activeId === null) {
      applyWindowPan(root, (x - 0.5) * -22, (y - 0.5) * -16)
    }
  }

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button, video')) return
    const root = rootRef.current
    if (!root) return

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: 0,
      panY: 0,
    }
    root.dataset.dragging = 'true'
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return
    drag.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (rootRef.current) rootRef.current.dataset.dragging = 'false'
  }

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true })
    return () => pauseAll()
  }, [pauseAll])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (section === 'lusion') {
          setSection('windows')
          return
        }
        if (activeId !== null) returnToOverview()
        else onClose()
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      const current = activeId ?? (direction > 0 ? -1 : 0)
      focusWindow(((current + direction + motionWindows.length) % motionWindows.length) as MotionWindowId)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeId, focusWindow, onClose, returnToOverview, section])

  if (section === 'lusion') {
    return (
      <Suspense fallback={<div className="lusion-study-loading">正在构建实验场…</div>}>
        <LusionStudy onBack={() => setSection('windows')} onClose={onClose} />
      </Suspense>
    )
  }

  return (
    <section
      aria-label="动效实验室"
      className={`motion-lab ${activeId !== null ? 'has-focus' : ''}`}
      data-dragging="false"
      data-playing={isPlaying ? 'true' : 'false'}
      onPointerCancel={endDrag}
      onPointerDown={beginDrag}
      onPointerMove={updatePointer}
      onPointerUp={endDrag}
      ref={rootRef}
      tabIndex={-1}
    >
      <div className="motion-lab-ambient" aria-hidden="true">
        <i className="motion-lab-grid" />
        <i className="motion-lab-halo motion-lab-halo-a" />
        <i className="motion-lab-halo motion-lab-halo-b" />
        <i className="motion-lab-sweep" />
        <i className="motion-lab-grain" />
      </div>

      <header className="motion-lab-header">
        <button className="motion-lab-brand" onClick={onClose} type="button" aria-label="返回 Sakura1Tap">
          <span>Sakura1Tap</span><i />
        </button>
        <div className="motion-lab-title">
          <span>04 / LAB</span>
          <strong>动效实验室</strong>
        </div>
        <div className="motion-lab-count" aria-live="polite">
          <b>{String(activeId === null ? 0 : activeId + 1).padStart(2, '0')}</b><span>/ 04</span>
        </div>
      </header>

      <button
        className="motion-lab-section-entry"
        onClick={() => {
          pauseAll()
          setSection('lusion')
        }}
        type="button"
      >
        <span>01 / STUDY</span>
        <strong>仿 Lusion</strong>
        <i>进入实验 →</i>
      </button>

      {activeId !== null && (
        <button className="motion-lab-overview" onClick={returnToOverview} type="button">
          概览 <span>×</span>
        </button>
      )}

      <div className="motion-lab-stage" aria-label="视频动效窗口">
        <div className="motion-lab-focus-pulse" aria-hidden="true" />
        {motionWindows.map((item, index) => {
          const active = activeId === item.id
          const unavailable = failedVideos.has(item.id)
          const itemProgress = active ? progress : 0
          return (
            <button
              aria-label={`${unavailable ? '重新加载' : active ? (isPlaying ? '暂停' : '继续播放') : '聚焦'}${item.title}`}
              aria-pressed={active}
              className={`motion-window ${active ? 'is-active' : ''} ${unavailable ? 'is-unavailable' : ''}`}
              data-depth={item.depth}
              data-index={index}
              key={item.id}
              onClick={() => selectWindow(item.id)}
              onPointerEnter={() => previewWindow(item.id)}
              onPointerLeave={() => stopPreview(item.id)}
              style={
                {
                  '--depth': item.depth,
                  '--reveal-delay': `${index * 110}ms`,
                  '--window-rotate': item.rotate,
                  '--window-width': item.width,
                  '--window-x': item.x,
                  '--window-y': item.y,
                } as CSSProperties
              }
              type="button"
            >
              <span className="motion-window-echo" aria-hidden="true" />
              <span className="motion-window-surface">
                <video
                  loop
                  muted
                  onError={() => {
                    setFailedVideos((current) => new Set(current).add(item.id))
                    if (active) setIsPlaying(false)
                  }}
                  onLoadedData={() => {
                    setFailedVideos((current) => {
                      if (!current.has(item.id)) return current
                      const next = new Set(current)
                      next.delete(item.id)
                      return next
                    })
                  }}
                  onPause={() => active && setIsPlaying(false)}
                  onPlay={() => active && setIsPlaying(true)}
                  onTimeUpdate={(event) => {
                    if (!active || !Number.isFinite(event.currentTarget.duration)) return
                    setProgress(event.currentTarget.currentTime / event.currentTarget.duration)
                  }}
                  playsInline
                  preload="metadata"
                  ref={(video) => { videoRefs.current[item.id] = video }}
                  src={item.src}
                />
                {unavailable && (
                  <span className="motion-window-unavailable" role="status">
                    <strong>片段加载中断</strong>
                    <i>点击重新加载</i>
                  </span>
                )}
                <span className="motion-window-shade" aria-hidden="true" />
                <span className="motion-window-scan" aria-hidden="true" />
                <span className="motion-window-meta">
                  <i>{item.label}</i>
                  <strong>{item.title}</strong>
                </span>
                <span className="motion-window-state">
                  {unavailable ? '待恢复' : active ? (isPlaying ? '播放中' : '已暂停') : '聚焦'}
                </span>
                <span className="motion-window-progress" aria-hidden="true">
                  <i style={{ transform: `scaleX(${itemProgress})` }} />
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <footer className="motion-lab-footer">
        <div className="motion-lab-rail" aria-hidden="true">
          {motionWindows.map((item) => <i className={activeId === item.id ? 'is-active' : ''} key={item.id} />)}
        </div>
        <span>{activeId === null ? '拖动空间 · 点击窗口' : '点击窗口暂停 · ESC 返回概览'}</span>
      </footer>

      <div className="motion-lab-cursor" aria-hidden="true"><i /></div>
    </section>
  )
}
