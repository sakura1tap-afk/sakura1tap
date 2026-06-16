import { motion } from 'framer-motion'

export default function MainPage() {
  return (
    <motion.section
      className="main-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
    >
      <h1>功能界面</h1>
    </motion.section>
  )
}
