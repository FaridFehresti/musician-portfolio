import { useState } from 'react'
import { motion } from 'framer-motion'

const TIP_AMOUNTS = ['$3', '$5', '$10']

const WHY_CARDS = [
  { icon: '🎙', title: 'Better equipment', text: 'Better mics, converters, and monitors mean better music.' },
  { icon: '🎵', title: 'More music', text: 'Every tip goes directly back into studio time and releases.' },
  { icon: '∞', title: 'Keep it free', text: 'Your support means the music stays free for everyone, forever.' },
]

export default function Donate() {
  const [selected, setSelected] = useState('$5')

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 pb-32"
      style={{ background: 'var(--color-bg)', paddingTop: 120 }}
    >
      {/* Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 30% at 50% 20%, rgba(0,229,255,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 'clamp(36px, 6vw, 64px)',
              color: 'var(--color-text)',
              marginBottom: 16,
            }}
          >
            Support the Music
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.7 }}>
            All music is free. If you enjoy it, a small tip keeps the studio running.
          </p>
        </motion.div>

        {/* Tip amounts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {TIP_AMOUNTS.map(amt => {
            const active = selected === amt
            return (
              <button
                key={amt}
                onClick={() => setSelected(amt)}
                className="py-5 rounded-2xl flex flex-col items-center gap-1 transition-all"
                style={{
                  background: active ? 'rgba(0,229,255,0.12)' : 'var(--color-surface)',
                  border: active ? '1.5px solid var(--color-accent)' : '1px solid rgba(240,236,224,0.06)',
                  cursor: 'pointer',
                  color: active ? 'var(--color-accent)' : 'var(--color-muted)',
                  transform: active ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: active ? '0 0 20px rgba(0,229,255,0.12)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, fontWeight: 700 }}>
                  {amt}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  one-time tip
                </span>
              </button>
            )
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="flex flex-col gap-3 mb-16"
        >
          <a
            href="https://ko-fi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--color-accent)',
              color: '#0a0a0a',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-warm)'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            ☕ Buy a Coffee on Ko-fi
          </a>

          <a
            href="https://paypal.me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm transition-all"
            style={{
              background: 'transparent',
              color: 'var(--color-accent)',
              border: '1px solid rgba(0,229,255,0.3)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'rgba(0,229,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.background = 'transparent' }}
          >
            PayPal.me
          </a>
        </motion.div>

        {/* Why donate */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="grid gap-4 mb-12"
        >
          {WHY_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid rgba(240,236,224,0.06)',
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{card.icon}</span>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--color-text)', marginBottom: 4 }}>
                  {card.title}
                </h3>
                <p style={{ color: 'var(--color-muted)', fontSize: 13, lineHeight: 1.6 }}>
                  {card.text}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer note */}
        <p
          className="text-center"
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--color-muted)',
            lineHeight: 1.6,
          }}
        >
          No account needed. No subscription.
          <br />
          Just music.
        </p>
      </div>
    </div>
  )
}
