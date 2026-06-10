import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'

const YL='#FFF8D6', YD='#B8900A'
export default function ProfileScreen({ user, city, bookings, showToast }) {
  const menus = [['📋','My Bookings','#D1FAE5'],['📍','Change City','#DBEAFE'],['🏠','Saved Addresses','#FFF8D6'],['🎁','Refer & Earn','#EDE9FE'],['💳','Payment Methods','#F3F4F6'],['❓','Help & Support','#F3F4F6'],['📜','Privacy Policy','#F3F4F6']]
  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <Card style={{ textAlign:'center', padding:24 }}>
        <div style={{ width:72, height:72, borderRadius:20, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 14px' }}>👤</div>
        <p style={{ fontWeight:800, fontSize:18 }}>{user?.email?.replace('@kaamready.in','')||'User'}</p>
        {city && <p style={{ fontSize:13, color:'#888', marginTop:4 }}>📍 {city}, Karnataka</p>}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:12 }}>
          <span style={{ background:YL, color:YD, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8 }}>{bookings.length} Booking{bookings.length!==1?'s':''}</span>
          <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8 }}>✓ Verified</span>
        </div>
      </Card>
      <Card>
        {menus.map(([ico,label,bg]) => (
          <div key={label} onClick={() => showToast(label+' — coming soon!')}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 0', borderBottom:'1px solid #f5f5f5', cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{ico}</div>
            <span style={{ fontSize:15, fontWeight:500, flex:1 }}>{label}</span>
            <span style={{ color:'#ddd', fontSize:18 }}>›</span>
          </div>
        ))}
      </Card>
      <Btn label="Sign Out" variant="outline" onClick={() => sb.auth.signOut()} />
      <p style={{ textAlign:'center', fontSize:12, color:'#ccc', paddingBottom:8 }}>Kaam Ready v1.0 · Made in Karnataka 🇮🇳</p>
    </div>
  )
}
