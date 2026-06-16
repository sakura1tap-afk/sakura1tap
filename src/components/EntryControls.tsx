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
import { type CSSProperties, useEffect, useState } from 'react'

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

const desktopGroupTransforms = {
  light: 'translate(calc(-50% - 4.2rem), calc(-50% + 1.4rem)) scale(1)',
  rotate: 'translate(-50%, calc(-50% - 4.65rem)) scale(1)',
  size: 'translate(calc(-50% + 4.55rem), calc(-50% + 3.45rem)) scale(1)',
  tone: 'translate(calc(-50% - 0.4rem), calc(-50% + 5.05rem)) scale(1)',
  view: 'translate(calc(-50% + 5.4rem), calc(-50% - 1.45rem)) scale(1)',
} as const

const compactGroupTransforms = {
  light: 'translate(calc(-50% + 8rem), calc(-50% + 6.65rem)) scale(1)',
  rotate: 'translate(calc(-50% - 1.55rem), calc(-50% + 4.05rem)) scale(1)',
  size: 'translate(calc(-50% + 3.85rem), calc(-50% + 4.15rem)) scale(1)',
  tone: 'translate(calc(-50% + 0.15rem), calc(-50% + 6.85rem)) scale(1)',
  view: 'translate(calc(-50% + 4.55rem), calc(-50% + 0.45rem)) scale(1)',
} as const

type CommandGroup = keyof typeof desktopGroupTransforms

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

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)')
    const update = () => setIsCompact(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const closeMenu = () => {
    window.setTimeout(() => {
      if (!document.querySelector('.command-hub:focus-within')) {
        setIsOpen(false)
      }
    }, 80)
  }

  const getGroupStyle = (group: CommandGroup): CSSProperties | undefined => {
    if (!isOpen) return undefined

    const transforms = isCompact ? compactGroupTransforms : desktopGroupTransforms
    return {
      opacity: 1,
      pointerEvents: 'auto',
      transform: transforms[group],
    }
  }

  return (
    <aside
      className={`command-hub ${isReady ? 'is-ready' : ''} ${isOpen ? 'is-open' : ''}`}
      aria-label="入口页控制"
      onBlur={closeMenu}
      onFocus={() => setIsOpen(true)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
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
          <div className="command-group command-group-rotate" style={getGroupStyle('rotate')}>
            <button
              aria-label={autoRotate ? '暂停自动旋转' : '开启自动旋转'}
              className={`command-option ${autoRotate ? 'is-active' : ''}`}
              onClick={onToggleRotate}
              title={autoRotate ? '暂停自动旋转' : '开启自动旋转'}
              type="button"
            >
              {autoRotate ? <Pause size={17} strokeWidth={1.8} /> : <Play size={17} strokeWidth={1.8} />}
            </button>
          </div>

          <div className="command-group command-group-view" style={getGroupStyle('view')}>
            {viewControls.map(({ icon: Icon, label, value }) => (
              <button
                aria-label={label}
                className={`command-option ${viewMode === value ? 'is-active' : ''}`}
                key={value}
                onClick={() => onViewModeChange(value)}
                title={label}
                type="button"
              >
                <Icon size={17} strokeWidth={1.8} />
              </button>
            ))}
          </div>

          <div className="command-group command-group-size" style={getGroupStyle('size')}>
            {sizeControls.map(({ icon: Icon, label, value }) => (
              <button
                aria-label={label}
                className={`command-option ${modelSize === value ? 'is-active' : ''}`}
                key={value}
                onClick={() => onModelSizeChange(value)}
                title={label}
                type="button"
              >
                <Icon size={16} strokeWidth={1.8} />
              </button>
            ))}
          </div>

          <div className="command-group command-group-tone" style={getGroupStyle('tone')}>
            {toneControls.map(({ label, value }) => (
            <button
              aria-label={label}
              className={`command-tone command-tone-${value} ${backgroundTone === value ? 'is-active' : ''}`}
              key={value}
              onClick={() => onBackgroundToneChange(value)}
              title={label}
              type="button"
            />
            ))}
          </div>

          <div className="command-group command-group-light" style={getGroupStyle('light')}>
            <button
              aria-label={softLight ? '关闭柔光' : '开启柔光'}
              className={`command-option ${softLight ? 'is-active' : ''}`}
              onClick={() => onSoftLightChange(!softLight)}
              title={softLight ? '关闭柔光' : '开启柔光'}
              type="button"
            >
              {softLight ? <SunMedium size={17} strokeWidth={1.8} /> : <Lamp size={17} strokeWidth={1.8} />}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
