import './classic.css'
import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PlayerBar } from './components/player/PlayerBar'
import { Nav }       from './components/ui/Nav'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { useContentStore } from '../store/contentStore'
import Home       from './pages/Home'
import Library    from './pages/Library'
import NowPlaying from './pages/NowPlaying'
import Track      from './pages/Track'
import About      from './pages/About'
import Donate     from './pages/Donate'
import Videos     from './pages/Videos'

// Admin CMS — lazy so its bundle never touches the public site.
const AdminApp = lazy(() => import('../pages/admin/AdminApp'))

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
          <Route path="/track/:id"   element={<Track />} />
          <Route path="/videos"      element={<Videos />} />
          <Route path="/about"       element={<About />} />
          <Route path="/donate"      element={<Donate />} />
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

// Hides the global chrome on /admin (it has its own layout).
function Shell() {
  const { pathname } = useLocation()
  const immersive = pathname.startsWith('/admin')

  // Boot splash — runs once on first load, never on later client navigation.
  // Skipped on immersive routes (admin), which have their own chrome.
  const [booting, setBooting] = useState(() => !immersive)

  // Pull the live CMS content once on first load (falls back to the static
  // catalog + defaults if the API isn't running).
  useEffect(() => { useContentStore.getState().load() }, [])

  return (
    <>
      {!immersive && <Nav />}
      <AnimatedRoutes />
      {!immersive && <PlayerBar />}
      {booting && !immersive && (
        <LoadingScreen isHome={pathname === '/'} onFinish={() => setBooting(false)} />
      )}
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
