import { useEffect, useState } from 'react'

function useMediaQuery(query) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const onChange = e => setMatch(e.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [query])
  return match
}

/** True only on devices with a real mouse — gates the tilt/foil/cursor-facing
 *  effects so touch devices don't get broken pointer-driven animations. */
export function useIsHoverDevice() {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}

/** 'mobile' (<640) | 'tablet' (640–1023) | 'desktop' (≥1024) */
export function useBreakpoint() {
  const mobile = useMediaQuery('(max-width: 639px)')
  const tablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
  return mobile ? 'mobile' : tablet ? 'tablet' : 'desktop'
}
