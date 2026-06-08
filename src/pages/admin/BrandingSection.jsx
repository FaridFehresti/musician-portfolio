import { Panel, Text, Uploader, Saver, Field } from './ui'
import { useEditor } from './useEditor'
import { THEME_OPTIONS } from '../../lib/defaults'
import { useThemeStore } from '../../store/themeStore'

/* Branding — logo (replaces the hero artist name), name, tagline, and the
   site theme (the public theme switcher was moved here). */
export function BrandingSection({ site, onSaved }) {
  const { draft, set, dirty, saving, savedAt, save } = useEditor('site', site, onSaved)
  const setTheme = useThemeStore(s => s.setTheme)

  function pickTheme(id) {
    set({ theme: id })
    setTheme(id)        // live-preview the theme in the admin immediately
  }

  return (
    <Panel
      title="Branding"
      desc="Your logo replaces the “Artist Name” text in the home hero. Leave it empty to show the name as text instead."
      actions={<Saver onSave={save} dirty={dirty} saving={saving} savedAt={savedAt} />}
    >
      <Uploader
        label="Logo"
        type="logo"
        accept="image/*"
        value={draft.logoUrl}
        onChange={url => set({ logoUrl: url })}
        hint="PNG with transparency works best. Shown in the hero and the top-left brand."
      />

      {draft.logoUrl && (
        <Field label={`Logo height — ${draft.logoHeight || 90}px`}>
          <input
            type="range" min={40} max={200} step={2}
            value={draft.logoHeight || 90}
            onChange={e => set({ logoHeight: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
          />
        </Field>
      )}

      <Text label="Artist name" value={draft.artistName} onChange={v => set({ artistName: v })} placeholder="Artist Name" />
      <Text label="Tagline" value={draft.tagline} onChange={v => set({ tagline: v })} hint="The line under the hero title." />
      <Text label="YouTube channel URL" value={draft.youtubeUrl} onChange={v => set({ youtubeUrl: v })} placeholder="https://youtube.com/@yourchannel" hint="When set, a “Go to YouTube” button appears on the home Videos section." />

      <Field label="Theme" hint="Sets the colour theme for the whole public site.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {THEME_OPTIONS.map(t => {
            const active = draft.theme === t.id
            return (
              <button
                key={t.id} type="button" onClick={() => pickTheme(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                  background: active ? 'color-mix(in srgb, var(--color-accent) 16%, transparent)' : 'var(--color-bg)',
                  border: active ? '1.5px solid var(--color-accent)' : '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
                  color: active ? 'var(--color-accent)' : 'var(--color-text)',
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                }}
              >
                <span style={{ display: 'flex' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.bg, border: '1px solid rgba(255,255,255,0.25)' }} />
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.a, marginLeft: -5 }} />
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.b, marginLeft: -5 }} />
                </span>
                {t.label}
              </button>
            )
          })}
        </div>
      </Field>
    </Panel>
  )
}
