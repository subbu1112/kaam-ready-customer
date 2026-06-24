import { sb } from './supabase'

// Defaults are used as a fallback until the live values load (or if the
// network call fails). Admin panel -> Settings overrides these at runtime.
export const SETTINGS_DEFAULTS = {
  commission_pct:   '10',
  upi_handle:       'kaamready@ybl',
  support_phone:    '18005747435',
  support_email:    'support@kaamready.in',
  support_whatsapp: '918012345678',
}

let cache = null
let inflight = null

export async function loadSettings() {
  if (cache) return cache
  if (!inflight) {
    inflight = sb.from('app_settings').select('key,value')
      .then(({ data }) => {
        const map = { ...SETTINGS_DEFAULTS }
        ;(data || []).forEach(r => {
          if (r && r.value != null && String(r.value).trim() !== '') map[r.key] = r.value
        })
        cache = map
        return map
      })
      .catch(() => ({ ...SETTINGS_DEFAULTS }))
  }
  return inflight
}

// Synchronous best-effort read (returns default until loadSettings resolves)
export function getSetting(key) {
  return (cache && cache[key]) ?? SETTINGS_DEFAULTS[key]
}
