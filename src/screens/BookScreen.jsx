import { useState, useRef, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import MapView from '../components/MapView'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', GREEN='#22c55e'
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const RZP_KEY_ID    = import.meta.env.VITE_RAZORPAY_KEY_ID

// Load Razorpay checkout script once
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function BookScreen({ user, city, selSvc, setTab, showToast, loadBookings }) {
  const [step,       setStep]       = useState(0)
  const [desc,       setDesc]       = useState('')
  const [addr,       setAddr]       = useState('')
  const [worker,     setWorker]     = useState(null)
  const [amount,     setAmount]     = useState(0)
  const [rating,     setRating]     = useState(0)
  const [bookId,     setBookId]     = useState(null)
  const [payLoading, setPayLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => { loadRazorpayScript() }, [])

  async function findWorkers() {
    setStep(1)
    showToast('Finding workers nearby...')
    const { data, error } = await sb.from('bookings').insert({
      user_id: user?.id, service: selSvc?.lbl, service_id: selSvc?.id,
      description: desc||'(No description)', address: addr||(city+', Karnataka'), city, status:'searching',
    }).select().single()
    if (error) { showToast('Error: '+error.message); setStep(0); return }
    setBookId(data.id)
    const ch = sb.channel('booking-'+data.id)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings', filter:'id=eq.'+data.id }, async payload => {
        if (payload.new.status==='assigned' && payload.new.worker_id) {
          clearTimeout(timer.current)
          // Fetch real worker profile from DB
          const { data: wData } = await sb.from('workers').select('*').eq('id', payload.new.worker_id).single()
          const w = wData || payload.new.worker || {}
          setWorker(w); setStep(2)
          showToast((w.name||'A worker')+' is on the way! 🎉')
          ch.unsubscribe()
        }
      }).subscribe()
    // 3-minute timeout — no fake workers, just show "no workers available"
    timer.current = setTimeout(async () => {
      ch.unsubscribe()
      await sb.from('bookings').update({ status:'cancelled' }).eq('id', data.id)
      setStep(4) // no-workers state
    }, 180000)
  }

  async function completeJob() {
    const amt = [350,420,450,480,500][Math.floor(Math.random()*5)]
    setAmount(amt)
    if (bookId) await sb.from('bookings').update({ status:'completed', amount:amt }).eq('id', bookId)
    setStep(3)
  }

  async function payWithRazorpay() {
    // Open Razorpay payment page (API integration coming soon)
    window.open('https://rzp.io/rzp/Gd1FRwo', '_blank')
    if (bookId && rating > 0) await sb.from('bookings').update({ rating, payment_status: 'pending_verification' }).eq('id', bookId)
    showToast('Payment page opened — complete payment there ✓')
  }

  async function payCash() {
    if (bookId) await sb.from('bookings').update({ rating: rating || 0, payment_status: 'cash', payment_method: 'cash' }).eq('id', bookId)
    showToast('Cash payment recorded ✓')
    await loadBookings()
    setTimeout(() => { setStep(0); setDesc(''); setAddr(''); setRating(0); setTab('home') }, 1200)
  }

  function cancel() { clearTimeout(timer.current); setStep(0); setWorker(null); setTab('home') }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:Y, borderRadius:16, padding:'14px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700 }}>{selSvc?.ico} {selSvc?.lbl} Request</p>
            <p style={{ fontSize:11, color:'rgba(0,0,0,.6)' }}>📍 {city}</p>
          </div>
          <button onClick={cancel} style={{ background:'rgba(0,0,0,.12)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>✕ Cancel</button>
        </div>
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:10 }}>
          {['Describe','Searching','Assigned','Done'].map((_,i) => (
            <div key={i} style={{ height:8, borderRadius:4, transition:'.2s', background:step>=i?'#000':'rgba(0,0,0,.2)', width:step===i?22:8 }} />
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
          <p style={{ fontSize:11, color:'#bbb', marginTop:4 }}>Confirmed after assessment</p>
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
                <span style={{ background:'#f0f0f0', color:'#555', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6 }}>{worker.jobs||0} jobs</span>
                <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>✓ Verified</span>
              </div>
            </div>
            <a href={'tel:+91'+worker.phone} style={{ width:40, height:40, borderRadius:12, background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, textDecoration:'none', flexShrink:0 }}>📞</a>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {[['🕐','ETA',worker.eta||'10 min'],['📍','Distance',worker.dist||'1.2 km'],['💼','Experience',(worker.jobs||0)+' jobs']].map(([ico,k,v])=>(
              <div key={k} style={{ flex:1, textAlign:'center', background:'#f9f9f9', borderRadius:10, padding:'8px 4px' }}>
                <div style={{ fontSize:16 }}>{ico}</div>
                <div style={{ fontSize:13, fontWeight:800, marginTop:2 }}>{v}</div>
                <div style={{ fontSize:10, color:'#aaa' }}>{k}</div>
              </div>
            ))}
          </div>
          <Btn label="Mark Job as Complete ✓" variant="dark" onClick={completeJob} />
        </Card>
      </>}

      {step===3 && <>
        <Card style={{ textAlign:'center', padding:28, animation:'popIn .4s ease' }}>
          <div style={{ fontSize:60, marginBottom:12 }}>🎉</div>
          <p style={{ fontWeight:800, fontSize:22 }}>Job Completed!</p>
          <p style={{ fontSize:13, color:'#888', marginTop:4 }}>by {worker?.name}</p>
          <hr style={{ border:'none', borderTop:'1px solid #f0f0f0', margin:'12px 0' }} />
          {[['Service charge',Math.round(amount*.78)],['Labour',Math.round(amount*.22)]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:14, color:'#555' }}>{k}</span>
              <span style={{ fontWeight:700 }}>₹{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'2px solid #f0f0f0' }}>
            <span style={{ fontSize:16, fontWeight:800 }}>Total</span>
            <span style={{ fontSize:24, fontWeight:800, color:YD }}>₹{amount}</span>
          </div>
        </Card>
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:12 }}>Rate your experience</p>
          <div style={{ display:'flex', gap:6, justifyContent:'center', margin:'10px 0 14px' }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} onClick={() => setRating(n)} style={{ fontSize:34, cursor:'pointer', filter:rating>=n?'none':'grayscale(1) opacity(.4)' }}>⭐</span>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={payWithRazorpay} disabled={payLoading}
              style={{ flex:1, background:Y, border:'none', borderRadius:12, padding:14, fontWeight:700, fontSize:14, cursor:'pointer', opacity:payLoading?.6:1 }}>
              {payLoading ? 'Opening...' : `Pay ₹${amount} Online`}
            </button>
            <button onClick={payCash}
              style={{ flex:1, background:'#1C1C1E', color:'#fff', border:'none', borderRadius:12, padding:14, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Pay Cash
            </button>
          </div>
        </Card>
      </>}

      {step===4 && (
        <Card style={{ textAlign:'center', padding:32 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>😔</div>
          <p style={{ fontWeight:800, fontSize:18 }}>No Workers Available</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>No workers in {city} accepted this job right now. Try again in a few minutes.</p>
          <Btn label="Try Again" onClick={() => { setStep(0); setWorker(null) }} />
          <button onClick={() => setTab('home')}
            style={{ display:'block', width:'100%', margin:'10px 0 0', background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Go Home
          </button>
        </Card>
      )}
    </div>
  )
}
