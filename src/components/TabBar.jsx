const Y='#F5C000', YD='#B8900A'

const TABS = [
  { id:'home',     ico:'🏠', lbl:'Home'     },
  { id:'search',   ico:'🔍', lbl:'Find'     },
  { id:'bookings', ico:'📋', lbl:'Bookings' },
  { id:'payments', ico:'💳', lbl:'Payments' },
  { id:'profile',  ico:'👤', lbl:'Me'       },
]

export default function TabBar({ tab, setTab }) {
  return (
    <div style={{ background:'#fff', borderTop:'1px solid #E5E5EA', display:'flex', padding:'6px 0 10px', flexShrink:0, boxShadow:'0 -2px 12px rgba(0,0,0,.06)' }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
          <span style={{ fontSize:20 }}>{t.ico}</span>
          <span style={{ fontSize:9, fontWeight:700, color:tab===t.id?YD:'#AEAEB2', letterSpacing:.2 }}>{t.lbl}</span>
          {tab===t.id && <div style={{ width:16, height:2, background:Y, borderRadius:2, marginTop:1 }} />}
        </button>
      ))}
    </div>
  )
}
