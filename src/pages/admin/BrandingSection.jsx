import { Panel, Text, Uploader, Saver, Field, Toggle } from './ui'
import { useEditor } from './useEditor'
import { THEME_OPTIONS_BY_TEMPLATE, TEMPLATE_OPTIONS } from '../../lib/defaults'
import { useThemeStore } from '../../store/themeStore'

/* Branding — logo (replaces the hero artist name), name, tagline, the site
   template (which whole front-end visitors see), and the theme. */
export function BrandingSection({ site, onSaved }) {
  const { draft, set, dirty, saving, savedAt, save } = useEditor('site', site, onSaved)
  const setTheme = useThemeStore(s => s.setTheme)

  const template = draft.template || 'classic'
  const themeOpts = THEME_OPTIONS_BY_TEMPLATE[template] || THEME_OPTIONS_BY_TEMPLATE.classic

  function pickTemplate(id) {
    const opts = THEME_OPTIONS_BY_TEMPLATE[id] || []
    const patch = { template: id }
    // keep the theme valid for the new template
    if (!opts.some(o => o.id === draft.theme)) patch.theme = opts[0]?.id
    set(patch)
  }

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
            type="range" min={40} max={600} step={5}
            value={draft.logoHeight || 90}
            onChange={e => set({ logoHeight: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
          />
        </Field>
      )}

      <Text label="Artist name" value={draft.artistName} onChange={v => set({ artistName: v })} placeholder="Artist Name" />
      <Text label="Tagline" value={draft.tagline} onChange={v => set({ tagline: v })} hint="The line under the hero title." />
      <Text label="YouTube channel URL" value={draft.youtubeUrl} onChange={v => set({ youtubeUrl: v })} placeholder="https://youtube.com/@yourchannel" hint="When set, a “Go to YouTube” button appears on the home Videos section." />

      <Field label="Site template" hint="The entire front-end style visitors see. Switching changes the whole site; reload the public site to see it. Each template has its own themes.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {TEMPLATE_OPTIONS.map(t => {
            const active = template === t.id
            return (
              <button
                key={t.id} type="button" onClick={() => pickTemplate(t.id)}
                style={{
                  flex: '1 1 200px', textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: active ? 'color-mix(in srgb, var(--color-accent) 16%, transparent)' : 'var(--color-bg)',
                  border: active ? '1.5px solid var(--color-accent)' : '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.04em', color: active ? 'var(--color-accent)' : 'var(--color-text)' }}>
                  {t.label}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.4, color: 'var(--color-muted)' }}>
                  {t.desc}
                </div>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Theme" hint="Colour theme for the selected template's public site.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {themeOpts.map(t => {
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

      <Field label="Now Playing effects" hint="Audio-reactive effects on the player card while music plays. They can be combined — each adds its own GPU load.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Toggle
            checked={draft.npLightning !== false}
            onChange={v => set({ npLightning: v })}
            label="Lightning strikes"
          />
          <Toggle
            checked={draft.npEmbers === true}
            onChange={v => set({ npEmbers: v })}
            label="Ember drift — the card sheds glowing sparks"
          />
          <Toggle
            checked={draft.npPulse === true}
            onChange={v => set({ npPulse: v })}
            label="Pulse rings — shockwaves ripple out on beats"
          />
          <Toggle
            checked={draft.npOrbit === true}
            onChange={v => set({ npOrbit: v })}
            label="Comet orbit — lights race around the card"
          />
        </div>
      </Field>
    </Panel>
  )
}
