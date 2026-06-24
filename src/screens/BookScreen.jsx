import { useState, useRef, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import MapView from '../components/MapView'
import { serviceFloor } from '../constants'
import { loadSettings, getSetting } from '../lib/settings'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', GREEN='#22c55e'

// Flow: 0 describe · 1 searching · 2 worker working · 3 approve price & pay · 4 no workers · 5 waiting verify · 6 done · 7 scheduled
export default function BookScreen({ user, city, selSvc, setTab, showToast, loadBookings, resume, clearResume, rebookWorker, clearRebook }) {
  const [step,        setStep]        = useState(0)
  const [desc,        setDesc]        = useState('')
  const [addr,        setAddr]        = useState('')
  const [when,        setWhen]        = useState('now')
  const [schedAt,     setSchedAt]     = useState('')
  const [worker,      setWorker]      = useState(null)
  const [booking,     setBooking]     = useState(null)
  const [rating,      setRating]      = useState(0)
  const [paying,      setPaying]      = useState(false)
  const [utr,         setUtr]         = useState('')
  const [cancelModal, setCancelModal] = useState(false)
  const timer = useRef(null), chanRef = useRef(null), workerRef = useRef(null)

  useEffect(() => () => { clearTimeout(timer.current); if (chanRef.current) chanRef.current.unsubscribe() }, [])

  // Load admin-controlled settings (UPI handle, etc.) once on mount
  useEffect(() => { loadSettings() }, [])

  function subscribeBooking(id) {
    if (chanRef.current) chanRef.current.unsubscribe()
    const ch = sb.channel('booking-'+id)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings', filter:'id=eq.'+id }, async payload => {
        const b = payload.new
        setBooking(prev => ({ ...(prev||{}), ...b }))
        if (b.status==='assigned' && b.worker_id && !workerRef.current) {
          clearTimeout(timer.current)
          const { data: wData } = await sb.from('workers_public').select('*').eq('id', b.worker_id).single()
          const w = wData || b.worker || {}
          workerRef.current = w
          setWorker(w); setStep(2)
          showToast((w.name||'A worker')+' is on the way! 🎉')
        }
        if (b.status==='priced' && b.amount && !b.payment_status) {
          setStep(3)
          showToast('Work done — review and pay ₹'+b.amount)
        }
        // Admin verified the payment → job complete
        if (b.payment_status==='verified') {
          setStep(6)
          showToast('Payment verified! Job complete ✓')
          await loadBookings()
        }
      }).subscribe()
    chanRef.current = ch
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

  function getPosition() {
    return new Promise(res => {
      if (!navigator.geolocation) return res(null)
      navigator.geolocation.getCurrentPosition(
        pos => res({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        ()  => res(null), { enableHighAccuracy: true, timeout: 5000 })
    })
  }

  async function findWorkers() {
    setStep(1)
    showToast('Finding workers nearby...')
    const scheduled = when==='later' && schedAt
    if (when==='later' && !schedAt) { showToast('Pick a date & time'); setStep(0); return }
    const [pos, prof] = await Promise.all([
      getPosition(),
      sb.from('profiles').select('name, phone').eq('id', user?.id).single(),
    ])
    const { data, error } = await sb.from('bookings').insert({
      user_id: user?.id, service: selSvc?.lbl, service_id: selSvc?.id,
      description: desc||'(No description)', address: addr||(city+', Karnataka'), city,
      status: scheduled ? 'scheduled' : 'searching',
      is_scheduled: !!scheduled, scheduled_at: scheduled ? new Date(schedAt).toISOString() : null,
      address_lat: pos?.lat ?? null, address_lng: pos?.lng ?? null,
      customer_name: prof?.data?.name || null, customer_phone: prof?.data?.phone || null,
      preferred_worker_id: rebookWorker?.id || null,
    }).select().single()
    if (error) { showToast('Error: '+error.message); setStep(0); return }
    setBooking(data)
    if (scheduled) {
      showToast('Booking scheduled ✓')
      await loadBookings()
      clearRebook && clearRebook()
      setStep(7)
      subscribeBooking(data.id)
      return
    }
    subscribeBooking(data.id)
    clearRebook && clearRebook()
    timer.current = setTimeout(async () => {
      if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
      await sb.from('bookings').update({ status:'cancelled' }).eq('id', data.id)
      setStep(4)
    }, 180000)
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
    if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
    workerRef.current = null
    setStep(0); setDesc(''); setAddr(''); setWorker(null); setBooking(null); setRating(0)
    setCancelModal(false)
  }

  async function confirmCancel() {
    // If a worker is assigned (step 2+), cancel in DB and notify worker
    if (booking?.id) {
      await sb.from('bookings').update({
        status: 'customer_cancelled',
        cancelled_by: 'customer',
      }).eq('id', booking.id)
      // Notify worker if assigned
      if (booking.worker_id) {
        await sb.from('notifications').insert({
          user_id: booking.worker_id,
          title: 'Booking Cancelled',
          body: 'The customer cancelled the booking for ' + (booking.service || 'service') + '. You are free to take other jobs.',
          type: 'booking_cancelled',
          booking_id: booking.id,
        }).then(() => {})
      }
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:24, width:'100%', maxWidth:380 }}>
            <p style={{ fontWeight:800, fontSize:17, marginBottom:8 }}>Cancel this booking?</p>
            <p style={{ fontSize:14, color:'#555', marginBottom:20 }}>
              {booking?.worker_id
                ? 'The worker will be notified that you cancelled.'
                : 'Your booking request will be cancelled.'}
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setCancelModal(false)}
                style={{ flex:1, background:'#f2f2f7', border:'none', borderRadius:12, padding:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                Keep Booking
              </button>
              <button onClick={confirmCancel}
                style={{ flex:1, background:'#ef4444', color:'#fff', border:'none', borderRadius:12, padding:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                Yes, Cancel
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
          {step < 5 && step !== 6 && (
            <button onClick={() => setCancelModal(true)}
              style={{ background:'rgba(0,0,0,.12)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
              ✕ Cancel
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
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:12 }}>Describe the problem</p>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Fan not working..." rows={3}
            style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:13, fontSize:14, outline:'none', fontFamily:'inherit', resize:'none', marginBottom:12 }} />
          <p style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:6 }}>Address</p>
          <input value={addr} onChange={e => setAddr(e.target.value)} placeholder={'MG Road, '+city}
            style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:13, fontSize:14, outline:'none', fontFamily:'inherit' }} />
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
        <Btn label={when==='later' ? 'Schedule Booking 📅' : 'Find Workers Near Me 🔍'} onClick={findWorkers} />
      </>}

      {step===1 && (
        <Card style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🔍</div>
          <p style={{ fontWeight:800, fontSize:18 }}>Finding workers nearby...</p>
          <p style={{ fontSize:13, color:'#888', marginTop:6 }}>Checking availability in {city}</p>
          <div style={{ background:'#f0f0f0', borderRadius:20, height:6, overflow:'hidden', marginTop:20 }}>
            <div style={{ background:Y, height:'100%', borderRadius:20, width:'65%' }} />
          </div>
        </Card>
      )}

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
            <a href={'tel:+91'+worker.phone} style={{ width:40, height:40, borderRadius:12, background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, textDecoration:'none', flexShrink:0 }}>📞</a>
          </div>
          <div style={{ background:'#f9f9f9', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#555' }}>Starting price</span>
              <span style={{ fontSize:16, fontWeight:800 }}>from ₹{floor}</span>
            </div>
            <p style={{ fontSize:11, color:'#aaa', marginTop:4 }}>The worker will send the final price when the work is done. You approve it before paying via UPI.</p>
          </div>
        </Card>
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
          <p style={{ fontSize:11, color:'#aaa', textAlign:'center', marginBottom:12 }}>
            Opens GPay / PhonePe / Paytm with amount pre-filled
          </p>
          <input value={utr} onChange={e => setUtr(e.target.value)}
            placeholder="UPI reference / UTR number (required)"
            style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:10, boxSizing:'border-box' }} />
          <button onClick={markPaid} disabled={paying}
            style={{ width:'100%', background:'#1C1C1E', color:'#fff', border:'none', borderRadius:12, padding:14, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:paying?0.6:1 }}>
            {paying ? 'Saving...' : 'I Paid ✓'}
          </button>
          <p style={{ fontSize:11, color:'#bbb', textAlign:'center', marginTop:8 }}>Admin will verify your payment and credit the worker</p>
        </Card>
      </>}

      {step===4 && (
        <Card style={{ textAlign:'center', padding:32 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>😔</div>
          <p style={{ fontWeight:800, fontSize:18 }}>No Workers Available</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>No workers in {city} accepted this job right now. Try again in a few minutes.</p>
          <Btn label="Try Again" onClick={() => { setStep(0); setWorker(null); workerRef.current=null }} />
          <button onClick={() => setTab('home')}
            style={{ display:'block', width:'100%', margin:'10px 0 0', background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Go Home
          </button>
        </Card>
      )}

      {step===5 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:52, marginBottom:14 }}>⏳</div>
          <p style={{ fontWeight:800, fontSize:18 }}>Payment Under Verification</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 4px' }}>KaamReady admin is verifying your UPI payment of ₹{booking?.amount}.</p>
          <p style={{ fontSize:12, color:'#bbb' }}>This usually takes a few minutes. You'll be notified when verified.</p>
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
