import { lazy, Suspense, useEffect, useState } from 'react'
import { useContentStore } from './store/contentStore'

/* Template router. The artist picks their site's style in the CMS
   (site.template = 'classic' | 'analog'); this loads the content once, then
   lazy-loads ONLY the chosen template — so its JS *and* CSS are a separate
   chunk and a visitor never downloads the template they aren't seeing.
   The Classic chunk carries the heavy 3D stack; Analog stays light. */

const ClassicApp = lazy(() => import('./classic/ClassicApp'))
const AnalogApp = lazy(() => import('./App'))

function Splash() {
  return <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} />
}

export default function Root() {
  const loaded = useContentStore((s) => s.loaded)
  const [template, setTemplate] = useState(null) // locked once, on first load

  // Pull the live CMS content up front (falls back to defaults offline) so we
  // know which template to mount before rendering anything heavy.
  useEffect(() => { useContentStore.getState().load() }, [])

  // Lock the template at first load. A later change in the CMS takes effect on
  // the next reload, rather than swapping the whole app out mid-session.
  useEffect(() => {
    if (loaded && template === null) {
      setTemplate(useContentStore.getState().site?.template === 'analog' ? 'analog' : 'classic')
    }
  }, [loaded, template])

  if (template === null) return <Splash />

  const ActiveApp = template === 'analog' ? AnalogApp : ClassicApp
  return (
    <Suspense fallback={<Splash />}>
      <ActiveApp />
    </Suspense>
  )
}
