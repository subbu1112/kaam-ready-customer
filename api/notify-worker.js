// POST /api/notify-worker  { booking_id }
//
// Sends a OneSignal push notification to workers when a customer places a
// booking. The caller must send their Supabase JWT in the Authorization
// header — the booking is re-read through Supabase RLS, so users can only
// trigger notifications for their own bookings.
//
// Targeting:
//   1. Rebooking a preferred worker  → push straight to that worker (external_id)
//   2. Normal booking                → all workers tagged with the booking's city
//   3. No tagged workers reached yet → all subscribed workers (fallback so no
//      job goes unannounced while older installs haven't refreshed tags)
//
// Secrets are read from Vercel environment variables (Project Settings →
// Environment Variables). No keys are hardcoded here — GitHub push
// protection (correctly) blocks commits containing secrets.
// Required: SUPABASE_ANON_KEY, ONESIGNAL_WORKER_API_KEY
// Optional: SUPABASE_URL, ONESIGNAL_WORKER_APP_ID, WORKER_APP_URL

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ujwizsgiowsahoyajbkj.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const OS_APP_ID = process.env.ONESIGNAL_WORKER_APP_ID || '75b6ff8a-1d09-43d6-be4f-c97c42cfdd82'
const OS_API_KEY = process.env.ONESIGNAL_WORKER_API_KEY
const WORKER_APP_URL = process.env.WORKER_APP_URL || 'https://worker.thekaamready.in'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!SUPABASE_ANON_KEY || !OS_API_KEY) {
    return res.status(500).json({ error: 'Server not configured: set SUPABASE_ANON_KEY and ONESIGNAL_WORKER_API_KEY in Vercel env vars' })
  }

  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' })

  const bookingId = String((req.body || {}).booking_id || '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)) {
    return res.status(400).json({ error: 'Invalid booking_id' })
  }

  // Read the booking as the calling user — RLS enforces ownership.
  let booking
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=id,service,city,status,is_scheduled,scheduled_at,preferred_worker_id`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth } }
    )
    const rows = await r.json()
    booking = Array.isArray(rows) ? rows[0] : null
  } catch (e) {
    return res.status(502).json({ error: 'Could not verify booking' })
  }
  if (!booking) return res.status(404).json({ error: 'Booking not found' })

  const when = booking.is_scheduled && booking.scheduled_at
    ? new Date(booking.scheduled_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
      })
    : null

  const base = {
    app_id: OS_APP_ID,
    headings: { en: booking.preferred_worker_id ? 'A customer requested YOU! ⭐' : 'New job request 🔔' },
    contents: {
      en: `${booking.service || 'Service'} in ${booking.city || 'your city'}` +
          (when ? ` — scheduled for ${when}.` : ' — needed now.') +
          ' Open KaamReady to accept.',
    },
    url: WORKER_APP_URL,
    data: { booking_id: booking.id, city: booking.city || '' },
  }

  const send = async (target) => {
    const r = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${OS_API_KEY}` },
      body: JSON.stringify({ ...base, ...target }),
    })
    return r.json()
  }

  const attempts = []
  let result = null

  // 1) Preferred worker (rebooking) → direct push
  if (booking.preferred_worker_id) {
    result = await send({
      include_aliases: { external_id: [booking.preferred_worker_id] },
      target_channel: 'push',
    })
    attempts.push({ target: 'preferred_worker', recipients: result?.recipients ?? 0, errors: result?.errors })
  }

  // 2) City-tagged workers
  if (!result || !result.id || result.recipients === 0) {
    result = await send({
      filters: [{ field: 'tag', key: 'city', relation: '=', value: booking.city || '' }],
    })
    attempts.push({ target: 'city_tag', recipients: result?.recipients ?? 0, errors: result?.errors })
  }

  // 3) Fallback: every subscribed worker (older installs without tags yet)
  if (!result?.id || result.recipients === 0) {
    result = await send({ included_segments: ['Total Subscriptions'] })
    attempts.push({ target: 'all_subscribed', recipients: result?.recipients ?? 0, errors: result?.errors })
  }

  return res.status(200).json({
    ok: !!result?.id,
    recipients: result?.recipients ?? 0,
    attempts,
  })
}
