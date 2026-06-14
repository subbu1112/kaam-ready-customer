import { useEffect, useState } from 'react'
import { sb } from '../lib/supabase'
import { SERVICES } from '../constants'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', BK='#1C1C1E', GREEN='#22c55e'

const STATUS = {
  completed: { bg:'#D1FAE5', c:'#065F46', label:'✓ Completed',   icon:'✅' },
  searching:  { bg:YL,       c:YD,        label:'Searching...',  icon:'🔍' },
  assigned:   { bg:'#DBEAFE', c:'#1E40AF', label:'Worker Assigned', icon:'👷' },
  priced:     { bg:'#FEF3C7', c:'#92400E', label:'💳 Pay Now',     icon:'💳' },
  cancelled:  { bg:'#FEE2E2', c:'#991B1B', label:'Cancelled',    icon:'❌' },
  scheduled:  { bg:'#EDE9FE', c:'#5B21B6', label:'Scheduled',    icon:'📅' },
  en_route:   { bg:'#DBEAFE', c:'#1E40AF', label:'En Route 🚗',  icon:'🚗' },
  arrived:    { bg:YL,       c:YD,        label:'Arrived',      icon:'📍' },
  started:    { bg:'#D1FAE5', c:'#065F46', label:'In Progress',  icon:'🔧' },
}

const TIMELINE = {
  searching: ['Booking Created','Worker Search'],
  assigned:  ['Booking Created','Worker Search','Worker Assigned'],
  en_route:  ['Booking Created','Worker Search','Worker Assigned','En Route'],
  arrived:   ['Booking Created','Worker Search','Worker Assigned','En Route','Worker Arrived'],
  started:   ['Booking Created','Worker Search','Worker Assigned','En Route','Worker Arrived','Service Started'],
  completed: ['Booking Created','Worker Search','Worker Assigned','En Route','Worker Arrived','Service Started','Completed ✓'],
  cancelled: ['Booking Created','Cancelled ✗'],
  priced:    ['Booking Created','Worker Assigned','Price Quoted'],
}

function BookingDetail({ booking, worker, onClose, showToast, onRebook }) {
  const st = STATUS[booking.status] || STATUS.searching
  const svc = SERVICES.find(s => s.id === booking.service_id || s.lbl === booking.service)
  const timeline = TIMELINE[booking.status] || TIMELINE.searching
  const fmtDate = d => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'
  const fmt = n => '₹'+(n||0).toLocaleString('en-IN')

  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submitReport() {
    if (!reason.trim()) { showToast('Please describe the issue'); return }
    setBusy(true)
    await sb.from('disputes').insert({ booking_id:booking.id, raised_by:booking.user_id, raised_by_role:'customer', reason:reason.trim(), status:'open' })
    setBusy(false); setReporting(false); setReason('')
    showToast('Report submitted — our team will contact you within 24 hours ✓')
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#F2F2F7', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430, maxHeight:'90vh', overflowY:'auto', padding:'20px 16px 40px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontWeight:800, fontSize:17, color:BK }}>Booking Details</p>
          <button onClick={onClose} style={{ background:'#E5E5EA', border:'none', borderRadius:10, padding:'6px 14px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Close</button>
        </div>

        {/* Status banner */}
        <div style={{ background:st.bg, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <span style={{ fontSize:28 }}>{st.icon}</span>
          <div>
            <p style={{ fontWeight:800, fontSize:15, color:st.c }}>{st.label}</p>
            <p style={{ fontSize:11, color:st.c, opacity:.7, marginTop:2 }}>{booking.service} • {fmtDate(booking.created_at)}</p>
          </div>
        </div>

        {/* Service info */}
        <div style={{ background:'#fff', borderRadius:14, padding:14, marginBottom:10 }}>
          <p style={{ fontWeight:700, fontSize:13, color:'#8e8e93', marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>Service Details</p>
          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{svc?.ico||'🔧'}</div>
            <div>
              <p style={{ fontWeight:800, fontSize:15, color:BK }}>{booking.service}</p>
              <p style={{ fontSize:12, color:'#8e8e93', marginTop:2 }}>📍 {booking.address || booking.city || '—'}</p>
            </div>
          </div>
          {booking.description && <p style={{ fontSize:13, color:'#555', background:'#f9f9f9', borderRadius:10, padding:'8px 12px', marginTop:8 }}>{booking.description}</p>}
        </div>

        {/* Worker info */}
        {worker && (
          <div style={{ background:'#fff', borderRadius:14, padding:14, marginBottom:10 }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#8e8e93', marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>Your Worker</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👷</div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:800, fontSize:15, color:BK }}>{worker.name}</p>
                <p style={{ fontSize:12, color:'#8e8e93' }}>{worker.skill} • ⭐ {(worker.rating||5.0).toFixed(1)}</p>
                <p style={{ fontSize:11, color:'#8e8e93', marginTop:1 }}>{worker.total_jobs||0} jobs completed</p>
              </div>
              {worker.phone && (
                <a href={`tel:+91${worker.phone}`}
                  style={{ width:44, height:44, borderRadius:12, background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, textDecoration:'none', flexShrink:0 }}>
                  📞
                </a>
              )}
            </div>
          </div>
        )}

        {/* Payment status */}
        <div style={{ background:'#fff', borderRadius:14, padding:14, marginBottom:10 }}>
          <p style={{ fontWeight:700, fontSize:13, color:'#8e8e93', marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>Payment</p>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:22, fontWeight:900, color:booking.amount>0?YD:'#8e8e93' }}>{booking.amount>0?fmt(booking.amount):'TBD'}</p>
              <p style={{ fontSize:11, color:'#8e8e93', marginTop:2 }}>
                {booking.payment_status==='paid'?'✅ Paid':booking.payment_status==='pending'?'⏳ Pending':'—'}
              </p>
            </div>
            {booking.payment_status === 'paid' && (
              <span style={{ background:'#D1FAE5', color:'#065F46', padding:'4px 12px', borderRadius:8, fontSize:11, fontWeight:700 }}>✓ Paid</span>
            )}
          </div>
          {booking.transaction_id && <p style={{ fontSize:11, color:'#aaa', marginTop:8 }}>TXN: {booking.transaction_id}</p>}
        </div>

        {/* Timeline */}
        <div style={{ background:'#fff', borderRadius:14, padding:14, marginBottom:12 }}>
          <p style={{ fontWeight:700, fontSize:13, color:'#8e8e93', marginBottom:12, textTransform:'uppercase', letterSpacing:.5 }}>Booking Timeline</p>
          {timeline.map((step, i) => (
            <div key={step} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom: i<timeline.length-1?14:0 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:Y, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:BK }}>{i+1}</div>
                {i<timeline.length-1 && <div style={{ width:2, height:20, background:'#E5E5EA', marginTop:4 }} />}
              </div>
              <p style={{ fontSize:13, fontWeight: i===timeline.length-1?700:500, color: i===timeline.length-1?BK:'#8e8e93', paddingTop:2 }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {booking.status==='completed' && booking.worker_id && (
            <button onClick={() => { onClose(); onRebook(booking) }}
              style={{ width:'100%', background:YL, border:'1.5px solid '+Y, borderRadius:12, padding:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', color:YD }}>
              🔁 Rebook This Worker
            </button>
          )}
          {booking.status==='completed' && !reporting && (
            <button onClick={() => setReporting(true)}
              style={{ width:'100%', background:'#FEE2E2', border:'1.5px solid #FCA5A5', borderRadius:12, padding:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', color:'#991B1B' }}>
              ⚠️ Report Problem
            </button>
          )}
          {reporting && (
            <div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder="Describe the issue (e.g. charged more than agreed, poor work quality)..."
                style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:12, fontSize:13, outline:'none', fontFamily:'inherit', resize:'none', boxSizing:'border-box', marginBottom:8 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setReporting(false)} style={{ flex:1, background:'#f5f5f5', border:'none', borderRadius:12, padding:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button onClick={submitReport} disabled={busy} style={{ flex:2, background:'#dc2626', color:'#fff', border:'none', borderRadius:12, padding:12, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity:busy?0.6:1 }}>
                  {busy?'Sending...':'Submit Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingsScreen({ user, setTab, setSelSvc, setRebookWorker, showToast }) {
  const [bookings,  setBookings]  = useState([])
  const [workers,   setWorkers]   = useState({})
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState('all') // all | active | completed | cancelled

  useEffect(() => { if (user?.id) load() }, [user?.id])

  async function load() {
    setLoading(true)
    const { data } = await sb.from('bookings').select('*').eq('user_id', user.id).order('created_at',{ascending:false})
    if (data) {
      setBookings(data)
      // load worker details for each unique worker
      const wIds = [...new Set(data.filter(b=>b.worker_id).map(b=>b.worker_id))]
      if (wIds.length > 0) {
        const { data: wData } = await sb.from('workers').select('id,name,phone,skill,rating,total_jobs,avatar_url').in('id', wIds)
        if (wData) {
          const map = {}; wData.forEach(w => map[w.id] = w); setWorkers(map)
        }
      }
    }
    setLoading(false)
  }

  async function rebook(b) {
    const w = workers[b.worker_id]
    if (w) setRebookWorker(w)
    setSelSvc(SERVICES.find(s=>s.id===b.service_id||s.lbl===b.service)||{id:b.service_id,lbl:b.service,ico:'🔧',range:''})
    setTab('book')
  }

  const filtered = bookings.filter(b => {
    if (filter === 'active') return ['assigned','searching','priced','en_route','arrived','started','scheduled'].includes(b.status)
    if (filter === 'completed') return b.status === 'completed'
    if (filter === 'cancelled') return b.status === 'cancelled'
    return true
  })

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F2F2F7' }}>
      {selected && (
        <BookingDetail booking={selected} worker={workers[selected.worker_id]} onClose={() => setSelected(null)}
          showToast={showToast} onRebook={rebook} />
      )}

      {/* Header */}
      <div style={{ background:BK, padding:'52px 20px 16px', flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:Y, marginBottom:12 }}>📋 My Bookings</h1>
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
          {[['all','All'],['active','Active'],['completed','Completed'],['cancelled','Cancelled']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid '+(filter===v?Y:'rgba(255,255,255,.2)'),
                background:filter===v?Y:'transparent', fontSize:11, fontWeight:700, cursor:'pointer',
                fontFamily:'inherit', color:filter===v?BK:'rgba(255,255,255,.7)', whiteSpace:'nowrap', flexShrink:0 }}>
              {l} {v==='all'?bookings.length:bookings.filter(b=>v==='active'?['assigned','searching','priced','en_route','arrived','started','scheduled'].includes(b.status):b.status===v).length}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', flex:1, padding:60 }}>
            <div style={{ width:32, height:32, border:'3px solid #E5E5EA', borderTop:'3px solid '+Y, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px', background:'#fff', borderRadius:20, margin:8 }}>
            <div style={{ fontSize:52, marginBottom:14 }}>📋</div>
            <p style={{ fontWeight:800, fontSize:17, color:BK }}>No {filter!=='all'?filter:''} bookings</p>
            <p style={{ fontSize:13, color:'#8e8e93', margin:'8px 0 20px' }}>
              {filter==='all'?'Book your first service to get started!':'Try a different filter.'}
            </p>
            {filter==='all' && (
              <button onClick={() => setTab('home')}
                style={{ background:Y, border:'none', borderRadius:14, padding:'13px 28px', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', color:BK }}>
                Book a Service →
              </button>
            )}
          </div>
        ) : filtered.map(b => {
          const st = STATUS[b.status] || STATUS.searching
          const svc = SERVICES.find(s => s.id===b.service_id || s.lbl===b.service)
          const worker = workers[b.worker_id]
          return (
            <button key={b.id} onClick={() => setSelected(b)}
              style={{ background:'#fff', borderRadius:18, padding:16, border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{svc?.ico||'🔧'}</div>
                  <div>
                    <p style={{ fontSize:15, fontWeight:700, color:BK }}>{b.service}</p>
                    <p style={{ fontSize:12, color:'#8e8e93', marginTop:2 }}>
                      {new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </p>
                  </div>
                </div>
                <span style={{ background:st.bg, color:st.c, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:8, flexShrink:0, marginLeft:8 }}>{st.label}</span>
              </div>

              {worker && (
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f9f9f9', borderRadius:10, padding:'8px 10px', marginBottom:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👷</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:BK }}>{worker.name}</p>
                    <p style={{ fontSize:10, color:'#8e8e93' }}>{worker.skill} • ⭐ {(worker.rating||5.0).toFixed(1)}</p>
                  </div>
                  <a href={`tel:+91${worker.phone}`} onClick={e => e.stopPropagation()}
                    style={{ width:32, height:32, borderRadius:8, background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, textDecoration:'none' }}>
                    📞
                  </a>
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#8e8e93' }}>📍 {b.address||b.city||'—'}</span>
                {b.amount>0 && <span style={{ fontSize:15, fontWeight:800, color:YD }}>₹{b.amount}</span>}
              </div>
              <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'#c7c7cc' }}>Tap for details →</span>
                {b.payment_status==='paid' && <span style={{ fontSize:11, color:GREEN, fontWeight:700 }}>✓ Paid</span>}
              </div>
            </button>
          )
        })}
        <div style={{ height:8 }} />
      </div>
    </div>
  )
}
