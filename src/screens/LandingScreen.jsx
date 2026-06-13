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
  return (
    <div className="kr-phone-wrap">
      <div className="kr-phone-frame">
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
      <div className="kr-phone-glow" />
    </div>
  )
}

function StatCounter({ value, label }) {
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    const num = parseFloat(value.replace(/[^0-9.]/g,''))
    const prefix = value.match(/^[^0-9]*/)?.[0] || ''
    const suffix = value.match(/[^0-9.]+$/)?.[0] || ''
    const duration = 1200
    const steps = 40
    let i = 0
    const interval = setInterval(() => {
      i++
      const progress = i / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      const cur = Math.round(eased * num * 10) / 10
      setDisplay(prefix + (Number.isInteger(num) ? Math.round(cur) : cur.toFixed(1)) + suffix)
      if (i >= steps) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [value])
  return (
    <div style={{ textAlign:'center' }}>
      <p style={{ fontWeight:900, fontSize:20, color:DARK, margin:0, letterSpacing:'-0.5px' }}>{display}</p>
      <p style={{ fontSize:11, fontWeight:700, color:'#7A5800', margin:'3px 0 0', letterSpacing:0.3 }}>{label}</p>
    </div>
  )
}

export default function LandingScreen({ setScreen }) {
  const [installed, setInstalled] = useState(window.matchMedia('(display-mode: standalone)').matches)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    window.addEventListener('appinstalled', () => { setInstalled(true); setShowInstallModal(false) })
  }, [])

  async function handleInstall() {
    const prompt = window.__pwaPrompt
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') { setInstalled(true); window.__pwaPrompt = null }
    } else setShowInstallModal(true)
  }

  // Inject CSS + setup animations
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'kr-landing'
    style.textContent = `
      /* ── Layout ── */
      .kr-nav-inner,.kr-stats-inner,.kr-section-inner,.kr-footer-inner { max-width:1200px; margin:0 auto; }
      .kr-hero-inner { max-width:1200px; margin:0 auto; display:flex; flex-direction:column; align-items:center; gap:40px; }
      .kr-hero-text { text-align:center; }
      .kr-svc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
      .kr-trust-grid { display:flex; flex-direction:column; gap:12px; }
      .kr-steps { display:flex; flex-direction:column; gap:16px; }
      .kr-bottom { display:grid; grid-template-columns:1fr; gap:20px; }

      /* ── Keyframes ── */
      @keyframes kr-float { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
      @keyframes kr-glow  { 0%,100%{box-shadow:0 0 30px rgba(245,192,0,.3),0 32px 80px rgba(0,0,0,.25)} 50%{box-shadow:0 0 60px rgba(245,192,0,.7),0 32px 80px rgba(0,0,0,.25)} }
      @keyframes kr-hero-bg { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      @keyframes kr-reveal-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
      @keyframes kr-reveal-left { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
      @keyframes kr-reveal-scale { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
      @keyframes kr-pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
      @keyframes kr-ripple { to{transform:scale(4);opacity:0} }
      @keyframes kr-shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
      @keyframes kr-badge-in { from{opacity:0;transform:scale(0.5) translateY(-10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes kr-orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.1)} 66%{transform:translate(-20px,15px) scale(.9)} }
      @keyframes kr-orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(.9)} 66%{transform:translate(20px,-15px) scale(1.1)} }
      @keyframes kr-gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes kr-spin-slow { to{transform:rotate(360deg)} }

      /* ── Phone ── */
      .kr-phone-wrap { position:relative; width:200px; height:360px; margin:0 auto; flex-shrink:0; animation:kr-float 4s ease-in-out infinite; }
      .kr-phone-frame { width:200px; height:360px; background:#FFF; border-radius:36px; border:7px solid #222; display:flex; flex-direction:column; overflow:hidden; animation:kr-glow 3s ease-in-out infinite; }
      .kr-phone-glow { position:absolute; bottom:-28px; left:50%; transform:translateX(-50%); width:160px; height:28px; background:rgba(245,192,0,.5); border-radius:50%; filter:blur(16px); }

      /* ── Hero ── */
      .kr-hero-section { background:linear-gradient(135deg,#1a1a1a,#2d2d2d,#1a1a1a,#222,#1a1a1a); background-size:400% 400%; animation:kr-gradient 8s ease infinite; }
      .kr-hero-badge { animation:kr-badge-in .6s cubic-bezier(.34,1.56,.64,1) .2s both; }
      .kr-hero-orb1 { animation:kr-orb1 10s ease-in-out infinite; }
      .kr-hero-orb2 { animation:kr-orb2 12s ease-in-out infinite; }

      /* ── Scroll reveal ── */
      .kr-reveal { opacity:0; }
      .kr-reveal.visible-up   { animation:kr-reveal-up   .7s cubic-bezier(.22,1,.36,1) forwards; }
      .kr-reveal.visible-left { animation:kr-reveal-left .7s cubic-bezier(.22,1,.36,1) forwards; }
      .kr-reveal.visible-scale{ animation:kr-reveal-scale .6s cubic-bezier(.22,1,.36,1) forwards; }
      .kr-reveal.d1 { animation-delay:.05s } .kr-reveal.d2 { animation-delay:.1s }
      .kr-reveal.d3 { animation-delay:.15s } .kr-reveal.d4 { animation-delay:.2s }
      .kr-reveal.d5 { animation-delay:.25s } .kr-reveal.d6 { animation-delay:.3s }
      .kr-reveal.d7 { animation-delay:.35s } .kr-reveal.d8 { animation-delay:.4s }

      /* ── Service cards ── */
      .kr-svc-card { transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s; cursor:pointer; transform-style:preserve-3d; }
      .kr-svc-card:hover { transform:translateY(-6px) scale(1.06) rotateX(6deg); box-shadow:0 12px 30px rgba(0,0,0,.12); }
      .kr-svc-card:active { transform:scale(.95); }

      /* ── Buttons ── */
      .kr-btn-primary { position:relative; overflow:hidden; transition:transform .15s,box-shadow .15s; }
      .kr-btn-primary:hover { transform:translateY(-2px) scale(1.02); box-shadow:0 10px 32px rgba(245,192,0,.55) !important; }
      .kr-btn-primary:active { transform:scale(.97); }
      .kr-btn-secondary { transition:transform .15s,background .15s; }
      .kr-btn-secondary:hover { transform:translateY(-2px); background:rgba(255,255,255,.18) !important; }
      .kr-btn-secondary:active { transform:scale(.96); }
      .kr-ripple-el { position:absolute; border-radius:50%; background:rgba(255,255,255,.4); width:10px; height:10px; transform:scale(0); animation:kr-ripple .6s linear forwards; pointer-events:none; }

      /* ── How it works cards ── */
      .kr-step-card { transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s; }
      .kr-step-card:hover { transform:translateY(-4px) scale(1.02); box-shadow:0 16px 40px rgba(0,0,0,.1) !important; }

      /* ── Trust cards ── */
      .kr-trust-card { transition:transform .2s,box-shadow .2s; }
      .kr-trust-card:hover { transform:translateX(4px); box-shadow:4px 0 0 0 ${Y} inset !important; }

      /* ── CTA blocks ── */
      .kr-cta-book { transition:transform .2s,box-shadow .2s; }
      .kr-cta-book:hover { transform:translateY(-3px) scale(1.01); box-shadow:0 20px 50px rgba(245,192,0,.35) !important; }
      .kr-cta-worker { transition:transform .2s,box-shadow .2s; }
      .kr-cta-worker:hover { transform:translateY(-3px) scale(1.01); box-shadow:0 20px 50px rgba(0,0,0,.3) !important; }

      /* ── Stat shimmer ── */
      .kr-stat-val { background:linear-gradient(90deg,#1a1a1a 0%,#7a5800 50%,#1a1a1a 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:kr-shimmer 2.5s linear infinite; }

      /* ── Nav glass ── */
      .kr-nav { backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }

      /* ── Desktop ── */
      @media(min-width:768px){
        .kr-hero-inner { flex-direction:row; align-items:center; text-align:left; padding:60px 40px; gap:60px; }
        .kr-hero-text { text-align:left; flex:1; }
        .kr-hero-h1 { font-size:54px !important; }
        .kr-hero-btns { justify-content:flex-start !important; }
        .kr-svc-grid { grid-template-columns:repeat(8,1fr); }
        .kr-trust-grid { display:grid; grid-template-columns:1fr 1fr; }
        .kr-steps { flex-direction:row; gap:24px; }
        .kr-bottom { grid-template-columns:1fr 1fr; }
        .kr-nav-inner,.kr-stats-inner { padding:0 40px; }
        .kr-section-inner { padding:52px 40px !important; }
        .kr-footer-inner { display:flex; justify-content:space-between; align-items:flex-start; }
        .kr-footer-links { display:flex; gap:24px; align-items:center; }
      }
      @media(max-width:767px){
        .kr-footer-inner { display:flex; flex-direction:column; gap:16px; }
        .kr-footer-links { display:flex; flex-direction:column; gap:10px; }
      }
    `
    document.head.appendChild(style)

    // Intersection Observer for scroll reveals
    const io = new IntersectionObserver((entries) => {
      entries.forEach(el => {
        if (el.isIntersecting) { el.target.classList.add('visible-up'); io.unobserve(el.target) }
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.kr-reveal').forEach(el => io.observe(el))

    // Stats counter trigger
    const statsEl = document.getElementById('kr-stats-section')
    if (statsEl) {
      const sio = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { setStatsVisible(true); sio.disconnect() }
      }, { threshold: 0.5 })
      sio.observe(statsEl)
    }

    // Ripple effect on buttons
    function addRipple(e) {
      const btn = e.currentTarget
      const r = document.createElement('span')
      r.className = 'kr-ripple-el'
      const rect = btn.getBoundingClientRect()
      r.style.left = (e.clientX - rect.left - 5) + 'px'
      r.style.top  = (e.clientY - rect.top  - 5) + 'px'
      btn.appendChild(r)
      setTimeout(() => r.remove(), 700)
    }
    document.querySelectorAll('.kr-btn-primary').forEach(b => b.addEventListener('click', addRipple))

    // Re-observe after mount
    setTimeout(() => {
      document.querySelectorAll('.kr-reveal').forEach(el => io.observe(el))
    }, 100)

    return () => {
      document.getElementById('kr-landing')?.remove()
      io.disconnect()
    }
  }, [])

  return (
    <div style={{ height:'100dvh', overflowY:'auto', WebkitOverflowScrolling:'touch', background:'#FFFFFF', fontFamily:'Inter, system-ui, sans-serif' }}>

      {/* NAV */}
      <nav className="kr-nav" style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,.88)', borderBottom:'1px solid rgba(240,240,240,.8)', padding:'14px 20px' }}>
        <div className="kr-nav-inner" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:36, height:36, background:Y, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 4px 12px rgba(245,192,0,.4)' }}>🏠</div>
            <span style={{ fontWeight:900, fontSize:20, color:DARK, letterSpacing:'-0.5px' }}>Kaam Ready</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {!installed && (
              <button onClick={handleInstall} className="kr-btn-secondary"
                style={{ background:'#F5F5F5', border:'none', borderRadius:10, padding:'8px 14px', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:DARK, display:'flex', alignItems:'center', gap:6 }}>
                ⬇️ Download
              </button>
            )}
            <button onClick={() => setScreen('login')} className="kr-btn-secondary"
              style={{ background:'none', border:'1.5px solid #E5E7EB', borderRadius:10, padding:'8px 14px', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'#6B7280' }}>
              Sign Up
            </button>
            <button onClick={() => setScreen('login')} className="kr-btn-primary"
              style={{ background:DARK, border:'none', borderRadius:10, padding:'9px 16px', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:Y }}>
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="kr-hero-section" style={{ padding:'44px 24px 52px', position:'relative', overflow:'hidden' }}>
        <div className="kr-hero-orb1" style={{ position:'absolute', top:-80, right:-80, width:320, height:320, background:'rgba(245,192,0,.12)', borderRadius:'50%' }} />
        <div className="kr-hero-orb2" style={{ position:'absolute', bottom:-100, left:-60, width:280, height:280, background:'rgba(245,192,0,.07)', borderRadius:'50%' }} />
        <div className="kr-hero-inner" style={{ position:'relative', zIndex:1, padding:0 }}>
          <div className="kr-hero-text">
            <div className="kr-hero-badge" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(245,192,0,.15)', borderRadius:20, padding:'5px 14px', marginBottom:20 }}>
              <span style={{ width:6, height:6, background:Y, borderRadius:'50%', display:'inline-block' }} />
              <span style={{ fontSize:11, fontWeight:700, color:Y, letterSpacing:1 }}>MYSURU · BENGALURU</span>
            </div>
            <h1 className="kr-hero-h1" style={{ fontWeight:900, color:'#FFFFFF', lineHeight:1.1, letterSpacing:'-2px', margin:'0 0 16px', fontSize:36 }}>
              Home Services,<br/><span style={{ color:Y }}>Done Right.</span>
            </h1>
            <p style={{ fontSize:16, color:'#A0A0A0', margin:'0 0 32px', lineHeight:1.7, maxWidth:420 }}>
              Verified electricians, plumbers, cleaners & more — at your door in under an hour
            </p>
            <div className="kr-hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
              <button onClick={() => setScreen('login')} className="kr-btn-primary"
                style={{ background:Y, color:DARK, border:'none', borderRadius:14, padding:'15px 32px', fontWeight:900, fontSize:16, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 6px 28px rgba(245,192,0,.45)', letterSpacing:'-0.3px' }}>
                Book a Service →
              </button>
              <button onClick={() => setScreen('login')} className="kr-btn-secondary"
                style={{ background:'rgba(255,255,255,.1)', color:'#FFF', border:'1.5px solid rgba(255,255,255,.2)', borderRadius:14, padding:'15px 24px', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
                See Services
              </button>
              {!installed && (
                <button onClick={handleInstall} className="kr-btn-secondary"
                  style={{ background:'rgba(255,255,255,.08)', color:'#FFF', border:'1.5px solid rgba(255,255,255,.15)', borderRadius:14, padding:'15px 20px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
                  ⬇️ Install App
                </button>
              )}
            </div>
          </div>
          <PhoneMockup />
        </div>
      </section>

      {/* STATS */}
      <section id="kr-stats-section" style={{ background:Y, padding:'20px 24px' }}>
        <div className="kr-stats-inner" style={{ display:'flex', justifyContent:'space-around' }}>
          {statsVisible ? (
            [['500+','Verified Workers'],['10+','Home Services'],['2','Cities'],['4.8★','Avg Rating']].map(([v,l]) => (
              <StatCounter key={l} value={v} label={l} />
            ))
          ) : (
            [['500+','Verified Workers'],['10+','Home Services'],['2','Cities'],['4.8★','Avg Rating']].map(([v,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <p style={{ fontWeight:900, fontSize:20, color:DARK, margin:0 }}>—</p>
                <p style={{ fontSize:11, fontWeight:700, color:'#7A5800', margin:'3px 0 0' }}>{l}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding:'32px 24px' }}>
        <div className="kr-section-inner" style={{ padding:0 }}>
          <p className="kr-reveal" style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>What we offer</p>
          <h2 className="kr-reveal d1" style={{ fontSize:26, fontWeight:900, color:DARK, margin:'0 0 20px', letterSpacing:'-0.5px' }}>Pick Your Service</h2>
          <div className="kr-svc-grid">
            {SERVICES.map((s, i) => (
              <button key={s.lbl} onClick={() => setScreen('login')} className={`kr-svc-card kr-reveal d${i+1}`}
                style={{ background:'#F5F5F8', border:'none', borderRadius:16, padding:'18px 8px 14px', cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
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
          <p className="kr-reveal" style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Simple process</p>
          <h2 className="kr-reveal d1" style={{ fontSize:26, fontWeight:900, color:DARK, margin:'0 0 24px', letterSpacing:'-0.5px' }}>How It Works</h2>
          <div className="kr-steps">
            {[
              { ico:'📱', title:'Book in Seconds',   desc:'Choose a service, confirm address — done in under a minute' },
              { ico:'👷', title:'Worker Dispatched',  desc:'A nearby verified worker is assigned and heads your way' },
              { ico:'✅', title:'Job Done · Pay',     desc:"Pay via UPI only after you're satisfied with the work" },
            ].map((s, i) => (
              <div key={i} className={`kr-step-card kr-reveal d${i+1}`}
                style={{ flex:1, background:'#FFF', borderRadius:18, padding:'24px 20px', display:'flex', flexDirection:'column', gap:10, border:'1px solid #EBEBEB', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:Y, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 4px 12px rgba(245,192,0,.35)' }}>{s.ico}</div>
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
          <p className="kr-reveal" style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Why us</p>
          <h2 className="kr-reveal d1" style={{ fontSize:26, fontWeight:900, color:DARK, margin:'0 0 20px', letterSpacing:'-0.5px' }}>Why Kaam Ready?</h2>
          <div className="kr-trust-grid">
            {[
              { ico:'🪪', title:'ID-Verified Workers',  desc:'Every worker submits Aadhaar before joining' },
              { ico:'💳', title:'Pay After Job',         desc:"Your money stays safe — pay only when you're happy" },
              { ico:'⚡', title:'60-Min Response',       desc:'Workers nearby alerted instantly — fast arrival' },
              { ico:'🔁', title:'Rebook Favourites',     desc:'Loved the worker? Request them directly next time' },
            ].map((p, i) => (
              <div key={p.title} className={`kr-trust-card kr-reveal d${i+1}`}
                style={{ display:'flex', gap:14, alignItems:'flex-start', background:'#F5F5F8', borderRadius:16, padding:'16px' }}>
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
          <div className="kr-cta-book kr-reveal d1" style={{ background:`linear-gradient(135deg,${Y},#FFD740)`, borderRadius:22, padding:'32px 28px' }}>
            <p style={{ fontSize:32, margin:'0 0 10px' }}>📱</p>
            <p style={{ fontWeight:900, fontSize:22, color:DARK, margin:'0 0 8px' }}>Ready to book?</p>
            <p style={{ fontSize:14, color:'#7A5800', margin:'0 0 20px', lineHeight:1.6 }}>Get a verified worker at your door today</p>
            <button onClick={() => setScreen('login')} className="kr-btn-primary"
              style={{ background:DARK, color:Y, border:'none', borderRadius:13, padding:'14px 28px', fontWeight:900, fontSize:15, cursor:'pointer', fontFamily:'inherit', width:'100%', boxShadow:'0 6px 20px rgba(0,0,0,.2)' }}>
              Book Now →
            </button>
          </div>
          <div className="kr-cta-worker kr-reveal d2" style={{ background:DARK, borderRadius:22, padding:'32px 28px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, background:'rgba(245,192,0,.1)', borderRadius:'50%' }} />
            <p style={{ fontSize:32, margin:'0 0 10px' }}>👷</p>
            <p style={{ fontWeight:900, fontSize:22, color:'#FFF', margin:'0 0 8px' }}>Earn with your skills</p>
            <p style={{ fontSize:14, color:'#9CA3AF', margin:'0 0 20px', lineHeight:1.6 }}>Join 500+ workers earning ₹500–₹2000/day</p>
            <a href="https://worker.thekaamready.in" target="_blank" rel="noreferrer" className="kr-btn-primary"
              style={{ display:'block', background:Y, color:DARK, textDecoration:'none', borderRadius:13, padding:'14px 28px', fontWeight:900, fontSize:15, textAlign:'center', boxShadow:'0 6px 20px rgba(245,192,0,.35)' }}>
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
              <div style={{ width:30, height:30, background:Y, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, boxShadow:'0 4px 10px rgba(245,192,0,.35)' }}>🏠</div>
              <span style={{ fontWeight:900, fontSize:17, color:DARK }}>Kaam Ready</span>
            </div>
            <p style={{ fontSize:13, color:'#9CA3AF', maxWidth:340, lineHeight:1.6, margin:0 }}>Connecting skilled workers with homes across Karnataka</p>
          </div>
          <div className="kr-footer-links">
            <a href="/privacy.html" style={{ color:'#6B7280', textDecoration:'none', fontSize:13 }}>Privacy</a>
            <a href="/terms.html"   style={{ color:'#6B7280', textDecoration:'none', fontSize:13 }}>Terms</a>
            <a href="mailto:admin@kaamready.in" style={{ color:'#6B7280', textDecoration:'none', fontSize:13 }}>Contact</a>
            <p style={{ fontSize:12, color:'#D1D5DB', margin:0 }}>© 2026 Kaam Ready</p>
          </div>
        </div>
      </footer>

      {/* INSTALL MODAL */}
      {showInstallModal && (
        <div onClick={() => setShowInstallModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#FFF', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, padding:'24px 24px 40px', animation:'kr-reveal-up .35s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ width:48, height:4, background:'#E5E7EB', borderRadius:4, margin:'0 auto 20px' }} />
            <p style={{ fontWeight:900, fontSize:20, color:DARK, margin:'0 0 6px' }}>Install Kaam Ready</p>
            <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 24px' }}>Add to your home screen for the best experience</p>
            {[{ico:'🌐',t:'Open in Chrome browser'},{ico:'⋮',t:'Tap the three-dot menu (⋮) top right'},{ico:'➕',t:'Tap "Add to Home screen"'},{ico:'✅',t:'Tap "Add" — done!'}].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:Y, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, color:DARK, flexShrink:0 }}>{s.ico}</div>
                <p style={{ fontSize:14, color:DARK, margin:0, fontWeight: i===1||i===2 ? 700 : 400 }}>{s.t}</p>
              </div>
            ))}
            <button onClick={() => setShowInstallModal(false)} className="kr-btn-primary"
              style={{ width:'100%', background:DARK, color:Y, border:'none', borderRadius:14, padding:15, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', marginTop:8 }}>
              Got it ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
