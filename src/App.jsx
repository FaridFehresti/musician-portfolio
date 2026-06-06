import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PlayerBar } from './components/player/PlayerBar'
import { Nav }       from './components/ui/Nav'
import Home       from './pages/Home'
import Library    from './pages/Library'
import NowPlaying from './pages/NowPlaying'
import About      from './pages/About'
import Donate     from './pages/Donate'

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
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <AnimatedRoutes />
      <PlayerBar />
    </BrowserRouter>
  )
}
