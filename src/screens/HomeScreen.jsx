import { useEffect } from 'react'
import { SERVICES } from '../constants'
import Card from '../components/Card'
import Btn  from '../components/Btn'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6'

export default function HomeScreen({ city, selSvc, setSelSvc, setTab, bookings, loadBookings, showToast }) {
  useEffect(() => { loadBookings() }, [])
  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:Y, borderRadius:16, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800 }}>Kaam Ready ⚡</h1>
          <p style={{ fontSize:12, color:'rgba(0,0,0,.6)' }}>📍 {city||'Karnataka'}</p>
        </div>
        <button onClick={() => setTab('profile')}
          style={{ width:36, height:36, borderRadius:10, background:'rgba(0,0,0,.12)', border:'none', cursor:'pointer', fontSize:18 }}>👤</button>
      </div>
      <Card style={{ background:YL, border:'1.5px solid '+Y }}>
        <p style={{ fontSize:13, fontWeight:700, color:YD, marginBottom:8 }}>⚡ Workers available in {city}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[['12+','Online'],['~8 min','Avg ETA'],['4.7⭐','Rating']].map(([v,l]) => (
            <div key={l} style={{ background:'#fff', borderRadius:10, padding:'8px', textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:800 }}>{v}</div>
              <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:12 }}>Select a service</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {SERVICES.map(s => (
            <div key={s.id} onClick={() => setSelSvc(s)}
              style={{ background:selSvc?.id===s.id?YL:'#f9f9f9', borderRadius:14, padding:'14px 8px',
                textAlign:'center', cursor:'pointer', border:'2px solid '+(selSvc?.id===s.id?Y:'transparent'), transition:'.15s' }}>
              <div style={{ fontSize:26, marginBottom:5 }}>{s.ico}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#333' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
        <Btn label="Book Now →" onClick={() => { if (!selSvc) { showToast('Select a service first'); return } setTab('book') }} style={{ marginTop:14 }} />
      </Card>
      {bookings.length > 0 && (
        <Card>
          <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6, marginBottom:12 }}>Recent bookings</p>
          {bookings.slice(0,3).map(b => (
            <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600 }}>{b.service}</p>
                <p style={{ fontSize:11, color:'#888' }}>{new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                {b.amount && <p style={{ fontSize:13, fontWeight:700 }}>₹{b.amount}</p>}
                <span style={{ background:b.status==='completed'?'#D1FAE5':'#FFF8D6', color:b.status==='completed'?'#065F46':'#B8900A', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6 }}>{b.status}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
