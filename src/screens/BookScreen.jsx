import { useState, useRef, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import MapView from '../components/MapView'
import { serviceFloor } from '../constants'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', GREEN='#22c55e'

// Flow: 0 describe · 1 searching · 2 worker working · 3 approve price & pay · 4 no workers · 5 waiting confirm · 6 done
export default function BookScreen({ user, city, selSvc, setTab, showToast, loadBookings, resume, clearResume }) {
  const [step,    setStep]    = useState(0)
  const [desc,    setDesc]    = useState('')
  const [addr,    setAddr]    = useState('')
  const [worker,  setWorker]  = useState(null)
  const [booking, setBooking] = useState(null)
  const [rating,  setRating]  = useState(0)
  const [paying,  setPaying]  = useState(false)
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
          const w = wData || b.worker || {}
          workerRef.current = w
          setWorker(w); setStep(2)
          showToast((w.name||'A worker')+' is on the way! 🎉')
        }
        if (b.status==='priced' && b.amount && b.payment_status!=='claimed') {
          setStep(3)
          showToast('Work done — review and pay ₹'+b.amount)
        }
        if (b.status==='completed' && b.payment_status==='paid') {
          setStep(6)
          showToast('Payment confirmed by worker ✓')
          await loadBookings()
        }
      }).subscribe()
    chanRef.current = ch
    return ch
  }

  // Resume an in-progress booking (after refresh or returning from a UPI app)
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
      if (resume.payment_status==='claimed') setStep(5)
      else if (resume.status==='priced')     setStep(3)
      else                                   setStep(2)
      subscribeBooking(resume.id)
      clearResume && clearResume()
    })()
    return () => { cancelled = true }
  }, [resume?.id])

  async function findWorkers() {
    setStep(1)
    showToast('Finding workers nearby...')
    const { data, error } = await sb.from('bookings').insert({
      user_id: user?.id, service: selSvc?.lbl, service_id: selSvc?.id,
      description: desc||'(No description)', address: addr||(city+', Karnataka'), city, status:'searching',
    }).select().single()
    if (error) { showToast('Error: '+error.message); setStep(0); return }
    setBooking(data)
    subscribeBooking(data.id)
    // 3-minute timeout — no fake workers, just show "no workers available"
    timer.current = setTimeout(async () => {
      if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
      await sb.from('bookings').update({ status:'cancelled' }).eq('id', data.id)
      setStep(4) // no-workers state
    }, 180000)
  }

  function upiLink() {
    const amt = booking?.amount || 0
    const pa  = worker?.upi_id || ''
    const pn  = encodeURIComponent(worker?.name || 'Kaam Ready Worker')
    const tn  = encodeURIComponent('Kaam Ready - '+(selSvc?.lbl||'Service'))
    return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`
  }

  async function openUpiApp() {
    if (!worker?.upi_id) {
      showToast('Ask the worker for their UPI ID, or pay to their phone number on your UPI app')
      return
    }
    window.location.href = upiLink()
  }

  async function markPaid() {
    if (!booking?.id || paying) return
    setPaying(true)
    const { error } = await sb.from('bookings').update({
      payment_status:'claimed', payment_method:'upi',
      customer_paid_at:new Date().toISOString(), rating: rating||null,
    }).eq('id', booking.id)
    setPaying(false)
    if (error) { showToast(error.message); return }
    setStep(5)
    showToast('Waiting for the worker to confirm... ⏳')
  }

  function resetAll() {
    clearTimeout(timer.current)
    if (chanRef.current) { chanRef.current.unsubscribe(); chanRef.current = null }
    workerRef.current = null
    setStep(0); setDesc(''); setAddr(''); setWorker(null); setBooking(null); setRating(0)
  }

  function cancel() { resetAll(); setTab('home') }

  const floor = serviceFloor(selSvc?.id)
  const dots  = step>=5 ? 3 : step===4 ? 1 : Math.min(step,3)

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:Y, borderRadius:16, padding:'14px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700 }}>{selSvc?.ico} {selSvc?.lbl} Request</p>
            <p style={{ fontSize:11, color:'rgba(0,0,0,.6)' }}>📍 {city}</p>
          </div>
          {step<3 && <button onClick={cancel} style={{ background:'rgba(0,0,0,.12)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>✕ Cancel</button>}
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
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, color:'#555' }}>Estimated cost</span>
            <span style={{ fontSize:17, fontWeight:800 }}>{selSvc?.range}</span>
          </div>
          <p style={{ fontSize:11, color:'#bbb', marginTop:4 }}>Final price set by the worker after the job — you approve it before paying. UPI payment only, no cash.</p>
        </Card>
        <Btn label="Find Workers Near Me 🔍" onClick={findWorkers} />
      </>}

      {step===1 && (
        <Card style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:52, marginBottom:16, animation:'float 1s ease-in-out infinite' }}>🔍</div>
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
          style={{ borderRadius:16, height:180, overflow:'hidden', marginBottom:0 }}
        />
        <Card style={{ border:'2px solid '+Y }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <p style={{ fontWeight:800, fontSize:15 }}>✅ Worker Assigned!</p>
            <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8 }}>On the way</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, borderBottom:'1px solid #f0f0f0', marginBottom:12 }}>
            <div style={{ width:60, height:60, borderRadius:16, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, flexShrink:0 }}>{worker.ico||'👷'}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:800 }}>{worker.name}</p>
              <p style={{ fontSize:12, color:'#888', margin:'2px 0' }}>{worker.skill}</p>
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <span style={{ background:'#FFF8D6', color:'#B8900A', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>★ {worker.rating||'5.0'}</span>
                <span style={{ background:'#f0f0f0', color:'#555', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6 }}>{worker.total_jobs||worker.jobs||0} jobs</span>
                <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>✓ Verified</span>
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
      </>}

      {step===3 && <>
        <Card style={{ textAlign:'center', padding:24, animation:'popIn .4s ease' }}>
          <div style={{ fontSize:52, marginBottom:10 }}>🧾</div>
          <p style={{ fontWeight:800, fontSize:20 }}>Work Completed!</p>
          <p style={{ fontSize:13, color:'#888', marginTop:4 }}>{worker?.name} has sent the final price</p>
          <hr style={{ border:'none', borderTop:'1px solid #f0f0f0', margin:'14px 0' }} />
          {booking?.price_note && (
            <div style={{ background:'#FFF8D6', borderRadius:10, padding:'10px 12px', marginBottom:12, textAlign:'left' }}>
              <p style={{ fontSize:11, fontWeight:700, color:YD, marginBottom:2 }}>WORKER'S NOTE</p>
              <p style={{ fontSize:13, color:'#555' }}>{booking.price_note}</p>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:13, color:'#888' }}>Minimum charge</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#888' }}>₹{floor}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'2px solid #f0f0f0' }}>
            <span style={{ fontSize:16, fontWeight:800 }}>Total to pay</span>
            <span style={{ fontSize:26, fontWeight:800, color:YD }}>₹{booking?.amount}</span>
          </div>
        </Card>
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:12 }}>Rate your experience</p>
          <div style={{ display:'flex', gap:6, justifyContent:'center', margin:'10px 0 14px' }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} onClick={() => setRating(n)} style={{ fontSize:34, cursor:'pointer', filter:rating>=n?'none':'grayscale(1) opacity(.4)' }}>⭐</span>
            ))}
          </div>
          <button onClick={openUpiApp}
            style={{ width:'100%', background:Y, border:'none', borderRadius:12, padding:15, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
            Pay ₹{booking?.amount} via UPI 📲
          </button>
          <p style={{ fontSize:11, color:'#aaa', textAlign:'center', margin:'8px 0' }}>
            Opens GPay / PhonePe / Paytm with the amount pre-filled
            {worker?.upi_id ? <> · paying to <b>{worker.upi_id}</b></> : null}
          </p>
          <button onClick={markPaid} disabled={paying}
            style={{ width:'100%', background:'#1C1C1E', color:'#fff', border:'none', borderRadius:12, padding:14, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:paying?.6:1 }}>
            {paying ? 'Saving...' : "I've Paid ✓"}
          </button>
          <p style={{ fontSize:11, color:'#bbb', textAlign:'center', marginTop:8 }}>UPI only — cash payments are not accepted</p>
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
          <div style={{ fontSize:52, marginBottom:14, animation:'float 1.5s ease-in-out infinite' }}>⏳</div>
          <p style={{ fontWeight:800, fontSize:18 }}>Waiting for confirmation</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 4px' }}>{worker?.name} is confirming your ₹{booking?.amount} UPI payment.</p>
          <p style={{ fontSize:12, color:'#bbb' }}>This usually takes a few seconds.</p>
        </Card>
      )}

      {step===6 && (
        <Card style={{ textAlign:'center', padding:36, animation:'popIn .4s ease' }}>
          <div style={{ fontSize:60, marginBottom:12 }}>🎉</div>
          <p style={{ fontWeight:800, fontSize:22 }}>All Done!</p>
          <p style={{ fontSize:13, color:'#888', margin:'6px 0 20px' }}>₹{booking?.amount} paid via UPI · confirmed by {worker?.name}</p>
          <Btn label="Back to Home" onClick={() => { resetAll(); setTab('home') }} />
        </Card>
      )}
    </div>
  )
}
