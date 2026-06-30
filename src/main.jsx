import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import OneSignal from 'react-onesignal'
import App from './App'
import './index.css'

// Optional browser features (push-permission prompts, service-worker
// registration) reject with "Rejected" / a ServiceWorker error when the user
// dismisses the prompt or the feature isn't available. These are expected and
// don't affect the app, so swallow them instead of letting them surface as
// unhandled promise rejections (which were being reported to Sentry as crashes).
// Some Android WebViews and privacy modes deny access to localStorage /
// sessionStorage (throwing "Access is denied for this document"), and old tabs
// can request chunk hashes that no longer exist after a deploy ("Failed to fetch
// dynamically imported module"). Both are benign noise — treat them as such.
const krBenign = (msg) => {
  const m = String(msg || '').toLowerCase()
  return (
    m.includes('dynamically imported module') ||
    m.includes('module script failed') ||
    m.includes('access is denied for this document') ||
    ((m.includes('localstorage') || m.includes('sessionstorage')) && m.includes('denied'))
  )
}

// Reload exactly once to pick up the fresh build. Uses a URL flag (not storage)
// so it still works — and can't loop — when storage access is blocked.
const krReloadOnce = () => {
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.get('kr_r') === '1') return
    url.searchParams.set('kr_r', '1')
    window.location.replace(url.toString())
  } catch { /* ignore */ }
}

window.addEventListener('unhandledrejection', (e) => {
  const msg = String((e.reason && (e.reason.message || e.reason)) || '')
  const m = msg.toLowerCase()
  if (msg === 'Rejected' || m.includes('serviceworker')) { e.preventDefault(); return }
  if (m.includes('dynamically imported module') || m.includes('module script failed')) {
    e.preventDefault()
    krReloadOnce()
  }
})

window.addEventListener('vite:preloadError', (e) => {
  if (e && e.preventDefault) e.preventDefault()
  krReloadOnce()
})

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    const raw = (hint && hint.originalException) || ''
    const msg =
      (raw && (raw.message || raw)) ||
      (event.exception && event.exception.values && event.exception.values[0] && event.exception.values[0].value) ||
      ''
    if (krBenign(msg)) return null
    return event
  },
})

// Self-heal: unregister any previously-deployed custom service worker (/sw.js)
// and clear its caches. A caching SW could break navigation for returning
// visitors. OneSignal's own push worker is left untouched.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => {
      const url = (r.active && r.active.scriptURL) || ''
      if (url.endsWith('/sw.js')) r.unregister()
    }))
    .catch(() => {})
  if (window.caches) {
    caches.keys().then((ks) => ks.forEach((k) => { if (k.startsWith('kr-') || k.startsWith('kaam-ready')) caches.delete(k) })).catch(() => {})
  }
}

OneSignal.init({
  appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
  allowLocalhostAsSecureOrigin: true,
}).catch(console.error)

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
