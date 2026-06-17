import {
  Aperture,
  CircleDot,
  Focus,
  Lamp,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SunMedium,
} from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'

export type ViewMode = 'front' | 'detail' | 'stage'
export type BackgroundTone = 'paper' | 'warm' | 'mist'
export type ModelSize = 'small' | 'medium' | 'large'

type EntryControlsProps = {
  autoRotate: boolean
  backgroundTone: BackgroundTone
  isReady: boolean
  onBackgroundToneChange: (tone: BackgroundTone) => void
  onModelSizeChange: (size: ModelSize) => void
  onSoftLightChange: (enabled: boolean) => void
  onToggleRotate: () => void
  onViewModeChange: (mode: ViewMode) => void
  modelSize: ModelSize
  softLight: boolean
  viewMode: ViewMode
}

const viewControls = [
  { icon: Focus, label: '正面', value: 'front' },
  { icon: Aperture, label: '细节', value: 'detail' },
  { icon: RotateCcw, label: '全景', value: 'stage' },
] as const

const toneControls = [
  { label: '纸白', value: 'paper' },
  { label: '暖白', value: 'warm' },
  { label: '雾粉', value: 'mist' },
] as const

const sizeControls = [
  { icon: Minimize2, label: '缩小模型', value: 'small' },
  { icon: CircleDot, label: '标准模型', value: 'medium' },
  { icon: Maximize2, label: '放大模型', value: 'large' },
] as const

const orbitAngles = [-90, -57, -24, 9, 42, 75, 108, 141, 174, 207, 240] as const

export default function EntryControls({
  autoRotate,
  backgroundTone,
  isReady,
  onBackgroundToneChange,
  onModelSizeChange,
  onSoftLightChange,
  onToggleRotate,
  onViewModeChange,
  modelSize,
  softLight,
  viewMode,
}: EntryControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openMenu = () => {
    clearCloseTimer()
    setIsOpen(true)
  }

  const scheduleCloseMenu = (delay = 1600) => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      if (!document.querySelector('.command-hub:focus-within')) {
        setIsOpen(false)
      }
    }, delay)
  }

  const refreshMenuHold = () => {
    if (isOpen) {
      scheduleCloseMenu()
    }
  }

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)')
    const update = () => setIsCompact(query.matches)

    update()
    query.addEventListener('change', update)
    return () => {
      query.removeEventListener('change', update)
      clearCloseTimer()
    }
  }, [])

  const closeMenu = () => {
    scheduleCloseMenu()
  }

  const getNodeStyle = (index: number): CSSProperties | undefined => {
    if (!isOpen) return undefined

    const radius = isCompact ? '5.1rem' : '5.7rem'
    const angle = orbitAngles[index]
    return {
      '--radius': radius,
      opacity: 1,
      pointerEvents: 'auto',
      transform:
        `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(var(--radius) * -1)) rotate(${-angle}deg) scale(1)`,
    } as CSSProperties
  }

  return (
    <aside
      className={`command-hub ${isReady ? 'is-ready' : ''} ${isOpen ? 'is-open' : ''}`}
      aria-label="入口页控制"
      onBlur={closeMenu}
      onFocus={openMenu}
      onMouseEnter={openMenu}
      onMouseLeave={() => scheduleCloseMenu()}
      onPointerMove={refreshMenuHold}
    >
      <button
        aria-expanded={isOpen}
        aria-label="打开入口页控制"
        className="command-hub-button"
        disabled={!isReady}
        onClick={() => setIsOpen((value) => !value)}
        title="控制"
        type="button"
      >
        <Settings2 size={19} strokeWidth={1.7} />
      </button>

      {isOpen && (
        <div className="command-orbit">
          <button
            aria-label={autoRotate ? '暂停自动旋转' : '开启自动旋转'}
            className={`command-node command-option ${autoRotate ? 'is-active' : ''}`}
            onClick={() => {
              onToggleRotate()
              scheduleCloseMenu()
            }}
            style={getNodeStyle(0)}
            title={autoRotate ? '暂停自动旋转' : '开启自动旋转'}
            type="button"
          >
            {autoRotate ? <Pause size={17} strokeWidth={1.8} /> : <Play size={17} strokeWidth={1.8} />}
          </button>

          {viewControls.map(({ icon: Icon, label, value }, index) => (
            <button
              aria-label={label}
              className={`command-node command-option ${viewMode === value ? 'is-active' : ''}`}
              key={value}
              onClick={() => {
                onViewModeChange(value)
                scheduleCloseMenu()
              }}
              style={getNodeStyle(index + 1)}
              title={label}
              type="button"
            >
              <Icon size={17} strokeWidth={1.8} />
            </button>
          ))}

          {sizeControls.map(({ icon: Icon, label, value }, index) => (
            <button
              aria-label={label}
              className={`command-node command-option ${modelSize === value ? 'is-active' : ''}`}
              key={value}
              onClick={() => {
                onModelSizeChange(value)
                scheduleCloseMenu()
              }}
              style={getNodeStyle(index + 4)}
              title={label}
              type="button"
            >
              <Icon size={16} strokeWidth={1.8} />
            </button>
          ))}

          {toneControls.map(({ label, value }, index) => (
            <button
              aria-label={label}
              className={`command-node command-tone command-tone-${value} ${backgroundTone === value ? 'is-active' : ''}`}
              key={value}
              onClick={() => {
                onBackgroundToneChange(value)
                scheduleCloseMenu()
              }}
              style={getNodeStyle(index + 7)}
              title={label}
              type="button"
            />
          ))}

          <button
            aria-label={softLight ? '关闭柔光' : '开启柔光'}
            className={`command-node command-option ${softLight ? 'is-active' : ''}`}
            onClick={() => {
              onSoftLightChange(!softLight)
              scheduleCloseMenu()
            }}
            style={getNodeStyle(10)}
            title={softLight ? '关闭柔光' : '开启柔光'}
            type="button"
          >
            {softLight ? <SunMedium size={17} strokeWidth={1.8} /> : <Lamp size={17} strokeWidth={1.8} />}
          </button>
        </div>
      )}
    </aside>
  )
}
