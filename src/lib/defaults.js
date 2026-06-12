/* Default site content — the source of truth for both the server (seeds the
   DB on first run) and the client (fallback when the API is unreachable, so
   the public site looks identical to before even with no server running).
   Pure JS, no React — safe to import from the Node server. */

export const DEFAULT_SITE = {
  artistName: 'Artist Name',
  tagline: 'Electronic · House · Techno · Ambient',
  theme: 'smoke',
  logoUrl: null,
  logoHeight: 90,            // px height of the logo in the hero (when set)
  youtubeUrl: '',            // channel URL → "Go to YouTube" button in Videos section
  homeSlots: {},             // optional genre label per home deck pile, keyed by slot ('stack-1'…'fan-3')
  npLightning: true,         // Now Playing: audio-reactive lightning on the player card
  npEmbers: false,           // Now Playing: glowing embers shed from the card body
  npPulse: false,            // Now Playing: shockwave rings on beats
  npOrbit: false,            // Now Playing: comets orbiting the card outline
}

export const DEFAULT_ABOUT = {
  label: 'About the Artist',
  quote: 'Music is the space between the notes.',
  portraitUrl: null,
  bio: [
    'A music producer and sound explorer pushing boundaries across genres. From pulsing psytrance to heavy metal and hypnotic deep house — every track is a journey through texture, rhythm, and raw energy.',
    'Drawing from global influences — tribal rhythms, cinematic landscapes, and the underground — each release is crafted with precision and passion, to move bodies and expand minds.',
    'All music here is free. No subscriptions, no gatekeeping. Just sound — available to anyone who wants to listen.',
  ],
  genres: ['Psytrance', 'Electronic', 'Metal', 'Ambient', 'House', 'Melodic'],
}

export const DEFAULT_SOCIALS = [
  { label: 'SoundCloud', icon: 'soundcloud', href: 'https://soundcloud.com' },
  { label: 'Instagram',  icon: 'instagram',  href: 'https://instagram.com' },
  { label: 'YouTube',    icon: 'youtube',    href: 'https://youtube.com' },
  { label: 'X',          icon: 'x',          href: 'https://x.com' },
]

/* Free-form external links the artist wants to surface (shop, press kit, …). */
export const DEFAULT_LINKS = []

export const DEFAULT_DONATION = {
  heading: 'Support the Music',
  subtext: 'All music here is free. If it added something to your day, you can leave a tip — pay what you like, it all goes straight back into the studio.',
  checkyaUrl: '',                                    // your Checkya tip / payment link
  buttonLabel: 'Leave a tip',
  note: 'Secure checkout via Checkya — no account needed.',
  why: [
    { icon: '🎙', title: 'Better equipment', text: 'Better mics, converters, and monitors mean better music.' },
    { icon: '🎵', title: 'More music',       text: 'Every tip goes directly back into studio time and releases.' },
    { icon: '∞',  title: 'Keep it free',     text: 'Your support keeps the music free for everyone, forever.' },
  ],
}

export const DEFAULT_CONTENT = {
  site:     DEFAULT_SITE,
  about:    DEFAULT_ABOUT,
  socials:  DEFAULT_SOCIALS,
  links:    DEFAULT_LINKS,
  donation: DEFAULT_DONATION,
}

/* Theme list — the single source of truth, consumed by themeStore (client),
   the CMS picker (BrandingSection), and the index.html pre-paint script.
   Each id has a matching html[data-theme='…'] block in globals.css. The
   `bg / a / b` fields drive the three-dot swatch in the picker. Pure data —
   safe to import from the Node server. All themes are dark by design: the
   analog "record shop" look assumes a dim canvas. */
export const THEME_OPTIONS = [
  { id: 'smoke',             label: 'Smoke & Whiskey',  bg: '#161210', a: '#d18b2f', b: '#a2452e' },
  { id: 'midnight-sapphire', label: 'Midnight Sapphire', bg: '#0e1530', a: '#5b9bd8', b: '#c9913f' },
  { id: 'emerald-gold',      label: 'Emerald & Gold',   bg: '#0b1a13', a: '#c9a44a', b: '#9f5a2a' },
  { id: 'crimson-velvet',    label: 'Crimson Velvet',   bg: '#1e0c0f', a: '#c64b54', b: '#c89a4e' },
]
