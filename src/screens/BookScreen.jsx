import { useState, useRef, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import MapView from '../components/MapView'
import { serviceFloor } from '../constants'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', GREEN='#22c55e'
const KR_UPI = '9100193118@ybl'
const KR_NAME = 'Kaam Ready'

// Flow: 0 describe · 1 searching · 2 worker working · 3 worker sent price → pay
// 4 no workers · 5 waiting admin verification · 6 done · 7 scheduled · 8 rejected
export default function BookScreen({ user, city, selSvc, setTab, showToast, loadBookings, resume, clearResume, rebookWorker, clearRebook }) {
  const [step,      setStep]      = useState(0)
  const [desc,      setDesc]      = useState('')
  const [addr,      setAddr]      = useState('')
  const [when,      setWhen]      = useState('now')
  const [schedAt,   setSchedAt]   = useState('')
  const [worker,    setWorker]    = useState(null)
  const [booking,   setBooking]   = useState(null)
  const [rating,    setRating]    = useState(0)
  const [paying,    setPaying]    = useState(false)
  const timer = useRef(null), chanRef = useRef(null), workerRef = useRef(null)

  useEffect(() => () => { clearTimeout(timer.current); if (chanRef.current) chanRef.current.unsubscribe() }, [])

  function subscribeBooking(id) {
    if (chanRef.current) chanRef.current.unsubscribe()
    const ch = sb.channel('booking-'+id)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings', filter:'id=eq.'+id }, async payload => {
        const b = payload.new
        setBooking(prev => ({ ...(prev||{}), ...b }))
        if (b.status==='assigned' && b.worker_id && !workerRef.current) {
          clearTimeout(timer.current)
          const { data: wData } = await sb.from('workers').select('*').eq('id', b.worker_id).single()
          const w = wData || {}
          workerRef.current = w; setWorker(w); setStep(2)
          showToast((w.name||'A worker')+' accepted your booking! 🎉')
        }
        if (b.status==='priced' && b.amount && b.payment_status!=='pending_verification' && b.payment_status!=='verified') {
          setStep(3)
          showToast('Worker sent the price — ₹'+b.amount+'. Review and pay!')
        }
        if (b.payment_status==='verified') {
          setStep(6)
          showToast('Payment approved by admin ✓ Job complete!')
          await loadBookings()
        }
        if (b.payment_status==='rejected') {
          setStep(8)
          showToast('Payment rejected — please contact support')
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
        const { data: w } = await sb.from('workers').select('*').eq('id', resume.worker_id).single()
        if (cancelled) return
        if (w) { workerRef.current = w; setWorker(w) }
      }
      if (resume.payment_status==='verified')              setStep(6)
      else if (resume.payment_status==='rejected')         setStep(8)
      else if (resume.payment_status==='pending_verification') setStep(5)
      else if (resume.status==='priced')                   setStep(3)
      else                                                 setStep(2)
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
      setStep(7); subscribeBooking(data.id); return
    }
    subscribeBooking(data.id)
    clearRebook && clearRebook()
    timer.current = setTimeout(async () => {
      if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
      await sb.from('bookings').update({ status:'cancelled' }).eq('id', data.id)
      setStep(4)
    }, 180000)
  }

  function krUpiLink() {
    const amt = booking?.amount || 0
    const tn  = encodeURIComponent('KaamReady-' + (booking?.id||'').slice(0,8))
    return `upi://pay?pa=${encodeURIComponent(KR_UPI)}&pn=${encodeURIComponent(KR_NAME)}&am=${amt}&cu=INR&tn=${tn}`
  }

  async function markPaid() {
    if (!booking?.id) return
    setPaying(true)
    const { error } = await sb.from('bookings').update({
      payment_status: 'pending_verification',
      payment_method: 'upi',
      customer_paid_at: new Date().toISOString(),
      rating: rating || null,
    }).eq('id', booking.id)
    setPaying(false)
    if (error) { showToast('Error: ' + error.message); return }
    setStep(5)
    showToast('Payment marked! Admin will verify shortly ⏳')
  }

  async function resubmitProof() {
    await sb.from('bookings').update({ payment_status:'priced' }).eq('id', booking?.id).catch(()=>{})
    setBooking(b => ({ ...b, payment_status:'priced' }))
    setStep(3)
  }

  function resetAll() {
    clearTimeout(timer.current)
    if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
    workerRef.current = null
    setStep(0); setDesc(''); setAddr(''); setWorker(null); setBooking(null)
    setRating(0); setPaying(false)
  }

  function cancel() { resetAll(); setTab('home') }

  const floor = serviceFloor(selSvc?.id)
  const dots  = step>=5 ? 3 : step===4 ? 1 : Math.min(step,3)

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      {/* Header */}
      <div style={{ background:Y, borderRadius:16, padding:'14px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:16 }}>{selSvc?.lbl || 'Book a Service'}</p>
            <p style={{ fontSize:12, marginTop:2, opacity:.7 }}>
              {['Finding workers','Worker working','Price received','Done'].filter((_,i)=>i<dots+1).join(' → ')}
            </p>
          </div>
          {step<3 && <button onClick={cancel} style={{ background:'rgba(0,0,0,.12)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>✕ Cancel</button>}
        </div>
        <div style={{ display:'flex', gap:4, marginTop:10 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ flex:1, height:3, borderRadius:4, background:dots>i?'#000':'rgba(0,0,0,.2)' }} />
          ))}
        </div>
      </div>

      {/* STEP 0 — Describe job */}
      {step===0 && <>
        <Card>
          <p style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', marginBottom:8 }}>Job Description</p>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Describe what needs to be done..."
            style={{ width:'100%', border:'1.5px solid #eee', borderRadius:10, padding:10, fontSize:14, fontFamily:'inherit', resize:'none', outline:'none', boxSizing:'border-box' }} />
          <p style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', marginTop:10, marginBottom:6 }}>Address</p>
          <input value={addr} onChange={e=>setAddr(e.target.value)} placeholder="Flat / Building / Landmark..."
            style={{ width:'100%', border:'1.5px solid #eee', borderRadius:10, padding:'10px 12px', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
          <p style={{ fontSize:11, color:'#bbb', marginTop:6 }}>Min charge: ₹{floor}</p>
          <p style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', marginTop:12, marginBottom:8 }}>When</p>
          <div style={{ display:'flex', gap:8 }}>
            {['now','later'].map(w => (
              <button key={w} onClick={()=>setWhen(w)} style={{ flex:1, padding:10, borderRadius:10, border:'2px solid '+(when===w?YD:'#eee'), background:when===w?YL:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>{w==='now'?'⚡ Right Now':'📅 Schedule'}</button>
            ))}
          </div>
          {when==='later' && (
            <input type="datetime-local" value={schedAt} onChange={e=>setSchedAt(e.target.value)} min={new Date(Date.now()+30*60000).toISOString().slice(0,16)}
              style={{ width:'100%', border:'1.5px solid #eee', borderRadius:10, padding:'10px 12px', fontSize:14, fontFamily:'inherit', outline:'none', marginTop:10, boxSizing:'border-box' }} />
          )}
        </Card>
        <Btn label="Find a Worker 🔍" onClick={findWorkers} disabled={!desc.trim()} />
        <p style={{ fontSize:11, color:'#aaa', textAlign:'center' }}>Final price is set by the worker after completing the job. You review it before paying.</p>
      </>}

      {/* STEP 1 — Searching */}
      {step===1 && (
        <Card style={{ textAlign:'center', padding:40 }}>
          <div style={{ width:56, height:56, border:'4px solid '+YL, borderTop:'4px solid '+Y, borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }} />
          <p style={{ fontWeight:800, fontSize:18 }}>Finding workers nearby...</p>
          <p style={{ fontSize:13, color:'#888', marginTop:6 }}>Looking for {selSvc?.lbl} experts in {city}</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </Card>
      )}

      {/* STEP 2 — Worker accepted, doing the job */}
      {step===2 && worker && <>
        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div style={{ width:50, height:50, borderRadius:'50%', background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800 }}>
              {worker.name?.[0]?.toUpperCase()||'W'}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:16 }}>{worker.name || 'Worker'}</p>
              <p style={{ fontSize:12, color:'#888' }}>{worker.skill||selSvc?.lbl} · ⭐ {worker.rating||5.0}</p>
            </div>
            <a href={`tel:${worker.phone}`} style={{ background:Y, border:'none', borderRadius:10, padding:'8px 14px', fontWeight:700, fontSize:13, cursor:'pointer', textDecoration:'none', color:'#1C1C1E' }}>📞 Call</a>
          </div>
          <div style={{ background:YL, borderRadius:10, padding:'10px 12px' }}>
            <p style={{ fontSize:12, fontWeight:700, color:YD }}>🔧 Worker is on the job</p>
            <p style={{ fontSize:12, color:'#888', marginTop:3 }}>The worker will send you the final price after completing the work.</p>
          </div>
        </Card>
        {booking?.address_lat && booking?.address_lng && (
          <MapView customerLat={booking.address_lat} customerLng={booking.address_lng} workerLat={worker?.lat} workerLng={worker?.lng} />
        )}
      </>}

      {/* STEP 3 — Worker sent price → Customer pays to KaamReady */}
      {step===3 && <>
        <Card style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🧾</div>
          <p style={{ fontWeight:800, fontSize:20 }}>Price Received!</p>
          <p style={{ fontSize:13, color:'#888', marginTop:4 }}>{worker?.name || 'Your worker'} has completed the work</p>

          {(booking?.photo_before_url || booking?.photo_after_url) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, margin:'12px 0' }}>
              {[['Before', booking.photo_before_url],['After', booking.photo_after_url]].map(([lb,u]) => u && (
                <div key={lb}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#aaa', marginBottom:4, textAlign:'left' }}>{lb}</p>
                  <img src={u} alt={lb} style={{ width:'100%', height:100, objectFit:'cover', borderRadius:10 }} />
                </div>
              ))}
            </div>
          )}

          {booking?.price_note && (
            <div style={{ background:YL, borderRadius:10, padding:'10px 12px', margin:'10px 0', textAlign:'left' }}>
              <p style={{ fontSize:11, fontWeight:700, color:YD, marginBottom:2 }}>WORKER'S NOTE</p>
              <p style={{ fontSize:13, color:'#555' }}>{booking.price_note}</p>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid #f0f0f0', marginTop:8 }}>
            <span style={{ fontSize:13, color:'#888' }}>Min. charge</span>
            <span style={{ fontSize:13, color:'#888' }}>₹{floor}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'2px solid #f0f0f0' }}>
            <span style={{ fontSize:18, fontWeight:800 }}>Total</span>
            <span style={{ fontSize:28, fontWeight:900, color:YD }}>₹{booking?.amount}</span>
          </div>
        </Card>

        {/* Rate */}
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', marginBottom:10 }}>Rate your experience (optional)</p>
          <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} onClick={()=>setRating(n)} style={{ fontSize:32, cursor:'pointer', filter:rating>=n?'none':'grayscale(1) opacity(.3)' }}>⭐</span>
            ))}
          </div>
        </Card>

        {/* Payment to KaamReady */}
        <Card>
          <div style={{ background:'#0f172a', borderRadius:14, padding:'16px', marginBottom:14, textAlign:'center' }}>
            <p style={{ fontSize:11, color:'#64748b', fontWeight:700, textTransform:'uppercase', marginBottom:8, letterSpacing:1 }}>Pay to Kaam Ready</p>
            <p style={{ fontSize:22, fontWeight:900, color:Y, letterSpacing:1 }}>{KR_UPI}</p>
            <p style={{ fontSize:12, color:'#475569', marginTop:4 }}>Official KaamReady payment account</p>
            <div style={{ display:'flex', gap:8, marginTop:14, justifyContent:'center' }}>
              <a href={krUpiLink()} style={{ flex:1, background:Y, border:'none', borderRadius:10, padding:'12px 0', fontWeight:800, fontSize:14, cursor:'pointer', textDecoration:'none', color:'#1C1C1E', textAlign:'center', display:'block' }}>
                📲 Pay ₹{booking?.amount} via UPI
              </a>
            </div>
            <p style={{ fontSize:11, color:'#475569', marginTop:8 }}>Opens GPay / PhonePe / Paytm · UPI ID: {KR_UPI}</p>
          </div>

          <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:14 }}>
            <p style={{ fontSize:12, color:'#888', marginBottom:12 }}>After paying via UPI, tap the button below. Our admin will verify and confirm.</p>
            <button onClick={markPaid} disabled={paying}
              style={{ width:'100%', background:'#16a34a', border:'none', borderRadius:12, padding:15, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', fontFamily:'inherit', opacity:paying?0.6:1 }}>
              {paying ? 'Processing...' : '✅ I Paid — Notify Admin'}
            </button>
            <p style={{ fontSize:11, color:'#aaa', marginTop:8, textAlign:'center' }}>Admin will verify your payment from UPI records</p>
          </div>
        </Card>
      </>}

      {/* STEP 4 — No workers */}
      {step===4 && (
        <Card style={{ textAlign:'center', padding:32 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>😔</div>
          <p style={{ fontWeight:800, fontSize:18 }}>No Workers Available</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>No {selSvc?.lbl} workers in {city} right now. Try again in a few minutes.</p>
          <Btn label="Try Again" onClick={() => { setStep(0); setWorker(null); workerRef.current=null }} />
          <button onClick={()=>setTab('home')} style={{ display:'block', width:'100%', margin:'10px 0 0', background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Go Home</button>
        </Card>
      )}

      {/* STEP 5 — Waiting for admin verification */}
      {step===5 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:52, marginBottom:14 }}>🔍</div>
          <p style={{ fontWeight:800, fontSize:18 }}>Verifying Payment</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 4px' }}>Our admin team is verifying your UPI payment.</p>
          <p style={{ fontSize:12, color:'#bbb', marginBottom:20 }}>This usually takes under 30 minutes during business hours.</p>
          <div style={{ background:YL, borderRadius:12, padding:'12px 16px', textAlign:'left' }}>
            <p style={{ fontSize:12, fontWeight:700, color:YD, marginBottom:4 }}>What happens next?</p>
            <p style={{ fontSize:12, color:'#666', lineHeight:1.7 }}>
              ✅ Admin approves → job marked complete<br/>
              ❌ If rejected → you'll be asked to pay again via UPI
            </p>
          </div>
        </Card>
      )}

      {/* STEP 6 — Payment verified, done */}
      {step===6 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:60, marginBottom:12 }}>🎉</div>
          <p style={{ fontWeight:800, fontSize:22 }}>All Done!</p>
          <p style={{ fontSize:14, color:GREEN, fontWeight:700, marginBottom:6 }}>✅ Payment Verified by KaamReady</p>
          <p style={{ fontSize:13, color:'#888', margin:'4px 0 20px' }}>₹{booking?.amount} payment confirmed · Thank you!</p>
          <Btn label="Back to Home" onClick={()=>{ resetAll(); setTab('home') }} />
        </Card>
      )}

      {/* STEP 7 — Scheduled */}
      {step===7 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:56, marginBottom:12 }}>📅</div>
          <p style={{ fontWeight:800, fontSize:20 }}>Booking Scheduled!</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>
            {selSvc?.lbl} · {schedAt ? new Date(schedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}
          </p>
          <Btn label="Back to Home" onClick={()=>{ resetAll(); setTab('home') }} />
        </Card>
      )}

      {/* STEP 8 — Payment proof rejected */}
      {step===8 && (
        <Card style={{ textAlign:'center', padding:36 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>❌</div>
          <p style={{ fontWeight:800, fontSize:18, color:'#dc2626' }}>Proof Rejected</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>
            {booking?.rejection_reason || 'Your payment could not be verified. Please try paying again via the UPI link.'}
          </p>
          <button onClick={resubmitProof} style={{ width:'100%', background:Y, border:'none', borderRadius:12, padding:14, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
            💸 Try Payment Again
          </button>
        </Card>
      )}
    </div>
  )
}
