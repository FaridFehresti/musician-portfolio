import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PlayerBar } from './components/player/PlayerBar'
import { Nav }       from './components/ui/Nav'
import Home       from './pages/Home'
import Library    from './pages/Library'
import NowPlaying from './pages/NowPlaying'
import About      from './pages/About'
import Donate     from './pages/Donate'

// Lazy-loaded so Three.js + the /lab bundle stay out of the main chunk.
const Lab = lazy(() => import('./pages/Lab'))

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
          <Route path="/"            element={<Home />} />
          <Route path="/library"     element={<Library />} />
          <Route path="/now-playing" element={<NowPlaying />} />
          <Route path="/about"       element={<About />} />
          <Route path="/donate"      element={<Donate />} />
          <Route path="/lab"         element={
            <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} />}>
              <Lab />
            </Suspense>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

// Hides the global chrome on /lab so the journey is full-screen and immersive.
function Shell() {
  const { pathname } = useLocation()
  const immersive = pathname === '/lab'
  return (
    <>
      {!immersive && <Nav />}
      <AnimatedRoutes />
      {!immersive && <PlayerBar />}
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
