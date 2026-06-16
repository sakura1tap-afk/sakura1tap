import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import EntryScene from './components/EntryScene'
import EnterOverlay from './components/EnterOverlay'
import MainPage from './components/MainPage'

export default function App() {
  const [entered, setEntered] = useState(false)

  return (
    <main className="app-shell">
      <AnimatePresence mode="wait">
        {!entered ? (
          <motion.section
            key="entry"
            className="entry-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          >
            <EntryScene />
            <EnterOverlay onEnter={() => setEntered(true)} />
          </motion.section>
        ) : (
          <MainPage key="main" />
        )}
      </AnimatePresence>
    </main>
  )
}
