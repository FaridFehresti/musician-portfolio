import { Link2 } from 'lucide-react'
import { resolveIconKey } from './socialMeta'

/* Social brand icons. lucide-react (v1) dropped its brand glyphs, so the
   brand marks here are hand-drawn SVGs; lucide still provides the generic
   "Other / Link" fallback. All use currentColor, so they inherit the
   surrounding text colour. Pure metadata (options, key resolution) lives in
   ./socialMeta so this file only exports components. */

function Svg({ size = 18, filled = true, style, children, ...rest }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? undefined : 2}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden focusable="false"
      style={{ display: 'block', ...style }}  // block removes the inline baseline gap that knocks it off-centre
      {...rest}
    >
      {children}
    </svg>
  )
}

export function YoutubeIcon(props) {
  return (
    <Svg {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5z" />
    </Svg>
  )
}

export function TwitchIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4.27 0 1.4 3.43v15.43h5.14V22l3.43-3.14h2.57L18.6 14V0zm12.34 13.14-2.86 2.86h-2.86l-2.5 2.43V16H4.84V1.71h11.77z" />
      <path d="M14.34 4.57h-1.71v5.14h1.71zM9.77 4.57H8.06v5.14h1.71z" />
    </Svg>
  )
}

export function InstagramIcon(props) {
  return (
    <Svg filled={false} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function XIcon(props) {
  return (
    <Svg {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </Svg>
  )
}

export function SoundcloudIcon(props) {
  // Centred within the 24×24 box: bars + cloud span ~x2.5–21.5, y7–17 (mid ≈12).
  return (
    <Svg {...props}>
      <rect x="2.5" y="11.5" width="1.5" height="5"   rx=".75" />
      <rect x="5"   y="9.5"  width="1.5" height="7"   rx=".75" />
      <rect x="7.5" y="10.5" width="1.5" height="6"   rx=".75" />
      <path d="M10.5 16.5V9.4c0-.5.4-.9.9-.9.3 0 .5.1.7.3C13 6.9 14.7 5.7 16.6 5.7c2.6 0 4.7 2.1 4.7 4.7 0 .25-.02.5-.07.73.5.4.84 1.03.84 1.74 0 1.2-1 2.16-2.2 2.16H10.9z" />
    </Svg>
  )
}

/* key → component. */
const ICONS = {
  youtube: YoutubeIcon,
  twitch: TwitchIcon,
  instagram: InstagramIcon,
  x: XIcon,
  soundcloud: SoundcloudIcon,
}

export function SocialIcon({ name, size = 18, ...rest }) {
  const Cmp = ICONS[resolveIconKey(name)]
  if (Cmp) return <Cmp size={size} {...rest} />
  // generic fallback (lucide) — block display keeps it centred like the rest
  return <Link2 size={size} aria-hidden {...rest} style={{ display: 'block', ...rest.style }} />
}
