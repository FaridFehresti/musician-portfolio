import { motion } from 'framer-motion'
import { useContentStore } from '../../store/contentStore'

export default function Donate() {
  const donation = useContentStore(s => s.donation)
  const WHY_CARDS = donation.why || []
  const url = donation.checkyaUrl || ''
  const buttonLabel = donation.buttonLabel || 'Leave a tip'
  const note = donation.note || 'Secure checkout via Checkya — no account needed.'

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 pb-32"
      style={{ background: 'var(--color-bg)', paddingTop: 120 }}
    >
      {/* Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 30% at 50% 18%, color-mix(in srgb, var(--accent) 9%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
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
            {donation.heading}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.7 }}>
            {donation.subtext}
          </p>
        </motion.div>

        {/* Checkya tip card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6 }}
          className="mb-14"
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '38px 26px 30px',
            textAlign: 'center',
            background: 'linear-gradient(165deg, color-mix(in srgb, var(--accent) 13%, var(--color-surface)) 0%, var(--color-surface) 58%)',
            border: '1px solid color-mix(in srgb, var(--accent-2) 26%, transparent)',
            boxShadow: '0 26px 64px rgba(0,0,0,0.34), 0 0 50px color-mix(in srgb, var(--accent) 10%, transparent)',
          }}
        >
          {/* top glow */}
          <div aria-hidden style={{
            position: 'absolute', top: -90, left: '50%', transform: 'translateX(-50%)',
            width: 260, height: 260, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent) 0%, transparent 68%)',
          }} />

          <div style={{ position: 'relative' }}>
            {/* heart badge */}
            <div style={{
              width: 66, height: 66, margin: '0 auto 20px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 42%, transparent)',
              boxShadow: '0 0 26px color-mix(in srgb, var(--accent) 22%, transparent)',
              color: 'var(--color-accent)',
            }}>
              <HeartIcon />
            </div>

            <p style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 700,
              color: 'var(--color-text)', marginBottom: 6,
            }}>
              Pay what you like
            </p>
            <p style={{ color: 'var(--color-muted)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 24, maxWidth: 320, marginInline: 'auto' }}>
              One tap takes you to a secure Checkya page — tip any amount, no sign-up.
            </p>

            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  width: '100%', padding: '15px 22px', borderRadius: 14, cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--accent-2) 75%, var(--color-accent)))',
                  color: 'var(--on-accent, #0a0a0a)', textDecoration: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em',
                  boxShadow: '0 12px 30px color-mix(in srgb, var(--accent) 30%, transparent)',
                  transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 40px color-mix(in srgb, var(--accent) 40%, transparent)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 30px color-mix(in srgb, var(--accent) 30%, transparent)' }}
              >
                {buttonLabel}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 17 17 7" /><path d="M9 7h8v8" />
                </svg>
              </a>
            ) : (
              <div style={{
                padding: '15px 22px', borderRadius: 14, color: 'var(--color-muted)',
                background: 'color-mix(in srgb, var(--text) 5%, transparent)',
                border: '1px dashed color-mix(in srgb, var(--text) 20%, transparent)',
                fontFamily: 'var(--font-mono)', fontSize: 13,
              }}>
                Tip link coming soon
              </div>
            )}

            <p style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              marginTop: 16, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.03em',
            }}>
              <LockIcon /> {note}
            </p>
          </div>
        </motion.div>

        {/* Why donate */}
        {WHY_CARDS.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="grid gap-4 mb-12"
          >
            {WHY_CARDS.map((card, i) => (
              <motion.div
                key={card.title || i}
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
        )}

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

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21s-7.5-4.6-10-9.3C.7 9 1.6 5.5 4.7 4.6 6.8 4 8.9 4.9 10 6.6l.9 1.4.9-1.4c1.1-1.7 3.2-2.6 5.3-2 3.1.9 4 4.4 2.7 7.1C19.5 16.4 12 21 12 21z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
