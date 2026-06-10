import { useState, useRef, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', GREEN='#22c55e'
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const RZP_KEY_ID    = import.meta.env.VITE_RAZORPAY_KEY_ID

const MOCK_WORKERS = [
  { id:'w1', name:'Raju Kumar',  skill:'Electrician', rating:4.8, dist:'0.8 km', eta:'6 min', jobs:342, ico:'⚡' },
  { id:'w2', name:'Suresh M.',   skill:'Plumber',     rating:4.9, dist:'0.5 km', eta:'4 min', jobs:521, ico:'🔧' },
]

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
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings', filter:'id=eq.'+data.id }, payload => {
        if (payload.new.status==='assigned' && payload.new.worker) {
          setWorker(payload.new.worker); setStep(2)
          showToast(payload.new.worker.name+' is on the way! 🎉')
          ch.unsubscribe()
        }
      }).subscribe()
    timer.current = setTimeout(async () => {
      const w = MOCK_WORKERS[0]
      await sb.from('bookings').update({ status:'assigned', worker:w, worker_id:w.id }).eq('id', data.id)
      setWorker(w); setStep(2)
      showToast(w.name+' is on the way! 🎉')
    }, 4000)
  }

  async function completeJob() {
    const amt = [350,420,450,480,500][Math.floor(Math.random()*5)]
    setAmount(amt)
    if (bookId) await sb.from('bookings').update({ status:'completed', amount:amt }).eq('id', bookId)
    setStep(3)
  }

  async function payWithRazorpay() {
    setPayLoading(true)
    try {
      // Create Razorpay order via Edge Function
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
        body: JSON.stringify({ booking_id: bookId, amount }),
      })
      const order = await res.json()
      if (!res.ok) { showToast('Payment error. Try cash.'); setPayLoading(false); return }

      const loaded = await loadRazorpayScript()
      if (!loaded) { showToast('Payment gateway unavailable'); setPayLoading(false); return }

      const options = {
        key: order.key_id || RZP_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Kaam Ready',
        description: `${selSvc?.lbl} Service`,
        order_id: order.order_id,
        prefill: {
          name: user?.user_metadata?.full_name || '',
          contact: user?.phone || '',
          email: user?.email || '',
        },
        theme: { color: Y },
        handler: async (response) => {
          // Payment success — update booking
          if (bookId && rating > 0) await sb.from('bookings').update({ rating, payment_status: 'paid', payment_id: response.razorpay_payment_id }).eq('id', bookId)
          showToast('Payment done! Thank you ⭐')
          await loadBookings()
          setTimeout(() => { setStep(0); setDesc(''); setAddr(''); setRating(0); setTab('home') }, 1200)
        },
        modal: { ondismiss: () => setPayLoading(false) },
      }
      new window.Razorpay(options).open()
    } catch (e) {
      showToast('Payment failed: '+e.message)
    }
    setPayLoading(false)
  }

  async function payCash() {
    if (bookId) await sb.from('bookings').update({ rating: rating || 0, payment_status: 'cash', payment_method: 'cash' }).eq('id', bookId)
    showToast('Cash payment recorded ✓')
    await loadBookings()
    setTimeout(() => { setStep(0); setDesc(''); setAddr(''); setRating(0); setTab('home') }, 1200)
  }

  function cancel() { clearTimeout(timer.current); setStep(0); setTab('home') }

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
        <div style={{ background:'linear-gradient(135deg,#e8f4e8,#c3e6cb)', borderRadius:16, height:150, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:8, left:10, background:'rgba(255,255,255,.9)', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8 }}>📍 {city}</div>
          <div style={{ position:'absolute', top:'40%', left:'44%', fontSize:26 }}>📍</div>
          <div style={{ position:'absolute', top:'20%', left:'26%', fontSize:18, animation:'float 2s ease-in-out infinite' }}>🔵</div>
        </div>
        <Card style={{ border:'2px solid '+Y }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <p style={{ fontWeight:800, fontSize:15 }}>✅ Worker Assigned!</p>
            <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8 }}>On the way</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, borderBottom:'1px solid #f0f0f0', marginBottom:12 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{worker.ico||'👷'}</div>
            <div>
              <p style={{ fontSize:14, fontWeight:700 }}>{worker.name}</p>
              <p style={{ fontSize:12, color:'#888' }}>{worker.skill} · ★ {worker.rating} · {worker.jobs} jobs</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:GREEN }}>{worker.eta}</div>
              <div style={{ fontSize:11, color:'#888' }}>ETA</div>
            </div>
            <div style={{ width:1, background:'#f0f0f0' }} />
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800 }}>{worker.dist}</div>
              <div style={{ fontSize:11, color:'#888' }}>Distance</div>
            </div>
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
    </div>
  )
}
