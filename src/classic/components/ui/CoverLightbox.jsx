import { useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Full-screen cover image lightbox.
 * Usage: <CoverLightbox src={url} title="..." onClose={() => setOpen(false)} />
 * Wrap with <AnimatePresence> at the call site.
 */
export function CoverLightbox({ src, title, onClose }) {
  /* Close on Escape */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.92)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         9999,
        cursor:         'zoom-out',
        backdropFilter: 'blur(12px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.78, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.78, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
        style={{
          position:     'relative',
          borderRadius: 12,
          overflow:     'hidden',
          boxShadow:    '0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px color-mix(in srgb, var(--accent-2) 15%, transparent)',
          maxWidth:     'min(80vmin, 600px)',
          maxHeight:    'min(80vmin, 600px)',
          width:        '100%',
          aspectRatio:  '1',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={title || 'Cover art'}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #1a1208, #0a0a0a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="80" height="80" viewBox="0 0 80 80" opacity="0.3">
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--accent)" strokeWidth="1" />
              <circle cx="40" cy="40" r="20" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
              <circle cx="40" cy="40" r="6"  fill="var(--accent)" />
            </svg>
          </div>
        )}

        {/* Track title overlay */}
        {title && (
          <div style={{
            position:   'absolute',
            bottom:     0, left: 0, right: 0,
            padding:    '40px 20px 20px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle:  'italic',
              fontSize:   22,
              color:      'var(--color-text)',
            }}>
              {title}
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position:       'absolute',
            top:            14,
            right:          14,
            width:          34,
            height:         34,
            borderRadius:   '50%',
            background:     'rgba(10,10,10,0.75)',
            border:         '1px solid rgba(240,236,224,0.15)',
            color:          'rgba(240,236,224,0.7)',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       16,
            lineHeight:     1,
            backdropFilter: 'blur(4px)',
            transition:     'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-2) 40%, transparent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,236,224,0.7)'; e.currentTarget.style.borderColor = 'rgba(240,236,224,0.15)' }}
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  )
}
