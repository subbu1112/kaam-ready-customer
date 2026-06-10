import { useState } from 'react'
import { SERVICES } from '../constants'
import Card from '../components/Card'

const Y='#F5C000', YL='#FFF8D6'
const MOCK_WORKERS = [
  { id:1, name:'Raju Kumar',  skill:'Electrician', rating:4.8, dist:'0.8 km', eta:'6 min',  jobs:342, ico:'⚡' },
  { id:2, name:'Suresh M.',   skill:'Plumber',     rating:4.9, dist:'0.5 km', eta:'4 min',  jobs:521, ico:'🔧' },
  { id:3, name:'Prakash B.',  skill:'Carpenter',   rating:4.6, dist:'1.2 km', eta:'9 min',  jobs:198, ico:'🪚' },
  { id:4, name:'Meena S.',    skill:'Cleaner',     rating:4.7, dist:'1.5 km', eta:'11 min', jobs:276, ico:'🧹' },
]
export default function SearchScreen({ city, setSelSvc, setTab, showToast }) {
  const [q,      setQ]      = useState('')
  const [filter, setFilter] = useState('all')
  const workers = MOCK_WORKERS.filter(w => {
    const mQ = !q || w.name.toLowerCase().includes(q.toLowerCase()) || w.skill.toLowerCase().includes(q.toLowerCase())
    const mF = filter==='all' || w.skill===filter
    return mQ && mF
  })
  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'#fff', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, border:'1.5px solid #E5E5EA' }}>
        <span style={{ fontSize:18 }}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search workers or services..."
          style={{ flex:1, border:'none', background:'transparent', fontSize:15, outline:'none', fontFamily:'inherit' }} />
        {q && <button onClick={() => setQ('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:18 }}>✕</button>}
      </div>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
        {['all',...SERVICES.map(s=>s.lbl).slice(0,5)].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'7px 14px', borderRadius:20, flexShrink:0, border:'1.5px solid '+(filter===f?Y:'#E5E5EA'),
              background:filter===f?Y:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', color:filter===f?'#000':'#888' }}>
            {f==='all'?'All':f}
          </button>
        ))}
      </div>
      <div style={{ background:'linear-gradient(135deg,#e8f4e8,#c3e6cb)', borderRadius:16, height:140, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:8, left:10, background:'rgba(255,255,255,.9)', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8 }}>📍 {city}</div>
        <div style={{ position:'absolute', top:'40%', left:'44%', fontSize:24 }}>📍</div>
        {workers.map((w,i) => (
          <div key={w.id} style={{ position:'absolute', fontSize:16, animation:'float 2s ease-in-out infinite',
            top:['20%','55%','30%','65%'][i], left:['25%','62%','70%','40%'][i], animationDelay:(i*0.6)+'s' }}>🔵</div>
        ))}
      </div>
      <p style={{ fontSize:13, fontWeight:700, color:'#888' }}>{workers.length} worker{workers.length!==1?'s':''} nearby</p>
      {workers.map(w => (
        <div key={w.id} style={{ background:'#fff', borderRadius:16, padding:14, border:'1px solid #E5E5EA', display:'flex', alignItems:'center', gap:12, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{w.ico}</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700 }}>{w.name}</p>
            <p style={{ fontSize:12, color:'#888', marginTop:2 }}>{w.dist} · ETA {w.eta} · {w.jobs} jobs</p>
            <div style={{ marginTop:4 }}>
              <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>● Online</span>
              <span style={{ fontSize:12, color:'#f59e0b', fontWeight:700, marginLeft:6 }}>★ {w.rating}</span>
            </div>
          </div>
          <button onClick={() => { setSelSvc(SERVICES.find(s=>s.lbl===w.skill)||SERVICES[0]); setTab('book'); showToast('Booking '+w.name+'...') }}
            style={{ background:Y, border:'none', borderRadius:10, padding:'9px 14px', fontWeight:700, fontSize:13, cursor:'pointer' }}>Book</button>
        </div>
      ))}
    </div>
  )
}
