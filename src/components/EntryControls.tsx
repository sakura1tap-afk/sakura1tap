import { Aperture, Focus, Lamp, Pause, Play, RotateCcw, SunMedium } from 'lucide-react'

export type ViewMode = 'front' | 'detail' | 'stage'
export type BackgroundTone = 'paper' | 'warm' | 'mist'

type EntryControlsProps = {
  autoRotate: boolean
  backgroundTone: BackgroundTone
  onBackgroundToneChange: (tone: BackgroundTone) => void
  onSoftLightChange: (enabled: boolean) => void
  onToggleRotate: () => void
  onViewModeChange: (mode: ViewMode) => void
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

export default function EntryControls({
  autoRotate,
  backgroundTone,
  onBackgroundToneChange,
  onSoftLightChange,
  onToggleRotate,
  onViewModeChange,
  softLight,
  viewMode,
}: EntryControlsProps) {
  return (
    <>
      <aside className="side-panel side-panel-left" aria-label="模型控制">
        <div className="control-stack">
          <button
            aria-label={autoRotate ? '暂停自动旋转' : '开启自动旋转'}
            className={`icon-control ${autoRotate ? 'is-active' : ''}`}
            onClick={onToggleRotate}
            title={autoRotate ? '暂停自动旋转' : '开启自动旋转'}
            type="button"
          >
            {autoRotate ? <Pause size={18} strokeWidth={1.8} /> : <Play size={18} strokeWidth={1.8} />}
          </button>

          <div className="control-divider" />

          {viewControls.map(({ icon: Icon, label, value }) => (
            <button
              aria-label={label}
              className={`icon-control ${viewMode === value ? 'is-active' : ''}`}
              key={value}
              onClick={() => onViewModeChange(value)}
              title={label}
              type="button"
            >
              <Icon size={18} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </aside>

      <aside className="side-panel side-panel-right" aria-label="画面控制">
        <div className="tone-switcher">
          {toneControls.map(({ label, value }) => (
            <button
              aria-label={label}
              className={`tone-dot tone-dot-${value} ${backgroundTone === value ? 'is-active' : ''}`}
              key={value}
              onClick={() => onBackgroundToneChange(value)}
              title={label}
              type="button"
            />
          ))}
        </div>

        <button
          aria-label={softLight ? '关闭柔光' : '开启柔光'}
          className={`light-toggle ${softLight ? 'is-active' : ''}`}
          onClick={() => onSoftLightChange(!softLight)}
          title={softLight ? '关闭柔光' : '开启柔光'}
          type="button"
        >
          {softLight ? <SunMedium size={18} strokeWidth={1.8} /> : <Lamp size={18} strokeWidth={1.8} />}
        </button>
      </aside>
    </>
  )
}
