import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', BK='#1C1C1E', GREEN='#22c55e'

const PAY_STATUS = {
  paid:                  { bg:'#D1FAE5', c:'#065F46', label:'✓ Paid' },
  verified:              { bg:'#D1FAE5', c:'#065F46', label:'✓ Verified' },
  pending_verification:  { bg:'#E0F2FE', c:'#0369A1', label:'🔍 Under Review' },
  pending:               { bg:YL,        c:YD,        label:'⏳ Pending' },
  failed:                { bg:'#FEE2E2', c:'#991B1B', label:'✗ Failed' },
  refunded:              { bg:'#EDE9FE', c:'#5B21B6', label:'↩ Refunded' },
}

export default function PaymentsScreen({ user }) {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    sb.from('bookings')
      .select('id,service,amount,payment_status,status,created_at,completed_at,transaction_id,city,address,worker_id')
      .eq('user_id', user.id)
      .not('amount', 'is', null)
      .order('created_at',{ascending:false})
      .then(({ data }) => { setBookings(data || []); setLoading(false) })
  }, [user?.id])

  const fmt = n => '₹'+(n||0).toLocaleString('en-IN')
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'

  const filtered = bookings.filter(b => filter==='all' || b.payment_status===filter)

  const totalPaid    = bookings.filter(b=>b.payment_status==='paid').reduce((s,b)=>s+(b.amount||0),0)
  const totalPending = bookings.filter(b=>b.payment_status==='pending'||b.payment_status==='pending_verification').reduce((s,b)=>s+(b.amount||0),0)

  function downloadInvoice(b) {
    const content = `KAAM READY — INVOICE\n${'='.repeat(40)}\nBooking ID: ${b.id}\nService: ${b.service}\nDate: ${fmtDate(b.created_at)}\nAmount: ${fmt(b.amount)}\nStatus: ${b.payment_status?.toUpperCase()}\nLocation: ${b.address||b.city||'—'}\n${b.transaction_id?`Transaction ID: ${b.transaction_id}\n`:''}\n${'='.repeat(40)}\nThank you for using Kaam Ready!\nsupport@kaamready.in | 6362869636`
    const blob = new Blob([content],{type:'text/plain'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `KR_Invoice_${b.id.slice(0,8)}.txt`
    a.click()
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F2F2F7' }}>
      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={e=>{ if(e.target===e.currentTarget) setSelected(null) }}>
          <div style={{ background:'#F2F2F7', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430, padding:'20px 16px 40px', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <p style={{ fontWeight:800, fontSize:17, color:BK }}>Payment Receipt</p>
              <button onClick={()=>setSelected(null)} style={{ background:'#E5E5EA', border:'none', borderRadius:10, padding:'6px 14px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Close</button>
            </div>
            {(() => {
              const ps = PAY_STATUS[selected.payment_status]||PAY_STATUS.pending
              return (
                <>
                  <div style={{ background:ps.bg, borderRadius:14, padding:16, textAlign:'center', marginBottom:12 }}>
                    <p style={{ fontSize:28, fontWeight:900, color:ps.c }}>{fmt(selected.amount)}</p>
                    <p style={{ color:ps.c, fontWeight:700, fontSize:13, marginTop:4 }}>{ps.label}</p>
                  </div>
                  <div style={{ background:'#fff', borderRadius:14, padding:14, marginBottom:10 }}>
                    {[
                      ['Service', selected.service],
                      ['Date', fmtDate(selected.created_at)],
                      ['Location', selected.address||selected.city||'—'],
                      ['Amount', fmt(selected.amount)],
                      ['Payment Status', (PAY_STATUS[selected.payment_status]||PAY_STATUS.pending).label],
                      ['Booking Status', selected.status],
                      selected.transaction_id && ['Transaction ID', selected.transaction_id],
                    ].filter(Boolean).map(([l,v]) => (
                      <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f5f5f5' }}>
                        <span style={{ color:'#8e8e93', fontSize:12, fontWeight:600 }}>{l}</span>
                        <span style={{ color:BK, fontSize:13, fontWeight: l==='Amount'?800:500, maxWidth:200, textAlign:'right', wordBreak:'break-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => downloadInvoice(selected)}
                    style={{ width:'100%', background:YL, border:'1.5px solid '+Y, borderRadius:14, padding:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', color:YD }}>
                    ⬇ Download Receipt
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:BK, padding:'52px 20px 16px', flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:Y, marginBottom:12 }}>💳 Payments</h1>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          <div style={{ background:'rgba(255,255,255,.08)', borderRadius:12, padding:'10px 14px' }}>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:10, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Total Paid</p>
            <p style={{ color:GREEN, fontSize:18, fontWeight:900 }}>{fmt(totalPaid)}</p>
          </div>
          <div style={{ background:'rgba(255,255,255,.08)', borderRadius:12, padding:'10px 14px' }}>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:10, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Pending</p>
            <p style={{ color:Y, fontSize:18, fontWeight:900 }}>{fmt(totalPending)}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['all','All'],['paid','Paid'],['pending','Pending'],['failed','Failed']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding:'6px 12px', borderRadius:20, border:'1.5px solid '+(filter===v?Y:'rgba(255,255,255,.2)'),
                background:filter===v?Y:'transparent', fontSize:11, fontWeight:700, cursor:'pointer',
                fontFamily:'inherit', color:filter===v?BK:'rgba(255,255,255,.7)', flexShrink:0 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div style={{ width:32, height:32, border:'3px solid #E5E5EA', borderTop:'3px solid '+Y, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px', background:'#fff', borderRadius:20 }}>
            <div style={{ fontSize:52, marginBottom:14 }}>💳</div>
            <p style={{ fontWeight:800, fontSize:17, color:BK }}>No payments yet</p>
            <p style={{ fontSize:13, color:'#8e8e93', marginTop:8 }}>Your payment history will appear here</p>
          </div>
        ) : filtered.map(b => {
          const ps = PAY_STATUS[b.payment_status] || PAY_STATUS.pending
          return (
            <button key={b.id} onClick={() => setSelected(b)}
              style={{ background:'#fff', borderRadius:16, padding:16, border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <p style={{ fontWeight:700, fontSize:15, color:BK }}>{b.service}</p>
                  <p style={{ fontSize:12, color:'#8e8e93', marginTop:3 }}>{fmtDate(b.created_at)}</p>
                  <p style={{ fontSize:11, color:'#aaa', marginTop:2 }}>📍 {b.address||b.city||'—'}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:18, fontWeight:900, color:YD }}>{fmt(b.amount)}</p>
                  <span style={{ background:ps.bg, color:ps.c, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6, display:'inline-block', marginTop:4 }}>{ps.label}</span>
                </div>
              </div>
              {b.transaction_id && <p style={{ fontSize:10, color:'#aaa', marginTop:8, fontFamily:'monospace' }}>TXN: {b.transaction_id}</p>}
            </button>
          )
        })}
        <div style={{ height:8 }} />
      </div>
    </div>
  )
}
