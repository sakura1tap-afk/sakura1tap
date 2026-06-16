import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import EntryScene from './components/EntryScene'
import EntryControls, { type BackgroundTone, type ViewMode } from './components/EntryControls'
import EnterOverlay from './components/EnterOverlay'
import MainPage from './components/MainPage'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('front')
  const [backgroundTone, setBackgroundTone] = useState<BackgroundTone>('paper')
  const [softLight, setSoftLight] = useState(true)

  return (
    <main className={`app-shell tone-${backgroundTone}`}>
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
            <EntryScene
              autoRotate={autoRotate}
              backgroundTone={backgroundTone}
              softLight={softLight}
              viewMode={viewMode}
            />
            <EntryControls
              autoRotate={autoRotate}
              backgroundTone={backgroundTone}
              onBackgroundToneChange={setBackgroundTone}
              onSoftLightChange={setSoftLight}
              onToggleRotate={() => setAutoRotate((value) => !value)}
              onViewModeChange={setViewMode}
              softLight={softLight}
              viewMode={viewMode}
            />
            <EnterOverlay onEnter={() => setEntered(true)} />
          </motion.section>
        ) : (
          <MainPage key="main" />
        )}
      </AnimatePresence>
    </main>
  )
}
