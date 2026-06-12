import './styles/globals.css'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Nav } from './components/layout/Nav'
import { Footer } from './components/layout/Footer'
import { GrainOverlay } from './components/layout/GrainOverlay'
import { ConsoleBar } from './components/player/ConsoleBar'
import { AudioBridge } from './components/visualizer/AudioBridge'
import { useContentStore } from './store/contentStore'
import { usePlayerStore } from './store/playerStore'
import Home from './pages/Home'
import Records from './pages/Records'
import TurntablePage from './pages/Turntable'
import Track from './pages/Track'
import Tapes from './pages/Tapes'
import About from './pages/About'
import Support from './pages/Support'

// Admin CMS — lazy so its bundle never touches the public site.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

const PAGE_TRANSITION = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1, transition: { duration: 0.3 } },
  exit:     { opacity: 0, transition: { duration: 0.2 } },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...PAGE_TRANSITION}>
        <Routes location={location}>
          <Route path="/"          element={<Home />} />
          <Route path="/records"   element={<Records />} />
          <Route path="/turntable" element={<TurntablePage />} />
          <Route path="/track/:id" element={<Track />} />
          <Route path="/tapes"     element={<Tapes />} />
          <Route path="/about"     element={<About />} />
          <Route path="/support"   element={<Support />} />
          {/* old-concept routes → their analog counterparts */}
          <Route path="/library"     element={<Navigate to="/records" replace />} />
          <Route path="/now-playing" element={<Navigate to="/turntable" replace />} />
          <Route path="/videos"      element={<Navigate to="/tapes" replace />} />
          <Route path="/donate"      element={<Navigate to="/support" replace />} />
          <Route path="/admin/*"     element={
            <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} />}>
              <AdminApp />
            </Suspense>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

// Hides the public chrome on /admin (it has its own layout).
function Shell() {
  const { pathname } = useLocation()
  const immersive = pathname.startsWith('/admin')
  const hasTrack = usePlayerStore((s) => Boolean(s.currentTrack))

  // Pull the live CMS content once on first load (falls back to the static
  // catalog + defaults if the API isn't running).
  useEffect(() => { useContentStore.getState().load() }, [])

  // New page, top of the page.
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      {/* feeds audioSink for the VU meters; renders null */}
      <AudioBridge />
      {!immersive && <Nav />}
      <main className={!immersive && hasTrack ? 'pb-28' : ''}>
        <AnimatedRoutes />
      </main>
      {!immersive && <Footer />}
      {!immersive && <ConsoleBar />}
      {!immersive && <GrainOverlay />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
