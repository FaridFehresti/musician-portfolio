import { Panel, Text, Area, Uploader, Saver, Field, Btn } from './ui'
import { useEditor } from './useEditor'
import { SocialIcon } from '../../components/icons/SocialIcons'
import { SOCIAL_OPTIONS, normalizeIconKey } from '../../components/icons/socialMeta'

/* ── A reusable editor for an array of objects (socials, links, why-cards) ── */
function RowList({ items, columns, onChange, blank, addLabel }) {
  const list = items || []
  const update = (i, key, val) => onChange(list.map((it, j) => (j === i ? { ...it, [key]: val } : it)))
  const remove = (i) => onChange(list.filter((_, j) => j !== i))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const copy = [...list]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    onChange(copy)
  }
  const inputStyle = {
    flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 8,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
    fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
  }
  return (
    <div>
      {list.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          {columns.map(col => (
            <input
              key={col.key}
              style={{ ...inputStyle, flex: col.flex || 1 }}
              placeholder={col.placeholder}
              value={it[col.key] ?? ''}
              onChange={e => update(i, col.key, e.target.value)}
            />
          ))}
          <button type="button" onClick={() => move(i, -1)} title="Move up" style={iconBtn}>↑</button>
          <button type="button" onClick={() => move(i, 1)} title="Move down" style={iconBtn}>↓</button>
          <button type="button" onClick={() => remove(i)} title="Remove" style={{ ...iconBtn, color: '#ff5470' }}>✕</button>
        </div>
      ))}
      <Btn variant="ghost" onClick={() => onChange([...list, { ...blank }])} style={{ marginTop: 6 }}>+ {addLabel}</Btn>
    </div>
  )
}
const iconBtn = {
  width: 30, height: 30, flexShrink: 0, borderRadius: 8, cursor: 'pointer',
  background: 'var(--color-bg)', border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
  color: 'var(--color-muted)', fontSize: 13,
}

/* ── About ─────────────────────────────────────────────────────────── */
export function AboutSection({ about, onSaved }) {
  const { draft, set, setDraft, dirty, saving, savedAt, save } = useEditor('about', about, onSaved)
  const bio = draft.bio || []
  const setBio = (next) => setDraft(d => ({ ...d, bio: next }))

  return (
    <Panel title="About page" actions={<Saver onSave={save} dirty={dirty} saving={saving} savedAt={savedAt} />}>
      <Text label="Section label" value={draft.label} onChange={v => set({ label: v })} />
      <Area label="Pull quote" value={draft.quote} onChange={v => set({ quote: v })} rows={2} />
      <Uploader label="Portrait photo" type="portrait" accept="image/*" value={draft.portraitUrl} onChange={url => set({ portraitUrl: url })} />

      <Field label="Biography paragraphs">
        {bio.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <textarea
              rows={3}
              value={p}
              onChange={e => setBio(bio.map((x, j) => (j === i ? e.target.value : x)))}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, lineHeight: 1.6, resize: 'vertical',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
                fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
              }}
            />
            <button type="button" onClick={() => setBio(bio.filter((_, j) => j !== i))} style={{ ...iconBtn, color: '#ff5470', alignSelf: 'flex-start' }}>✕</button>
          </div>
        ))}
        <Btn variant="ghost" onClick={() => setBio([...bio, ''])} style={{ marginTop: 4 }}>+ Add paragraph</Btn>
      </Field>

      <Text
        label="Genre tags"
        hint="Comma separated — shown big on the About page."
        value={(draft.genres || []).join(', ')}
        onChange={v => set({ genres: v.split(',').map(s => s.trim()).filter(Boolean) })}
      />
    </Panel>
  )
}

/* ── Socials ───────────────────────────────────────────────────────────
   Each row picks a brand icon from a dropdown (with a live preview), plus a
   label + URL. */
export function SocialsSection({ socials, onSaved }) {
  const { draft, setDraft, dirty, saving, savedAt, save } = useEditor('socials', socials, onSaved)
  const list = draft || []
  const update = (i, key, val) => setDraft(list.map((it, j) => (j === i ? { ...it, [key]: val } : it)))
  const remove = (i) => setDraft(list.filter((_, j) => j !== i))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const copy = [...list]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    setDraft(copy)
  }
  const add = () => setDraft([...list, { icon: 'soundcloud', label: '', href: '' }])

  const input = {
    minWidth: 0, padding: '8px 10px', borderRadius: 8,
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
    fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
  }

  return (
    <Panel title="Social links" desc="Pick a platform icon, set the label and URL. Shown on the About page." actions={<Saver onSave={save} dirty={dirty} saving={saving} savedAt={savedAt} />}>
      {list.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            width: 36, height: 36, flexShrink: 0, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-bg)', border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)', color: 'var(--color-accent)',
          }}>
            <SocialIcon name={it.icon} size={18} />
          </span>
          <select value={normalizeIconKey(it.icon)} onChange={e => update(i, 'icon', e.target.value)} style={{ ...input, flex: 1, cursor: 'pointer' }}>
            {SOCIAL_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <input style={{ ...input, flex: 1.2 }} placeholder="Label" value={it.label ?? ''} onChange={e => update(i, 'label', e.target.value)} />
          <input style={{ ...input, flex: 2.4 }} placeholder="https://…" value={it.href ?? ''} onChange={e => update(i, 'href', e.target.value)} />
          <button type="button" onClick={() => move(i, -1)} title="Move up" style={iconBtn}>↑</button>
          <button type="button" onClick={() => move(i, 1)} title="Move down" style={iconBtn}>↓</button>
          <button type="button" onClick={() => remove(i)} title="Remove" style={{ ...iconBtn, color: '#ff5470' }}>✕</button>
        </div>
      ))}
      <Btn variant="ghost" onClick={add} style={{ marginTop: 6 }}>+ Add social</Btn>
    </Panel>
  )
}

/* ── Custom links ──────────────────────────────────────────────────── */
export function LinksSection({ links, onSaved }) {
  const { draft, setDraft, dirty, saving, savedAt, save } = useEditor('links', links, onSaved)
  return (
    <Panel title="Custom links" desc="Extra links (shop, press kit, merch…). Shown on the About page." actions={<Saver onSave={save} dirty={dirty} saving={saving} savedAt={savedAt} />}>
      <RowList
        items={draft}
        onChange={setDraft}
        columns={[
          { key: 'label', placeholder: 'Merch store', flex: 1 },
          { key: 'href', placeholder: 'https://…', flex: 2.5 },
        ]}
        blank={{ label: '', href: '' }}
        addLabel="Add link"
      />
    </Panel>
  )
}

/* ── Donations ─────────────────────────────────────────────────────── */
export function DonationSection({ donation, onSaved }) {
  const { draft, set, setDraft, dirty, saving, savedAt, save } = useEditor('donation', donation, onSaved)
  return (
    <Panel title="Donations" desc="The Support page. Tips go through a single Checkya link — no preset amounts." actions={<Saver onSave={save} dirty={dirty} saving={saving} savedAt={savedAt} />}>
      <Text label="Heading" value={draft.heading} onChange={v => set({ heading: v })} />
      <Area label="Subtext" value={draft.subtext} onChange={v => set({ subtext: v })} rows={2} />
      <Text
        label="Checkya link"
        hint="Your Checkya tip / payment page. This is the only place money is collected."
        value={draft.checkyaUrl}
        onChange={v => set({ checkyaUrl: v })}
        placeholder="https://checkya.com/your-handle"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Text label="Button label" value={draft.buttonLabel} onChange={v => set({ buttonLabel: v })} placeholder="Leave a tip" />
        <Text label="Note under button" value={draft.note} onChange={v => set({ note: v })} placeholder="Secure checkout via Checkya — no account needed." />
      </div>
      <Field label="“Why donate” cards">
        <RowList
          items={draft.why}
          onChange={why => setDraft(d => ({ ...d, why }))}
          columns={[
            { key: 'icon', placeholder: '🎙', flex: 0.4 },
            { key: 'title', placeholder: 'Title', flex: 1 },
            { key: 'text', placeholder: 'Short description', flex: 2.5 },
          ]}
          blank={{ icon: '', title: '', text: '' }}
          addLabel="Add card"
        />
      </Field>
    </Panel>
  )
}
