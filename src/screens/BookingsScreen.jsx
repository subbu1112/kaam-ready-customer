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
}
export default function BookingsScreen({ user, setTab }) {
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
