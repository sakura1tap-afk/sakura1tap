import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  Beaker,
  Boxes,
  Gamepad2,
  Search,
  Wrench,
} from 'lucide-react'
import { type CSSProperties, useMemo, useState } from 'react'
import {
  featureCategoryOrder,
  featureRegistry,
  type FeatureAction,
  type FeatureCategory,
} from '../features/registry'
import './play/FunctionSpace.css'

type PlayPageProps = {
  onClose: () => void
  onOpenLab: () => void
  onStartReaction: () => void
}

const categoryMeta = {
  game: { label: '游戏', icon: Gamepad2 },
  tool: { label: '工具', icon: Wrench },
  experiment: { label: '实验', icon: Beaker },
} as const

const statusMeta = {
  available: '可用',
  building: '制作中',
  planned: '规划中',
} as const

export default function PlayPage({ onClose, onOpenLab, onStartReaction }: PlayPageProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | FeatureCategory>('all')
  const [query, setQuery] = useState('')

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return featureRegistry.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false
      if (!normalizedQuery) return true
      return [item.title, item.description, ...item.tags]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    })
  }, [activeCategory, query])

  const openModule = (action?: FeatureAction) => {
    if (action === 'reaction') onStartReaction()
    if (action === 'lab') onOpenLab()
  }

  const availableCount = featureRegistry.filter((item) => item.status === 'available').length

  return (
    <motion.section
      animate={{ opacity: 1 }}
      className="function-space"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onWheel={(event) => event.stopPropagation()}
      transition={{ duration: 0.36, ease: 'easeOut' }}
    >
      <div className="function-space-backdrop" aria-hidden="true" />

      <header className="function-space-header">
        <button className="function-space-back" onClick={onClose} type="button">
          <ArrowLeft size={16} strokeWidth={1.8} />
          <span>Sakura1Tap</span>
        </button>
        <div className="function-space-heading">
          <span>FUNCTION SPACE</span>
          <h1>功能空间</h1>
        </div>
        <div className="function-space-summary">
          <strong>{String(availableCount).padStart(2, '0')}</strong>
          <span>可用 / {String(featureRegistry.length).padStart(2, '0')} 模块</span>
        </div>
      </header>

      <div className="function-space-shell">
        <section className="function-space-controls" aria-label="筛选功能模块">
          <label className="function-space-search">
            <Search size={16} strokeWidth={1.7} />
            <input
              aria-label="搜索功能模块"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索工具、游戏与实验"
              type="search"
              value={query}
            />
          </label>

          <nav className="function-space-tabs" aria-label="模块分类">
            <button
              className={activeCategory === 'all' ? 'is-active' : ''}
              onClick={() => setActiveCategory('all')}
              type="button"
            >
              <Boxes size={15} strokeWidth={1.7} />
              <span>全部</span><i>{featureRegistry.length}</i>
            </button>
            {featureCategoryOrder.map((category) => {
              const CategoryIcon = categoryMeta[category].icon
              return (
                <button
                  className={activeCategory === category ? 'is-active' : ''}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  <CategoryIcon size={15} strokeWidth={1.7} />
                  <span>{categoryMeta[category].label}</span>
                  <i>{featureRegistry.filter((item) => item.category === category).length}</i>
                </button>
              )
            })}
          </nav>
        </section>

        <div className="function-space-results" aria-live="polite">
          <span>{filteredModules.length} 个结果</span>
        </div>

        {featureCategoryOrder.map((category) => {
          const categoryModules = filteredModules.filter((item) => item.category === category)
          if (categoryModules.length === 0) return null
          const CategoryIcon = categoryMeta[category].icon

          return (
            <section className="function-section" key={category} aria-labelledby={`function-${category}`}>
              <header className="function-section-header">
                <div>
                  <CategoryIcon size={18} strokeWidth={1.6} />
                  <h2 id={`function-${category}`}>{categoryMeta[category].label}</h2>
                </div>
                <span>{String(categoryModules.length).padStart(2, '0')}</span>
              </header>

              <div className="function-card-grid">
                {categoryModules.map((item, index) => (
                  <article
                    className={`function-card ${item.featured ? 'is-featured' : ''} is-${item.status}`}
                    key={item.id}
                    style={{ '--card-order': index } as CSSProperties}
                  >
                    {item.featured && (
                      <div className="function-card-visual" aria-hidden="true">
                        <i /><i /><i /><span />
                      </div>
                    )}
                    <div className="function-card-topline">
                      <span>{item.category.toUpperCase()} / {String(index + 1).padStart(2, '0')}</span>
                      <i>{statusMeta[item.status]}</i>
                    </div>
                    <div className="function-card-copy">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <footer className="function-card-footer">
                      <div>{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                      {item.action ? (
                        <button onClick={() => openModule(item.action)} type="button">
                          打开 <ArrowUpRight size={15} strokeWidth={1.8} />
                        </button>
                      ) : (
                        <span>{statusMeta[item.status]}</span>
                      )}
                    </footer>
                  </article>
                ))}
              </div>
            </section>
          )
        })}

        {filteredModules.length === 0 && (
          <div className="function-space-empty">
            <Search size={20} strokeWidth={1.5} />
            <strong>没有匹配的模块</strong>
            <button onClick={() => { setQuery(''); setActiveCategory('all') }} type="button">清除筛选</button>
          </div>
        )}
      </div>
    </motion.section>
  )
}
