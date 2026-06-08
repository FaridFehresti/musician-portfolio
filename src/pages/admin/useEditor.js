import { useState, useCallback } from 'react'
import { api } from '../../lib/api'

/* Per-section draft state + save. `source` is the canonical value from the
   server; the editor keeps a local draft, tracks whether it diverged, and
   PUTs it under `sectionKey` on save. Works for object and array sections.

   When the server pushes a fresh `source` (initial load / after a save) its
   identity changes, so we resync the draft during render — React's
   adjust-state-while-rendering pattern, which avoids the setState-in-effect
   cascade. While editing, `source` is stable so the draft is preserved. */
export function useEditor(sectionKey, source, onSaved) {
  const [draft, setDraft] = useState(source)
  const [baseline, setBaseline] = useState(source)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(0)

  if (baseline !== source) {
    setBaseline(source)
    setDraft(source)
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(source)

  const set = useCallback((patch) => setDraft(d => ({ ...d, ...patch })), [])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const content = await api.saveSettings({ [sectionKey]: draft })
      onSaved?.(content)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }, [sectionKey, draft, onSaved])

  return { draft, setDraft, set, dirty, saving, savedAt, save }
}
