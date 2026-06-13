import { useEffect, useState } from 'react'

const Y = '#F5C000'
const DARK = '#1A1A1A'

const SERVICES = [
  { ico:'⚡', lbl:'Electrician' }, { ico:'🔧', lbl:'Plumber'     },
  { ico:'🧹', lbl:'Cleaning'   }, { ico:'🪵', lbl:'Carpenter'   },
  { ico:'🎨', lbl:'Painter'    }, { ico:'🐜', lbl:'Pest Control' },
  { ico:'🔩', lbl:'Mechanic'   }, { ico:'👷', lbl:'Labour'       },
]

function PhoneMockup() {
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  )

  useEffect(() => {
    window.addEventListener('appinstalled', () => setInstalled(true))
  }, [])

  async function handleInstall() {
    const prompt = window.__pwaPrompt
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') { setInstalled(true); window.__pwaPrompt = null }
  }

  return (
    <div style={{ position:'relative', width:200, height:360, margin:'0 auto', flexShrink:0 }}>
      <div style={{ width:200, height:360, background:'#FFFFFF', borderRadius:36,
        boxShadow:'0 32px 80px rgba(0,0,0,.3)', border:'7px solid #222',
        display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ height:26, background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:50, height:10, background:'#333', borderRadius:5 }} />
        </div>
        <div style={{ flex:1, background:'#F5F5F8', padding:'10px 10px 8px', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ background:Y, borderRadius:10, padding:'7px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:900, color:DARK }}>🏠 Kaam Ready</span>
            <span style={{ fontSize:10, color:DARK }}>Mysuru</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
            {['⚡','🔧','🧹','🪵','🎨','🐜'].map(ico => (
              <div key={ico} style={{ background:'#FFF', borderRadius:8, padding:'7px 2px', textAlign:'center', fontSize:16 }}>{ico}</div>
            ))}
          </div>
          <div style={{ background:'#FFF', borderRadius:10, padding:'8px 10px', border:'2px solid '+Y }}>
            <p style={{ fontSize:10, fontWeight:800, color:DARK, margin:'0 0 2px' }}>⚡ Electrician · Active</p>
            <p style={{ fontSize:9, color:'#9CA3AF', margin:0 }}>Rajesh · 8 min away · ★ 4.9</p>
            <div style={{ marginTop:6, background:Y, borderRadius:5, padding:'3px 8px', display:'inline-block' }}>
              <span style={{ fontSize:9, fontWeight:800, color:DARK }}>Track Worker →</span>
            </div>
          </div>
          <div style={{ marginTop:'auto', background:'#FFF', borderRadius:10, padding:'5px 0', display:'flex', justifyContent:'space-around' }}>
            {['🏠','📋','👤'].map(t => <span key={t} style={{ fontSize:17 }}>{t}</span>)}
          </div>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:-24, left:'50%', transform:'translateX(-50%)',
        width:150, height:24, background:'rgba(245,192,0,.4)', borderRadius:'50%', filter:'blur(14px)' }} />
    </div>
  )
}

export default function LandingScreen({ setScreen }) {
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'kr-landing'
    style.textContent = `
      .kr-root { max-width:100%; }
      .kr-nav-inner { max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; }
      .kr-hero-inner { max-width:1200px; margin:0 auto; display:flex; flex-direction:column; align-items:center; gap:40px; }
      .kr-hero-text { text-align:center; }
      .kr-hero-h1 { font-size:36px; }
      .kr-stats-inner { max-width:1200px; margin:0 auto; display:flex; justify-content:space-around; }
      .kr-section-inner { max-width:1200px; margin:0 auto; }
      .kr-svc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
      .kr-trust-grid { display:flex; flex-direction:column; gap:12px; }
      .kr-steps { display:flex; flex-direction:column; gap:0; }
      .kr-bottom { display:grid; grid-template-columns:1fr; gap:20px; }
      .kr-phone { display:block; }
      @media(min-width:768px){
        .kr-hero-inner { flex-direction:row; align-items:center; text-align:left; padding:60px 40px; gap:60px; }
        .kr-hero-text { text-align:left; flex:1; }
        .kr-hero-h1 { font-size:52px !important; }
        .kr-hero-btns { justify-content:flex-start !important; }
        .kr-svc-grid { grid-template-columns:repeat(8,1fr); }
        .kr-trust-grid { display:grid; grid-template-columns:1fr 1fr; }
        .kr-steps { flex-direction:row; gap:24px; }
        .kr-step-connector { display:none !important; }
        .kr-bottom { grid-template-columns:1fr 1fr; }
        .kr-nav-inner { padding:0 40px; }
        .kr-stats-inner { padding:0 40px; }
        .kr-section-inner { padding:48px 40px !important; }
        .kr-footer-inner { max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; align-items:flex-start; }
        .kr-footer-links { display:flex; gap:24px; align-items:center; }
      }
      @media(max-width:767px){
        .kr-footer-inner { display:flex; flex-direction:column; gap:16px; }
        .kr-footer-links { display:flex; flex-direction:column; gap:10px; }
      }
    `
    document.head.appendChild(style)
    return () => document.getElementById('kr-landing')?.remove()
  }, [])

  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  )

  useEffect(() => {
    window.addEventListener('appinstalled', () => setInstalled(true))
  }, [])

  async function handleInstall() {
    const prompt = window.__pwaPrompt
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') { setInstalled(true); window.__pwaPrompt = null }
  }

  return (
    <div className="kr-root" style={{ height:'100dvh', overflowY:'auto', WebkitOverflowScrolling:'touch',
      background:'#FFFFFF', fontFamily:'Inter, system-ui, sans-serif' }}>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,.95)',
        backdropFilter:'blur(12px)', borderBottom:'1px solid #F0F0F0', padding:'14px 20px' }}>
        <div className="kr-nav-inner">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:36, height:36, background:Y, borderRadius:11,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏠</div>
            <span style={{ fontWeight:900, fontSize:20, color:DARK, letterSpacing:'-0.5px' }}>Kaam Ready</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {!installed && (
              <button onClick={handleInstall}
                style={{ background:'#F5F5F5', border:'none', borderRadius:10, padding:'8px 14px',
                  fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#1A1A1A',
                  display:'flex', alignItems:'center', gap:6 }}>
                ⬇️ Download
              </button>
            )}
            <button onClick={() => setScreen('login')}
              style={{ background:'none', border:'1.5px solid #E5E7EB', borderRadius:10, padding:'8px 14px',
                fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#6B7280' }}>
              Sign Up
            </button>
            <button onClick={() => setScreen('login')}
              style={{ background:DARK, border:'none', borderRadius:10, padding:'9px 16px',
                fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:Y }}>
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:`linear-gradient(150deg, #1A1A1A 0%, #2C2C2C 60%, #1A1A1A 100%)`,
        padding:'44px 24px 52px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320,
          background:'rgba(245,192,0,.1)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:-100, left:-60, width:280, height:280,
          background:'rgba(245,192,0,.06)', borderRadius:'50%' }} />
        <div className="kr-hero-inner" style={{ position:'relative', zIndex:1, padding:'0' }}>
          <div className="kr-hero-text">
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(245,192,0,.15)',
              borderRadius:20, padding:'5px 14px', marginBottom:20 }}>
              <span style={{ width:6, height:6, background:Y, borderRadius:'50%', display:'inline-block' }} />
              <span style={{ fontSize:11, fontWeight:700, color:Y, letterSpacing:1 }}>MYSURU · BENGALURU</span>
            </div>
            <h1 className="kr-hero-h1" style={{ fontWeight:900, color:'#FFFFFF', lineHeight:1.1,
              letterSpacing:'-2px', margin:'0 0 16px' }}>
              Home Services,<br/><span style={{ color:Y }}>Done Right.</span>
            </h1>
            <p style={{ fontSize:16, color:'#A0A0A0', margin:'0 0 32px', lineHeight:1.7, maxWidth:420 }}>
              Verified electricians, plumbers, cleaners & more — at your door in under an hour. Pay only after the job.
            </p>
            <div className="kr-hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
              <button onClick={() => setScreen('login')}
                style={{ background:Y, color:DARK, border:'none', borderRadius:14,
                  padding:'15px 32px', fontWeight:900, fontSize:16, cursor:'pointer',
                  fontFamily:'inherit', boxShadow:'0 6px 28px rgba(245,192,0,.45)', letterSpacing:'-0.3px' }}>
                Book a Service →
              </button>
              <button onClick={() => setScreen('login')}
                style={{ background:'rgba(255,255,255,.1)', color:'#FFF', border:'1.5px solid rgba(255,255,255,.2)',
                  borderRadius:14, padding:'15px 24px', fontWeight:700, fontSize:15, cursor:'pointer',
                  fontFamily:'inherit' }}>
                See Services
              </button>
              {!installed && (
                <button onClick={handleInstall}
                  style={{ background:'rgba(255,255,255,.12)', color:'#FFF', border:'1.5px solid rgba(255,255,255,.25)',
                    borderRadius:14, padding:'15px 24px', fontWeight:700, fontSize:15, cursor:'pointer',
                    fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
                  <span>⬇️</span> Install App
                </button>
              )}
              {installed && (
                <div style={{ background:'rgba(255,255,255,.12)', borderRadius:14, padding:'15px 20px',
                  color:'#A0FFA0', fontWeight:700, fontSize:14 }}>✓ App Installed</div>
              )}
            </div>

          </div>
          <div className="kr-phone"><PhoneMockup /></div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background:Y, padding:'20px 24px' }}>
        <div className="kr-stats-inner">
          {[['500+','Verified Workers'],['10+','Home Services'],['2 Cities','& growing'],['4.8★','Avg Rating']].map(([v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <p style={{ fontWeight:900, fontSize:20, color:DARK, margin:0, letterSpacing:'-0.5px' }}>{v}</p>
              <p style={{ fontSize:11, fontWeight:700, color:'#7A5800', margin:'3px 0 0', letterSpacing:0.3 }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding:'32px 24px' }}>
        <div className="kr-section-inner" style={{ padding:0 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>What we offer</p>
          <h2 style={{ fontSize:26, fontWeight:900, color:DARK, margin:'0 0 20px', letterSpacing:'-0.5px' }}>Pick Your Service</h2>
          <div className="kr-svc-grid">
            {SERVICES.map(s => (
              <button key={s.lbl} onClick={() => setScreen('login')}
                style={{ background:'#F5F5F8', border:'none', borderRadius:16, padding:'18px 8px 14px',
                  cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
                <div style={{ fontSize:30, marginBottom:7 }}>{s.ico}</div>
                <p style={{ fontSize:12, fontWeight:700, color:DARK, margin:0 }}>{s.lbl}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background:'#F5F5F8', padding:'32px 24px' }}>
        <div className="kr-section-inner" style={{ padding:0 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Simple process</p>
          <h2 style={{ fontSize:26, fontWeight:900, color:DARK, margin:'0 0 24px', letterSpacing:'-0.5px' }}>How It Works</h2>
          <div className="kr-steps">
            {[
              { ico:'📱', title:'Book in Seconds',   desc:'Choose a service, confirm your address — done in under a minute' },
              { ico:'👷', title:'Worker Dispatched',  desc:'A nearby verified worker is assigned and heads your way' },
              { ico:'✅', title:'Job Done · Pay',     desc:"Pay securely via UPI only after you're satisfied" },
            ].map((s, i) => (
              <div key={i} style={{ flex:1, background:'#FFF', borderRadius:18, padding:'24px 20px',
                display:'flex', flexDirection:'column', gap:10, border:'1px solid #EBEBEB' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:Y,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{s.ico}</div>
                <p style={{ fontSize:13, fontWeight:700, color:'#9CA3AF', margin:0 }}>0{i+1}</p>
                <p style={{ fontWeight:800, fontSize:16, color:DARK, margin:0 }}>{s.title}</p>
                <p style={{ fontSize:13, color:'#6B7280', margin:0, lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ padding:'32px 24px' }}>
        <div className="kr-section-inner" style={{ padding:0 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Why us</p>
          <h2 style={{ fontSize:26, fontWeight:900, color:DARK, margin:'0 0 20px', letterSpacing:'-0.5px' }}>Why Kaam Ready?</h2>
          <div className="kr-trust-grid">
            {[
              { ico:'🪪', title:'ID-Verified Workers',  desc:'Every worker submits Aadhaar before joining' },
              { ico:'💳', title:'Pay After Job',         desc:"Your money stays safe — pay only when you're happy" },
              { ico:'⚡', title:'60-Min Response',       desc:'Workers nearby are alerted instantly — fast arrival' },
              { ico:'🔁', title:'Rebook Favourites',     desc:'Loved the worker? Request them directly next time' },
            ].map(p => (
              <div key={p.title} style={{ display:'flex', gap:14, alignItems:'flex-start',
                background:'#F5F5F8', borderRadius:16, padding:'16px' }}>
                <span style={{ fontSize:26, flexShrink:0 }}>{p.ico}</span>
                <div>
                  <p style={{ fontWeight:800, fontSize:14, color:DARK, margin:'0 0 4px' }}>{p.title}</p>
                  <p style={{ fontSize:13, color:'#6B7280', margin:0, lineHeight:1.5 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTAs */}
      <section style={{ padding:'0 24px 36px' }}>
        <div className="kr-section-inner kr-bottom" style={{ padding:0 }}>
          {/* Book CTA */}
          <div style={{ background:`linear-gradient(135deg,${Y},#FFD740)`, borderRadius:22, padding:'32px 28px' }}>
            <p style={{ fontSize:32, margin:'0 0 10px' }}>📱</p>
            <p style={{ fontWeight:900, fontSize:22, color:DARK, margin:'0 0 8px' }}>Ready to book?</p>
            <p style={{ fontSize:14, color:'#7A5800', margin:'0 0 20px', lineHeight:1.6 }}>Get a verified worker at your door today</p>
            <button onClick={() => setScreen('login')}
              style={{ background:DARK, color:Y, border:'none', borderRadius:13, padding:'14px 28px',
                fontWeight:900, fontSize:15, cursor:'pointer', fontFamily:'inherit', width:'100%' }}>
              Book Now →
            </button>
          </div>
          {/* Worker CTA */}
          <div style={{ background:DARK, borderRadius:22, padding:'32px 28px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100,
              background:'rgba(245,192,0,.1)', borderRadius:'50%' }} />
            <p style={{ fontSize:32, margin:'0 0 10px' }}>👷</p>
            <p style={{ fontWeight:900, fontSize:22, color:'#FFF', margin:'0 0 8px' }}>Earn with your skills</p>
            <p style={{ fontSize:14, color:'#9CA3AF', margin:'0 0 20px', lineHeight:1.6 }}>Join 500+ workers earning ₹500–₹2000/day</p>
            <a href="https://worker.thekaamready.in" target="_blank" rel="noreferrer"
              style={{ display:'block', background:Y, color:DARK, textDecoration:'none', borderRadius:13,
                padding:'14px 28px', fontWeight:900, fontSize:15, textAlign:'center' }}>
              Join as a Worker →
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid #F0F0F0', padding:'28px 24px 48px' }}>
        <div className="kr-footer-inner">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:30, height:30, background:Y, borderRadius:9,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🏠</div>
              <span style={{ fontWeight:900, fontSize:17, color:DARK }}>Kaam Ready</span>
            </div>
            <p style={{ fontSize:13, color:'#9CA3AF', maxWidth:340, lineHeight:1.6, margin:0 }}>
              Connecting skilled workers with homes across Karnataka
            </p>
          </div>
          <div className="kr-footer-links" style={{ marginTop:0 }}>
            <a href="/privacy.html"             style={{ color:'#6B7280', textDecoration:'none', fontSize:13 }}>Privacy Policy</a>
            <a href="/terms.html"               style={{ color:'#6B7280', textDecoration:'none', fontSize:13 }}>Terms</a>
            <a href="mailto:admin@kaamready.in" style={{ color:'#6B7280', textDecoration:'none', fontSize:13 }}>Contact</a>
            <p style={{ fontSize:12, color:'#D1D5DB', margin:0 }}>© 2026 Kaam Ready</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
