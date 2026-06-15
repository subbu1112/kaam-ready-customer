import { useEffect, useState } from 'react'
import { sb } from '../lib/supabase'
import { SERVICES } from '../constants'
import Card from '../components/Card'
import Btn  from '../components/Btn'

const YD='#B8900A'
const STATUS_STYLE = {
  completed: { bg:'#D1FAE5', c:'#065F46', label:'✓ Done'       },
  searching:  { bg:'#FFF8D6', c:'#B8900A', label:'Searching...' },
  assigned:   { bg:'#DBEAFE', c:'#1E40AF', label:'Active'       },
  priced:     { bg:'#FEF3C7', c:'#92400E', label:'💳 Payment Due' },
  cancelled:  { bg:'#FEE2E2', c:'#991B1B', label:'Cancelled'    },
  scheduled:  { bg:'#EDE9FE', c:'#5B21B6', label:'📅 Scheduled'  },
}
export default function BookingsScreen({ user, setTab, setSelSvc, setRebookWorker, showToast }) {
  const [reportFor, setReportFor] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function rebook(b) {
    if (!b.worker_id) return
    const { data: w } = await sb.from('workers').select('*').eq('id', b.worker_id).single()
    if (!w) { showToast && showToast('Worker not found'); return }
    setRebookWorker(w)
    setSelSvc(SERVICES.find(s=>s.id===b.service_id) || { id:b.service_id, lbl:b.service, ico:'🔧', range:'' })
    setTab('book')
  }

  async function submitReport() {
    if (!reason.trim() || busy) return
    setBusy(true)
    const { error } = await sb.from('disputes').insert({
      booking_id: reportFor.id, raised_by: user.id, raised_by_role: 'customer',
      reason: reason.trim(), status: 'open',
    })
    setBusy(false)
    if (error) { showToast && showToast(error.message); return }
    setReportFor(null); setReason('')
    showToast && showToast('Reported — our team will call you ✓')
  }
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { if (user?.id) load(user.id) }, [user?.id])

  async function load(uid) {
    setLoading(true)
    const { data, error } = await sb.from('bookings').select('*')
      .eq('user_id', uid).order('created_at', { ascending: false })
    if (data) setBookings(data)
    setLoading(false)
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <p style={{ fontWeight:800, fontSize:22, padding:'4px 0 0' }}>My Bookings</p>
      {reportFor && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430, padding:'20px 20px 36px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <p style={{ fontWeight:800, fontSize:17 }}>⚠️ Report a Problem</p>
              <button onClick={() => { setReportFor(null); setReason('') }} style={{ background:'#f0f0f0', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit' }}>Close</button>
            </div>
            <p style={{ fontSize:12, color:'#888', marginBottom:10 }}>{reportFor.service} · ₹{reportFor.amount||0}</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="What went wrong? e.g. charged more than agreed, poor work quality..."
              style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:12, fontSize:14, outline:'none', fontFamily:'inherit', resize:'none', marginBottom:12 }} />
            <button onClick={submitReport} disabled={busy}
              style={{ width:'100%', background:'#dc2626', color:'#fff', border:'none', borderRadius:12, padding:14, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:busy?.6:1 }}>
              {busy ? 'Sending...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <Card style={{ textAlign:'center', padding:'40px 24px' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>⏳</div>
          <p style={{ color:'#888', fontSize:14 }}>Loading your bookings...</p>
        </Card>
      ) : bookings.length===0 ? (
        <Card style={{ textAlign:'center', padding:'48px 24px' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>📋</div>
          <p style={{ fontWeight:800, fontSize:17 }}>No bookings yet</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>Book your first service to get started</p>
          <Btn label="Book Now →" onClick={() => setTab('home')} style={{ width:'auto', padding:'14px 28px' }} />
        </Card>
      ) : bookings.map(b => {
        const st = STATUS_STYLE[b.status]||STATUS_STYLE.searching
        const svc = SERVICES.find(s=>s.lbl===b.service)
        return (
          <Card key={b.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:'#FFF8D6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{svc?.ico||'🔧'}</div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700 }}>{b.service}</p>
                  <p style={{ fontSize:12, color:'#888' }}>{new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
              </div>
              <span style={{ background:st.bg, color:st.c, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8 }}>{st.label}</span>
            </div>
            {b.worker?.name && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f9f9f9', borderRadius:10, padding:'8px 10px', marginBottom:8 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'#FFF8D6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👷</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700 }}>{b.worker.name}</p>
                  <p style={{ fontSize:11, color:'#888' }}>{b.worker.skill} · ★ {b.worker.rating||'5.0'}</p>
                </div>
              </div>
            )}
            <p style={{ fontSize:12, color:'#aaa', marginBottom:b.amount?10:0 }}>📍 {b.address||b.city}</p>
            {(b.status==='completed' || b.status==='cancelled') && (
              <div style={{ display:'flex', gap:8, margin:'10px 0' }}>
                {b.worker_id && b.status==='completed' && (
                  <button onClick={() => rebook(b)}
                    style={{ flex:1, background:'#FFF8D6', color:'#B8900A', border:'none', borderRadius:10, padding:'9px 0', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>🔁 Rebook Worker</button>
                )}
                {b.status==='completed' && (
                  <button onClick={() => setReportFor(b)}
                    style={{ flex:1, background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:10, padding:'9px 0', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>⚠️ Report Problem</button>
                )}
              </div>
            )}
            {b.amount>0 && (
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid #f5f5f5' }}>
                <span style={{ fontSize:13, color:'#888' }}>Amount paid</span>
                <span style={{ fontSize:16, fontWeight:800, color:YD }}>₹{b.amount}</span>
              </div>
            )}
            {b.rating>0 && <p style={{ fontSize:13, color:'#f59e0b', marginTop:6 }}>{'★'.repeat(b.rating)}{'☆'.repeat(5-b.rating)}</p>}
          </Card>
        )
      })}
    </div>
  )
}
