import { useState, useRef, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import MapView from '../components/MapView'
import LocationPicker from '../components/LocationPicker'
import { serviceFloor } from '../constants'
import { loadSettings, getSetting } from '../lib/settings'
import { CUSTOMER_CANCEL_REASONS } from '../lib/cancelReasons'
import { staffingLabel } from '../lib/status'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', GREEN='#22c55e'

// Flow: 0 describe · 1 searching · 2 worker working · 3 approve price & pay · 4 no workers · 5 waiting verify · 6 done · 7 scheduled
export default function BookScreen({ user, profile, city, selSvc, setTab, showToast, loadBookings, resume, clearResume, rebookWorker, clearRebook }) {
  const [step,        setStep]        = useState(0)
  const [desc,        setDesc]        = useState('')
  // Exact service location for THIS booking — never inherited silently from the
  // profile address, because the worker navigates to these coordinates and the
  // distance on their job card is measured from them.
  const [loc,         setLoc]         = useState({ lat:null, lng:null, address:'', landmark:'', source:null, confirmed:false })
  const [workersNeed, setWorkersNeed] = useState(1)
  const [crew,        setCrew]        = useState([])
  const [when,        setWhen]        = useState('now')
  const [schedAt,     setSchedAt]     = useState('')
  const [worker,      setWorker]      = useState(null)
  const [booking,     setBooking]     = useState(null)
  const [rating,      setRating]      = useState(0)
  const [paying,      setPaying]      = useState(false)
  const [utr,         setUtr]         = useState('')
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelCode,  setCancelCode]  = useState('')
  const [cancelNote,  setCancelNote]  = useState('')
  const [cancelBusy,  setCancelBusy]  = useState(false)
  const timer = useRef(null), chanRef = useRef(null), workerRef = useRef(null), pollRef = useRef(null)

  useEffect(() => () => { clearTimeout(timer.current); if (pollRef.current) clearInterval(pollRef.current); if (chanRef.current) chanRef.current.unsubscribe() }, [])

  // Load admin-controlled settings (UPI handle, etc.) once on mount
  useEffect(() => { loadSettings() }, [])

  function stopPoll() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  // Single source of truth for moving the customer to the right step based on the
  // booking row. Idempotent + silent, so the realtime handler, the initial catch-up
  // fetch, and the polling fallback can all call it without spamming toasts.
  function syncBookingStep(b) {
    if (!b) return
    setBooking(prev => ({ ...(prev || {}), ...b }))
    if (b.payment_status === 'verified') { clearTimeout(timer.current); stopPoll(); setStep(6); loadBookings?.(); return }
    if (b.payment_status === 'pending_verification') { clearTimeout(timer.current); stopPoll(); setStep(5); return }
    if (b.status === 'priced' && b.amount) { clearTimeout(timer.current); stopPoll(); setStep(3); return }
    if ((b.status === 'assigned' || b.status === 'otp_verified') && b.worker_id) {
      clearTimeout(timer.current)
      if (!workerRef.current) {
        sb.from('workers_public').select('*').eq('id', b.worker_id).single()
          .then(({ data }) => { const w = data || b.worker || {}; workerRef.current = w; setWorker(w) })
      }
      setStep(2); return
    }
    if (['cancelled','customer_cancelled','worker_cancelled','expired','rejected'].includes(b.status)) {
      clearTimeout(timer.current); stopPoll(); setStep(4)
    }
  }

  async function loadCrew(id) {
    if (!id) return
    const { data } = await sb.from('booking_workers')
      .select('worker_id,worker_name,worker_phone,status,is_primary,assigned_at,cancellation_reason')
      .eq('booking_id', id).order('assigned_at')
    setCrew(data || [])
  }

  function subscribeBooking(id) {
    if (chanRef.current) chanRef.current.unsubscribe()
    const prevWorker = () => workerRef.current
    const ch = sb.channel('booking-'+id)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings', filter:'id=eq.'+id }, payload => {
        const b = payload.new
        const wasUnassigned = !prevWorker()
        syncBookingStep(b)
        // One-time, friendly toasts on the key transitions (realtime only).
        if (b.status==='assigned' && b.worker_id && wasUnassigned) showToast('A worker is on the way! 🎉')
        else if (b.status==='priced' && b.amount && !b.payment_status) showToast('Work done — review and pay ₹'+b.amount)
        else if (b.payment_status==='verified') showToast('Payment verified! Job complete ✓')
      }).subscribe()
    chanRef.current = ch
    // Catch any change that happened before the channel went live (race), then poll
    // every 5s as a safety net so the customer never gets stuck on "searching".
    sb.from('bookings').select('*').eq('id', id).single().then(({ data }) => syncBookingStep(data))
    loadCrew(id)
    stopPoll()
    pollRef.current = setInterval(() => {
      sb.from('bookings').select('*').eq('id', id).single().then(({ data }) => syncBookingStep(data))
      loadCrew(id)
    }, 5000)
    return ch
  }

  useEffect(() => {
    if (!resume?.id) return
    let cancelled = false
    ;(async () => {
      setBooking(resume)
      if (resume.worker_id) {
        const { data: w } = await sb.from('workers_public').select('*').eq('id', resume.worker_id).single()
        if (cancelled) return
        if (w) { workerRef.current = w; setWorker(w) }
      }
      if (resume.payment_status==='pending_verification') setStep(5)
      else if (resume.payment_status==='verified')        setStep(6)
      else if (resume.status==='priced')                  setStep(3)
      else if (resume.status==='searching' && !resume.worker_id) setStep(1)
      else                                                setStep(2)
      subscribeBooking(resume.id)
      clearResume && clearResume()
    })()
    return () => { cancelled = true }
  }, [resume?.id])

  // Fire a device notification + on-screen confirmation the moment a booking is
  // placed. Client-side only (works while the app is open); if the customer
  // hasn't granted notification permission we ask once, then fall back to the
  // on-screen toast.
  function notifyBooked(b) {
    const title = 'Booking placed ✓'
    const body = b?.status === 'scheduled'
      ? `${b?.service || 'Service'} scheduled — we'll assign a worker soon.`
      : `${b?.service || 'Service'} — finding a verified worker near you now.`
    try {
      if (typeof Notification === 'undefined') return
      const show = () => { try { new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' }) } catch (e) {} }
      if (Notification.permission === 'granted') show()
      else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') show() })
    } catch (e) {}
  }

  // Server-side push to workers' devices (works even when their app is
  // closed). Fire-and-forget: booking flow never blocks on this.
  async function pushToWorkers(b) {
    try {
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.access_token || !b?.id) return
      fetch('/api/notify-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ booking_id: b.id }),
      }).catch(() => {})
    } catch (e) { /* non-blocking */ }
  }

  async function findWorkers() {
    const scheduled = when==='later' && schedAt
    if (when==='later' && !schedAt) { showToast('Pick a date & time'); return }
    // Hard gate: no booking goes out without a location the customer looked at
    // and confirmed. Guessing from the profile address is what sent workers to
    // the wrong door.
    if (!loc.confirmed || !loc.lat || !loc.lng) {
      showToast('Please confirm your exact service location first')
      return
    }
    if (!String(loc.address || '').trim()) { showToast('Add the address for the service location'); return }

    setStep(1)
    showToast('Finding workers nearby...')
    const { data: prof } = await sb.from('profiles').select('name, full_name, phone').eq('id', user?.id).maybeSingle()
    const { data, error } = await sb.from('bookings').insert({
      user_id: user?.id, service: selSvc?.lbl, service_id: selSvc?.id,
      description: desc||'(No description)',
      address: loc.address.trim(), landmark: loc.landmark?.trim() || null, city,
      status: scheduled ? 'scheduled' : 'searching',
      is_scheduled: !!scheduled, scheduled_at: scheduled ? new Date(schedAt).toISOString() : null,
      address_lat: loc.lat, address_lng: loc.lng,
      location_source: loc.source || 'map',
      location_accuracy_m: loc.accuracy ?? null,
      location_confirmed_at: new Date().toISOString(),
      workers_required: Math.max(1, Math.min(Number(workersNeed) || 1, 50)),
      customer_name: prof?.name || prof?.full_name || profile?.name || null,
      customer_phone: prof?.phone || profile?.phone || null,
      preferred_worker_id: rebookWorker?.id || null,
    }).select().single()
    if (error) { showToast('Error: '+error.message); setStep(0); return }
    setBooking(data)
    notifyBooked(data)
    pushToWorkers(data) // push notification to workers' devices via OneSignal
    if (scheduled) {
      showToast('Booking scheduled ✓ — we\'ll assign a worker soon')
      await loadBookings()
      clearRebook && clearRebook()
      setStep(7)
      subscribeBooking(data.id)
      return
    }
    showToast('Booking placed ✓ — finding a verified worker near you')
    subscribeBooking(data.id)
    clearRebook && clearRebook()
    // Give a multi-worker request longer to fill, and never expire one that
    // already has workers on it.
    const searchWindow = (Number(workersNeed) || 1) > 1 ? 420000 : 180000
    timer.current = setTimeout(async () => {
      const { data: fresh } = await sb.from('bookings')
        .select('status,workers_accepted').eq('id', data.id).single()
      if (fresh && (fresh.status !== 'searching' || (fresh.workers_accepted || 0) > 0)) return
      if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
      await sb.from('bookings').update({ status:'expired' }).eq('id', data.id)
      setStep(4)
    }, searchWindow)
  }

  function upiLink() {
    const amt = booking?.amount || 0
    const pa  = getSetting('upi_handle') || 'kaamready@ybl'
    const pn  = encodeURIComponent('KaamReady')
    const tn  = encodeURIComponent('KaamReady - '+(selSvc?.lbl||'Service')+' #'+((booking?.id||'').slice(0,8).toUpperCase()))
    return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`
  }

  async function openUpiApp() {
    window.location.href = upiLink()
  }

  async function markPaid() {
    if (!booking?.id || paying) return
    const ref = utr.trim()
    if (ref.length < 6) { showToast('Enter the UPI reference / UTR number from your payment app'); return }
    setPaying(true)
    const { error } = await sb.from('bookings').update({
      payment_status:'pending_verification',
      payment_method:'upi',
      payment_id: ref,
      customer_paid_at:new Date().toISOString(),
    }).eq('id', booking.id)
    setPaying(false)
    if (error) { showToast(error.message); return }
    setStep(5)
    showToast('Payment submitted — admin will verify shortly ⏳')
  }

  function loadRazorpay() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = () => resolve(true)
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })
  }

  // Razorpay UPI — auto-verified. Opens Checkout, then a Supabase Edge Function
  // verifies the signature server-side and marks the booking paid + credits the
  // worker. No manual admin step, no UTR typing.
  async function payWithRazorpay() {
    if (!booking?.id || paying) return
    setPaying(true)
    const ok = await loadRazorpay()
    if (!ok) { setPaying(false); showToast('Could not load payment — check your connection'); return }
    const { data: order, error } = await sb.functions.invoke('razorpay', { body: { action: 'create_order', booking_id: booking.id } })
    if (error || order?.error || !order?.order_id) { setPaying(false); showToast(order?.error || 'Could not start payment'); return }
    const rzp = new window.Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: 'KaamReady',
      description: order.service || 'Service payment',
      theme: { color: '#F5C000' },
      handler: async (resp) => {
        const { data: v, error: ve } = await sb.functions.invoke('razorpay', { body: {
          action: 'verify', booking_id: booking.id,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        } })
        setPaying(false)
        if (ve || v?.error || !v?.verified) { showToast('Payment received — confirming…'); return }
        showToast('Payment successful! ✓')
        // syncBookingStep (realtime + poll) will advance to the "done" screen.
      },
      modal: { ondismiss: () => setPaying(false) },
    })
    rzp.on('payment.failed', () => { setPaying(false); showToast('Payment failed — please try again') })
    rzp.open()
  }

  // Customer asks the worker to revise the quotation. Sends the job back to
  // 'assigned' (OTP stays verified) so the worker can re-enter the breakdown.
  // The worker is notified via a DB trigger on the priced→assigned transition.
  async function requestModification() {
    if (!booking?.id) return
    const { error } = await sb.from('bookings').update({ status:'assigned' }).eq('id', booking.id)
    if (error) { showToast(error.message); return }
    setBooking(prev => ({ ...(prev||{}), status:'assigned' }))
    setStep(2)
    showToast('Asked the worker to revise the price ✏️')
  }

  function resetAll() {
    clearTimeout(timer.current)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
    workerRef.current = null
    setStep(0); setDesc(''); setWorker(null); setBooking(null); setRating(0)
    setLoc({ lat:null, lng:null, address:'', landmark:'', source:null, confirmed:false })
    setWorkersNeed(1); setCrew([])
    setCancelModal(false); setCancelCode(''); setCancelNote('')
  }

  async function confirmCancel() {
    if (cancelBusy) return
    if (!cancelCode) { showToast('Please select a reason for cancelling'); return }
    if (cancelCode === 'other' && !cancelNote.trim()) { showToast('Please tell us the reason'); return }

    if (booking?.id) {
      setCancelBusy(true)
      const reason = CUSTOMER_CANCEL_REASONS.find(r => r.code === cancelCode)
      // One server call: it records the reason, releases every assigned worker,
      // writes the audit row and notifies the worker. A client-side update
      // could not notify the worker at all (notifications are owner-only).
      const { error } = await sb.rpc('cancel_booking_customer', {
        p_booking_id: booking.id,
        p_reason_code: cancelCode,
        p_reason_label: reason?.label || cancelCode,
        p_note: cancelNote.trim() || null,
      })
      setCancelBusy(false)
      if (error) { showToast(error.message.replace(/^.*?:\s*/, '')); return }
      showToast('Booking cancelled ✓')
      await loadBookings?.()
    }
    resetAll()
    setTab('home')
  }

  const floor = serviceFloor(selSvc?.id)
  const dots  = step>=5 ? 3 : step===4 ? 1 : Math.min(step,3)
  const bookingRef = booking?.id ? '#KR-' + booking.id.slice(0,8).toUpperCase() : null

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      {/* Cancel confirmation modal */}
      {cancelModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:'22px 22px 0 0', padding:'20px 20px 30px', width:'100%', maxWidth:430, maxHeight:'88vh', overflowY:'auto' }}>
            <p style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>Cancel this booking?</p>
            <p style={{ fontSize:13, color:'#666', marginBottom:16 }}>
              {booking?.worker_id
                ? 'The worker will be notified straight away. Please tell us why:'
                : 'Please tell us why so we can improve:'}
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {CUSTOMER_CANCEL_REASONS.map(r => (
                <button key={r.code} onClick={() => setCancelCode(r.code)}
                  style={{ display:'flex', alignItems:'center', gap:10, textAlign:'left',
                    background: cancelCode===r.code ? YL : '#fff',
                    border:'1.5px solid '+(cancelCode===r.code ? Y : '#E5E5EA'),
                    borderRadius:12, padding:'12px 14px', fontSize:14, fontWeight:600,
                    cursor:'pointer', fontFamily:'inherit' }}>
                  <span style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                    border:'2px solid '+(cancelCode===r.code ? YD : '#CFCFD4'),
                    background: cancelCode===r.code ? YD : 'transparent' }} />
                  {r.label}
                </button>
              ))}
            </div>

            {cancelCode === 'other' && (
              <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value.slice(0, 300))} rows={3}
                autoFocus placeholder="Tell us what happened…"
                style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:12, fontSize:14,
                  outline:'none', fontFamily:'inherit', resize:'none', marginBottom:14, boxSizing:'border-box' }} />
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setCancelModal(false); setCancelCode(''); setCancelNote('') }}
                style={{ flex:1, background:'#f2f2f7', border:'none', borderRadius:12, padding:14, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                Keep Booking
              </button>
              <button onClick={confirmCancel} disabled={cancelBusy || !cancelCode}
                style={{ flex:1, background:'#ef4444', color:'#fff', border:'none', borderRadius:12, padding:14,
                  fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit',
                  opacity:(cancelBusy || !cancelCode) ? .5 : 1 }}>
                {cancelBusy ? 'Cancelling…' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background:Y, borderRadius:16, padding:'14px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700 }}>{selSvc?.ico} {selSvc?.lbl} Request</p>
            <p style={{ fontSize:11, color:'rgba(0,0,0,.6)' }}>
              📍 {city}
              {bookingRef && <span style={{ marginLeft:8, fontFamily:'monospace', fontWeight:800 }}>{bookingRef}</span>}
            </p>
          </div>
          {step > 0 && step < 5 && step !== 6 && (
            <button onClick={() => setCancelModal(true)}
              style={{ background:'rgba(0,0,0,.14)', border:'none', borderRadius:9, padding:'7px 13px',
                cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'inherit', whiteSpace:'nowrap' }}>
              ✕ Cancel Booking
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:10 }}>
          {['Describe','Searching','Working','Pay'].map((_,i) => (
            <div key={i} style={{ height:8, borderRadius:4, transition:'.2s', background:dots>=i?'#000':'rgba(0,0,0,.2)', width:dots===i?22:8 }} />
          ))}
        </div>
      </div>

      {step===0 && <>
        {/* 1 — Service (already chosen on the home screen) */}
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:8 }}>Service</p>
          <p style={{ fontSize:16, fontWeight:800 }}>{selSvc?.ico} {selSvc?.lbl}</p>
        </Card>

        {/* 2 — Exact service location */}
        <Card>
          <LocationPicker user={user} city={city} value={loc} onChange={setLoc}
            onConfirm={() => showToast('Service location confirmed ✓')} showToast={showToast} />
        </Card>

        {/* 3 — Workers required */}
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:4 }}>Workers Required</p>
          <p style={{ fontSize:12, color:'#888', marginBottom:12 }}>
            How many people do you need for this job?
          </p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setWorkersNeed(n)}
                style={{ flex:'1 1 56px', background: workersNeed===n ? Y : '#f5f5f5', border:'none',
                  borderRadius:12, padding:'13px 0', fontWeight:800, fontSize:16, cursor:'pointer', fontFamily:'inherit' }}>
                {n}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, color:'#888', flexShrink:0 }}>Need more?</span>
            <input type="number" min={1} max={50} value={workersNeed}
              onChange={e => setWorkersNeed(Math.max(1, Math.min(50, Number(e.target.value.replace(/\D/g,'')) || 1)))}
              style={{ width:80, border:'1.5px solid #E5E5EA', borderRadius:10, padding:'9px 12px',
                fontSize:15, fontWeight:700, outline:'none', fontFamily:'inherit', textAlign:'center' }} />
            <span style={{ fontSize:13, color:'#555' }}>worker{workersNeed>1?'s':''}</span>
          </div>
          {workersNeed > 1 && (
            <p style={{ fontSize:11, color:YD, marginTop:10, background:YL, borderRadius:8, padding:'8px 10px' }}>
              We'll keep the request open until {workersNeed} workers have accepted. You'll see each one
              confirm as they join.
            </p>
          )}
        </Card>

        {/* 4 — Booking details */}
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:12 }}>Booking Details</p>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Fan not working..." rows={3}
            style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:13, fontSize:14, outline:'none', fontFamily:'inherit', resize:'none' }} />
        </Card>
        {rebookWorker && (
          <Card style={{ border:'2px solid '+Y, background:YL }}>
            <p style={{ fontSize:13, fontWeight:700 }}>🔁 Rebooking {rebookWorker.name}</p>
            <p style={{ fontSize:11, color:'#888', marginTop:2 }}>This worker gets your request first</p>
          </Card>
        )}
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:10 }}>When?</p>
          <div style={{ display:'flex', gap:8, marginBottom: when==='later' ? 12 : 0 }}>
            {[['now','⚡ Now'],['later','📅 Schedule']].map(([v,lb]) => (
              <button key={v} onClick={() => setWhen(v)}
                style={{ flex:1, background: when===v ? Y : '#f5f5f5', border:'none', borderRadius:10, padding:11, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>{lb}</button>
            ))}
          </div>
          {when==='later' && (
            <input type="datetime-local" value={schedAt} onChange={e => setSchedAt(e.target.value)}
              min={new Date(Date.now()+30*60*1000).toISOString().slice(0,16)}
              style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:12, fontSize:14, outline:'none', fontFamily:'inherit' }} />
          )}
        </Card>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, color:'#555' }}>Estimated cost</span>
            <span style={{ fontSize:17, fontWeight:800 }}>{selSvc?.range}</span>
          </div>
          <p style={{ fontSize:11, color:'#bbb', marginTop:4 }}>Final price set by the worker after the job — you approve it before paying. UPI payment only, no cash.</p>
        </Card>
        {!loc.confirmed && (
          <p style={{ fontSize:12, color:'#B8900A', background:'#FFF8D6', borderRadius:10, padding:'10px 12px' }}>
            ⚠️ Confirm your exact service location above to continue.
          </p>
        )}
        <Btn
          label={when==='later' ? 'Confirm Booking 📅' : `Confirm Booking${workersNeed>1 ? ` · ${workersNeed} workers` : ''} →`}
          onClick={findWorkers}
          disabled={!loc.confirmed} />
      </>}

      {step===1 && (() => {
        const need = Math.max(Number(booking?.workers_required) || workersNeed || 1, 1)
        const have = Number(booking?.workers_accepted) || 0
        const pct  = need > 1 ? Math.max(8, Math.round((have / need) * 100)) : 65
        return (
          <Card style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🔍</div>
            <p style={{ fontWeight:800, fontSize:18 }}>
              {need > 1 ? 'Gathering your team…' : 'Finding workers nearby...'}
            </p>
            <p style={{ fontSize:13, color:'#888', marginTop:6 }}>
              {need > 1 ? `${have} of ${need} workers confirmed · ${city}` : `Checking availability in ${city}`}
            </p>
            <div style={{ background:'#f0f0f0', borderRadius:20, height:6, overflow:'hidden', marginTop:20 }}>
              <div style={{ background:Y, height:'100%', borderRadius:20, width:pct+'%', transition:'width .4s' }} />
            </div>
            {have > 0 && crew.filter(c => c.status === 'assigned').length > 0 && (
              <div style={{ marginTop:16, textAlign:'left' }}>
                {crew.filter(c => c.status === 'assigned').map(c => (
                  <div key={c.worker_id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0' }}>
                    <span style={{ fontSize:16 }}>👷</span>
                    <span style={{ fontSize:13, fontWeight:700 }}>{c.worker_name || 'Worker'}</span>
                    <span style={{ marginLeft:'auto', background:'#D1FAE5', color:'#065F46', fontSize:10,
                      fontWeight:700, padding:'2px 8px', borderRadius:6 }}>Confirmed</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })()}

      {step===2 && worker && <>
        <MapView
          workerLat={worker.lat} workerLng={worker.lng}
          customerLat={booking?.address_lat} customerLng={booking?.address_lng}
          style={{ borderRadius:16, height:180, overflow:'hidden', marginBottom:0 }}
        />
        <Card style={{ border:'2px solid '+Y }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <p style={{ fontWeight:800, fontSize:15 }}>✅ Worker Assigned!</p>
            <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8 }}>On the way</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, borderBottom:'1px solid #f0f0f0', marginBottom:12 }}>
            {worker.avatar_url
              ? <img src={worker.avatar_url} alt="" style={{ width:60, height:60, borderRadius:16, objectFit:'cover', flexShrink:0 }} />
              : <div style={{ width:60, height:60, borderRadius:16, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, flexShrink:0 }}>{worker.ico||'👷'}</div>}
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:800 }}>{worker.name}</p>
              <p style={{ fontSize:12, color:'#888', margin:'2px 0' }}>{worker.skill}</p>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <span style={{ background:'#FFF8D6', color:'#B8900A', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>★ {worker.rating||'5.0'}</span>
                <span style={{ background:'#f0f0f0', color:'#555', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6 }}>{worker.total_jobs||worker.jobs||0} jobs</span>
                {(worker.aadhar_verified || worker.aadhaar_verified)
                  ? <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>✓ Verified</span>
                  : <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>KYC pending</span>}
              </div>
            </div>
            <a href={'tel:+91'+(worker?.phone || booking?.worker?.phone || '')} style={{ width:40, height:40, borderRadius:12, background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, textDecoration:'none', flexShrink:0 }}>📞</a>
          </div>
          <div style={{ background:'#f9f9f9', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#555' }}>Starting price</span>
              <span style={{ fontSize:16, fontWeight:800 }}>from ₹{floor}</span>
            </div>
            <p style={{ fontSize:11, color:'#aaa', marginTop:4 }}>The worker will send the final price when the work is done. You approve it before paying via UPI.</p>
          </div>
        </Card>
        {/* Everyone else on this job (multi-worker bookings) */}
        {crew.filter(c => c.status === 'assigned' && c.worker_id !== worker?.id).length > 0 && (
          <Card>
            <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:10 }}>
              Your team ({crew.filter(c => c.status === 'assigned').length} of {booking?.workers_required || 1})
            </p>
            {crew.filter(c => c.status === 'assigned').map(c => (
              <div key={c.worker_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop:'1px solid #f5f5f5' }}>
                <div style={{ width:34, height:34, borderRadius:11, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>👷</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13.5, fontWeight:700 }}>{c.worker_name || 'Worker'}</p>
                  {c.is_primary && <p style={{ fontSize:11, color:'#888' }}>Lead worker</p>}
                </div>
                {c.worker_phone && (
                  <a href={'tel:+91'+c.worker_phone}
                    style={{ width:34, height:34, borderRadius:11, background:GREEN, display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:15, textDecoration:'none', flexShrink:0 }}>📞</a>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* Where the worker is heading — the exact point the customer confirmed */}
        {(booking?.address || booking?.landmark) && (
          <Card>
            <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:8 }}>Service Location</p>
            <p style={{ fontSize:14, fontWeight:600, lineHeight:1.5 }}>📍 {booking.address}</p>
            {booking.landmark && <p style={{ fontSize:12.5, color:'#888', marginTop:4 }}>Landmark: {booking.landmark}</p>}
          </Card>
        )}

        {booking?.completion_otp && (
          <Card style={{ border:'2px dashed '+Y, background:YL }}>
            <p style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>🔐 Your Completion Code</p>
            <p style={{ fontSize:12, color:'#7a6000', marginBottom:10 }}>Share this code with the worker only when the job is finished. They need it to close the job and send the bill.</p>
            <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
              {String(booking.completion_otp).padStart(4,'0').split('').map((d,i) => (
                <span key={i} style={{ width:46, height:54, borderRadius:12, background:'#fff', border:'1.5px solid '+Y, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:YD }}>{d}</span>
              ))}
            </div>
          </Card>
        )}
      </>}

      {step===2 && (
        <button onClick={() => setCancelModal(true)}
          style={{ width:'100%', background:'#fff', color:'#ef4444', border:'1.5px solid #ef4444',
            borderRadius:14, padding:14, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          Cancel Booking
        </button>
      )}

      {step===3 && <>
        <Card style={{ textAlign:'center', padding:24 }}>
          <div style={{ fontSize:52, marginBottom:10 }}>🧾</div>
          <p style={{ fontWeight:800, fontSize:20 }}>Work Completed!</p>
          <p style={{ fontSize:13, color:'#888', marginTop:4 }}>{worker?.name} has sent the final price</p>
          <hr style={{ border:'none', borderTop:'1px solid #f0f0f0', margin:'14px 0' }} />
          {(booking?.photo_before_url || booking?.photo_after_url) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {[['Before', booking.photo_before_url],['After', booking.photo_after_url]].map(([lb,u]) => u && (
                <div key={lb}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#aaa', marginBottom:4, textAlign:'left' }}>{lb.toUpperCase()}</p>
                  <img src={u} alt={lb} style={{ width:'100%', height:110, objectFit:'cover', borderRadius:10 }} />
                </div>
              ))}
            </div>
          )}
          {booking?.price_note && (
            <div style={{ background:'#FFF8D6', borderRadius:10, padding:'10px 12px', marginBottom:12, textAlign:'left' }}>
              <p style={{ fontSize:11, fontWeight:700, color:YD, marginBottom:2 }}>WORKER'S NOTE</p>
              <p style={{ fontSize:13, color:'#555' }}>{booking.price_note}</p>
            </div>
          )}
          {(booking?.labor_charge || booking?.material_cost || booking?.additional_charge) ? (
            <div style={{ marginBottom:6, textAlign:'left' }}>
              {[['Labour charge', booking?.labor_charge],['Material cost', booking?.material_cost],['Additional charges', booking?.additional_charge]].map(([lb,v]) => (v ? (
                <div key={lb} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:'#888' }}>{lb}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>₹{v}</span>
                </div>
              ) : null))}
            </div>
          ) : (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'#888' }}>Minimum charge</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#888' }}>₹{floor}</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'2px solid #f0f0f0' }}>
            <span style={{ fontSize:16, fontWeight:800 }}>Total to pay</span>
            <span style={{ fontSize:26, fontWeight:800, color:YD }}>₹{booking?.amount}</span>
          </div>
        </Card>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={requestModification}
            style={{ flex:1, background:'#FEF3C7', color:'#92400E', border:'none', borderRadius:12, padding:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>✏️ Request Change</button>
          <a href={'tel:+91'+(worker?.phone||booking?.worker?.phone||'')}
            style={{ flex:1, background:'#E0F2FE', color:'#0369A1', border:'none', borderRadius:12, padding:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'center', textDecoration:'none' }}>📞 Contact Worker</a>
        </div>
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#555', marginBottom:6 }}>Pay to KaamReady UPI</p>
          <div style={{ background:'#f5f5f5', borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:'#333', fontWeight:700 }}>{getSetting('upi_handle') || 'kaamready@ybl'}</span>
            <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>KaamReady Official</span>
          </div>
          <button onClick={openUpiApp}
            style={{ width:'100%', background:Y, border:'none', borderRadius:12, padding:15, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', marginBottom:8 }}>
            Pay ₹{booking?.amount} via UPI 📲
          </button>
          <p style={{ fontSize:11, color:'#aaa', textAlign:'center', marginBottom:12 }}>Opens GPay / PhonePe / Paytm with amount pre-filled</p>
          <input value={utr} onChange={e => setUtr(e.target.value)}
            placeholder="UPI reference / UTR number (required)"
            style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:10, boxSizing:'border-box' }} />
          <button onClick={markPaid} disabled={paying}
            style={{ width:'100%', background:'#1C1C1E', color:'#fff', border:'none', borderRadius:12, padding:14, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:paying?0.6:1 }}>
            {paying ? 'Saving...' : 'I Paid ✓'}
          </button>
          <p style={{ fontSize:11, color:'#bbb', textAlign:'center', marginTop:8 }}>KaamReady verifies your payment — usually within ~30 minutes (8 AM–10 PM) — then credits the worker. You'll be notified.</p>
        </Card>
      </>}

      {step===4 && (() => {
        const st = booking?.status
        const byWorker   = st === 'worker_cancelled'
        const byCustomer = st === 'customer_cancelled'
        const ico   = byWorker ? '🚫' : byCustomer ? '✕' : '😔'
        const title = byWorker ? 'Worker Cancelled'
          : byCustomer ? 'Booking Cancelled'
          : 'No Workers Available'
        const body = byWorker
          ? `The worker cancelled${booking?.cancellation_reason ? ' — ' + booking.cancellation_reason : ''}. You can send the request out again.`
          : byCustomer
          ? `You cancelled this booking${booking?.cancellation_reason ? ' — ' + booking.cancellation_reason : ''}.`
          : `No workers in ${city} accepted this job in time. Try again in a few minutes.`
        return (
          <Card style={{ textAlign:'center', padding:32 }}>
            <div style={{ fontSize:52, marginBottom:12 }}>{ico}</div>
            <p style={{ fontWeight:800, fontSize:18 }}>{title}</p>
            <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>{body}</p>
            <Btn label="Book Again" onClick={() => { resetAll() }} />
            <button onClick={() => { resetAll(); setTab('home') }}
              style={{ display:'block', width:'100%', margin:'10px 0 0', background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Go Home
            </button>
          </Card>
        )
      })()}

      {step===5 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:52, marginBottom:14 }}>⏳</div>
          <p style={{ fontWeight:800, fontSize:18 }}>Payment Under Verification</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 4px' }}>KaamReady admin is verifying your UPI payment of ₹{booking?.amount}.</p>
          <p style={{ fontSize:12, color:'#bbb' }}>This is usually verified within ~30 minutes (8 AM–10 PM). You'll be notified the moment it's done.</p>
          {bookingRef && <p style={{ fontSize:12, fontWeight:700, color:'#B8900A', marginTop:12 }}>Reference: {bookingRef}</p>}
        </Card>
      )}

      {step===7 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:56, marginBottom:12 }}>📅</div>
          <p style={{ fontWeight:800, fontSize:20 }}>Booking Scheduled!</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>
            {selSvc?.lbl} · {schedAt ? new Date(schedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}<br/>
            A worker will accept it and arrive at the scheduled time.
          </p>
          <Btn label="Back to Home" onClick={() => { resetAll(); setTab('home') }} />
        </Card>
      )}

      {step===6 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:60, marginBottom:12 }}>🎉</div>
          <p style={{ fontWeight:800, fontSize:22 }}>All Done!</p>
          <p style={{ fontSize:13, color:'#888', margin:'6px 0 16px' }}>₹{booking?.amount} payment verified · Service by {worker?.name}</p>
          {/* Rating — shown post-verification */}
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', marginBottom:8 }}>Rate your experience</p>
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:16 }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} onClick={() => setRating(n)} style={{ fontSize:34, cursor:'pointer', filter:rating>=n?'none':'grayscale(1) opacity(.4)' }}>⭐</span>
            ))}
          </div>
          {rating > 0 && (
            <p style={{ fontSize:12, color:'#888', marginBottom:16 }}>Thanks for rating {worker?.name}!</p>
          )}
          <Btn label="Back to Home" onClick={async () => {
            // Save rating if given
            if (rating > 0 && booking?.id) {
              await sb.from('bookings').update({ rating }).eq('id', booking.id)
            }
            resetAll(); setTab('home')
          }} />
        </Card>
      )}
    </div>
  )
}
