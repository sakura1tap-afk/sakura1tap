import { ArrowUpRight } from 'lucide-react'
import { mainSections as sections, sectionOrder, type SectionKey } from '../../data/mainSections'

type RealmInterfaceProps = {
  active: SectionKey
  isNodeOpen: boolean
  onActivate: (key: SectionKey) => void
  onOpenActive: () => void
}

export default function RealmInterface({
  active,
  isNodeOpen,
  onActivate,
  onOpenActive,
}: RealmInterfaceProps) {
  const activeSection = sections[active]
  const activeIndex = sectionOrder.indexOf(active)
  const progress = `${((activeIndex + 1) / sectionOrder.length) * 100}%`

  return (
    <div className="realm-interface" aria-label="3D installation navigation">
      <header className="realm-header">
        <button className="realm-brand" onClick={() => onActivate('home')} type="button">
          <span>Sakura1Tap</span>
          <i />
        </button>
        <nav className="realm-nav" aria-label="Installation sections">
          {sectionOrder.map((key) => (
            <button
              aria-label={sections[key].label}
              className={active === key ? 'is-active' : ''}
              key={key}
              onClick={() => onActivate(key)}
              type="button"
            />
          ))}
        </nav>
      </header>

      <section className="realm-hero-panel" aria-label={activeSection.label} aria-live="polite">
        <span>{activeSection.label}</span>
        <h1>{activeSection.title}</h1>
        <div className="realm-actions">
          <button
            aria-label={isNodeOpen ? 'Open active section' : 'Enter active section'}
            className="realm-primary-action"
            onClick={onOpenActive}
            type="button"
          >
            <ArrowUpRight size={16} strokeWidth={1.8} />
          </button>
        </div>
      </section>

      <aside className="realm-map-card" aria-label="Installation signal">
        <div className="realm-map-orbit" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </aside>

      <div className="realm-section-progress" aria-hidden="true">
        <span style={{ width: progress }} />
      </div>
    </div>
  )
}
