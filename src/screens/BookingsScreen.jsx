import { useEffect, useState } from 'react'
import { sb } from '../lib/supabase'
import { SERVICES } from '../constants'
import Card from '../components/Card'
import Btn  from '../components/Btn'

const Y='#F5C000', YD='#B8900A'
const STATUS_STYLE = {
  searching:            { bg:'#FFF8D6', c:'#B8900A', label:'🔍 Finding worker' },
  scheduled:            { bg:'#EDE9FE', c:'#5B21B6', label:'📅 Scheduled' },
  assigned:             { bg:'#DBEAFE', c:'#1E40AF', label:'👷 Worker on the way' },
  otp_verified:         { bg:'#DBEAFE', c:'#1E40AF', label:'🔧 Work in progress' },
  priced:               { bg:'#FEF3C7', c:'#92400E', label:'💳 Payment due' },
  completed:            { bg:'#D1FAE5', c:'#065F46', label:'✓ Completed' },
  cancelled:            { bg:'#FEE2E2', c:'#991B1B', label:'Cancelled' },
}
// payment_status overrides the badge while a payment is mid-flight
const PAY_STYLE = {
  pending_verification: { bg:'#E0F2FE', c:'#0369A1', label:'🔍 Verifying payment' },
  verified:             { bg:'#D1FAE5', c:'#065F46', label:'✓ Paid' },
  paid:                 { bg:'#D1FAE5', c:'#065F46', label:'✓ Paid' },
}
const ACTIVE = ['searching','assigned','otp_verified','priced']
const fmtDate = d => d ? new Date(d).toLocaleString('en-IN',{ day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : ''

export default function BookingsScreen({ user, setTab, setSelSvc, setRebookWorker, setResume, showToast }) {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [reportFor, setReportFor] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (user?.id) load(user.id) }, [user?.id])

  // Live updates: refresh whenever any of this customer's bookings change
  // (e.g. a worker accepts → status flips to 'assigned' instantly here too).
  useEffect(() => {
    if (!user?.id) return
    const ch = sb.channel('my-bookings-' + user.id)
      .on('postgres_changes', { event:'*', schema:'public', table:'bookings', filter:'user_id=eq.'+user.id },
        () => load(user.id))
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [user?.id])

  async function load(uid) {
    setLoading(true)
    const { data } = await sb.from('bookings').select('*').eq('user_id', uid).order('created_at', { ascending:false })
    setBookings(data || [])
    setLoading(false)
  }

  // Re-open an active booking in the booking flow (to pay, track, or share the OTP).
  function resumeBooking(b) {
    setSelSvc(SERVICES.find(s => s.id === b.service_id) || { id:b.service_id, lbl:b.service, ico:'🔧', range:'' })
    setResume?.(b)
    setTab('book')
  }

  async function rebook(b) {
    if (!b.worker_id) return
    const { data: w } = await sb.from('workers_public').select('*').eq('id', b.worker_id).single()
    if (!w) { showToast && showToast('Worker not found'); return }
    setRebookWorker(w)
    setSelSvc(SERVICES.find(s => s.id === b.service_id) || { id:b.service_id, lbl:b.service, ico:'🔧', range:'' })
    setTab('book')
  }

  async function submitReport() {
    if (!reason.trim() || busy) return
    setBusy(true)
    const { error } = await sb.from('disputes').insert({ booking_id: reportFor.id, raised_by: user.id, raised_by_role:'customer', reason: reason.trim(), status:'open' })
    setBusy(false)
    if (error) { showToast && showToast(error.message); return }
    setReportFor(null); setReason('')
    showToast && showToast('Reported — our team will call you ✓')
  }

  const row = (label, value) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'3px 0' }}>
      <span style={{ fontSize:12, color:'#999' }}>{label}</span>
      <span style={{ fontSize:12, color:'#444', fontWeight:600, maxWidth:'62%', textAlign:'right' }}>{value}</span>
    </div>
  )

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
            <button onClick={submitReport} disabled={busy} style={{ width:'100%', background:'#dc2626', color:'#fff', border:'none', borderRadius:12, padding:14, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:busy?.6:1 }}>
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
      ) : bookings.length === 0 ? (
        <Card style={{ textAlign:'center', padding:'48px 24px' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>📋</div>
          <p style={{ fontWeight:800, fontSize:17 }}>No bookings yet</p>
          <p style={{ fontSize:13, color:'#888', margin:'8px 0 20px' }}>Book your first service to get started</p>
          <Btn label="Book Now →" onClick={() => setTab('home')} style={{ width:'auto', padding:'14px 28px' }} />
        </Card>
      ) : bookings.map(b => {
        const st = (b.payment_status && PAY_STYLE[b.payment_status]) || STATUS_STYLE[b.status] || STATUS_STYLE.searching
        const svc = SERVICES.find(s => s.lbl === b.service)
        const isActive = ACTIVE.includes(b.status) && b.payment_status !== 'verified'
        const showOtp = (b.status === 'assigned' || b.status === 'otp_verified') && b.completion_otp && !b.payment_status
        const paid = b.payment_status === 'verified' || b.payment_status === 'paid'
        const ref = '#KR-' + b.id.slice(0,8).toUpperCase()
        return (
          <Card key={b.id}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:'#FFF8D6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{svc?.ico || '🔧'}</div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700 }}>{b.service || 'Service'}</p>
                  <p style={{ fontSize:11, color:'#aaa', fontFamily:'monospace' }}>{ref}</p>
                </div>
              </div>
              <span style={{ background:st.bg, color:st.c, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8, whiteSpace:'nowrap' }}>{st.label}</span>
            </div>

            {/* Completion OTP — the customer shows this to the worker when the job is done */}
            {showOtp && (
              <div style={{ background:'#FFF8D6', border:'2px dashed '+Y, borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
                <p style={{ fontWeight:800, fontSize:13, color:YD }}>🔐 Completion code — give this to the worker</p>
                <p style={{ fontSize:11, color:'#7a6000', margin:'2px 0 8px' }}>Only after the job is finished. They need it to close the job & send the bill.</p>
                <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
                  {String(b.completion_otp).padStart(4,'0').split('').map((d,i) => (
                    <span key={i} style={{ width:42, height:50, borderRadius:10, background:'#fff', border:'1.5px solid '+Y, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:YD }}>{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Worker */}
            {(b.worker?.name || b.worker_name) && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f9f9f9', borderRadius:10, padding:'8px 10px', marginBottom:8 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'#FFF8D6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👷</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700 }}>{b.worker?.name || b.worker_name}</p>
                  <p style={{ fontSize:11, color:'#888' }}>{b.worker?.skill || ''}{b.worker?.rating ? ' · ★ '+b.worker.rating : ''}</p>
                </div>
              </div>
            )}

            {/* Details */}
            <div style={{ borderTop:'1px solid #f5f5f5', paddingTop:8 }}>
              {row('Booked', fmtDate(b.created_at))}
              {b.address && row('Address', b.address)}
              {b.description && row('Details', b.description)}
              {(b.labor_charge || b.material_cost || b.additional_charge) ? (
                <>
                  {b.labor_charge ? row('Labour', '₹'+b.labor_charge) : null}
                  {b.material_cost ? row('Material', '₹'+b.material_cost) : null}
                  {b.additional_charge ? row('Additional', '₹'+b.additional_charge) : null}
                </>
              ) : null}
              {b.price_note && row('Worker note', b.price_note)}
            </div>

            {/* Amount */}
            {b.amount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, marginTop:6, borderTop:'1px solid #f5f5f5' }}>
                <span style={{ fontSize:13, color:'#888' }}>{paid ? 'Amount paid' : b.status === 'priced' ? 'Amount due' : 'Quoted'}</span>
                <span style={{ fontSize:18, fontWeight:800, color: paid ? '#065F46' : YD }}>₹{b.amount}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              {isActive && (
                <button onClick={() => resumeBooking(b)}
                  style={{ flex:2, background:Y, color:'#1a1a1a', border:'none', borderRadius:10, padding:'11px 0', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  {b.status === 'priced' ? `Pay ₹${b.amount} →` : 'Open / Track →'}
                </button>
              )}
              {b.worker_id && b.status === 'completed' && (
                <button onClick={() => rebook(b)}
                  style={{ flex:1, background:'#FFF8D6', color:'#B8900A', border:'none', borderRadius:10, padding:'11px 0', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>🔁 Rebook</button>
              )}
              {b.status === 'completed' && (
                <button onClick={() => setReportFor(b)}
                  style={{ flex:1, background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:10, padding:'11px 0', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>⚠️ Report</button>
              )}
            </div>

            {b.rating > 0 && <p style={{ fontSize:13, color:'#f59e0b', marginTop:8 }}>{'★'.repeat(b.rating)}{'☆'.repeat(5-b.rating)}</p>}
          </Card>
        )
      })}
    </div>
  )
}
