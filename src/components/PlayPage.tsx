import { motion } from 'framer-motion'
import { ArrowUpRight, Play, X } from 'lucide-react'

type PlayPageProps = {
  onClose: () => void
  onStartGame: () => void
}

const playModes = [
  { label: 'DODGE', meta: 'available', body: '黑白躲避原型，作为第一个独立小游戏程序进入全屏游玩。' },
  { label: 'SIGNAL', meta: 'planned', body: '未来用于测试鼠标轨迹、粒子跟随和节奏反馈。' },
  { label: 'FORGE', meta: 'planned', body: '未来放模型、颜色、材质和小型生成工具。' },
]

export default function PlayPage({ onClose, onStartGame }: PlayPageProps) {
  return (
    <motion.section
      className="play-page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.46, ease: [0.2, 0.8, 0.2, 1] }}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="play-page-bg" aria-hidden="true" />
      <header className="play-page-header">
        <button aria-label="退出 Play 页面" onClick={onClose} type="button">
          <X size={17} strokeWidth={1.8} />
          <span>EXIT PLAY</span>
        </button>
        <div>
          <span>04 / TOOLBOX</span>
          <h1>Play Toolbox</h1>
        </div>
      </header>

      <aside className="play-page-brief">
        <span>INTERACTIVE MODULES</span>
        <p>Play 会逐步收纳可玩的实验、小游戏、反应训练和视觉工具。每个模块都以独立程序进入，介绍页只负责展示和启动。</p>
      </aside>

      <section className="play-cover-panel" aria-label="Blackout Run introduction">
        <div className="play-arena-title">
          <span>AVAILABLE MODULE</span>
          <strong>BLACKOUT RUN</strong>
        </div>
        <div className="play-cover-preview" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
        </div>
        <div className="play-cover-copy">
          <span>01 / CANVAS GAME</span>
          <h2>Blackout Run</h2>
          <p>鼠标控制白色光点，在黑白扫描障碍里存活。点击启动后进入全屏网页程序，不再被压在介绍页的小窗口里。</p>
          <button className="play-start-button" onClick={onStartGame} type="button">
            <Play size={17} strokeWidth={1.8} />
            <span>START PROGRAM</span>
            <ArrowUpRight size={16} strokeWidth={1.7} />
          </button>
        </div>
      </section>

      <nav className="play-mode-list" aria-label="Play modes">
        {playModes.map((mode, index) => (
          <article className={index === 0 ? 'is-active' : undefined} key={mode.label}>
            <span>{mode.meta}</span>
            <h2>{mode.label}</h2>
            <p>{mode.body}</p>
          </article>
        ))}
      </nav>
    </motion.section>
  )
}
