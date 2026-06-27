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
window.addEventListener('unhandledrejection', (e) => {
  const msg = String((e.reason && (e.reason.message || e.reason)) || '')
  if (msg === 'Rejected' || msg.toLowerCase().includes('serviceworker')) {
    e.preventDefault()
  }
})

// Auto-recover from stale lazy-loaded chunks after a new deploy: when an old
// tab requests a chunk hash that no longer exists, reload ONCE to pick up the
// fresh build instead of showing a broken/blank screen.
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('kr_reloaded_stale')) {
    sessionStorage.setItem('kr_reloaded_stale', '1')
    window.location.reload()
  }
})

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
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
