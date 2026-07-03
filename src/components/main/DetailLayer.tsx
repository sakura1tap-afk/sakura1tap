import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { mainSections as sections, type SectionKey } from '../../data/mainSections'

type DetailLayerProps = {
  active: SectionKey
  onClose: () => void
}

export default function DetailLayer({ active, onClose }: DetailLayerProps) {
  const section = sections[active]

  return (
    <motion.section
      className={`node-detail node-detail-${active}`}
      initial={{ opacity: 0, x: 28, filter: 'blur(12px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 28, filter: 'blur(12px)' }}
      transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className="node-detail-header">
        <div>
          <h2>{section.title}</h2>
        </div>
        <button aria-label="关闭节点详情" onClick={onClose} type="button">
          <X size={17} strokeWidth={1.8} />
        </button>
      </header>

      <div className="node-detail-grid">
        {section.details.map((detail) => (
          <article className="node-detail-card" key={detail.label}>
            <span>{detail.meta}</span>
            <h3>{detail.label}</h3>
            <p>{detail.body}</p>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
