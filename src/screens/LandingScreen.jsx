const Y = '#F5C000'
const DARK = '#1A1A1A'

const SERVICES = [
  { ico:'⚡', lbl:'Electrician' }, { ico:'🔧', lbl:'Plumber'      },
  { ico:'🧹', lbl:'Cleaning'   }, { ico:'🪵', lbl:'Carpenter'    },
  { ico:'🎨', lbl:'Painter'    }, { ico:'🐜', lbl:'Pest Control'  },
  { ico:'🔩', lbl:'Mechanic'   }, { ico:'👷', lbl:'Labour'        },
]

function PhoneMockup() {
  return (
    <div style={{ position:'relative', width:160, height:280, margin:'0 auto' }}>
      {/* Phone frame */}
      <div style={{ width:160, height:280, background:'#FFFFFF', borderRadius:28,
        boxShadow:'0 24px 60px rgba(0,0,0,.25)', border:'6px solid #222',
        display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
        {/* Notch */}
        <div style={{ height:22, background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:40, height:8, background:'#333', borderRadius:4 }} />
        </div>
        {/* Screen */}
        <div style={{ flex:1, background:'#F5F5F8', padding:'8px 8px 6px', display:'flex', flexDirection:'column', gap:5 }}>
          {/* Mini header */}
          <div style={{ background:Y, borderRadius:8, padding:'6px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:9, fontWeight:900, color:DARK }}>🏠 Kaam Ready</span>
            <span style={{ fontSize:8, color:DARK }}>Mysuru</span>
          </div>
          {/* Service cards row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
            {['⚡','🔧','🧹','🪵','🎨','🐜'].map(ico => (
              <div key={ico} style={{ background:'#FFF', borderRadius:6, padding:'5px 2px', textAlign:'center', fontSize:12 }}>{ico}</div>
            ))}
          </div>
          {/* Active booking card */}
          <div style={{ background:'#FFF', borderRadius:8, padding:'6px 8px', border:'1.5px solid '+Y }}>
            <p style={{ fontSize:8, fontWeight:800, color:DARK, margin:'0 0 2px' }}>⚡ Electrician · Active</p>
            <p style={{ fontSize:7, color:'#9CA3AF', margin:0 }}>Rajesh · 8 min away · ★ 4.9</p>
            <div style={{ marginTop:4, background:Y, borderRadius:4, padding:'2px 6px', display:'inline-block' }}>
              <span style={{ fontSize:7, fontWeight:800, color:DARK }}>Track Worker →</span>
            </div>
          </div>
          {/* Bottom nav */}
          <div style={{ marginTop:'auto', background:'#FFF', borderRadius:8, padding:'4px 0', display:'flex', justifyContent:'space-around' }}>
            {['🏠','📋','👤'].map(t => <span key={t} style={{ fontSize:13 }}>{t}</span>)}
          </div>
        </div>
      </div>
      {/* Glow */}
      <div style={{ position:'absolute', bottom:-20, left:'50%', transform:'translateX(-50%)',
        width:120, height:20, background:'rgba(245,192,0,.35)', borderRadius:'50%', filter:'blur(10px)' }} />
    </div>
  )
}

export default function LandingScreen({ setScreen }) {
  return (
    <div style={{ height:'100dvh', overflowY:'auto', WebkitOverflowScrolling:'touch',
      background:'#FFFFFF', fontFamily:'Inter, system-ui, sans-serif', maxWidth:430, margin:'0 auto' }}>

      {/* ── NAV ── */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,.95)',
        backdropFilter:'blur(12px)', borderBottom:'1px solid #F0F0F0',
        display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, background:Y, borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏠</div>
          <span style={{ fontWeight:900, fontSize:19, color:DARK, letterSpacing:'-0.5px' }}>Kaam Ready</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setScreen('login')}
            style={{ background:'none', border:'1.5px solid #E5E7EB', borderRadius:9, padding:'7px 13px',
              fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#6B7280' }}>
            Sign Up
          </button>
          <button onClick={() => setScreen('login')}
            style={{ background:DARK, border:'none', borderRadius:9, padding:'8px 14px',
              fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:Y }}>
            Login
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background:`linear-gradient(150deg, #1A1A1A 0%, #2C2C2C 60%, #1A1A1A 100%)`,
        padding:'44px 24px 52px', position:'relative', overflow:'hidden' }}>
        {/* BG circles */}
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220,
          background:'rgba(245,192,0,.12)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-80, left:-40, width:200, height:200,
          background:'rgba(245,192,0,.07)', borderRadius:'50%' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(245,192,0,.15)',
            borderRadius:20, padding:'5px 12px', marginBottom:18 }}>
            <span style={{ width:6, height:6, background:Y, borderRadius:'50%', display:'inline-block' }} />
            <span style={{ fontSize:11, fontWeight:700, color:Y, letterSpacing:0.8 }}>MYSURU · BENGALURU</span>
          </div>

          <h1 style={{ fontSize:36, fontWeight:900, color:'#FFFFFF', lineHeight:1.1,
            letterSpacing:'-1.5px', margin:'0 0 14px' }}>
            Home Services,<br/><span style={{ color:Y }}>Done Right.</span>
          </h1>
          <p style={{ fontSize:14, color:'#A0A0A0', margin:'0 0 28px', lineHeight:1.6, maxWidth:280 }}>
            Verified electricians, plumbers, cleaners & more — at your door in under an hour
          </p>

          <div style={{ display:'flex', gap:10, marginBottom:40 }}>
            <button onClick={() => setScreen('login')}
              style={{ background:Y, color:DARK, border:'none', borderRadius:13,
                padding:'14px 24px', fontWeight:900, fontSize:15, cursor:'pointer',
                fontFamily:'inherit', boxShadow:'0 6px 24px rgba(245,192,0,.4)', letterSpacing:'-0.3px' }}>
              Book Now →
            </button>
            <button onClick={() => setScreen('login')}
              style={{ background:'rgba(255,255,255,.1)', color:'#FFF', border:'1.5px solid rgba(255,255,255,.2)',
                borderRadius:13, padding:'14px 20px', fontWeight:700, fontSize:14, cursor:'pointer',
                fontFamily:'inherit' }}>
              See Services
            </button>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background:Y, padding:'18px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-around' }}>
          {[['500+','Workers'],['10+','Services'],['2 Cities','& growing'],['4.8★','Avg Rating']].map(([v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <p style={{ fontWeight:900, fontSize:17, color:DARK, margin:0, letterSpacing:'-0.5px' }}>{v}</p>
              <p style={{ fontSize:10, fontWeight:700, color:'#7A5800', margin:'2px 0 0', letterSpacing:0.3 }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ padding:'28px 20px' }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
          What we offer
        </p>
        <h2 style={{ fontSize:22, fontWeight:900, color:DARK, margin:'0 0 18px', letterSpacing:'-0.5px' }}>
          Pick Your Service
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {SERVICES.map(s => (
            <button key={s.lbl} onClick={() => setScreen('login')}
              style={{ background:'#F5F5F8', border:'none', borderRadius:14, padding:'14px 6px 12px',
                cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                transition:'transform .15s', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ fontSize:26, marginBottom:5 }}>{s.ico}</div>
              <p style={{ fontSize:10, fontWeight:700, color:DARK, margin:0, lineHeight:1.2 }}>{s.lbl}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background:'#F5F5F8', padding:'28px 20px' }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
          Simple process
        </p>
        <h2 style={{ fontSize:22, fontWeight:900, color:DARK, margin:'0 0 20px', letterSpacing:'-0.5px' }}>
          How It Works
        </h2>
        {[
          { n:'01', ico:'📱', title:'Book in Seconds',  desc:'Choose a service, confirm your address — done in under a minute' },
          { n:'02', ico:'👷', title:'Worker Dispatched', desc:'A nearby verified worker is assigned and heads your way' },
          { n:'03', ico:'✅', title:'Job Done · Pay',    desc:'Pay securely via UPI only after you\'re satisfied with the work' },
        ].map((s, i) => (
          <div key={s.n} style={{ display:'flex', gap:14, marginBottom: i < 2 ? 20 : 0 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:44, height:44, borderRadius:14, background:Y,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {s.ico}
              </div>
              {i < 2 && <div style={{ width:2, flex:1, background:'#E5E7EB', marginTop:6, minHeight:20 }} />}
            </div>
            <div style={{ paddingTop:6 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', margin:'0 0 3px', letterSpacing:0.5 }}>{s.n}</p>
              <p style={{ fontWeight:800, fontSize:15, color:DARK, margin:'0 0 4px' }}>{s.title}</p>
              <p style={{ fontSize:13, color:'#6B7280', margin:0, lineHeight:1.5 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── TRUST ── */}
      <section style={{ padding:'28px 20px' }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:DARK, margin:'0 0 16px', letterSpacing:'-0.5px' }}>
          Why Kaam Ready?
        </h2>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { ico:'🪪', title:'ID-Verified Workers',   desc:'Every worker submits Aadhaar before joining' },
            { ico:'💳', title:'Pay After Job',          desc:'Your money is safe — pay only when you\'re happy' },
            { ico:'⚡', title:'60-Min Response',        desc:'Workers nearby are alerted instantly — fast arrival' },
            { ico:'🔁', title:'Rebook Favourites',      desc:'Loved the worker? Request them directly next time' },
          ].map(p => (
            <div key={p.title} style={{ display:'flex', gap:14, alignItems:'flex-start',
              background:'#F5F5F8', borderRadius:14, padding:'14px 14px' }}>
              <span style={{ fontSize:24, flexShrink:0 }}>{p.ico}</span>
              <div>
                <p style={{ fontWeight:800, fontSize:14, color:DARK, margin:'0 0 3px' }}>{p.title}</p>
                <p style={{ fontSize:12, color:'#6B7280', margin:0, lineHeight:1.5 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORKER CTA ── */}
      <section style={{ margin:'0 20px 28px', background:DARK, borderRadius:22, padding:'28px 22px',
        position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120,
          background:'rgba(245,192,0,.1)', borderRadius:'50%' }} />
        <p style={{ fontSize:30, margin:'0 0 10px' }}>👷</p>
        <p style={{ fontWeight:900, fontSize:20, color:'#FFF', margin:'0 0 8px', letterSpacing:'-0.5px' }}>
          Earn with your skills
        </p>
        <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 20px', lineHeight:1.6 }}>
          Join 500+ workers earning ₹500–₹2000/day. Weekly UPI payouts. Jobs near you.
        </p>
        <a href="https://kaam-ready-worker.vercel.app" target="_blank" rel="noreferrer"
          style={{ display:'block', background:Y, color:DARK, textDecoration:'none', borderRadius:13,
            padding:'14px 20px', fontWeight:900, fontSize:14, textAlign:'center',
            boxShadow:'0 6px 20px rgba(245,192,0,.35)' }}>
          Join as a Worker →
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'1px solid #F0F0F0', padding:'24px 20px 40px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, background:Y, borderRadius:8,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏠</div>
          <span style={{ fontWeight:900, fontSize:16, color:DARK }}>Kaam Ready</span>
        </div>
        <p style={{ fontSize:12, color:'#9CA3AF', marginBottom:16, lineHeight:1.6 }}>
          Connecting skilled workers with homes across Karnataka
        </p>
        <div style={{ display:'flex', gap:16, fontSize:12 }}>
          <a href="/privacy.html"            style={{ color:'#6B7280', textDecoration:'none' }}>Privacy</a>
          <a href="/terms.html"              style={{ color:'#6B7280', textDecoration:'none' }}>Terms</a>
          <a href="mailto:admin@kaamready.in" style={{ color:'#6B7280', textDecoration:'none' }}>Contact</a>
        </div>
        <p style={{ fontSize:11, color:'#D1D5DB', marginTop:16 }}>© 2026 Kaam Ready · Mysuru, Karnataka</p>
      </footer>
    </div>
  )
}
