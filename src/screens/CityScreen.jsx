import { sb } from '../lib/supabase'
import { KA_CITIES } from '../constants'

export default function CityScreen({ user, profile, setCity, setScreen, showToast }) {
  async function choose(c) {
    setCity(c)
    if (user) await sb.from('profiles').upsert({ id: user.id, city: c }, { onConflict: 'id' })
    showToast('📍 ' + c)
    // A Google sign-in has no phone number yet — collect it before the app
    // proper, so every booking carries a number the worker can call.
    setScreen(profile?.phone ? 'main' : 'phone')
  }
  return (
    <div style={{ minHeight:'100dvh', background:'#F2F2F7', maxWidth:430, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#1C1C1E', padding:'48px 20px 20px' }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#F5C000' }}>📍 Your city</h2>
        <p style={{ fontSize:13, color:'#555', marginTop:4 }}>We'll find workers near you</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8 }}>
        {KA_CITIES.map(c => (
          <button key={c} onClick={() => choose(c)}
            style={{ background:'#fff', border:'1.5px solid #E5E5EA', borderRadius:12,
              padding:'13px 16px', fontWeight:600, fontSize:14, cursor:'pointer',
              fontFamily:'inherit', textAlign:'left' }}>
            🏙️ {c}
          </button>
        ))}
      </div>
    </div>
  )
}
