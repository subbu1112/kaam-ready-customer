const YD = '#B8900A'
const TABS = [
  { id: 'home',     ico: '🏠', lbl: 'Home'    },
  { id: 'search',   ico: '🔍', lbl: 'Find'    },
  { id: 'bookings', ico: '📋', lbl: 'Bookings' },
  { id: 'profile',  ico: '👤', lbl: 'Me'      },
]
export default function TabBar({ tab, setTab }) {
  return (
    <div style={{ background:'#fff', borderTop:'1px solid #E5E5EA',
      display:'flex', padding:'8px 0 12px', flexShrink:0 }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
          <span style={{ fontSize:22 }}>{t.ico}</span>
          <span style={{ fontSize:10, fontWeight:700, color:tab===t.id?YD:'#AEAEB2' }}>{t.lbl}</span>
        </button>
      ))}
    </div>
  )
}
