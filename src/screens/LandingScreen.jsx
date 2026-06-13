const Y  = '#F5C000'
const BG = '#FFFFFF'

const SERVICES = [
  { ico:'⚡', lbl:'Electrician' }, { ico:'🔧', lbl:'Plumber' },
  { ico:'🧹', lbl:'Cleaning'   }, { ico:'🪵', lbl:'Carpenter' },
  { ico:'🎨', lbl:'Painter'    }, { ico:'🐜', lbl:'Pest Control' },
  { ico:'🔩', lbl:'Mechanic'   }, { ico:'👷', lbl:'Labour'     },
]

const STEPS = [
  { n:'1', title:'Choose a Service', desc:'Pick from 10+ home services — electrician, plumber, cleaning & more' },
  { n:'2', title:'Worker Arrives',   desc:'A verified local worker reaches you typically within 30–60 min' },
  { n:'3', title:'Pay Securely',     desc:'Pay only after the job — directly to the platform via UPI' },
]

export default function LandingScreen({ setScreen }) {
  return (
    <div style={{ minHeight:'100dvh', background: BG, fontFamily:'Inter, system-ui, sans-serif',
      maxWidth:430, margin:'0 auto', overflowX:'hidden' }}>

      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'20px 24px 0', position:'sticky', top:0, background: BG, zIndex:10,
        borderBottom:'1px solid #F0F0F0', paddingBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, background: Y, borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏠</div>
          <span style={{ fontWeight:900, fontSize:20, color:'#1A1A1A', letterSpacing:'-0.5px' }}>Kaam Ready</span>
        </div>
        <button onClick={() => setScreen('login')}
          style={{ background:'#F5F5F5', border:'none', borderRadius:10, padding:'9px 18px',
            fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:'#1A1A1A' }}>
          Login
        </button>
      </div>

      {/* Hero */}
      <div style={{ background:`linear-gradient(160deg, ${Y} 0%, #FFD740 100%)`,
        padding:'48px 24px 40px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:160, height:160,
          background:'rgba(255,255,255,.12)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-40, left:-20, width:120, height:120,
          background:'rgba(255,255,255,.1)', borderRadius:'50%' }} />
        <p style={{ fontSize:13, fontWeight:700, color:'#7A5800', letterSpacing:1,
          textTransform:'uppercase', marginBottom:12 }}>Home Services · Mysuru & Bengaluru</p>
        <h1 style={{ fontSize:34, fontWeight:900, color:'#1A1A1A', lineHeight:1.15,
          letterSpacing:'-1px', margin:'0 0 16px' }}>
          Any Home Fix,<br/>One Tap Away
        </h1>
        <p style={{ fontSize:15, color:'#4A3500', maxWidth:300, margin:'0 auto 28px', lineHeight:1.5 }}>
          Skilled, verified workers at your door — electricians, plumbers, cleaners & more
        </p>
        <button onClick={() => setScreen('login')}
          style={{ background:'#1A1A1A', color: Y, border:'none', borderRadius:16,
            padding:'16px 40px', fontWeight:900, fontSize:17, cursor:'pointer',
            fontFamily:'inherit', boxShadow:'0 8px 24px rgba(0,0,0,.25)', letterSpacing:'-0.3px' }}>
          Book a Service →
        </button>
        <p style={{ fontSize:12, color:'#7A5800', marginTop:12 }}>Free to book · Pay after job</p>
      </div>

      {/* Trust bar */}
      <div style={{ display:'flex', justifyContent:'space-around', padding:'16px 12px',
        background:'#FFFBEA', borderBottom:'1px solid #F5EDBB' }}>
        {[['✓', 'Verified Workers'],['⚡','Fast Response'],['🔒','Secure Payments']].map(([ico,lbl]) => (
          <div key={lbl} style={{ textAlign:'center' }}>
            <p style={{ fontSize:18, margin:0 }}>{ico}</p>
            <p style={{ fontSize:11, fontWeight:700, color:'#7A5800', margin:'2px 0 0' }}>{lbl}</p>
          </div>
        ))}
      </div>

      {/* Services grid */}
      <div style={{ padding:'28px 20px 0' }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#1A1A1A', marginBottom:16, letterSpacing:'-0.5px' }}>
          What do you need?
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {SERVICES.map(s => (
            <button key={s.lbl} onClick={() => setScreen('login')}
              style={{ background:'#F5F5F8', border:'none', borderRadius:16, padding:'14px 4px',
                cursor:'pointer', fontFamily:'inherit', transition:'.15s', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{s.ico}</div>
              <p style={{ fontSize:11, fontWeight:700, color:'#1A1A1A', margin:0, lineHeight:1.2 }}>{s.lbl}</p>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding:'32px 20px 0' }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#1A1A1A', marginBottom:20, letterSpacing:'-0.5px' }}>
          How it works
        </h2>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{ width:40, height:40, borderRadius:12, background: Y,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:900, fontSize:17, flexShrink:0, color:'#1A1A1A' }}>{s.n}</div>
              <div>
                <p style={{ fontWeight:800, fontSize:15, color:'#1A1A1A', margin:'0 0 4px' }}>{s.title}</p>
                <p style={{ fontSize:13, color:'#6B7280', margin:0, lineHeight:1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Worker CTA */}
      <div style={{ margin:'32px 20px 0', background:'#1A1A1A', borderRadius:20, padding:'24px 20px', textAlign:'center' }}>
        <p style={{ fontSize:22, margin:'0 0 8px' }}>👷</p>
        <p style={{ fontWeight:800, fontSize:17, color:'#FFFFFF', margin:'0 0 6px' }}>Are you a worker?</p>
        <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 16px', lineHeight:1.5 }}>
          Join Kaam Ready and earn ₹500–₹2000/day with your skills
        </p>
        <a href="https://kaam-ready-worker.vercel.app" target="_blank" rel="noreferrer"
          style={{ display:'block', background: Y, color:'#1A1A1A', textDecoration:'none',
            borderRadius:14, padding:'13px 20px', fontWeight:800, fontSize:14 }}>
          Join as a Worker →
        </a>
      </div>

      {/* Footer */}
      <div style={{ padding:'28px 20px 40px', textAlign:'center' }}>
        <p style={{ fontWeight:900, fontSize:16, color:'#1A1A1A', marginBottom:6 }}>🏠 Kaam Ready</p>
        <p style={{ fontSize:12, color:'#9CA3AF', marginBottom:12 }}>
          Connecting skilled workers with homes across Karnataka
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:20, fontSize:12, color:'#9CA3AF' }}>
          <a href="/privacy.html" style={{ color:'#9CA3AF', textDecoration:'none' }}>Privacy</a>
          <a href="/terms.html"   style={{ color:'#9CA3AF', textDecoration:'none' }}>Terms</a>
          <a href="mailto:admin@kaamready.in" style={{ color:'#9CA3AF', textDecoration:'none' }}>Contact</a>
        </div>
        <p style={{ fontSize:11, color:'#D1D5DB', marginTop:16 }}>© 2026 Kaam Ready · Mysuru, Karnataka</p>
      </div>
    </div>
  )
}
